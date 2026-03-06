---
title: "Heaps"
description: "Heap data structure — binary heaps, min-heap and max-heap, array representation, heapify, heap sort, and common heap problems with implementations."
date: "2026-03-06"
category: "CS/algorithms"
tags: ["algorithms", "heap", "data structures", "priority queue", "binary heap", "heap sort"]
author: "Nemit"
featured: false
pinned: false
---

# Heaps

## Heap — Complete Binary Tree with Ordering

A **heap** is a **complete binary tree** that satisfies the **heap property**:

- **Min-Heap**: Every parent node is ≤ both of its children. The root holds the **minimum** element.
- **Max-Heap**: Every parent node is ≥ both of its children. The root holds the **maximum** element.

A **complete binary tree** fills levels left to right, with every level fully filled except possibly the last.

### Min-Heap vs Max-Heap

```
Min-Heap:                    Max-Heap:

        1                           9
      /   \                       /   \
     2     3                     7     8
    / \   / \                   / \   / \
   4   5 6   7                 3   4 5   6
```

In the min-heap above, every parent is smaller than its children. In the max-heap, every parent is larger.

### Array Representation

A heap is stored as a flat array — no pointers needed. For a node at index `i`:

```
parent(i)  = (i - 1) // 2
left(i)    = 2 * i + 1
right(i)   = 2 * i + 2
```

```
Tree:                    Array index mapping:

        1  (0)           Index: [0] [1] [2] [3] [4] [5] [6]
      /     \            Value: [ 1,  2,  3,  4,  5,  6,  7]
    2 (1)  3 (2)
   /  \   /  \
 4(3) 5(4) 6(5) 7(6)
```

Index relationships:
- Node at index `1` (value 2): parent = index `0`, children = indices `3` and `4`
- Node at index `2` (value 3): parent = index `0`, children = indices `5` and `6`
- Nodes at indices `3–6` are leaves: `(2*3+1) = 7` is out of bounds for a 7-element array

This array layout is cache-friendly and avoids pointer overhead.

---

## Operations

| Operation | Time | Notes |
|---|---|---|
| `insert(x)` | O(log n) | Append then sift up |
| `extract_min()` / `extract_max()` | O(log n) | Swap root with last, sift down |
| `peek()` | O(1) | Read `heap[0]` |
| `heapify(array)` | O(n) | Build heap from unordered array |
| `heap_sort()` | O(n log n) | Heapify then extract repeatedly |

---

## Implementation — Min-Heap from Scratch

```python
class MinHeap:
    def __init__(self):
        self.heap = []

    def size(self):
        return len(self.heap)

    def peek(self):
        if not self.heap:
            raise IndexError("Heap is empty")
        return self.heap[0]           # Minimum is always at root

    def insert(self, val):
        self.heap.append(val)         # Add to end
        self._sift_up(len(self.heap) - 1)   # Restore heap property upward

    def extract_min(self):
        if not self.heap:
            raise IndexError("Heap is empty")
        if len(self.heap) == 1:
            return self.heap.pop()

        min_val = self.heap[0]
        self.heap[0] = self.heap.pop()  # Move last element to root
        self._sift_down(0)              # Restore heap property downward
        return min_val

    def _sift_up(self, i):
        # Bubble element up until heap property is satisfied
        while i > 0:
            parent = (i - 1) // 2
            if self.heap[i] < self.heap[parent]:
                self.heap[i], self.heap[parent] = self.heap[parent], self.heap[i]
                i = parent
            else:
                break

    def _sift_down(self, i):
        # Push element down until heap property is satisfied
        n = len(self.heap)
        while True:
            smallest = i
            left  = 2 * i + 1
            right = 2 * i + 2

            if left < n and self.heap[left] < self.heap[smallest]:
                smallest = left
            if right < n and self.heap[right] < self.heap[smallest]:
                smallest = right

            if smallest == i:
                break                  # Already in correct position

            self.heap[i], self.heap[smallest] = self.heap[smallest], self.heap[i]
            i = smallest

    def heapify(self, array):
        # Build heap from arbitrary array in O(n)
        self.heap = array[:]
        # Start from last non-leaf and sift down each node
        for i in range(len(self.heap) // 2 - 1, -1, -1):
            self._sift_down(i)
```

