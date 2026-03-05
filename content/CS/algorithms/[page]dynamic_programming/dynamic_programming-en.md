---
title: "Dynamic Programming"
description: "Dynamic programming fundamentals — optimal substructure, overlapping subproblems, top-down vs bottom-up, classic DP problems (knapsack, LCS, LIS, coin change, grid paths)."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "dynamic programming", "DP", "memoization", "optimization"]
author: "Nemit"
featured: false
pinned: false
---

# Dynamic Programming

## What Is Dynamic Programming?

**Dynamic programming (DP)** solves complex problems by breaking them into overlapping subproblems and storing their results to avoid redundant computation.

### Two Required Properties

1. **Optimal substructure**: the optimal solution contains optimal solutions to subproblems
2. **Overlapping subproblems**: the same subproblems are solved multiple times

If a problem has these properties, DP can transform an exponential solution into a polynomial one.

```
Fibonacci without DP:    O(2^n)    — exponential
Fibonacci with DP:       O(n)      — linear
```

---

## Top-Down vs Bottom-Up

### Top-Down (Memoization)

Start from the original problem, recurse into subproblems, cache results.

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
```

Or with explicit dictionary:

```python
def fib(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
```

### Bottom-Up (Tabulation)

Build the solution from the smallest subproblems up. Uses a table (array) instead of recursion.

```python
def fib(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
```

### Space-Optimized

When you only need the last few values, reduce space from O(n) to O(1):

```python
def fib(n):
    if n <= 1:
        return n
    prev2, prev1 = 0, 1
    for _ in range(2, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    return prev1
```

### Comparison

| Aspect | Top-Down | Bottom-Up |
|---|---|---|
| Approach | Recursive + cache | Iterative + table |
| Computes | Only needed subproblems | All subproblems |
| Stack | O(depth) recursion stack | No recursion |
| Ease of coding | Often more intuitive | May require careful ordering |
| Space optimization | Harder to optimize | Easier to reduce space |

---

## DP Problem-Solving Framework

1. **Define the state**: what does `dp[i]` (or `dp[i][j]`) represent?
2. **Find the recurrence**: how does `dp[i]` relate to smaller subproblems?
3. **Set base cases**: what are the trivially known values?
4. **Determine computation order**: ensure dependencies are computed first
5. **Optimize space** if possible (rolling array, keep only needed rows)

---

## Classic DP Problems

### 1. Climbing Stairs

You can climb 1 or 2 steps. How many ways to reach the top?

```python
# dp[i] = number of ways to reach step i
# dp[i] = dp[i-1] + dp[i-2]
# This is just Fibonacci!

def climb_stairs(n):
    if n <= 2:
        return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    return prev1
```

**Time**: O(n), **Space**: O(1)

### 2. Coin Change

Find the minimum number of coins to make a given amount.

```python
# dp[i] = minimum coins to make amount i
# dp[i] = min(dp[i - coin] + 1) for each coin

def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0

    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i and dp[i - coin] + 1 < dp[i]:
                dp[i] = dp[i - coin] + 1

    return dp[amount] if dp[amount] != float('inf') else -1

# coins = [1, 5, 10, 25], amount = 30
# dp[30] = 2 (25 + 5)
```

**Time**: O(amount × len(coins)), **Space**: O(amount)

### Coin Change 2 — Count Ways

```python
# dp[i] = number of ways to make amount i
def coin_change_ways(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1

    for coin in coins:            # Process each coin type
        for i in range(coin, amount + 1):
            dp[i] += dp[i - coin]

    return dp[amount]
```

Iterating coins in the outer loop avoids counting permutations (only combinations).

### 3. Longest Common Subsequence (LCS)

Find the length of the longest subsequence common to two strings.

```python
# dp[i][j] = LCS of text1[:i] and text2[:j]
# If text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
# Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])

def lcs(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    return dp[m][n]

# lcs("abcde", "ace") = 3 ("ace")
```

**Time**: O(m × n), **Space**: O(m × n), optimizable to O(min(m, n))

#### Reconstruct the LCS

```python
def lcs_string(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    # Backtrack to find the actual subsequence
    result = []
    i, j = m, n
    while i > 0 and j > 0:
        if text1[i - 1] == text2[j - 1]:
            result.append(text1[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] > dp[i][j - 1]:
            i -= 1
        else:
            j -= 1

    return ''.join(reversed(result))
```

### 4. Longest Increasing Subsequence (LIS)

Find the length of the longest strictly increasing subsequence.

```python
# O(n²) DP solution
# dp[i] = length of LIS ending at index i
def lis(nums):
    n = len(nums)
    dp = [1] * n

    for i in range(1, n):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)

    return max(dp)

# [10, 9, 2, 5, 3, 7, 101, 18] → 4 (2, 3, 7, 101)
```

#### O(n log n) Solution with Binary Search

```python
import bisect

def lis_fast(nums):
    tails = []    # tails[i] = smallest tail of increasing subsequence of length i+1

    for num in nums:
        pos = bisect.bisect_left(tails, num)
        if pos == len(tails):
            tails.append(num)
        else:
            tails[pos] = num

    return len(tails)
```

`tails` is always sorted, so we binary search for the position. **Time**: O(n log n).

### 5. 0/1 Knapsack

Given items with weight and value, maximize value without exceeding capacity.

```python
# dp[i][w] = max value using first i items with capacity w
# dp[i][w] = max(dp[i-1][w],                          # Don't take item i
#                dp[i-1][w - weight[i]] + value[i])    # Take item i

def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i - 1][w]    # Don't take
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i][w],
                               dp[i - 1][w - weights[i - 1]] + values[i - 1])

    return dp[n][capacity]

# weights = [2, 3, 4, 5], values = [3, 4, 5, 6], capacity = 8
# Answer: 10 (items with weight 3+5=8, value 4+6=10)
```

**Time**: O(n × W), **Space**: O(n × W)

#### Space-Optimized 0/1 Knapsack

```python
def knapsack_optimized(weights, values, capacity):
    dp = [0] * (capacity + 1)

    for i in range(len(weights)):
        for w in range(capacity, weights[i] - 1, -1):    # Reverse order!
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])

    return dp[capacity]
```

Iterate capacity in **reverse** to avoid using the same item twice.

### Unbounded Knapsack

Each item can be used unlimited times. Iterate capacity **forward**:

```python
def unbounded_knapsack(weights, values, capacity):
    dp = [0] * (capacity + 1)

    for i in range(len(weights)):
        for w in range(weights[i], capacity + 1):    # Forward order
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])

    return dp[capacity]
