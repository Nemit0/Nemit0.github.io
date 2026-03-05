---
title: "Recursion and Backtracking"
description: "Recursion fundamentals — base cases, call stack, tail recursion, memoization, divide and conquer, and backtracking algorithms with classic problems."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "recursion", "backtracking", "divide and conquer", "memoization"]
author: "Nemit"
featured: false
pinned: false
---

# Recursion and Backtracking

## What Is Recursion?

A function is **recursive** if it calls itself. Every recursive function needs:

1. **Base case**: condition that stops the recursion
2. **Recursive case**: the function calls itself with a smaller/simpler input
3. **Progress toward base case**: each call must move closer to the base case

```python
def factorial(n):
    if n <= 1:        # Base case
        return 1
    return n * factorial(n - 1)    # Recursive case

# factorial(4)
# = 4 * factorial(3)
# = 4 * 3 * factorial(2)
# = 4 * 3 * 2 * factorial(1)
# = 4 * 3 * 2 * 1
# = 24
```

---

## The Call Stack

Each recursive call creates a **stack frame** on the call stack, storing local variables and the return address.

```
factorial(4)
├── factorial(3)          # Stack: [4, 3]
│   ├── factorial(2)      # Stack: [4, 3, 2]
│   │   ├── factorial(1)  # Stack: [4, 3, 2, 1]
│   │   │   └── return 1  # Base case
│   │   └── return 2 * 1 = 2
│   └── return 3 * 2 = 6
└── return 4 * 6 = 24
```

**Stack overflow** occurs when recursion is too deep. Python's default limit is ~1000 frames (`sys.setrecursionlimit()` to change).

### Stack Frame Contents

Each frame stores:
- Function parameters
- Local variables
- Return address (where to continue after return)
- Saved registers

This is why recursion uses **O(depth)** space even if no extra data structures are created.

---

## Recursion Patterns

### 1. Linear Recursion

One recursive call per invocation. O(n) calls, O(n) stack space.

```python
# Sum of array
def array_sum(arr, n):
    if n == 0:
        return 0
    return arr[n - 1] + array_sum(arr, n - 1)

# Reverse a string
def reverse(s):
    if len(s) <= 1:
        return s
    return reverse(s[1:]) + s[0]

# Power: x^n
def power(x, n):
    if n == 0:
        return 1
    return x * power(x, n - 1)
```

### 2. Binary Recursion (Two Calls)

Two recursive calls per invocation. Often leads to O(2^n) without optimization.

```python
# Fibonacci — O(2^n) time, O(n) space
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Fibonacci call tree for n=5:
#                    fib(5)
#                /          \
#           fib(4)          fib(3)
#          /     \         /     \
#      fib(3)  fib(2)  fib(2)  fib(1)
#      /   \   /   \   /   \
#  fib(2) fib(1) ...
```

Many repeated subproblems — leads to memoization and dynamic programming.

### 3. Divide and Conquer

Split the problem into subproblems, solve recursively, combine results.

```python
# Binary search (recursive)
def binary_search(arr, target, low, high):
    if low > high:
        return -1
    mid = (low + high) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search(arr, target, mid + 1, high)
    else:
        return binary_search(arr, target, low, mid - 1)

# Merge sort
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

# Fast power: x^n in O(log n)
def fast_power(x, n):
    if n == 0:
        return 1
    if n % 2 == 0:
        half = fast_power(x, n // 2)
        return half * half
    else:
        return x * fast_power(x, n - 1)
```

### 4. Mutual Recursion

Two or more functions call each other.

```python
def is_even(n):
    if n == 0:
        return True
    return is_odd(n - 1)

def is_odd(n):
    if n == 0:
        return False
    return is_even(n - 1)
```

---

## Tail Recursion

A recursive call is **tail recursive** if it's the last operation in the function — nothing happens after the recursive call returns.

```python
# NOT tail recursive — multiplication happens after recursive call
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)    # Must multiply after return

# Tail recursive — accumulator holds the result
def factorial_tail(n, acc=1):
    if n <= 1:
        return acc
    return factorial_tail(n - 1, acc * n)    # Nothing after this call
```

