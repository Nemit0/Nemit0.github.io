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
