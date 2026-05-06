---
sidebar_position: 2
---
# B+ Tree

Internal nodes enable navigation; all row pointers sit in leaves, linked left-to-right for range scans. Depth stays low and I/O patterns stay predictable for OLTP.

*Examples:* MySQL (InnoDB), PostgreSQL
## Usage

- **When:** Stable mix of point lookups and ordered range scans on disk-backed OLTP.
- **Good for:** Clustered PK scans, prefix and range predicates with few buffer-pool misses per probe.
- **Tradeoff:** Random writes can split pages and ripple upward; not as write-optimized as append-only LSM for pure ingest.
## Read path

1. Start at root; compare key against separator keys in internal nodes and pick the child pointer.
2. Descend until you reach a leaf.
3. Query:
	1. Point lookup: find the key in the leaf (or “not found”).
	2. Range scan: walk the leaf chain (sibling links) in key order without revisiting the upper tree.

## Write path

1. Descend the same way as a read to the target leaf.
2. Insert or update in the leaf page (buffer pool).
	- For a write, the engine loads that page into the buffer pool, or finds it already there.
3. If the leaf overflows, split the leaf; insert a new separator into the parent.
4. If a parent overflows, split upward to the root; tree grows in height only when the root splits.
5. A WAL record describing the change is generated and is appended to WAL buffer. On commit, WAL is flushed to durable storage.
6. "Dirty" B+ tree page is later flushed to disk

## Order of a B+ Tree

The number of pointers in a B+ tree is determined by the order of the tree and the node type.

Say, for a B+ tree of order m

**Internal Nodes**
- Max Pointers: m
- Min Pointers: m/2 child pointers (to ensure a 50% fill rate).
- Root Exception: The root can have a minimum of 2 child pointers.

**Leaf Nodes**
- Data Pointers: Up to m-1 pointers for each data record/key.
- Sequence Pointer: Exactly 1 additional pointer that links to the next leaf node (enabling  range queries).