---
title: "Search Algorithms (Binary Search, BFS, DFS)"
description: "Fundamental search algorithms — linear search, binary search and its variants, BFS and DFS for graph/tree traversal, with complexity analysis and implementations."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "binary search", "BFS", "DFS", "graph", "tree", "search"]
author: "Nemit"
featured: false
pinned: false
---

# Search Algorithms

## Linear Search

Scan elements one by one. Works on any collection, sorted or not.

```python
def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1
```

- **O(n)** time, O(1) space
- Only option for unsorted data
- Optimal for small collections (cache-friendly sequential access)

---

## Binary Search

Search a **sorted** array by repeatedly halving the search space.

```python
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = low + (high - low) // 2    # Avoid integer overflow
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

```
Array: [1, 3, 5, 7, 9, 11, 13, 15]
Target: 9

Step 1: low=0, high=7, mid=3 → arr[3]=7 < 9 → low=4
Step 2: low=4, high=7, mid=5 → arr[5]=11 > 9 → high=4
Step 3: low=4, high=4, mid=4 → arr[4]=9 = 9 → Found at index 4
```

- **O(log n)** time, O(1) space
- **Prerequisite**: array must be sorted
- `mid = low + (high - low) // 2` instead of `(low + high) // 2` to prevent integer overflow

### Common Binary Search Variants

#### Find First Occurrence (Lower Bound)

```python
def lower_bound(arr, target):
    low, high = 0, len(arr)
    while low < high:
        mid = low + (high - low) // 2
        if arr[mid] < target:
            low = mid + 1
        else:
            high = mid
    return low    # First position where arr[pos] >= target
```

#### Find Last Occurrence (Upper Bound)

```python
def upper_bound(arr, target):
    low, high = 0, len(arr)
    while low < high:
        mid = low + (high - low) // 2
        if arr[mid] <= target:
            low = mid + 1
        else:
            high = mid
    return low    # First position where arr[pos] > target
```

#### Binary Search on Answer

When the answer is monotonic (if x works, then x+1 works), binary search the answer space:

```python
# Example: find minimum capacity to ship packages within D days
def min_capacity(weights, D):
    low, high = max(weights), sum(weights)
    while low < high:
        mid = low + (high - low) // 2
        if can_ship(weights, D, mid):
            high = mid
        else:
            low = mid + 1
    return low
```

#### Binary Search on Real Numbers

```python
# Find square root
def sqrt_binary(x, epsilon=1e-10):
    low, high = 0, max(1, x)
    while high - low > epsilon:
        mid = (low + high) / 2
        if mid * mid < x:
            low = mid
        else:
            high = mid
    return (low + high) / 2
```

### Off-by-One Pitfalls

Binary search is notoriously error-prone. Key decisions:

1. **`low <= high` vs `low < high`**: use `<=` when searching for exact match, `<` when finding boundaries
2. **`high = len(arr)` vs `len(arr) - 1`**: use `len(arr)` for boundary searches (half-open interval)
3. **`mid + 1` vs `mid`**: always exclude mid after checking to avoid infinite loops

---

## Graph Representations

Before BFS/DFS, we need to represent graphs:

### Adjacency List

```python
# Unweighted graph
graph = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 4],
    3: [1, 5],
    4: [1, 2, 5],
    5: [3, 4]
}

# Or using defaultdict
from collections import defaultdict
graph = defaultdict(list)
graph[0].append(1)
graph[1].append(0)
```

**Space**: O(V + E)
**Best for**: sparse graphs (E << V²), most real-world graphs

### Adjacency Matrix

```python
# 0-indexed, n vertices
matrix = [
    [0, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 0],
    [1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1],
    [0, 1, 1, 0, 0, 1],
    [0, 0, 0, 1, 1, 0]
]
```

**Space**: O(V²)
**Best for**: dense graphs, fast edge existence check O(1)

---

## BFS — Breadth-First Search

Explore all neighbors at the current depth before moving to the next depth level. Uses a **queue**.

```python
from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order
```

```
Graph:       BFS from 0:
0 - 1 - 3   Queue: [0]     Visit: 0
|   |   |   Queue: [1, 2]  Visit: 1, 2
2 - 4 - 5   Queue: [2, 3, 4] Visit: 3, 4
             Queue: [3, 4]  Visit: (2 done)
             Queue: [4, 5]  Visit: 5
             Order: [0, 1, 2, 3, 4, 5]
```