### Max-Heap Variant

The simplest way to get a max-heap is to flip the comparison in `_sift_up` and `_sift_down`:

```python
class MaxHeap:
    def __init__(self):
        self.heap = []

    def size(self):
        return len(self.heap)

    def peek(self):
        if not self.heap:
            raise IndexError("Heap is empty")
        return self.heap[0]

    def insert(self, val):
        self.heap.append(val)
        self._sift_up(len(self.heap) - 1)

    def extract_max(self):
        if not self.heap:
            raise IndexError("Heap is empty")
        if len(self.heap) == 1:
            return self.heap.pop()

        max_val = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._sift_down(0)
        return max_val

    def _sift_up(self, i):
        while i > 0:
            parent = (i - 1) // 2
            if self.heap[i] > self.heap[parent]:   # Flip: > instead of <
                self.heap[i], self.heap[parent] = self.heap[parent], self.heap[i]
                i = parent
            else:
                break

    def _sift_down(self, i):
        n = len(self.heap)
        while True:
            largest = i
            left  = 2 * i + 1
            right = 2 * i + 2

            if left < n and self.heap[left] > self.heap[largest]:   # Flip
                largest = left
            if right < n and self.heap[right] > self.heap[largest]: # Flip
                largest = right

            if largest == i:
                break

            self.heap[i], self.heap[largest] = self.heap[largest], self.heap[i]
            i = largest
```

---

## Why Heapify is O(n), not O(n log n)

Naively, calling `insert` n times is O(n log n). But the **bottom-up heapify** algorithm is O(n).

**Intuition**: Most nodes are near the bottom of the tree, where `_sift_down` does very little work. Only the root can travel all the way down — the vast majority of nodes are at most 1–2 levels from the leaves.

**Mathematical sketch**:

At height `h`, a complete binary tree has at most `⌈n / 2^(h+1)⌉` nodes, and each sifts down at most `h` steps.

```
Total work = Σ (h from 0 to log n) of  ⌈n / 2^(h+1)⌉ * h

           ≤ n * Σ (h from 0 to ∞) of  h / 2^h

           = n * 2        (geometric series identity: Σ h/2^h = 2)

           = O(n)
```

The key insight: there are `n/2` leaves (h=0, zero work each), `n/4` nodes at h=1 (1 swap max each), `n/8` at h=2 (2 swaps max each), and so on. The total converges to a linear bound.

---

## Heap Sort

Heap sort uses a max-heap to sort in-place:

1. **Build** a max-heap from the array in O(n)
2. **Repeatedly extract** the maximum: swap the root (max) with the last unsorted element, shrink the heap boundary by 1, then sift down the new root

```
Initial array: [4, 10, 3, 5, 1]

After heapify:
        10
       /  \
      5    3
     / \
    4   1
Array: [10, 5, 3, 4, 1]

Step 1 — extract max (10):
  Swap heap[0] and heap[4]: [1, 5, 3, 4, | 10]
  Sift down index 0, heap size = 4:
        5
       / \
      4   3
     /
    1
  Array: [5, 4, 3, 1, | 10]

Step 2 — extract max (5):
  Swap heap[0] and heap[3]: [1, 4, 3, | 5, 10]
  Sift down, heap size = 3:
  Array: [4, 1, 3, | 5, 10]

Step 3 — extract max (4):
  Swap heap[0] and heap[2]: [3, 1, | 4, 5, 10]
  Sift down, heap size = 2:
  Array: [3, 1, | 4, 5, 10]

Step 4 — extract max (3):
  Swap heap[0] and heap[1]: [1, | 3, 4, 5, 10]
  Heap size = 1, done.

Sorted: [1, 3, 4, 5, 10]
```

