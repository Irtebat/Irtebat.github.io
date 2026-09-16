---
sidebar_position: 5
---

# Lakebase Vector & Text Search

> **What this is:** a note that builds from first principles up to the internals, trade-offs, and Lakebase-specifics of vector (semantic) and text (keyword/BM25) search in Databricks Lakebase.
>
> **Sourcing / caveats:** Postgres, `pgvector`, GIN, and BM25 internals are established and stable. Lakebase-specific extension syntax (`lakebase_vector` / `lakebase_text`) is verified against the Databricks Lakebase Search docs and Neon getting-started guide (feature announced June 2026, GA on AWS/Azure). Headline latency numbers (e.g. "~18.6 ms vs ~19.5 s") are **vendor benchmarks** — directionally real, not guarantees. A few index knobs are not publicly documented yet; those are flagged `⚠️ confirm in docs`.
>
> _Last updated: 2026-09-15._

---

## The one-paragraph version (the map)

Lakebase is Databricks' managed Postgres (built on the Neon engine). "Lakebase vector and text search" means you can now do **semantic search** (find by *meaning*, via vectors) and **keyword/full-text search** (find by *words*, ranked by relevance) **inside your operational Postgres database itself**, instead of shipping data to a separate search system. Under the hood it's two extensions — `lakebase_vector` (an ANN vector index, pgvector-compatible) and `lakebase_text` (a BM25 full-text index) — which replace the older do-it-yourself approaches (`pgvector` + HNSW/IVFFlat for vectors; `tsvector` + GIN, or the now-deprecated ParadeDB `pg_search`, for text). The big wins: the index lives *in the same table as your data*, so it's **transactionally fresh** (no sync lag), and it runs on the same autoscaling Lakebase compute you're already paying for.

---

## L0 — What problem are we solving?

**Search = "given a query, find the most relevant rows, ranked best-first."** There are two fundamentally different notions of "relevant":

| | **Lexical / keyword search** | **Semantic / vector search** |
|---|---|---|
| Matches on | The actual **words** | The **meaning** |
| "car" finds | "car", "cars" (with stemming) | "automobile", "vehicle", "sedan" |
| Great at | Exact terms, names, codes, SKUs, acronyms | Paraphrases, concepts, fuzzy intent |
| Fails at | Synonyms, rephrasing | Exact IDs, rare proper nouns, negation |

Because they fail in *opposite* ways, serious systems combine both — that's **hybrid search**, and it's a big reason to want them in one database.

**The other L0 concept: an index.** Scanning every row for every query is O(N) and dies at scale. An *index* is a pre-built data structure that lets you jump to likely answers without reading everything — like a book's index vs. reading the whole book. Every technique below is really *"what index do we build, and how do we search it?"*

---

## L1 — The two families, conceptually

### Lexical: inverted index + ranking function

An **inverted index** flips the data around. Instead of `document → words`, store `word → list of documents containing it` (a *posting list*):

```
"lakebase" → [doc3, doc7, doc12, ...]
"postgres" → [doc1, doc3, doc99, ...]
```

To answer *"lakebase postgres"*, grab both posting lists and intersect/union them — fast. Then a **ranking function** scores the matches so the best ones float to the top. The quality of that ranking function is the whole ballgame (BM25 vs. `ts_rank`, see L2).

### Semantic: embeddings + nearest-neighbor

An **embedding** is a list of numbers (a *vector*, e.g. 1024 dims) produced by an ML model, positioned so that *things with similar meaning sit close together* in that space. "car" and "automobile" land near each other; "car" and "banana" don't.

So semantic search is geometry: **embed the query into the same space, then find the vectors nearest to it** (nearest-neighbor search). "Nearest" is a distance/similarity metric:

- **Cosine** (`<=>`) — angle between vectors; default for text embeddings.
- **L2 / Euclidean** (`<->`) — straight-line distance.
- **Inner product** (`<#>`) — for normalized vectors.