### BFS Properties

- **O(V + E)** time, O(V) space
- Finds **shortest path** in unweighted graphs
- Explores level by level (distance 1, then 2, then 3, ...)

### BFS Shortest Path

```python
def bfs_shortest_path(graph, start, end):
    visited = {start}
    queue = deque([(start, [start])])

    while queue:
        node, path = queue.popleft()
        if node == end:
            return path

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))

    return None    # No path exists
```

### BFS Applications

- **Shortest path** in unweighted graphs
- **Level-order traversal** of trees
- **Connected components**
- **Cycle detection** in undirected graphs
- **Bipartite checking** (2-coloring)
- **Web crawling** (explore pages by link depth)
- **Social network** — find people within N connections

---

## DFS — Depth-First Search

Explore as far as possible along each branch before backtracking. Uses a **stack** (or recursion).

### Recursive DFS

```python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()

    visited.add(start)
    print(start, end=' ')

    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)

    return visited
```

### Iterative DFS

```python
def dfs_iterative(graph, start):
    visited = set()
    stack = [start]
    order = []

    while stack:
        node = stack.pop()
        if node not in visited:
            visited.add(node)
            order.append(node)
            # Add neighbors in reverse order for consistent ordering
            for neighbor in reversed(graph[node]):
                if neighbor not in visited:
                    stack.append(neighbor)

    return order
```

```
Graph:       DFS from 0 (recursive):
0 - 1 - 3   Visit 0 → Visit 1 → Visit 3 → Visit 5 →
|   |   |   Backtrack → Visit 4 → Visit 2 → Done
2 - 4 - 5   Order: [0, 1, 3, 5, 4, 2]
```

### DFS Properties

- **O(V + E)** time, O(V) space
- Goes deep first, then backtracks
- Does NOT find shortest paths (in general)
- Natural recursive structure

### DFS Applications

- **Topological sort** (DAG ordering)
- **Cycle detection**
- **Connected components / Strongly connected components**
- **Path existence** (is there any path from A to B?)
- **Maze solving**
- **Backtracking algorithms** (N-Queens, Sudoku)

---

## BFS vs DFS Comparison

| Feature | BFS | DFS |
|---|---|---|
| Data structure | Queue | Stack / Recursion |
| Exploration | Level by level | Branch by branch |
| Shortest path (unweighted) | Yes | No |
| Space complexity | O(V) — can be wide | O(V) — depth of recursion |
| Good for | Shortest path, level order | Topological sort, cycle detection |
| Complete | Yes (finds all reachable) | Yes |
| Memory for wide graphs | High | Low |
| Memory for deep graphs | Low | High (stack overflow risk) |

---

## Tree Traversals

Trees are special graphs. DFS on trees has three orderings:

```
        1
       / \
      2   3
     / \   \
    4   5   6
```

### Inorder (Left, Root, Right)

```python
def inorder(node):
    if node:
        inorder(node.left)
        print(node.val)      # 4, 2, 5, 1, 3, 6
        inorder(node.right)
```

For **BST**: produces sorted order.

### Preorder (Root, Left, Right)

```python
def preorder(node):
    if node:
        print(node.val)      # 1, 2, 4, 5, 3, 6
        preorder(node.left)
        preorder(node.right)
```

Used for: serialization, creating a copy of the tree.

### Postorder (Left, Right, Root)

```python
def postorder(node):
    if node:
        postorder(node.left)
        postorder(node.right)
        print(node.val)      # 4, 5, 2, 6, 3, 1
```

Used for: deletion (delete children before parent), expression evaluation.

### Level Order (BFS)

```python
def level_order(root):
    if not root:
        return
    queue = deque([root])
    while queue:
        node = queue.popleft()
        print(node.val)      # 1, 2, 3, 4, 5, 6
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
```

---

## Topological Sort (DFS-based)

Order vertices of a DAG such that for every edge u→v, u comes before v:

```python
def topological_sort(graph, n):
    visited = [False] * n
    stack = []

    def dfs(node):
        visited[node] = True
        for neighbor in graph[node]:
            if not visited[neighbor]:
                dfs(neighbor)
        stack.append(node)

    for i in range(n):
        if not visited[i]:
            dfs(i)

    return stack[::-1]    # Reverse of finish order
```

