---
sidebar_position: 8
---
# Bloom Filter

A compact bit array plus several hash functions. Membership tests are probabilistic: a “maybe present” can be wrong; “definitely not present” is always correct (for the set the filter was built from).

*Examples:* SSTable metadata in LSM stores (RocksDB, Cassandra), CDNs, databases avoiding disk reads on cold keys

## Usage

- **When:** Avoid expensive work using probabilistic filtering.
- **Good for:** “Is this key present in this SSTable / cache shard?” before an I/O-heavy seek; dedup hints; join filters in query engines.
- **Tradeoff:** No false negatives for inserts you’ve added, but false positives mean extra work sometimes; classic filters don’t support delete (use a Cuckoo Filter or rebuild).

## Read path

1. Take the key and compute k hash values, mapping each to a bit index in an array of length m.
2. Test: if any of those k bits is 0, the key was never inserted : definitely not in the set
3. If all k bits are 1, report maybe present (could be a false positive from hash collisions on other keys).

## Write path

1. Allocate a bit array of size m (all zeros) and fix k hash functions.
2. For each insert, set the k bits corresponding to that key to 1 (idempotent).
3. Tuning: choose m and k from expected number of keys n and target false-positive rate p; rebuild the filter when the set grows enough that p drifts.

## Rules of Thumb for Bloom Filters 

1. **Bit Array Size ( m ) :** Use 1 byte (8 bits) per element to achieve roughly a 2% false positive rate.
2. **Number of Hash Functions (k):** The optimal number of hash functions is typically (m/n x 0.7)