Finding the *exact* nearest neighbors means comparing against every vector (O(N)). So we build an index that finds *approximate* nearest neighbors (**ANN**) fast, trading a little accuracy for huge speed. That trade-off — **recall vs. latency** — is the central tension of vector search.

> **Recall** = of the true top-K nearest neighbors, what fraction did the index return? 0.95 recall = found 95% of the "right" answers. You tune indexes to buy recall with latency/memory.

---

## L2 — How the *existing (DIY)* Postgres approaches work

Two lexical approaches, two vector approaches — these are what Lakebase Search wraps/replaces.

### 2a. Lexical #1 — native Postgres FTS (`tsvector` + **GIN index**)

Postgres's built-in full-text search. The **GIN (Generalized INverted index)** is the star.

**Pipeline:** `to_tsvector` preprocesses (lowercase, remove stop-words, **stem**: "running" → "run") → `tsquery` is the boolean query → `@@` matches → `ts_rank`/`ts_rank_cd` ranks.

```sql
-- Store a preprocessed tsvector column (generated, always in sync with body)
ALTER TABLE documents
  ADD COLUMN body_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', body)) STORED;

-- The GIN inverted index (word -> posting list of row locations)
CREATE INDEX documents_body_gin ON documents USING gin (body_tsv);

-- Match + rank. ts_rank_cd rewards query terms appearing close together.
SELECT id, title,
       ts_rank_cd(body_tsv, query) AS rank
FROM   documents,
       plainto_tsquery('english', 'lakebase postgres') AS query
WHERE  body_tsv @@ query          -- boolean match, uses the GIN index
ORDER  BY rank DESC               -- ranking is a separate, heavier step
LIMIT  10;
```

**Two big limitations:**

1. **Weak ranking.** `ts_rank` uses term frequency + position weights (A–D); `ts_rank_cd` adds proximity. **Neither is true BM25** — no proper IDF (down-weighting common words) and no document-length normalization. Relevance quality is mediocre for real search.

2. **GIN staleness — the `fastupdate` pending list.** By default `fastupdate = ON`: new rows go to an in-memory **pending list** (fast writes) that's only merged into the real index on `VACUUM` or when it overflows `gin_pending_list_limit` (default **4 MB**). Until then, freshly inserted rows are **invisible to search** — a staleness window of seconds to minutes.

```sql
-- Option A: always-fresh reads, slower writes
CREATE INDEX documents_body_gin ON documents
  USING gin (body_tsv) WITH (fastupdate = off);

-- Option B: keep fastupdate on, but force a flush when you need freshness
SELECT gin_clean_pending_list('documents_body_gin');
```

### 2b. Lexical #2 — BM25 via ParadeDB `pg_search` (Tantivy)  ⚠️ *deprecating*

To get search-engine-quality ranking, people added **ParadeDB's `pg_search`**, which embeds **Tantivy** (a Rust engine in the Lucene/Elasticsearch family) inside Postgres.

```sql
CREATE EXTENSION IF NOT EXISTS pg_search;

-- BM25 index over one or more columns
CREATE INDEX documents_search_idx ON documents
  USING bm25 (id, title, body)
  WITH (key_field = 'id');

-- @@@ is the BM25 match operator; paradedb.score() returns the BM25 score
SELECT id, title, paradedb.score(id) AS score
FROM   documents
WHERE  body @@@ 'lakebase postgres'
ORDER  BY score DESC
LIMIT  10;
```

**What BM25 actually is** — the ranking model that makes this good:

$$\text{score}(D,Q)=\sum_{q\in Q}\underbrace{\text{IDF}(q)}_{\text{rare terms matter more}}\cdot\frac{f(q,D)\cdot(k_1+1)}{f(q,D)+k_1\cdot\left(1-b+b\cdot\frac{|D|}{\text{avgDL}}\right)}$$

