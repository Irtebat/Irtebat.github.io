---
sidebar_position: 5
---
# Geohash

A **geohash** turns a lat/long into a short string (letters and numbers). Points in the **same area** often share the **start** of that string, which makes “nearby” searches easy on normal database indexes.

*Examples:* Redis GEO, Elasticsearch, many “near me” features

## What it is

The world is split into nested **boxes**. Each step picks the west/east half (longitude), then the south/north half (latitude). Every **5 steps** become one character, e.g. `9`, then `q`, then `8`…

**Example:** San Francisco `37.793217, -122.396559` at **8 characters** → `9q8znb19`

| Step | What splits | Bit | Box after |
|------|-------------|-----|-----------|
| 1 | longitude | 1 | east half of world |
| 2 | latitude | 1 | north half |
| 3 | longitude | 0 | west half of that |
| 4 | latitude | 0 | south half of that |
| … | … | … | … → `9q8znb19` |

More characters = **smaller** box (more exact).

## Where it is used

- **When:** You store many points and often ask “what is within X meters of here?”
- **Good for:** Map tiles, “near me”, prefix search on a string index
- **Watch out:** Each geohash is a **rectangle**, not a circle. Sorting strings is **not** the same as sorting by real distance.

## Encode (lat/long → string)

**Encode** = compute the string for a point.

```python
import geohash

geohash.encode(37.793217, -122.396559, precision=8)
# → '9q8znb19'
```

| Characters | Rough box size (mid-latitudes) |
|------------|--------------------------------|
| 5 | ~20 km |
| 7 | ~150 m |
| 8 | ~20 m |

**Example:** Two cafés in SF might both start with `9q8znb` at precision 6, even if they are a few blocks apart.

## Decode (string → lat/long)

**Decode** = get the **center** of the box for that string (not always your original point exactly).

```python
geohash.decode('9q8znb19')
# → (37.793226, -122.396450)   # center of that cell
```

**Example:** You only store `9q8znb19` in the index; decode gives you a rough center for display, but keep real lat/long in the row for exact distance.

## Compare strings

Geohashes are compared like normal text (`<`, `>`, same prefix).

```text
"9q8znb"   < "9q8znb19"          # longer = smaller box inside the shorter one
"9q8znb19".startswith("9q8znb") # True → same bigger tile
"9q8znb19"  vs "9q8znb1c"        # last letter differs → often next-door tiles
```

**Example:** `"9q8znb19"` and `"9q8znb1c"` are neighbors at precision 8. String order does **not** tell you which café is closer in meters — use real distance after the index step.

## Storage

Store each point as a **row** with an **indexed `geohash` column** alongside its real coordinates.

| Column | Example | Why |
|--------|---------|-----|
| `id` | `venue_42` | primary key |
| `lat` / `lon` | `37.793217` / `-122.396559` | exact distance later |
| `name` | `"Blue Bottle"` | payload |
| `geohash` | `9q8znb19` | indexed prefix for area lookups |

When you **save** a point:

1. **Encode** it at a **fine** precision.You can always match a shorter prefix at query time.

   ```python
   h = geohash.encode(37.793217, -122.396559, precision=8)  # '9q8znb19'
   ```

2. **Insert** the row with `h` in the indexed `geohash` column (so lookups by area are fast).

   ```sql
   INSERT INTO venues (id, lat, lon, name, geohash)
   VALUES ('venue_42', 37.793217, -122.396559, 'Blue Bottle', '9q8znb19');

   -- B-tree index makes prefix/range scans on geohash fast
   CREATE INDEX venues_geohash_idx ON venues (geohash);
   ```

3. Always keep **real lat/long** in their own columns. The geohash only **finds candidates** quickly; final distance uses the true coordinates.

**Example:** 500 venues in SF share the prefix `9q8` (precision 3); at precision 8 each venue usually has its own value like `9q8znb19`.

## Query (find nearby)

You rarely query **one** geohash. You query **several boxes** around the user, then check real distance.

**Example:** User at `37.793217, -122.396559`, radius **500 m**.

1. **Encode** the user (pick length to match radius — here precision **7**):

   ```python
   center = geohash.encode(37.793217, -122.396559, precision=7)
   #  '9q8znb1'
   ```

2. **Find neighbors** — the 8 boxes touching that one:

   ```python
   cells = [center] + geohash.neighbors(center)
   #  ['9q8znb1', '9q8znb0', '9q8znb4', '9q8yyzc', '9q8yyzb',
   #     '9q8yyzf', '9q8znb3', '9q8znb2', '9q8znb6']
   ```

3. **Load rows** from the DB for those cells. You stored precision 8 but are querying at precision 7, so match by **prefix**, not exact equality:

   ```sql
   SELECT id, lat, lon FROM venues
   WHERE geohash LIKE '9q8znb1%'   -- center
      OR geohash LIKE '9q8znb0%'
      OR geohash LIKE '9q8znb4%'
      OR geohash LIKE '9q8yyzc%'
      OR geohash LIKE '9q8yyzb%'
      OR geohash LIKE '9q8yyzf%'
      OR geohash LIKE '9q8znb3%'
      OR geohash LIKE '9q8znb2%'
      OR geohash LIKE '9q8znb6%';
   ```

   Each `LIKE 'x%'` uses the B-tree index as a **range scan** (`geohash >= 'x' AND geohash < next(x)`), so this stays fast.

   Or one wider prefix when the cells share a common start:

   ```sql
   SELECT id, lat, lon FROM venues WHERE geohash LIKE '9q8znb%';
   ```

4. **Filter** with real distance ≤ 500 m (haversine or `ST_DWithin`): 

   ```sql
   SELECT id, lat, lon FROM venues
   WHERE (
           geohash LIKE '9q8znb1%' OR geohash LIKE '9q8znb0%'
        OR geohash LIKE '9q8znb4%' OR geohash LIKE '9q8yyzc%'
        OR geohash LIKE '9q8yyzb%' OR geohash LIKE '9q8yyzf%'
        OR geohash LIKE '9q8znb3%' OR geohash LIKE '9q8znb2%'
        OR geohash LIKE '9q8znb6%'
         )
     AND ST_DWithin(
           ST_MakePoint(lon, lat)::geography,
           ST_MakePoint(-122.396559, 37.793217)::geography,
           500
         );
   ```

**Why not only `9q8znb1`?** A shop just across the cell edge might be `9q8znb0` with **no shared prefix** at precision 7. You would miss it without **neighbors**.

For a **large** radius (e.g. 50 km), use more boxes (a “cover” of geohashes), not just 8 neighbors.

## Libraries

| Language | Package | Example |
|----------|---------|---------|
| Python | `python-geohash` | `geohash.encode(37.79, -122.39, 8)` → `'9q8znb19'` |
| JavaScript | `ngeohash` | `ngeohash.encode(37.79, -122.39)` |
| Go | `mmcloughlin/geohash` | `geohash.Encode(37.79, -122.39)` |
| Redis | built-in GEO | `GEOADD cafes -122.39 37.79 "cafe1"` then `GEORADIUS` |