### Implementation

```python
def heap_sort(arr):
    n = len(arr)

    # Step 1: Build max-heap (bottom-up)
    for i in range(n // 2 - 1, -1, -1):
        _sift_down_max(arr, n, i)

    # Step 2: Extract elements one by one
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]   # Move current root (max) to sorted end
        _sift_down_max(arr, i, 0)          # Restore heap for reduced size

    return arr

def _sift_down_max(arr, heap_size, i):
    largest = i
    left  = 2 * i + 1
    right = 2 * i + 2

    if left < heap_size and arr[left] > arr[largest]:
        largest = left
    if right < heap_size and arr[right] > arr[largest]:
        largest = right

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        _sift_down_max(arr, heap_size, largest)

# [4, 10, 3, 5, 1] → [1, 3, 4, 5, 10]
```

**Time**: O(n log n) — O(n) to heapify, O(log n) per extraction × n extractions.
**Space**: O(1) — sorting is done in-place.

### Comparison with Other Sorting Algorithms

| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Tim Sort (Python) | O(n) | O(n log n) | O(n log n) | O(n) | Yes |

Heap sort is rarely used in practice despite its guarantees, because it has poor cache performance — accesses jump around the array rather than scanning linearly.

---

## Python `heapq` Module

Python provides a min-heap via the `heapq` module. All operations work on a plain `list`.

```python
import heapq

# --- Build ---
nums = [5, 3, 8, 1, 2]
heapq.heapify(nums)          # O(n), transforms list in-place → [1, 2, 8, 5, 3]

# --- Insert ---
heapq.heappush(nums, 0)      # O(log n), inserts 0 → [0, 2, 1, 5, 3, 8]

# --- Extract minimum ---
heapq.heappop(nums)          # O(log n) → returns 0

# --- Peek minimum ---
nums[0]                       # O(1), does NOT modify the heap

# --- Atomic push + pop (more efficient than separate calls) ---
heapq.heappushpop(nums, 4)   # Push 4, then pop and return the minimum
heapq.heapreplace(nums, 4)   # Pop and return minimum, then push 4
                              # heapreplace is faster but raises if heap is empty

# --- N largest / smallest ---
heapq.nlargest(3, nums)      # Returns 3 largest elements (sorted descending)
heapq.nsmallest(3, nums)     # Returns 3 smallest elements (sorted ascending)
```

### Max-Heap Trick

Python's `heapq` is min-heap only. Simulate a max-heap by **negating values**:

```python
import heapq

max_heap = []
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -3)
heapq.heappush(max_heap, -8)

max_val = -heapq.heappop(max_heap)    # 8 (negate back when reading)

# For a list of values:
nums = [5, 3, 8, 1, 2]
max_heap = [-x for x in nums]
heapq.heapify(max_heap)
largest = -heapq.heappop(max_heap)    # 8
```

### Custom Priority with Tuples

`heapq` compares tuples lexicographically. Use `(priority, item)` pairs:

```python
import heapq

pq = []
heapq.heappush(pq, (3, "low priority task"))
heapq.heappush(pq, (1, "high priority task"))
heapq.heappush(pq, (2, "medium priority task"))

priority, task = heapq.heappop(pq)    # (1, "high priority task")

# If items are not naturally comparable (e.g., custom objects),
# use (priority, tie_breaker, item) to avoid comparison errors:
import itertools
counter = itertools.count()
heapq.heappush(pq, (1, next(counter), some_object))
```

### When to Use `heapq` vs `sorted()` vs Manual Heap

