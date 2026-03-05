---
title: "Hash Tables and Hashing"
description: "How hash tables work — hash functions, collision resolution (chaining, open addressing), load factor, rehashing, and practical applications."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "hash table", "hash map", "hashing", "data structures"]
author: "Nemit"
featured: false
pinned: false
---

# Hash Tables and Hashing

## What Is a Hash Table?

A **hash table** (hash map) is a data structure that maps keys to values using a **hash function**. It provides **O(1) average-case** lookup, insertion, and deletion.

```
Key → Hash Function → Index → Value

"alice" → hash("alice") → 3 → {name: "Alice", age: 30}
"bob"   → hash("bob")   → 7 → {name: "Bob", age: 25}
```

### Core Operations

| Operation | Average | Worst |
|---|---|---|
| Search | O(1) | O(n) |
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |

Worst case O(n) occurs when all keys hash to the same bucket (degenerate case).

---

## Hash Functions

A hash function converts a key of arbitrary size into a fixed-size integer (the hash code), which is then mapped to an array index.

### Properties of Good Hash Functions

1. **Deterministic**: same key always produces same hash
2. **Uniform distribution**: keys spread evenly across buckets
3. **Fast to compute**: ideally O(1) or O(key length)
4. **Avalanche effect**: small changes in key produce very different hashes

### Common Hash Functions

#### Division Method

```
h(k) = k mod m
```

Choose m as a prime number not close to a power of 2 for better distribution.

#### Multiplication Method

```
h(k) = ⌊m × (k × A mod 1)⌋    where A ≈ 0.6180339887 (golden ratio)
```

Less sensitive to choice of m.

#### String Hashing

```python
def hash_string(s, m):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % m    # Polynomial rolling hash
    return h
```

Java's `String.hashCode()` uses multiplier 31. Other common choices: 37, 53.

#### Cryptographic Hash Functions

MD5, SHA-1, SHA-256 — designed for security (collision resistance, preimage resistance). Too slow for hash tables but used for checksums, digital signatures, and password storage.

### Python's hash()

```python
hash(42)           # Integer hash
hash("hello")      # String hash (randomized per session for security)
hash((1, 2, 3))    # Tuple hash (tuples are hashable)
# hash([1, 2, 3])  # Error: lists are mutable, not hashable
```

---

## Collision Resolution

Since the number of possible keys is usually much larger than the array size, multiple keys can hash to the same index. This is a **collision**.

### 1. Chaining (Separate Chaining)

Each bucket stores a **linked list** (or other collection) of all entries that hash to that index:

```
Index 0: → [("alice", 30)] → [("charlie", 35)]
Index 1: → [("bob", 25)]
Index 2: → (empty)
Index 3: → [("dave", 28)]
```

```python
class HashTableChaining:
    def __init__(self, size=16):
        self.size = size
        self.buckets = [[] for _ in range(size)]

    def _hash(self, key):
        return hash(key) % self.size

    def put(self, key, value):
        idx = self._hash(key)
        for i, (k, v) in enumerate(self.buckets[idx]):
            if k == key:
                self.buckets[idx][i] = (key, value)
                return
        self.buckets[idx].append((key, value))

    def get(self, key):
        idx = self._hash(key)
        for k, v in self.buckets[idx]:
            if k == key:
                return v
        raise KeyError(key)

    def delete(self, key):
        idx = self._hash(key)
        for i, (k, v) in enumerate(self.buckets[idx]):
            if k == key:
                self.buckets[idx].pop(i)
                return
        raise KeyError(key)
```

**Pros**: simple, handles high load factors well, deletion is easy
**Cons**: extra memory for pointers, poor cache locality

### 2. Open Addressing

All entries are stored in the array itself. On collision, **probe** for the next available slot.

#### Linear Probing

```
h(k, i) = (h(k) + i) mod m      for i = 0, 1, 2, ...
```

```
Insert "alice" → hash=3 → slot 3 ✓
Insert "bob"   → hash=3 → slot 3 taken → try 4 ✓
Insert "charlie" → hash=3 → slot 3 taken → 4 taken → try 5 ✓
```

**Problem**: **primary clustering** — consecutive occupied slots form clusters, making future insertions slower.

#### Quadratic Probing

```
h(k, i) = (h(k) + c₁i + c₂i²) mod m
```

Reduces primary clustering but can cause **secondary clustering** (keys with same hash follow same probe sequence).

#### Double Hashing

```
h(k, i) = (h₁(k) + i × h₂(k)) mod m
```

Uses a second hash function for the step size. Best distribution among open addressing methods.

### Deletion in Open Addressing

