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

---

## Worked Example: Inserting into a Hash Table with Chaining

**Setup**: hash table size **m = 7**, hash function **h(k) = k mod 7**

Insert keys in order: **50, 700, 76, 85, 92, 73, 101**

---

### Step-by-step Insertions

#### Insert 50

```
h(50) = 50 mod 7 = 1
```

Bucket 1 is empty → place 50 there.

```
Index | Chain
------+-------
  0   | (empty)
  1   | [50]
  2   | (empty)
  3   | (empty)
  4   | (empty)
  5   | (empty)
  6   | (empty)
```

---

#### Insert 700

```
h(700) = 700 mod 7 = 0
```

Bucket 0 is empty → place 700 there.

```
Index | Chain
------+-------
  0   | [700]
  1   | [50]
  2   | (empty)
  3   | (empty)
  4   | (empty)
  5   | (empty)
  6   | (empty)
```

---

#### Insert 76

```
h(76) = 76 mod 7 = 6
```

Bucket 6 is empty → place 76 there.

```
Index | Chain
------+-------
  0   | [700]
  1   | [50]
  2   | (empty)
  3   | (empty)
  4   | (empty)
  5   | (empty)
  6   | [76]
```

---

#### Insert 85

```
h(85) = 85 mod 7 = 1
```

Bucket 1 is **occupied** (has 50) → **collision** → append 85 to bucket 1's chain.

```
Index | Chain
------+-------
  0   | [700]
  1   | [50] → [85]   ← chain grows
  2   | (empty)
  3   | (empty)
  4   | (empty)
  5   | (empty)
  6   | [76]
```

---

#### Insert 92

```
h(92) = 92 mod 7 = 1
```

Bucket 1 already has [50 → 85] → **collision** → append 92.

```
Index | Chain
------+-------
  0   | [700]
  1   | [50] → [85] → [92]   ← chain grows again
  2   | (empty)
  3   | (empty)
  4   | (empty)
  5   | (empty)
  6   | [76]
```

---

#### Insert 73

```
h(73) = 73 mod 7 = 3
```

Bucket 3 is empty → place 73 there.

```
Index | Chain
------+-------
  0   | [700]
  1   | [50] → [85] → [92]
  2   | (empty)
  3   | [73]
  4   | (empty)
  5   | (empty)
  6   | [76]
```

---

#### Insert 101

```
h(101) = 101 mod 7 = 3
```

Bucket 3 is **occupied** (has 73) → **collision** → append 101.

```
Index | Chain
------+-------
  0   | [700]
  1   | [50] → [85] → [92]
  2   | (empty)
  3   | [73] → [101]
  4   | (empty)
  5   | (empty)
  6   | [76]
```

**Final table after all insertions:**

```
Index | Chain
------+---------------------------
  0   | [700]
  1   | [50] → [85] → [92]
  2   | (empty)
  3   | [73] → [101]
  4   | (empty)
  5   | (empty)
  6   | [76]

Load factor α = 7 / 7 = 1.0
```

---

### Lookup: Search for key 92

```
1. Compute h(92) = 92 mod 7 = 1  → go to bucket 1
2. Traverse bucket 1's chain:
      [50]  → 50 ≠ 92, continue
      [85]  → 85 ≠ 92, continue
      [92]  → 92 = 92, FOUND ✓
```

Total comparisons: **3** (one per node in the chain until match).

---

### Deletion: Delete key 700

```
1. Compute h(700) = 700 mod 7 = 0  → go to bucket 0
2. Traverse bucket 0's chain:
      [700]  → 700 = 700, FOUND → remove node

After deletion:
Index | Chain
------+---------------------------
  0   | (empty)   ← node removed
  1   | [50] → [85] → [92]
  2   | (empty)
  3   | [73] → [101]
  4   | (empty)
  5   | (empty)
  6   | [76]
```

Deletion with chaining is clean — simply unlink the node from the list. No tombstones needed.

---

## Worked Example: Open Addressing with Linear Probing

**Setup**: hash table size **m = 11**, hash function **h(k) = k mod 11**

Probe sequence: **h(k, i) = (h(k) + i) mod 11** for i = 0, 1, 2, …

Insert keys in order: **10, 22, 31, 4, 15, 28, 17, 88, 59**

---

### Step-by-step Insertions

#### Insert 10

```
h(10) = 10 mod 11 = 10   → slot 10 is empty ✓
```

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [   ][   ][   ][   ][   ][   ][   ][   ][   ][   ][10]
```

---

#### Insert 22

```
h(22) = 22 mod 11 = 0   → slot 0 is empty ✓
```

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][   ][   ][   ][   ][   ][   ][   ][   ][   ][10]
```

---

#### Insert 31

```
h(31) = 31 mod 11 = 9   → slot 9 is empty ✓
```

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][   ][   ][   ][   ][   ][   ][   ][   ][31 ][10]
```

---

#### Insert 4

```
h(4) = 4 mod 11 = 4   → slot 4 is empty ✓
```

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][   ][   ][   ][ 4 ][   ][   ][   ][   ][31 ][10]
```