| Scenario | Recommended |
|---|---|
| Need top-k elements from a large stream | `heapq.nsmallest` / `nlargest` |
| Need repeated min/max with interleaved inserts | `heapq` |
| One-time sort of a complete list | `sorted()` or `list.sort()` |
| Need both min and max simultaneously | Two heaps (see median problem) |
| Performance-critical, many pushes/pops | `heapq` (C-backed, very fast) |

---

## Heap Problems

### 1. Kth Largest Element in an Array

**Problem**: Find the kth largest element in an unsorted array.

**Approach**: Maintain a **min-heap of size k**. The root will be the kth largest.

```python
import heapq

def find_kth_largest(nums, k):
    heap = []

    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)    # Remove smallest — keep only k largest

    return heap[0]    # Root is the kth largest (smallest of the top k)

# nums = [3, 2, 1, 5, 6, 4], k = 2 → 5
# nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4 → 4
```

**Time**: O(n log k) — each of n elements is pushed/popped from a heap of size ≤ k.
**Space**: O(k)

### 2. Top K Frequent Elements

**Problem**: Given an array, return the k most frequent elements.

```python
import heapq
from collections import Counter

def top_k_frequent(nums, k):
    count = Counter(nums)                           # {element: frequency}

    # Min-heap of (frequency, element), size k
    heap = []
    for num, freq in count.items():
        heapq.heappush(heap, (freq, num))
        if len(heap) > k:
            heapq.heappop(heap)                     # Remove least frequent

    return [num for freq, num in heap]

# [1,1,1,2,2,3], k=2 → [1, 2]
```

**Time**: O(n log k), **Space**: O(n) for the counter + O(k) for the heap.

### 3. Merge K Sorted Lists

**Problem**: Merge k sorted arrays into one sorted array.

**Approach**: Use a min-heap seeded with the first element of each list. Always extract the smallest, then add that list's next element.

```python
import heapq

def merge_k_sorted(lists):
    heap = []

    # Seed with first element of each list: (value, list_index, element_index)
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))

    result = []
    while heap:
        val, list_idx, elem_idx = heapq.heappop(heap)
        result.append(val)

        # Push next element from the same list
        next_idx = elem_idx + 1
        if next_idx < len(lists[list_idx]):
            heapq.heappush(heap, (lists[list_idx][next_idx], list_idx, next_idx))

    return result

# [[1,4,7], [2,5,8], [3,6,9]] → [1,2,3,4,5,6,7,8,9]
```

**Time**: O(n log k) where n = total elements, k = number of lists.
**Space**: O(k) for the heap.

### 4. Find Median from Data Stream

**Problem**: Design a data structure that can add numbers one by one and compute the median at any time.

**Approach**: Maintain two heaps:
- `lower`: max-heap for the smaller half (negate to simulate max-heap)
- `upper`: min-heap for the larger half

Invariant: `len(lower) == len(upper)` or `len(lower) == len(upper) + 1`.

```python
import heapq

class MedianFinder:
    def __init__(self):
        self.lower = []    # Max-heap (negated) — holds smaller half
        self.upper = []    # Min-heap — holds larger half

    def add_num(self, num):
        # Push to lower first (convert to max-heap by negating)
        heapq.heappush(self.lower, -num)

        # Balance: ensure every element in lower ≤ every element in upper
        if self.lower and self.upper and (-self.lower[0] > self.upper[0]):
            val = -heapq.heappop(self.lower)
            heapq.heappush(self.upper, val)

        # Balance sizes: lower can have at most 1 more element than upper
        if len(self.lower) > len(self.upper) + 1:
            val = -heapq.heappop(self.lower)
            heapq.heappush(self.upper, val)
        elif len(self.upper) > len(self.lower):
            val = heapq.heappop(self.upper)
            heapq.heappush(self.lower, -val)

    def find_median(self):
        if len(self.lower) > len(self.upper):
            return -self.lower[0]              # Odd count: median is top of lower
        return (-self.lower[0] + self.upper[0]) / 2.0   # Even: average of two middles

# mf = MedianFinder()
# mf.add_num(1) → lower=[-1], upper=[]   → median = 1
# mf.add_num(2) → lower=[-1], upper=[2]  → median = 1.5
# mf.add_num(3) → lower=[-2,-1], upper=[3] → median = 2
```

