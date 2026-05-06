---
sidebar_position: 1
---
# LSM Tree (Log-Structured Merge Tree)

Writes are batched and appended; immutable on-disk files (SSTables) are merged in the background. Reads may cross several layers until a key is resolved.

*Examples:* RocksDB, Apache Cassandra

## Usage

- **When:** Sustained high write rates, mostly sequential ingest, and tolerance for read amplification until compaction catches up.
- **Good for:** Logs, CDC, metrics/time-series, key-value workloads that favor ingest over a single cheap read per key.
- **Tradeoff:** A point read can be more work than one B+ tree descent until Bloom filters, index blocks, and compaction shrink the search space.

## Read path

### Flow

1. Search Memtables ( in-memory sorted buffers ) and any immutable memtables waiting to flush first; respect tombstones and newer versions.
2. Search SSTables (newest to oldest) for each candidate file until the key is resolved:
   - Bloom filter : if no, skip the whole SSTable.
   - Index block : sparse index mapping key to block offset; binary search to the right data block.
   - Data block : load via block cache on hit, else from disk into cache.
3. For Range scans : merge iterators over memtable + SSTables in key order (same building blocks, merged order).

### Optimizations

| Piece                       | Role                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bloom filter**            | Probabilistic "maybe contains key"; if negative, skip entire SSTable without touching index/data.                                                             |
| **Index Block**             | Maps key ranges to block offsets; one index probe + one (or few) block reads vs scanning the whole file.                                                      |
| **Block cache**             | Hot data/index blocks reused across queries.                                                                                                                  |
| **Restart points in Block** | Keys are prefix-compressed. Restart points are periodic full keys inside a block allowing use of binary search within the block, then a short linear stretch. |
| **Compaction**              | Too many SSTables hurts reads; merging dedupes, expires tombstones, reduces read amplification; fewer files to check per read over time.                      |

**Summary:** **bloom** (Avoid work) → **block index** (narrow to a block) → **search the block** (using block cache + restart points )

## Write path

### Flow

1. Append  to WAL before it is applied in memory.
2. Insert into Memtable - an in-memory sorted structure (often a skip list); updates and deletes are new versions or tombstones.
3. When Memtable is full — freeze, flush to a new immutable SSTable (sorted, sequential write).
4. Merge SSTables in the background to collapse duplicates, drop tombstones when safe, re-level or tier data to control overlap and file count.

### Optimizations

| Piece                 | Role                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **WAL**               | Sequential append; crash recovery replays log if memtable was lost.                                                          |
| **Memtable**          | Buffers writes in RAM (fast inserts, batched flush)                                                                          |
| **Sequential flush**  | Memtable to SSTable is a sorted, append-friendly ( sequential ) write pattern                                                |
| **Compaction**        | Too many SSTables hurts reads; merging dedupes, expires tombstones, reduces read amplification.                              |
| **Leveled vs tiered** | Leveled: less overlap, better reads, often higher write amplification. Tiered: faster writes, often more read amplification. |
| **Compression**       | Per-block (or per-file) compression on flush/compaction  .                                                                   |

**Summary:** **persist** (WAL) → **buffer** (memtable) → **flush** (SSTable) → **organize** (compaction).