---

#### Insert 15

```
h(15) = 15 mod 11 = 4   → slot 4 OCCUPIED (has 4)
  probe i=1: slot (4+1) mod 11 = 5 → empty ✓
```

15 placed at slot **5** (1 probe after initial hash).

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][   ][   ][   ][ 4 ][15 ][   ][   ][   ][31 ][10]
```

---

#### Insert 28

```
h(28) = 28 mod 11 = 6   → slot 6 is empty ✓
```

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][   ][   ][   ][ 4 ][15 ][28 ][   ][   ][31 ][10]
```

---

#### Insert 17

```
h(17) = 17 mod 11 = 6   → slot 6 OCCUPIED (has 28)
  probe i=1: slot (6+1) mod 11 = 7 → empty ✓
```

17 placed at slot **7**.

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][   ][   ][   ][ 4 ][15 ][28 ][17 ][   ][31 ][10]
```

---

#### Insert 88

```
h(88) = 88 mod 11 = 0   → slot 0 OCCUPIED (has 22)
  probe i=1: slot (0+1) mod 11 = 1 → empty ✓
```

88 placed at slot **1**.

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][88 ][   ][   ][ 4 ][15 ][28 ][17 ][   ][31 ][10]
```

---

#### Insert 59

```
h(59) = 59 mod 11 = 4   → slot 4 OCCUPIED (has 4)
  probe i=1: slot 5 OCCUPIED (has 15)
  probe i=2: slot 6 OCCUPIED (has 28)
  probe i=3: slot 7 OCCUPIED (has 17)
  probe i=4: slot 8 → empty ✓
```

59 placed at slot **8** (4 probes needed — heavy clustering!).

**Final table after all insertions:**

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][88 ][   ][   ][ 4 ][15 ][28 ][17 ][59 ][31 ][10]

Load factor α = 9 / 11 ≈ 0.82
```

---

### The Clustering Problem

Look at the occupied slots after all insertions:

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][88 ][   ][   ][ 4 ][15 ][28 ][17 ][59 ][31 ][10]
        ↑────↑                ↑────↑────↑────↑────↑        ↑
     cluster 1             cluster 2 (slots 4–8, length 5!)
```

**Cluster 2 (slots 4–8)** was formed by five different keys: 4, 15, 28, 17, 59. Their initial hashes were 4, 4, 6, 6, 4 — but once a dense run of occupied slots forms, each new collision extends it further. This is **primary clustering**: any key hashing anywhere into the run must probe through the entire run.

The result is that the 59th insertion required **4 probes** even though only 8 of 11 slots were occupied. As the table fills, average probe length grows rapidly.

---

### Search for key 28

Trace the probe sequence used during lookup:

```
1. h(28) = 28 mod 11 = 6   → examine slot 6: value = 28 → MATCH ✓
```

28 is found in **1 probe** because it sits at its home slot (no collision displaced it).

Now contrast with searching for key **59**:

```
1. h(59) = 59 mod 11 = 4   → slot 4: value = 4  (≠ 59), continue
2. probe i=1: slot 5: value = 15 (≠ 59), continue
3. probe i=2: slot 6: value = 28 (≠ 59), continue
4. probe i=3: slot 7: value = 17 (≠ 59), continue
5. probe i=4: slot 8: value = 59 → MATCH ✓
```

5 probes to find 59 — same cost as its insertion.

---

### Tombstones During Deletion

Suppose we delete key **15** (at slot 5):

**Naïve deletion** (simply clearing slot 5):

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][88 ][   ][   ][ 4 ][   ][28 ][17 ][59 ][31 ][10]
                                   ↑
                            slot 5 now empty
```

Now search for **59**:

```
1. h(59) = 4  → slot 4: value = 4  (≠ 59)
2. probe i=1: slot 5: EMPTY → search STOPS (assumes 59 not present)
```

**Wrong!** 59 is at slot 8, but the empty slot 5 terminated the search early. The probe chain is broken.

**Tombstone solution** — mark slot 5 as `DELETED` rather than truly empty:

```
Slot:  [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Value: [22 ][88 ][   ][   ][ 4 ][DEL][28 ][17 ][59 ][31 ][10]
                                   ↑
                              tombstone
```

Search rules with tombstones:
- **During search**: treat `DELETED` as occupied (keep probing past it).
- **During insert**: treat `DELETED` as a candidate slot (reuse it).

Search for 59 now succeeds:

```
1. h(59) = 4  → slot 4: value = 4   (≠ 59), continue
2. probe i=1: slot 5: DELETED → continue (do NOT stop)
3. probe i=2: slot 6: value = 28 (≠ 59), continue
4. probe i=3: slot 7: value = 17 (≠ 59), continue
5. probe i=4: slot 8: value = 59 → MATCH ✓
```

**Trade-off**: tombstones accumulate over many deletions and slow down searches (probing never terminates early at a tombstone). Periodically **rebuild** (rehash) the table to eliminate accumulated tombstones.