```

### 6. Grid Paths

Count paths from top-left to bottom-right (can only move right or down).

```python
# dp[i][j] = number of paths to cell (i, j)
# dp[i][j] = dp[i-1][j] + dp[i][j-1]

def unique_paths(m, n):
    dp = [[1] * n for _ in range(m)]

    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1]

    return dp[m - 1][n - 1]
```

#### With Obstacles

```python
def unique_paths_with_obstacles(grid):
    m, n = len(grid), len(grid[0])
    dp = [[0] * n for _ in range(m)]
    dp[0][0] = 1 if grid[0][0] == 0 else 0

    for i in range(m):
        for j in range(n):
            if grid[i][j] == 1:
                dp[i][j] = 0
            else:
                if i > 0:
                    dp[i][j] += dp[i - 1][j]
                if j > 0:
                    dp[i][j] += dp[i][j - 1]

    return dp[m - 1][n - 1]
```

### 7. Minimum Path Sum

```python
def min_path_sum(grid):
    m, n = len(grid), len(grid[0])

    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0:
                continue
            elif i == 0:
                grid[i][j] += grid[i][j - 1]
            elif j == 0:
                grid[i][j] += grid[i - 1][j]
            else:
                grid[i][j] += min(grid[i - 1][j], grid[i][j - 1])

    return grid[m - 1][n - 1]