BM25 improves on naive term-frequency three ways:
- **IDF** — a word in every document is worthless; a rare word is discriminating. Weight accordingly.
- **TF saturation (`k₁`≈1.2)** — the 10th occurrence adds far less than the 2nd; score plateaus.
- **Length normalization (`b`≈0.75)** — divides out document length, so a long page doesn't beat a tight answer just by having more words.

**Tantivy internals:** documents are written into **immutable segments**, each a self-contained inverted index. New writes → new segment; a background process **merges** segments. Queries scan committed segments and aggregate top-K by BM25. Because writes are visible on commit (not gated on VACUUM), **BM25 avoids GIN's pending-list staleness**.

> ⚠️ **`pg_search` is deprecated on Neon/Lakebase** — migrate to `lakebase_text` before **September 21, 2026**.

### 2c. Vector — `pgvector` with HNSW or IVFFlat

`pgvector` is the standard open-source vector extension. It offers **two ANN index types**.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE documents ADD COLUMN embedding vector(1024);  -- e.g. 1024-dim embeddings

-- HNSW: best recall/latency, RAM-hungry, slow build, no training needed
CREATE INDEX documents_embedding_hnsw ON documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- IVFFlat: cheap build, lower memory, needs data to train; build AFTER loading data
CREATE INDEX documents_embedding_ivf ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
ANALYZE documents;

-- KNN query. <=> is cosine distance; SET ef_search trades recall for latency (HNSW).
SET hnsw.ef_search = 100;
SELECT id, title, 1 - (embedding <=> $1::vector) AS cosine_similarity
FROM   documents
ORDER  BY embedding <=> $1::vector   -- nearest first; uses the ANN index
LIMIT  10;
```

**HNSW (graph index):** a multi-layer graph; each node is a vector linked to nearby neighbors. Search starts at a sparse top layer and greedily hops toward the query, descending layers — like zooming a map from country → city → street. Reaches the neighborhood in ~log hops. Knobs: `m`, `ef_construction` (build), `ef_search` (query). Best recall/latency, but big, slow to build, and wants to stay **memory-resident** — spilling to disk tanks latency.

**IVFFlat (clustering index):** k-means partitions vectors into `lists` clusters; search probes the nearest `probes` centroids and brute-forces within them. Fast/cheap build, lower memory, lower recall, and needs representative data to train (build after loading).

Rule of thumb: **HNSW for quality when you have RAM; IVFFlat when memory/build-time constrained.**

**Dimension limits (real, stable):** `vector` up to **2,000** dims indexed; `halfvec` up to **4,000**; `bit` (binary) up to **64,000**.

---

## L2.5 — What "Lakebase Search" actually is

Lakebase Search packages the two best-in-class engines as **first-party, managed Postgres extensions**:

| You want… | Old DIY way | **Lakebase Search** |
|---|---|---|
| Keyword/relevance | `tsvector`+GIN (weak) or ParadeDB `pg_search` (deprecating) | **`lakebase_text`** — managed BM25 (`lakebase_bm25` index) |
| Semantic | raw `pgvector` (HNSW/IVFFlat) | **`lakebase_vector`** — managed ANN (`lakebase_ann` index) |
| Hybrid | hand-rolled SQL joining both | Both extensions in one DB, fused in SQL (RRF) |

**Why prefer it over the DIY extensions:**
1. **First-party & managed** — Databricks maintains it; no chasing ParadeDB compatibility or tuning HNSW blind.
2. **In-database & transactional** — index and data share the table, so an inserted row is queryable in the **same transaction** (the freshness win, see L3+).
3. **Hybrid-ready** — BM25 + vector side by side, fused without a second datastore.
4. **Scale** — `lakebase_ann` reportedly uses IVF partitioning + RaBitQ quantization to scale toward 1B+ vectors, and is **storage-backed** (queryable immediately after cold start, no warmup).

### Lakebase Search snippets

> Based on the Databricks Lakebase Search docs and Neon getting-started guide. Exact tuning knobs (HNSW `m`/`ef`, alternate distance metrics) are **not publicly documented** for `lakebase_ann` yet — `⚠️ confirm in docs` before relying on them. Requires Lakebase Search enabled in project settings.

```sql
-- Extensions (CASCADE pulls in pgvector as a dependency)
CREATE EXTENSION IF NOT EXISTS lakebase_vector CASCADE;  -- v1.0.0
CREATE EXTENSION IF NOT EXISTS lakebase_text   CASCADE;  -- v0.1.0
```

**Vector search (`lakebase_ann`)** — pgvector-compatible types/operators:

```sql
CREATE INDEX documents_embedding_ann ON documents
  USING lakebase_ann (embedding vector_cosine_ops);