**Time**: O(log n) per `add_num`, O(1) per `find_median`.

### 5. Task Scheduler

**Problem**: Given tasks (each labeled A–Z) and a cooldown `n`, find the minimum time to finish all tasks. Same tasks must be `n` intervals apart.

**Approach**: Greedily always schedule the most frequent remaining task. Use a max-heap for task counts and a wait queue for cooling-down tasks.

```python
import heapq
from collections import Counter, deque

def least_interval(tasks, n):
    count = Counter(tasks)
    max_heap = [-c for c in count.values()]   # Negate for max-heap
    heapq.heapify(max_heap)

    time = 0
    wait_queue = deque()    # (negative_count, available_at_time)

    while max_heap or wait_queue:
        time += 1

        if max_heap:
            cnt = 1 + heapq.heappop(max_heap)  # Use one task (cnt is negative, +1 reduces magnitude)
            if cnt < 0:                         # Tasks remaining
                wait_queue.append((cnt, time + n))

        # Re-add tasks whose cooldown has expired
        if wait_queue and wait_queue[0][1] == time:
            heapq.heappush(max_heap, wait_queue.popleft()[0])

    return time

# tasks = ["A","A","A","B","B","B"], n = 2 → 8
# Schedule: A B _ A B _ A B  (8 slots)
```

**Time**: O(m log m) where m is the number of unique tasks.

### 6. Dijkstra's Shortest Path

**Problem**: Find shortest path from source to all other nodes in a weighted graph (non-negative weights).

**Approach**: Use a min-heap as a priority queue. Always process the unvisited node with the smallest known distance.

```python
import heapq
from collections import defaultdict

def dijkstra(graph, source):
    # graph: {node: [(neighbor, weight), ...]}
    dist = defaultdict(lambda: float('inf'))
    dist[source] = 0

    heap = [(0, source)]    # (distance, node)

    while heap:
        d, u = heapq.heappop(heap)

        if d > dist[u]:
            continue    # Outdated entry — already found a shorter path

        for v, weight in graph[u]:
            new_dist = dist[u] + weight
            if new_dist < dist[v]:
                dist[v] = new_dist
                heapq.heappush(heap, (new_dist, v))

    return dict(dist)

# graph = {
#     0: [(1, 4), (2, 1)],
#     1: [(3, 1)],
#     2: [(1, 2), (3, 5)],
#     3: []
# }
# dijkstra(graph, 0) → {0: 0, 1: 3, 2: 1, 3: 4}
```

**Time**: O((V + E) log V), **Space**: O(V + E).

---

## Worked Example: Insert and Extract — Step-by-Step Trace

We insert `[5, 3, 8, 1, 2, 7]` one by one into an empty min-heap, then extract the minimum twice.

### Insertions

**Inserting 5** — heap is empty, just append:
```
Array: [5]
Tree:    5
```

**Inserting 3** — append at index 1, sift up: parent(1) = 0, heap[1]=3 < heap[0]=5 → swap
```
Array: [3, 5]       (after sift-up: 3 swapped with 5)
Tree:    3
        /
       5
```

**Inserting 8** — append at index 2, sift up: parent(2) = 0, heap[2]=8 ≥ heap[0]=3 → no swap
```
Array: [3, 5, 8]
Tree:    3
        / \
       5   8
```

**Inserting 1** — append at index 3, sift up:
- parent(3) = 1, heap[3]=1 < heap[1]=5 → swap → array: [3, 1, 8, 5]
- parent(1) = 0, heap[1]=1 < heap[0]=3 → swap → array: [1, 3, 8, 5]

```
Array: [1, 3, 8, 5]
Tree:      1
          / \
         3   8
        /
       5
```