Applications: build systems (Makefile), course prerequisites, task scheduling.

### Kahn's Algorithm (BFS-based Topological Sort)

```python
from collections import deque

def topological_sort_bfs(graph, n):
    in_degree = [0] * n
    for u in range(n):
        for v in graph[u]:
            in_degree[v] += 1

    queue = deque([i for i in range(n) if in_degree[i] == 0])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != n:
        return None    # Cycle detected
    return order
```

---

## Worked Example: BFS and DFS Trace on a Sample Graph

### Graph Setup

```
A -- B -- D
|    |
C -- E -- F
```

**Adjacency list:**
- A: [B, C]
- B: [A, D, E]
- C: [A, E]
- D: [B]
- E: [B, C, F]
- F: [E]

```python
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'E'],
    'D': ['B'],
    'E': ['B', 'C', 'F'],
    'F': ['E'],
}
```

---

### BFS Trace from A

BFS uses a **queue** (FIFO). When visiting a node, its unvisited neighbors are enqueued immediately.

```
Initial state — Queue: [A],  Visited: {}
```

| Step | Visit | Queue after dequeue + enqueue | Visited set |
|------|-------|-------------------------------|-------------|
| 1 | **A** | [B, C] | {A, B, C} |
| 2 | **B** | [C, D, E] | {A, B, C, D, E} |
| 3 | **C** | [D, E] | {A, B, C, D, E} |
| 4 | **D** | [E] | {A, B, C, D, E} |
| 5 | **E** | [F] | {A, B, C, D, E, F} |
| 6 | **F** | [] | {A, B, C, D, E, F} |

**Step-by-step notes:**
- Step 1: visit A, enqueue neighbors B and C (both unvisited)
- Step 2: visit B, A already visited — enqueue D, E
- Step 3: visit C, A already visited, E already in visited — nothing new enqueued
- Step 4: visit D, B already visited — nothing new
- Step 5: visit E, B and C already visited — enqueue F
- Step 6: visit F, E already visited — queue empty, done

**BFS traversal order: A → B → C → D → E → F**

BFS explores in *layers*: first all nodes at distance 1 from A (B, C), then distance 2 (D, E), then distance 3 (F).

---

### DFS Trace from A

DFS uses a **stack** (LIFO). The iterative version pushes neighbors in *reversed* order so the first neighbor is processed first.

```
Initial state — Stack: [A],  Visited: {}
```

| Step | Pop | Action | Stack after push | Visited set |
|------|-----|--------|-----------------|-------------|
| 1 | **A** | push reversed([B,C]) → push C, B | [C, B] | {A} |
| 2 | **B** | push reversed([A,D,E]) → A visited, push E, D | [C, E, D] | {A, B} |
| 3 | **D** | push reversed([B]) → B visited, nothing | [C, E] | {A, B, D} |
| 4 | **E** | push reversed([B,C,F]) → B visited, push F, C | [C, F, C] | {A, B, D, E} |
| 5 | **C** | push reversed([A,E]) → both visited, nothing | [C, F] | {A, B, C, D, E} |
| 6 | **F** | push reversed([E]) → E visited, nothing | [C] | {A, B, C, D, E, F} |
| 7 | ~~C~~ | already visited, skip | [] | {A, B, C, D, E, F} |

**DFS traversal order: A → B → D → E → C → F**

DFS goes as *deep* as possible first: A → B → D (dead end, backtrack) → E → C (dead end) → F.

---

### Comparing the Two Traversals

| | BFS | DFS |
|---|---|---|
| Traversal order | A, B, C, D, E, F | A, B, D, E, C, F |
| Strategy | Layer by layer (distance) | Branch as deep as possible |
| When D is visited | Step 4 (after C) | Step 3 (right after B) |
| When C is visited | Step 3 (early — same distance as B) | Step 5 (late — after the entire B-D-E-F branch) |

BFS reaches C early because it is only 1 hop from A. DFS delays C because it dives into B's sub-branch first (B → D → E → F), only returning to C via backtracking.

---

## Worked Example: Binary Search on Answer

### Problem