```

### 8. Edit Distance (Levenshtein Distance)

Minimum number of insertions, deletions, and substitutions to convert one string to another.

```python
# dp[i][j] = edit distance between word1[:i] and word2[:j]
def edit_distance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i    # Delete all characters
    for j in range(n + 1):
        dp[0][j] = j    # Insert all characters

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]    # No operation needed
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],       # Delete
                    dp[i][j - 1],       # Insert
                    dp[i - 1][j - 1]    # Replace
                )

    return dp[m][n]

# edit_distance("kitten", "sitting") = 3
# kitten → sitten → sittin → sitting
```

**Time**: O(m × n), **Space**: O(m × n)

### 9. Longest Palindromic Subsequence

```python
# dp[i][j] = length of longest palindromic subsequence in s[i:j+1]
def lps(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]

    for i in range(n):
        dp[i][i] = 1    # Single character is a palindrome

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])

    return dp[0][n - 1]

# lps("bbbab") = 4 ("bbbb")
```

### 10. Matrix Chain Multiplication

Find the optimal way to parenthesize matrix multiplications.

```python
# dp[i][j] = minimum multiplications to compute matrices i through j
def matrix_chain(dims):
    n = len(dims) - 1    # Number of matrices
    dp = [[0] * n for _ in range(n)]

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = float('inf')
            for k in range(i, j):
                cost = (dp[i][k] + dp[k + 1][j] +
                        dims[i] * dims[k + 1] * dims[j + 1])
                dp[i][j] = min(dp[i][j], cost)

    return dp[0][n - 1]