**Inserting 2** — append at index 4, sift up:
- parent(4) = 1, heap[4]=2 < heap[1]=3 → swap → array: [1, 2, 8, 5, 3]
- parent(1) = 0, heap[1]=2 ≥ heap[0]=1 → stop

```
Array: [1, 2, 8, 5, 3]
Tree:      1
          / \
         2   8
        / \
       5   3
```

**Inserting 7** — append at index 5, sift up:
- parent(5) = 2, heap[5]=7 < heap[2]=8 → swap → array: [1, 2, 7, 5, 3, 8]
- parent(2) = 0, heap[2]=7 ≥ heap[0]=1 → stop

```
Array: [1, 2, 7, 5, 3, 8]
Tree:        1
           /   \
          2     7
         / \   /
        5   3 8
```

### Trace Table — All Insertions

| Step | Insert | Append → Array | Sift-Up Swaps | Final Array |
|------|--------|----------------|---------------|-------------|
| 1 | 5 | `[5]` | none | `[5]` |
| 2 | 3 | `[5, 3]` | i=1 ↔ i=0 (3<5) | `[3, 5]` |
| 3 | 8 | `[3, 5, 8]` | none (8≥3) | `[3, 5, 8]` |
| 4 | 1 | `[3, 5, 8, 1]` | i=3↔i=1 (1<5), i=1↔i=0 (1<3) | `[1, 3, 8, 5]` |
| 5 | 2 | `[1, 3, 8, 5, 2]` | i=4↔i=1 (2<3) | `[1, 2, 8, 5, 3]` |
| 6 | 7 | `[1, 2, 8, 5, 3, 7]` | i=5↔i=2 (7<8) | `[1, 2, 7, 5, 3, 8]` |

### Extractions

**Extract min #1** from `[1, 2, 7, 5, 3, 8]`:
1. Save root: `min_val = 1`
2. Move last element to root: `[8, 2, 7, 5, 3]` (removed last 8)
3. Sift down from index 0:
   - children: left=2 (index 1), right=7 (index 2); smallest child = 2 at index 1
   - heap[0]=8 > 2 → swap → `[2, 8, 7, 5, 3]`
   - at index 1: children: 5 (index 3), 3 (index 4); smallest = 3 at index 4
   - heap[1]=8 > 3 → swap → `[2, 3, 7, 5, 8]`
   - at index 4: no children → done
4. Returned: `1`

```
Array after extract 1: [2, 3, 7, 5, 8]
Tree:        2
           /   \
          3     7
         / \
        5   8
```

**Extract min #2** from `[2, 3, 7, 5, 8]`:
1. Save root: `min_val = 2`
2. Move last element to root: `[8, 3, 7, 5]`
3. Sift down from index 0:
   - children: 3 (index 1), 7 (index 2); smallest = 3 at index 1
   - heap[0]=8 > 3 → swap → `[3, 8, 7, 5]`
   - at index 1: children: 5 (index 3), no right child; 8 > 5 → swap → `[3, 5, 7, 8]`
   - at index 3: no children → done
4. Returned: `2`

```
Array after extract 2: [3, 5, 7, 8]
Tree:      3
          / \
         5   7
        /
       8
```

### Extract Trace Table

| Step | Operation | Array Before | Action | Array After | Returned |
|------|-----------|--------------|--------|-------------|----------|
| 1 | extract_min | `[1, 2, 7, 5, 3, 8]` | root←last(8), sift down: 0↔1, 1↔4 | `[2, 3, 7, 5, 8]` | `1` |
| 2 | extract_min | `[2, 3, 7, 5, 8]` | root←last(8), sift down: 0↔1, 1↔3 | `[3, 5, 7, 8]` | `2` |

---

## Worked Example: Heapify — Step-by-Step Trace

**Goal**: Convert unordered array `[9, 4, 7, 2, 8, 1, 5]` into a min-heap using bottom-up heapify.