**Tail call optimization (TCO)** converts tail recursion into a loop, using O(1) stack space. Many languages support this (Scheme, Haskell, Scala), but **Python does NOT** — use explicit loops instead when stack depth is a concern.

```python
# Equivalent iterative version
def factorial_iter(n):
    acc = 1
    while n > 1:
        acc *= n
        n -= 1
    return acc
```

---

## Memoization

Cache results of expensive recursive calls to avoid redundant computation.

```python
# Without memoization: O(2^n)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

# With memoization: O(n)
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

# Using functools.lru_cache
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_cached(n):
    if n <= 1:
        return n
    return fib_cached(n - 1) + fib_cached(n - 2)
```

### When to Memoize

Memoization works when the problem has:
1. **Overlapping subproblems**: same subproblems are solved multiple times
2. **Optimal substructure**: optimal solution is built from optimal sub-solutions

These are the same conditions required for dynamic programming. Memoization is the "top-down" approach; DP tabulation is "bottom-up."

---

## Recursion vs Iteration

| Aspect | Recursion | Iteration |
|---|---|---|
| Readability | Often more intuitive for tree/graph problems | Better for simple loops |
| Space | O(depth) stack space | O(1) typically |
| Performance | Function call overhead | Generally faster |
| Stack overflow | Risk with deep recursion | No risk |
| State management | Implicit via call stack | Explicit via variables |

**Rule of thumb**: use recursion when the problem has a natural recursive structure (trees, graphs, divide and conquer). Convert to iteration when depth is unbounded or performance matters.

### Converting Recursion to Iteration

Any recursion can be converted to iteration using an explicit stack:

```python
# Recursive DFS
def dfs_recursive(node, visited):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs_recursive(neighbor, visited)

# Iterative DFS with explicit stack
def dfs_iterative(start):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node not in visited:
            visited.add(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    stack.append(neighbor)
```

---

## Backtracking

**Backtracking** is a systematic way to explore all possible solutions by building candidates incrementally and abandoning a candidate ("backtracking") as soon as it's determined to be invalid.

```
                    Start
                  /   |   \
                A     B     C
               / \   / \   / \
             AB  AC BA BC CA CB
             |   |   |   |   |   |
            ABC ACB BAC BCA CAB CBA

Backtracking prunes branches that can't lead to valid solutions.
```

### General Backtracking Template

```python
def backtrack(candidate, state):
    if is_solution(candidate):
        output(candidate)
        return

    for next_choice in get_choices(state):
        if is_valid(next_choice, state):
            make_choice(next_choice, state)        # Choose
            backtrack(candidate, state)             # Explore
            undo_choice(next_choice, state)         # Un-choose (backtrack)
```

### 1. Permutations

Generate all arrangements of n elements.

```python
def permutations(nums):
    result = []

    def backtrack(path, remaining):
        if not remaining:
            result.append(path[:])
            return

        for i in range(len(remaining)):
            path.append(remaining[i])
            backtrack(path, remaining[:i] + remaining[i+1:])
            path.pop()    # Backtrack

    backtrack([], nums)
    return result

# permutations([1, 2, 3])
# → [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
```

**Time**: O(n × n!) — n! permutations, each takes O(n) to copy.

### 2. Subsets (Power Set)

Generate all 2^n subsets.

```python
def subsets(nums):
    result = []

    def backtrack(start, path):
        result.append(path[:])    # Every path is a valid subset

        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()

    backtrack(0, [])
    return result

# subsets([1, 2, 3])
# → [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]
```

### 3. Combinations