Can't simply remove an entry — it would break the probe chain. Use **tombstones** (mark as deleted):

```
Slot: [alice] [DELETED] [charlie] [empty]
                 ↑ tombstone
Search for charlie: hash=0, probe 0 (alice), probe 1 (DELETED, continue), probe 2 (charlie, found!)
```

Tombstones accumulate and degrade performance. Periodically rebuild the table.

### Robin Hood Hashing

A variant of open addressing where the displaced element with the **shortest probe distance** is the one that keeps its spot. This reduces variance in probe lengths.

---

## Load Factor and Rehashing

### Load Factor

```
α = n / m    (number of entries / number of buckets)
```

| Load Factor | Chaining | Open Addressing |
|---|---|---|
| α < 0.5 | Fast | Fast |
| α ≈ 0.75 | Good | Acceptable (Java HashMap resizes here) |
| α > 1.0 | Possible (chains grow) | Impossible (no empty slots) |

### Rehashing

When the load factor exceeds a threshold, **double the array size** and reinsert all elements:

```python
def _resize(self):
    old_buckets = self.buckets
    self.size *= 2
    self.buckets = [[] for _ in range(self.size)]
    for bucket in old_buckets:
        for key, value in bucket:
            self.put(key, value)    # Rehash into new table
```

Rehashing is O(n) but happens rarely → O(1) amortized per operation.

---

## Hash Table in Practice

### Python `dict`

Python's dict uses open addressing with a compact layout:

```python
d = {"name": "Alice", "age": 30}
d["email"] = "alice@example.com"    # O(1) insert
print(d["name"])                     # O(1) lookup
del d["age"]                         # O(1) delete
"name" in d                          # O(1) membership test
```

Since Python 3.7, dicts maintain **insertion order**.

### Java `HashMap`

- Default initial capacity: 16
- Load factor threshold: 0.75
- When a bucket has > 8 entries, it converts from linked list to **red-black tree** (O(log n) worst case instead of O(n))

### C++ `std::unordered_map`

```cpp
std::unordered_map<std::string, int> map;
map["alice"] = 30;
map.count("alice");    // 1 (exists) or 0
```

Uses chaining. For open addressing, use `absl::flat_hash_map` or similar.

---

## Hash Sets

A **hash set** stores only keys (no values). Same O(1) operations.

```python
s = {1, 2, 3}
s.add(4)           # O(1)
s.remove(2)        # O(1)
3 in s             # O(1)
```

Applications:
- Duplicate detection
- Membership testing
- Set operations (union, intersection, difference)

---

## Applications

### Counting Frequency

```python
from collections import Counter

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
freq = Counter(words)
# Counter({'apple': 3, 'banana': 2, 'cherry': 1})
```

### Two Sum Problem

```python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
```

O(n) time, O(n) space — vs O(n²) brute force.

### Caching / Memoization

```python
cache = {}
def fibonacci(n):
    if n in cache:
        return cache[n]
    if n <= 1:
        return n
    cache[n] = fibonacci(n - 1) + fibonacci(n - 2)
    return cache[n]
```

### Deduplication

```python
unique = list(set(items))    # Remove duplicates (order not preserved)

# Preserve order:
seen = set()
unique = [x for x in items if not (x in seen or seen.add(x))]
```

### Anagram Detection

```python
def are_anagrams(s1, s2):
    return Counter(s1) == Counter(s2)
```

---

## Hash Collisions and Security

### Hash Flooding Attack

An attacker sends keys designed to collide, degrading O(1) to O(n). Mitigations:
- **Randomized hash seed** (Python does this since 3.3)
- **Switch to balanced tree on high collision** (Java 8+ HashMap)
- **Use cryptographic hash** for untrusted input

### Birthday Paradox

With a hash producing m possible values, a collision is expected after approximately **√m** insertions. For a 32-bit hash (m = 2³²), expect collisions after ~65,536 entries.

This is why hash tables need good collision resolution — collisions are inevitable.

---

## Comparison with Other Data Structures

| Operation | Hash Table | BST (balanced) | Sorted Array |
|---|---|---|---|
| Search | O(1) avg | O(log n) | O(log n) |
| Insert | O(1) avg | O(log n) | O(n) |
| Delete | O(1) avg | O(log n) | O(n) |
| Min/Max | O(n) | O(log n) | O(1) |
| Range query | O(n) | O(log n + k) | O(log n + k) |
| Ordered traversal | O(n log n) | O(n) | O(n) |
| Space | O(n) | O(n) | O(n) |

Use hash tables when you need fast lookup/insert/delete without ordering. Use BSTs when you need ordered operations.