**Array indices and initial tree**:
```
Index: [0] [1] [2] [3] [4] [5] [6]
Value: [ 9,  4,  7,  2,  8,  1,  5]

Tree:
          9  (0)
        /     \
      4 (1)   7 (2)
     /  \    /  \
   2(3) 8(4) 1(5) 5(6)
```

Last non-leaf index = `n // 2 - 1 = 7 // 2 - 1 = 2`. We sift down indices 2, 1, 0 in that order.

**Step 1 — sift_down(2)**: Node 7, children: 1 (index 5), 5 (index 6). Smallest child = 1.
- 7 > 1 → swap index 2 and 5 → `[9, 4, 1, 2, 8, 7, 5]`

```
          9
        /     \
       4       1     ← 1 bubbled up from index 5
     /  \    /  \
    2    8  7    5   ← 7 moved down to index 5
```

**Step 2 — sift_down(1)**: Node 4, children: 2 (index 3), 8 (index 4). Smallest child = 2.
- 4 > 2 → swap index 1 and 3 → `[9, 2, 1, 4, 8, 7, 5]`
- Now at index 3 (node 4): no children (2*3+1=7 ≥ n=7) → done

```
          9
        /     \
       2       1     ← 2 bubbled up
     /  \    /  \
    4    8  7    5   ← 4 moved down
```

**Step 3 — sift_down(0)**: Node 9, children: 2 (index 1), 1 (index 2). Smallest child = 1.
- 9 > 1 → swap index 0 and 2 → `[1, 2, 9, 4, 8, 7, 5]`
- Now at index 2 (node 9): children: 7 (index 5), 5 (index 6). Smallest = 5.
- 9 > 5 → swap index 2 and 6 → `[1, 2, 5, 4, 8, 7, 9]`
- At index 6: no children → done

```
          1
        /     \
       2       5
     /  \    /  \
    4    8  7    9
```

### Heapify Trace Table

| Step | Operation | Swaps | Array After |
|------|-----------|-------|-------------|
| Initial | — | — | `[9, 4, 7, 2, 8, 1, 5]` |
| sift_down(2) | 7 vs children(1,5): min=1 | idx 2 ↔ idx 5 | `[9, 4, 1, 2, 8, 7, 5]` |
| sift_down(1) | 4 vs children(2,8): min=2 | idx 1 ↔ idx 3 | `[9, 2, 1, 4, 8, 7, 5]` |
| sift_down(0) pass 1 | 9 vs children(2,1): min=1 | idx 0 ↔ idx 2 | `[1, 2, 9, 4, 8, 7, 5]` |
| sift_down(0) pass 2 | 9 vs children(7,5): min=5 | idx 2 ↔ idx 6 | `[1, 2, 5, 4, 8, 7, 9]` |

**Final heap**: `[1, 2, 5, 4, 8, 7, 9]` — valid min-heap ✓

Verification: Every parent ≤ its children:
- `heap[0]=1` ≤ `heap[1]=2` ✓ and ≤ `heap[2]=5` ✓
- `heap[1]=2` ≤ `heap[3]=4` ✓ and ≤ `heap[4]=8` ✓
- `heap[2]=5` ≤ `heap[5]=7` ✓ and ≤ `heap[6]=9` ✓

---

## Comparison

| Data Structure | Insert | Delete Min/Max | Search | Peek Min/Max | Use Case |
|---|---|---|---|---|---|
| Min/Max Heap | O(log n) | O(log n) | O(n) | O(1) | Priority queue, scheduling, Dijkstra |
| BST (balanced) | O(log n) | O(log n) | O(log n) | O(log n) | Ordered traversal, range queries |
| Sorted Array | O(n) | O(n) | O(log n) | O(1) | Static data, binary search |
| Unsorted Array | O(1) | O(n) | O(n) | O(n) | Append-heavy workloads |
