---
sidebar_position: 3
---
# Hash Table

Keys map to buckets via a hash function; no key ordering—only membership and value lookup by exact key.

*Examples:* Redis (dict), in-memory caches, hash indexes in databases
## Usage

- **When:** Equality on a full key; no need for range or ordering.
- **Good for:** O(1) average lookups
- **Tradeoff:** Range queries and sort-by-key are not supported; rehashing pauses or costs CPU/memory when the table grows.

## Read path

1. Hash the key : bucket index (often `hash(key) % num_buckets`).
2. Go to that bucket.
3. Hash Collision Handling
	1. Chaining: walk the list in the bucket until the key matches.
	2. Open addressing: probe the sequence of slots (linear/quadratic/double hashing) until the key or an empty slot.
4. Return value or not found.

## Write path

1. Hash the key to find a bucket (same as read).
2. Insert or update in the bucket (or first empty slot in probing schemes).
3. If load factor exceeds threshold, grow the table: allocate larger backing store, rehash all entries into new buckets.
4. Delete: remove entry; in open addressing, use tombstone or reorder probes per scheme.