> You need to ship packages with weights `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` within **D = 5 days**. Each day you load consecutive packages (in order) up to the ship's capacity. Find the **minimum ship capacity** that allows all packages to ship on time.

### Key Insight

If a capacity of `mid` works, then `mid + 1` also works — the answer is **monotonic**. This means we can binary search over the answer space.

- **Low = 10** (must carry at least the heaviest package)
- **High = 55** (carry everything in 1 day = sum of all weights)

```python
def can_ship(weights, D, capacity):
    days_needed, current_load = 1, 0
    for w in weights:
        if current_load + w > capacity:
            days_needed += 1
            current_load = 0
        current_load += w
    return days_needed <= D

def min_capacity(weights, D):
    low, high = max(weights), sum(weights)
    while low < high:
        mid = low + (high - low) // 2
        if can_ship(weights, D, mid):
            high = mid
        else:
            low = mid + 1
    return low
```

---

### Binary Search Trace

**Initial:** low = 10, high = 55

#### Iteration 1 — mid = 32

`can_ship([1..10], 5, capacity=32)`:
```
Day 1: 1+2+3+4+5+6+7 = 28  (adding 8 → 36 > 32, stop)
Day 2: 8+9+10 = 27
→ 2 days needed ≤ 5  ✓  True
```
→ `high = 32`

#### Iteration 2 — mid = 21

`can_ship([1..10], 5, capacity=21)`:
```
Day 1: 1+2+3+4+5+6 = 21  (adding 7 → 28 > 21, stop)
Day 2: 7+8 = 15           (adding 9 → 24 > 21, stop)
Day 3: 9+10 = 19
→ 3 days needed ≤ 5  ✓  True
```
→ `high = 21`

#### Iteration 3 — mid = 15

`can_ship([1..10], 5, capacity=15)`:
```
Day 1: 1+2+3+4+5 = 15  (adding 6 → 21 > 15, stop)
Day 2: 6+7 = 13        (adding 8 → 21 > 15, stop)
Day 3: 8               (adding 9 → 17 > 15, stop)
Day 4: 9               (adding 10 → 19 > 15, stop)
Day 5: 10
→ 5 days needed ≤ 5  ✓  True
```
→ `high = 15`

#### Iteration 4 — mid = 12

`can_ship([1..10], 5, capacity=12)`:
```
Day 1: 1+2+3+4 = 10  (adding 5 → 15 > 12, stop)
Day 2: 5+6 = 11      (adding 7 → 18 > 12, stop)
Day 3: 7             (adding 8 → 15 > 12, stop)
Day 4: 8             (adding 9 → 17 > 12, stop)
Day 5: 9             (adding 10 → 19 > 12, stop)
Day 6: 10
→ 6 days needed > 5  ✗  False
```
→ `low = 13`

#### Iteration 5 — mid = 14

`can_ship([1..10], 5, capacity=14)`:
```
Day 1: 1+2+3+4 = 10  (adding 5 → 15 > 14, stop)
Day 2: 5+6 = 11      (adding 7 → 18 > 14, stop)
Day 3: 7             (adding 8 → 15 > 14, stop)
Day 4: 8             (adding 9 → 17 > 14, stop)
Day 5: 9             (adding 10 → 19 > 14, stop)
Day 6: 10
→ 6 days needed > 5  ✗  False
```
→ `low = 15`

#### Termination — low = 15, high = 15

`low == high` → loop ends.

---

### Summary Table

| Iter | low | high | mid | can_ship(mid)? | Action |
|------|-----|------|-----|----------------|--------|
| 1 | 10 | 55 | 32 | True (2 days) | high = 32 |
| 2 | 10 | 32 | 21 | True (3 days) | high = 21 |
| 3 | 10 | 21 | 15 | True (5 days) | high = 15 |
| 4 | 10 | 15 | 12 | False (6 days) | low = 13 |
| 5 | 13 | 15 | 14 | False (6 days) | low = 15 |
| — | 15 | 15 | — | converged | **answer = 15** |

### Answer: **15**

With capacity 15 the packages ship in exactly 5 days:
`[1,2,3,4,5]` · `[6,7]` · `[8]` · `[9]` · `[10]`

Capacity 14 requires 6 days, so 15 is the minimum.