-- Same <=> operator and KNN pattern as pgvector
SELECT id, title, 1 - (embedding <=> $1::vector) AS cosine_similarity
FROM   documents
ORDER  BY embedding <=> $1::vector
LIMIT  10;
```

**Text/BM25 search (`lakebase_bm25`)** — indexes a standard `tsvector` column:

```sql
-- Build AFTER inserting data: BM25 computes corpus statistics at build time
CREATE INDEX documents_body_bm25 ON documents
  USING lakebase_bm25 (body_tsv)
  WITH (default_limit = 10);

-- <@> is the BM25 match/score operator; to_bm25query() references the index
-- for corpus stats. NOTE: lower score = more relevant, so ORDER BY score ASC.
SELECT id, title,
       body_tsv <@> to_bm25query(to_tsvector('english', 'lakebase postgres'),
                                 'documents_body_bm25') AS score
FROM   documents
ORDER  BY score
LIMIT  5;
```

**Hybrid search (Reciprocal Rank Fusion)** — combine both, rank-based so the two score scales don't need normalizing:

```sql
WITH vector_results AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
  FROM   documents
  WHERE  embedding IS NOT NULL
  LIMIT  40
),
bm25_results AS (
  SELECT id, ROW_NUMBER() OVER (
           ORDER BY body_tsv <@> to_bm25query(to_tsvector('english', $2),
                                               'documents_body_bm25')) AS rank
  FROM   documents
  LIMIT  40
)
SELECT id, SUM(1.0 / (60 + rank)) AS rrf_score   -- 60 = dampening constant (tunable)
FROM (
  SELECT id, rank FROM vector_results
  UNION ALL
  SELECT id, rank FROM bm25_results
) combined
GROUP BY id
ORDER BY rrf_score DESC
LIMIT 10;
```

---

## L3 — Internals, side by side

**Why BM25 (Tantivy) crushes GIN + `ts_rank` on ranked queries:** GIN was built for *matching*, not *ranking*. It finds matching rows fast, but Postgres must then fetch each row and compute `ts_rank` — a heavy, poorly-indexed post-process. Tantivy stores term frequencies and doc metadata *inside the segment* and computes BM25 during the scan with top-K collectors. Matching + ranking happen together, in a structure designed for it.

**Why HNSW beats IVFFlat on recall/latency but costs more:** IVFFlat's clusters are a coarse partition — a true neighbor just across a cluster boundary is missed unless you raise `probes` (which costs latency). HNSW's graph has no hard boundaries; long-range links let the greedy walk cross regions smoothly → high recall at low latency. But the graph is bigger, slower to build, and must stay in RAM.

**Universal knobs** (every vendor exposes some version — all are recall↔cost dials):
- Vector: `m`, `ef_construction`, `ef_search` (HNSW); `lists`, `probes` (IVFFlat).
- Text: `k₁`, `b` (BM25); tokenizer/stemmer/stop-word config.

---

## L3+ — The three operational questions

### ① Index size limits

| Index | Practical limit | Notes |
|---|---|---|
| `pgvector` dims | 2,000 / 4,000 (half) / 64,000 (binary) | Hard, from pgvector |
| Vector count | No documented row cap | Bounded by **~8 TB logical storage/branch** and by RAM for HNSW; `lakebase_ann` targets 1B+ via IVF+RaBitQ |
| BM25 (`lakebase_text`) | No documented hard cap | Lucene-family scales to web scale; segments on disk |
| GIN | No hard cap | Grows with unique-lexeme count |

The real ceiling for **HNSW** isn't a "max size" — it's **RAM**. Once the graph spills to disk, latency falls off a cliff. So "how big can my vector index be?" ≈ "how much RAM (compute) will I pay for?" (`lakebase_ann` being storage-backed relaxes this somewhat vs. raw HNSW.)

### ② Compute requirements

Lakebase runs on **Compute Units (CU)**, ~**2 GB RAM per CU**:
- **Autoscaling** **0.5 – 32 CU** (constraint: max − min ≤ 16 CU spread); fixed tiers **36–112 CU** above.
- **Scale-to-zero** on idle for non-prod branches; the `production` branch stays warm. Cold wake is ~sub-second.

Build vs. query:
- **HNSW build** = slow, RAM-hungry; wants a large `maintenance_work_mem` (~50–60% of instance RAM during a big build). **IVFFlat build** = cheaper. `lakebase_bm25` must be built **after** data load (computes corpus stats at build time).
- **Queries** run on the same CU serving Postgres — no separate cluster.
- Starting point for vector work: **4–8 CU (8–16 GB)** for ~1024-dim embeddings at moderate volume; raise the *minimum* CU to keep the working set cached (watch buffer-cache hit ratio, target > 99%); let autoscaling absorb build/bulk-insert spikes.

**There is no separate search cluster to size** — build and query consume the same autoscaling Postgres CUs. That's the operational appeal of "in-database."

### ③ Index sync & staleness — the subtle one

There are **two independent layers** of freshness. Conflating them is the #1 source of confusion.

**Layer 1 — index vs. its own table (in-Postgres freshness):**
- `lakebase_vector` / `pgvector`: index in the same table, updated **atomically in the transaction**. Insert → instantly searchable. **Zero staleness.** ✅
- `lakebase_text` (BM25/Tantivy): new rows → new segment, visible on commit; merges in the background. **No pending-list window.** ✅
- **GIN** (legacy FTS): the `fastupdate` pending-list window (seconds–minutes) unless `fastupdate = off` or manually flushed. ⚠️ *This is the only in-Postgres staleness culprit — exactly what the new extensions avoid.*

**Layer 2 — table vs. its source in the lakehouse (synced-table lag):**
Applies only if data is **synced from a Unity Catalog / Delta table** via Lakebase **synced tables**. Then freshness = sync mode:

| Sync mode | Lag | Requires Delta CDF? | Use for |
|---|---|---|---|
| **Snapshot** | one-time copy, manual re-run | No | initial load, small/static tables |
| **Triggered** | minutes → daily (scheduled) | Yes | dashboards, periodic refresh |
| **Continuous** | seconds (~real-time CDC) | Yes | live apps, operational data |

Throughput: snapshot ~**2,000 rows/sec/CU**; triggered/continuous ~**150 rows/sec/CU**. Synced tables are **read-only in Postgres** (you may only create indexes / drop the table); an index built on one is kept current as the pipeline updates rows.

> **So "how stale is the index?"** = **max(Layer 1, Layer 2)**.
> - Data born *in* Postgres → **fresh to the transaction** (the headline win).
> - Data synced *from* Delta → as fresh as your sync mode (seconds on continuous, longer otherwise); the index adds no meaningful lag on top.
>
> Contrast the standalone **Mosaic AI Vector Search** product, which is *inherently* an async copy of a Delta table — always some sync lag by design.

---

## Lakebase Search vs. Mosaic AI Vector Search

| | **Lakebase Search** (in-Postgres) | **Mosaic AI Vector Search** (standalone) |
|---|---|---|
| Model | Extensions inside your OLTP Postgres | Separate managed service, syncs from Delta |
| Freshness | Transactional if data is in Postgres | Async sync from Delta → lag by design |
| Scale | Small–medium (≲100M typical; `lakebase_ann` targets 1B+) | Enterprise, 100M–1B+, scales independently |
| Index choice | `lakebase_ann` / pgvector HNSW or IVFFlat | HNSW, managed |
| Hybrid | BM25 + vector in one DB, in SQL (RRF) | Native hybrid (vector + keyword) via API |
| Governance | Postgres GRANT/REVOKE | Unity Catalog ACLs, lineage |
| Best when | Vectors/text must stay in lockstep with live app rows; already run Postgres; RAG on operational data | Corpus-scale RAG over lakehouse data; search decoupled from the transactional DB |

> Note: Mosaic AI Vector Search is **not** L2-only — it supports cosine similarity too.

**Decision rule:**
- Data lives in / is driven by an **operational Postgres app**, needs to be **instantly** searchable, want **hybrid** without a second system → **Lakebase Search**.
- **Huge document corpus** in the lakehouse, search **decoupled** from the transactional DB, some staleness fine → **Mosaic AI Vector Search**.
- Some architectures use both: Lakebase for live operational vectors, Vector Search for the big RAG corpus.

---

## L3+ cheat sheet

- **Two search families, opposite failure modes** → real systems do **hybrid**; one DB for both is the point.
- **Lexical** = inverted index + ranking. Postgres native = **GIN + `ts_rank`** (fast match, weak rank, pending-list staleness). **BM25** (IDF + TF-saturation + length-norm) ranks far better → delivered by **`lakebase_text`** (successor to the **deprecating** ParadeDB `pg_search`/Tantivy).
- **Vector** = embeddings + ANN. `pgvector`: **HNSW** (graph; best recall/latency; RAM-hungry; no training) vs **IVFFlat** (clusters; cheap; needs training; lower recall). **`lakebase_vector`/`lakebase_ann`** is the managed ANN. Dims: 2k / 4k half / 64k binary.
- **Size limit** for vectors is really a **RAM limit** (HNSW must stay in memory); storage ~8 TB/branch.
- **Compute** = shared autoscaling **CUs (~2 GB each; 0.5–32 auto, up to 112 fixed)**, scale-to-zero on idle. No separate search cluster.
- **Staleness = max(index-vs-table, table-vs-Delta).** In-Postgres data → **transactionally fresh**. Synced-from-Delta → **snapshot / triggered / continuous(~seconds)**. New extensions avoid GIN's pending-list lag.
- **Lakebase Search vs Mosaic Vector Search** = *fresh + operational + small-medium + hybrid* vs *huge corpus + decoupled + lakehouse-scale*.

---

## Sources

- Databricks — Lakebase Search: `https://docs.databricks.com/aws/en/oltp/projects/lakebase-search.html`
- Databricks — Lakebase extensions list: `https://docs.databricks.com/aws/en/oltp/projects/extensions.html`
- Databricks — Lakebase release notes (announced 2026-06-16): `https://docs.databricks.com/aws/en/release-notes/lakebase/`
- Neon — Lakebase Search getting started: `https://neon.com/docs/ai/lakebase-search-get-started`
- Neon — extensions list & `pg_search` deprecation (ends 2026-09-21): `https://neon.com/docs/extensions/pg-extensions`
- Neon — CommSync case study (text/vector/hybrid on Lakebase Search): `https://neon.com/blog/commsync-runs-text-vector-and-hybrid-search-on-postgres-with-lakebase-search`
- PostgreSQL — full-text search functions & GIN indexes: `https://www.postgresql.org/docs/current/functions-textsearch.html`, `https://www.postgresql.org/docs/current/textsearch-indexes.html`
- pgvector: `https://github.com/pgvector/pgvector`
- Tantivy architecture: `https://github.com/quickwit-oss/tantivy/blob/main/ARCHITECTURE.md`