# dims = [10, 30, 5, 60] → matrices: 10×30, 30×5, 5×60
# Optimal: (A × B) × C = 10×30×5 + 10×5×60 = 1500 + 3000 = 4500
# vs A × (B × C) = 30×5×60 + 10×30×60 = 9000 + 18000 = 27000
```

**Time**: O(n³), **Space**: O(n²)

---

## DP on Strings

| Problem | Recurrence | Time |
|---|---|---|
| LCS | match → diag+1, else max(up, left) | O(m×n) |
| Edit Distance | match → diag, else 1+min(up, left, diag) | O(m×n) |
| Longest Palindromic Subseq | match → inner+2, else max(shrink sides) | O(n²) |
| Longest Common Substring | match → diag+1, else 0 | O(m×n) |
| Distinct Subsequences | match → diag+up, else up | O(m×n) |

---

## DP Patterns Summary

| Pattern | State | Example |
|---|---|---|
| Linear | `dp[i]` | Climbing stairs, house robber |
| Two-sequence | `dp[i][j]` | LCS, edit distance |
| Interval | `dp[i][j]` on range | Matrix chain, palindrome |
| Knapsack | `dp[i][w]` | 0/1 knapsack, coin change |
| Grid | `dp[i][j]` on coordinates | Unique paths, min path sum |
| Bitmask | `dp[mask]` | TSP, assignment |
| Tree | `dp[node]` | Tree diameter, house robber III |
| Digit | `dp[pos][tight][...]` | Count numbers with property |

### Recognizing DP Problems

A problem likely uses DP if:
- It asks for **optimal** (min/max) or **count** of something
- It has **choices** at each step
- The brute force is exponential
- It has overlapping subproblems
- Keywords: "minimum cost", "maximum profit", "number of ways", "can you reach"

---

## Worked Example: 0/1 Knapsack — Complete DP Table Fill-in

**Items and capacity:**

| Item | Weight | Value |
|------|--------|-------|
| 1    | 2      | 3     |
| 2    | 3      | 4     |
| 3    | 4      | 5     |
| 4    | 5      | 6     |

**Capacity W = 8**

`dp[i][w]` = maximum value achievable using the first `i` items with capacity `w`.

**Recurrence:**
```
dp[i][w] = dp[i-1][w]                              if weight[i] > w  (can't fit)
dp[i][w] = max(dp[i-1][w],  dp[i-1][w-weight[i]] + value[i])  otherwise
```

---

### Step 0 — Initial Table (all zeros)

Row `i=0` is the base case: zero items → zero value for every capacity.

| i \ w | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-------|---|---|---|---|---|---|---|---|---|
| **0** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **1** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **2** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **3** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

---

### Step 1 — Fill Row 1 (Item 1: weight=2, value=3)

For each capacity `w`, we decide: **skip** Item 1 (keep `dp[0][w]`) or **take** it (add value 3, use `dp[0][w-2]`).

| w | Skip → dp[0][w] | Take → dp[0][w-2]+3 | Condition | dp[1][w] |
|---|-----------------|----------------------|-----------|----------|
| 0 | 0               | — (2 > 0, can't fit) | skip only | **0**    |
| 1 | 0               | — (2 > 1, can't fit) | skip only | **0**    |
| 2 | 0               | dp[0][0]+3 = 0+3 = 3 | max(0,3)  | **3**    |
| 3 | 0               | dp[0][1]+3 = 0+3 = 3 | max(0,3)  | **3**    |
| 4 | 0               | dp[0][2]+3 = 0+3 = 3 | max(0,3)  | **3**    |
| 5 | 0               | dp[0][3]+3 = 0+3 = 3 | max(0,3)  | **3**    |
| 6 | 0               | dp[0][4]+3 = 0+3 = 3 | max(0,3)  | **3**    |
| 7 | 0               | dp[0][5]+3 = 0+3 = 3 | max(0,3)  | **3**    |
| 8 | 0               | dp[0][6]+3 = 0+3 = 3 | max(0,3)  | **3**    |

**Table after Row 1:**

| i \ w | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-------|---|---|---|---|---|---|---|---|---|
| **0** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **1** | 0 | 0 | **3** | **3** | **3** | **3** | **3** | **3** | **3** |
| **2** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **3** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

---

### Step 2 — Fill Row 2 (Item 2: weight=3, value=4)

| w | Skip → dp[1][w] | Take → dp[1][w-3]+4 | Condition    | dp[2][w] |
|---|-----------------|----------------------|--------------|----------|
| 0 | 0               | — (3 > 0)            | skip only    | **0**    |
| 1 | 0               | — (3 > 1)            | skip only    | **0**    |
| 2 | 3               | — (3 > 2)            | skip only    | **3**    |
| 3 | 3               | dp[1][0]+4 = 0+4 = 4 | max(3,4) → take | **4** |
| 4 | 3               | dp[1][1]+4 = 0+4 = 4 | max(3,4) → take | **4** |
| 5 | 3               | dp[1][2]+4 = 3+4 = 7 | max(3,7) → take | **7** |
| 6 | 3               | dp[1][3]+4 = 3+4 = 7 | max(3,7) → take | **7** |
| 7 | 3               | dp[1][4]+4 = 3+4 = 7 | max(3,7) → take | **7** |
| 8 | 3               | dp[1][5]+4 = 3+4 = 7 | max(3,7) → take | **7** |

**Table after Row 2:**

| i \ w | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-------|---|---|---|---|---|---|---|---|---|
| **0** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **1** | 0 | 0 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| **2** | 0 | 0 | 3 | **4** | **4** | **7** | **7** | **7** | **7** |
| **3** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

---

### Step 3 — Fill Row 3 (Item 3: weight=4, value=5)

| w | Skip → dp[2][w] | Take → dp[2][w-4]+5 | Condition    | dp[3][w] |
|---|-----------------|----------------------|--------------|----------|
| 0 | 0               | — (4 > 0)            | skip only    | **0**    |
| 1 | 0               | — (4 > 1)            | skip only    | **0**    |
| 2 | 3               | — (4 > 2)            | skip only    | **3**    |
| 3 | 4               | — (4 > 3)            | skip only    | **4**    |
| 4 | 4               | dp[2][0]+5 = 0+5 = 5 | max(4,5) → take | **5** |
| 5 | 7               | dp[2][1]+5 = 0+5 = 5 | max(7,5) → skip | **7** |
| 6 | 7               | dp[2][2]+5 = 3+5 = 8 | max(7,8) → take | **8** |
| 7 | 7               | dp[2][3]+5 = 4+5 = 9 | max(7,9) → take | **9** |
| 8 | 7               | dp[2][4]+5 = 4+5 = 9 | max(7,9) → take | **9** |

**Table after Row 3:**

| i \ w | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-------|---|---|---|---|---|---|---|---|---|
| **0** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **1** | 0 | 0 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| **2** | 0 | 0 | 3 | 4 | 4 | 7 | 7 | 7 | 7 |
| **3** | 0 | 0 | 3 | 4 | **5** | **7** | **8** | **9** | **9** |
| **4** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

---

### Step 4 — Fill Row 4 (Item 4: weight=5, value=6)

| w | Skip → dp[3][w] | Take → dp[3][w-5]+6 | Condition    | dp[4][w] |
|---|-----------------|----------------------|--------------|----------|
| 0 | 0               | — (5 > 0)            | skip only    | **0**    |
| 1 | 0               | — (5 > 1)            | skip only    | **0**    |
| 2 | 3               | — (5 > 2)            | skip only    | **3**    |
| 3 | 4               | — (5 > 3)            | skip only    | **4**    |
| 4 | 5               | — (5 > 4)            | skip only    | **5**    |
| 5 | 7               | dp[3][0]+6 = 0+6 = 6 | max(7,6) → skip | **7** |
| 6 | 8               | dp[3][1]+6 = 0+6 = 6 | max(8,6) → skip | **8** |
| 7 | 9               | dp[3][2]+6 = 3+6 = 9 | max(9,9) → skip | **9** |
| 8 | 9               | dp[3][3]+6 = 4+6 = 10 | max(9,10) → take | **10** |

**Final completed table:**

| i \ w | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-------|---|---|---|---|---|---|---|---|---|
| **0** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **1** | 0 | 0 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| **2** | 0 | 0 | 3 | 4 | 4 | 7 | 7 | 7 | 7 |
| **3** | 0 | 0 | 3 | 4 | 5 | 7 | 8 | 9 | 9 |
| **4** | 0 | 0 | 3 | 4 | 5 | 7 | 8 | 9 | **10** |

**Maximum value = dp[4][8] = 10**

---

### Traceback — Which Items Were Selected?

Start at `dp[4][8]` and walk backwards. At each row `i`, check whether Item `i` was taken:
- If `dp[i][w] == dp[i-1][w]` → Item `i` was **skipped** (move up one row, same column)
- If `dp[i][w] != dp[i-1][w]` → Item `i` was **taken** (move up one row, subtract weight)

```
Start: i=4, w=8, dp[4][8]=10

Step 1: dp[4][8]=10 vs dp[3][8]=9  → 10 ≠ 9  → Item 4 TAKEN (w=5, v=6)
        Remaining capacity: w = 8 - 5 = 3, move to i=3

Step 2: dp[3][3]=4  vs dp[2][3]=4  → 4 == 4  → Item 3 SKIPPED
        move to i=2, w stays 3

Step 3: dp[2][3]=4  vs dp[1][3]=3  → 4 ≠ 3   → Item 2 TAKEN (w=3, v=4)
        Remaining capacity: w = 3 - 3 = 0, move to i=1

Step 4: w=0, nothing more to take. Stop.
```

**Selected items: Item 2 (weight=3, value=4) + Item 4 (weight=5, value=6)**
- Total weight: 3 + 5 = **8** ✓ (exactly at capacity)
- Total value: 4 + 6 = **10** ✓

```python
def knapsack_traceback(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i][w],
                               dp[i - 1][w - weights[i - 1]] + values[i - 1])

    # Traceback
    selected = []
    w = capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:    # Item i was taken
            selected.append(i)
            w -= weights[i - 1]

    return dp[n][capacity], list(reversed(selected))