Choose k elements from n (order doesn't matter).

```python
def combinations(n, k):
    result = []

    def backtrack(start, path):
        if len(path) == k:
            result.append(path[:])
            return

        # Pruning: need (k - len(path)) more elements
        for i in range(start, n - (k - len(path)) + 2):
            path.append(i)
            backtrack(i + 1, path)
            path.pop()

    backtrack(1, [])
    return result

# combinations(4, 2) → [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]]
```

### 4. N-Queens

Place n queens on an n×n chessboard so no two queens attack each other.

```python
def solve_n_queens(n):
    results = []
    board = ['.' * n for _ in range(n)]
    cols = set()
    diag1 = set()    # row - col
    diag2 = set()    # row + col

    def backtrack(row):
        if row == n:
            results.append(board[:])
            return

        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue

            # Place queen
            cols.add(col)
            diag1.add(row - col)
            diag2.add(row + col)
            board[row] = '.' * col + 'Q' + '.' * (n - col - 1)

            backtrack(row + 1)

            # Remove queen (backtrack)
            cols.remove(col)
            diag1.remove(row - col)
            diag2.remove(row + col)
            board[row] = '.' * n

    backtrack(0)
    return results
```

### 5. Sudoku Solver

```python
def solve_sudoku(board):
    def is_valid(row, col, num):
        for i in range(9):
            if board[row][i] == num:
                return False
            if board[i][col] == num:
                return False
        box_row, box_col = 3 * (row // 3), 3 * (col // 3)
        for i in range(box_row, box_row + 3):
            for j in range(box_col, box_col + 3):
                if board[i][j] == num:
                    return False
        return True

    def backtrack():
        for i in range(9):
            for j in range(9):
                if board[i][j] == '.':
                    for num in '123456789':
                        if is_valid(i, j, num):
                            board[i][j] = num
                            if backtrack():
                                return True
                            board[i][j] = '.'    # Backtrack
                    return False    # No valid number → backtrack
        return True    # All cells filled
```

### 6. Word Search

Find if a word exists in a 2D grid by moving horizontally/vertically.

```python
def word_search(board, word):
    rows, cols = len(board), len(board[0])

    def backtrack(r, c, idx):
        if idx == len(word):
            return True
        if (r < 0 or r >= rows or c < 0 or c >= cols or
                board[r][c] != word[idx]):
            return False

        temp = board[r][c]
        board[r][c] = '#'    # Mark visited

        found = (backtrack(r + 1, c, idx + 1) or
                 backtrack(r - 1, c, idx + 1) or
                 backtrack(r, c + 1, idx + 1) or
                 backtrack(r, c - 1, idx + 1))

        board[r][c] = temp    # Restore (backtrack)
        return found

    for i in range(rows):
        for j in range(cols):
            if backtrack(i, j, 0):
                return True
    return False
```

---

## Pruning Strategies

Pruning makes backtracking efficient by cutting off branches early.

| Strategy | Description | Example |
|---|---|---|
| Constraint checking | Skip invalid choices immediately | N-Queens: skip attacked squares |
| Bound checking | Stop if best possible < current best | Branch and bound |
| Symmetry breaking | Avoid equivalent configurations | First queen in left half only |
| Ordering heuristic | Try most constrained choices first | Sudoku: cell with fewest options |
| Memoization | Cache results of subproblems | Grid path counting |

### Branch and Bound

An extension of backtracking that uses a **bounding function** to prune branches. If the best possible solution from the current state can't improve the known best, prune.

```
Without pruning:  Explore all 2^n subsets    → O(2^n)
With pruning:     Skip branches early        → Much faster in practice
```

---

## Classic Recursive Problems

| Problem | Time | Space | Technique |
|---|---|---|---|
| Factorial | O(n) | O(n) | Linear recursion |
| Fibonacci | O(n) memoized | O(n) | Memoization |
| Tower of Hanoi | O(2^n) | O(n) | Binary recursion |
| Binary search | O(log n) | O(log n) | Divide and conquer |
| Merge sort | O(n log n) | O(n) | Divide and conquer |
| Permutations | O(n × n!) | O(n) | Backtracking |
| Subsets | O(n × 2^n) | O(n) | Backtracking |
| N-Queens | O(n!) | O(n) | Backtracking + pruning |
| Sudoku | O(9^(empty cells)) | O(1) | Backtracking + pruning |

### Tower of Hanoi

```python
def hanoi(n, source, target, auxiliary):
    if n == 1:
        print(f"Move disk 1 from {source} to {target}")
        return

    hanoi(n - 1, source, auxiliary, target)
    print(f"Move disk {n} from {source} to {target}")
    hanoi(n - 1, auxiliary, target, source)

# hanoi(3, 'A', 'C', 'B')
# Minimum moves: 2^n - 1
```
