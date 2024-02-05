# CS204: Database Storage Engines & Indexing Architectures

<!-- metadata:
subject: Database Systems
topic_id: db_indexing_concurrency
topic_name: Database Indexing & Concurrency Control
difficulty: Intermediate
bloom_level: Analyze
prerequisites: File Systems, Binary Trees, Operating Systems
-->

## 1. B-Tree vs. Log-Structured Merge (LSM) Trees

Data storage engines optimize for read-heavy versus write-heavy workloads through distinct tree structures:
- **B+ Trees**: Self-balancing search tree where internal nodes store keys/pointers and leaf nodes store values linked as a bidirectional linked list.
  - Read: Guaranteed O(log_B N) disk block accesses.
  - Random Writes: High write amplification due to in-place page updates and random disk I/O.
- **LSM-Trees**: Used in modern distributed stores (Cassandra, RocksDB).
  - Writes are appended to an in-memory `MemTable` (skip list or red-black tree) and sequential write-ahead log (WAL).
  - Flushed to immutable disk `SSTables` (Sorted String Tables).
  - Background compaction merges runs, optimizing write throughput at the cost of read amplification.

## 2. Multi-Version Concurrency Control (MVCC) and ACID

To maintain isolation without acquiring destructive shared table locks:
- Each row update creates an immutable tuple version tagged with `created_txn_id` and `expired_txn_id`.
- Read transactions observe consistent snapshots corresponding to transactions committed prior to their start timestamp, eliminating read-write blocking.