weights = [2, 3, 4, 5]
values  = [3, 4, 5, 6]
max_val, items = knapsack_traceback(weights, values, 8)
# max_val = 10, items = [2, 4]
```

---

### Space-Optimized 1D DP — Same Example

Instead of a 2D table, keep a single array `dp[0..W]`. To prevent reusing an item in the same pass, iterate capacity in **reverse** (high → low).

```
dp[w] after processing each item (capacity w=0..8)
```

**Initial state:**
```
w:   0  1  2  3  4  5  6  7  8
dp: [0, 0, 0, 0, 0, 0, 0, 0, 0]
```

**Process Item 1 (weight=2, value=3) — iterate w from 8 down to 2:**

| w | dp[w] before | dp[w-2]+3       | dp[w] after |
|---|--------------|-----------------|-------------|
| 8 | 0            | dp[6]+3 = 0+3=3 | **3**       |
| 7 | 0            | dp[5]+3 = 0+3=3 | **3**       |
| 6 | 0            | dp[4]+3 = 0+3=3 | **3**       |
| 5 | 0            | dp[3]+3 = 0+3=3 | **3**       |
| 4 | 0            | dp[2]+3 = 0+3=3 | **3**       |
| 3 | 0            | dp[1]+3 = 0+3=3 | **3**       |
| 2 | 0            | dp[0]+3 = 0+3=3 | **3**       |

```
dp: [0, 0, 3, 3, 3, 3, 3, 3, 3]
```

**Process Item 2 (weight=3, value=4) — iterate w from 8 down to 3:**

| w | dp[w] before | dp[w-3]+4       | dp[w] after |
|---|--------------|-----------------|-------------|
| 8 | 3            | dp[5]+4 = 3+4=7 | **7**       |
| 7 | 3            | dp[4]+4 = 3+4=7 | **7**       |
| 6 | 3            | dp[3]+4 = 3+4=7 | **7**       |
| 5 | 3            | dp[2]+4 = 3+4=7 | **7**       |
| 4 | 3            | dp[1]+4 = 0+4=4 | **4**       |
| 3 | 3            | dp[0]+4 = 0+4=4 | **4**       |

```
dp: [0, 0, 3, 4, 4, 7, 7, 7, 7]
```

**Process Item 3 (weight=4, value=5) — iterate w from 8 down to 4:**

| w | dp[w] before | dp[w-4]+5       | dp[w] after |
|---|--------------|-----------------|-------------|
| 8 | 7            | dp[4]+5 = 4+5=9 | **9**       |
| 7 | 7            | dp[3]+5 = 4+5=9 | **9**       |
| 6 | 7            | dp[2]+5 = 3+5=8 | **8**       |
| 5 | 7            | dp[1]+5 = 0+5=5 | 7 (skip)    |
| 4 | 4            | dp[0]+5 = 0+5=5 | **5**       |

```
dp: [0, 0, 3, 4, 5, 7, 8, 9, 9]
```

**Process Item 4 (weight=5, value=6) — iterate w from 8 down to 5:**

| w | dp[w] before | dp[w-5]+6        | dp[w] after |
|---|--------------|------------------|-------------|
| 8 | 9            | dp[3]+6 = 4+6=10 | **10**      |
| 7 | 9            | dp[2]+6 = 3+6=9  | 9 (tie, skip) |
| 6 | 8            | dp[1]+6 = 0+6=6  | 8 (skip)    |
| 5 | 7            | dp[0]+6 = 0+6=6  | 7 (skip)    |

**Final 1D array:**
```
dp: [0, 0, 3, 4, 5, 7, 8, 9, 10]
```

`dp[8] = 10` — same answer as the 2D approach. ✓

> **Why reverse order?** When processing Item `i`, `dp[w-weight[i]]` must still represent the state from *before* Item `i` was considered (i.e., the previous row in the 2D table). Iterating backwards guarantees that smaller indices haven't been updated yet in the current pass, preventing an item from being counted twice.

```python
def knapsack_1d(weights, values, capacity):
    dp = [0] * (capacity + 1)

    for i in range(len(weights)):
        for w in range(capacity, weights[i] - 1, -1):    # Reverse!
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])

    return dp[capacity]

# knapsack_1d([2,3,4,5], [3,4,5,6], 8) == 10
```

**Space**: O(W) instead of O(n × W) — a significant improvement for large `n`.
