---
title: "Time Complexity (Big-O Notation)"
description: "Understanding algorithmic complexity — Big-O, Big-Ω, Big-Θ notation, common complexity classes, amortized analysis, space complexity, and how to analyze code."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "Big-O", "time complexity", "space complexity", "asymptotic analysis"]
author: "Nemit"
featured: false
pinned: false
---

# Time Complexity (Big-O Notation)

## What Is Asymptotic Analysis?

Asymptotic analysis describes how an algorithm's resource usage (time or space) grows as the input size approaches infinity. It ignores constant factors and lower-order terms, focusing on the **growth rate**.

We don't count exact operations. We classify algorithms by how they **scale**.

```
10n² + 500n + 10000
     ↓ (as n → ∞)
     O(n²)
```

The n² term dominates for large n. The constants (10, 500, 10000) become irrelevant at scale.

---

## Asymptotic Notations

### Big-O (Upper Bound)

**O(f(n))**: the algorithm takes **at most** f(n) time (up to a constant factor) for large n.

```
f(n) = O(g(n)) if ∃ c > 0, n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀
```

Big-O describes the **worst case** upper bound.

### Big-Ω (Lower Bound)

**Ω(f(n))**: the algorithm takes **at least** f(n) time.

```
f(n) = Ω(g(n)) if ∃ c > 0, n₀ such that f(n) ≥ c·g(n) for all n ≥ n₀
```

### Big-Θ (Tight Bound)

**Θ(f(n))**: the algorithm takes **exactly** f(n) time (within constant factors). It's both O(f(n)) and Ω(f(n)).

```
f(n) = Θ(g(n)) if f(n) = O(g(n)) AND f(n) = Ω(g(n))
```

### In Practice

Most people say "O(n)" when they really mean "Θ(n)." Strictly:
- "Binary search is O(n)" is **true** (it's also O(n²), O(n³), etc.) but unhelpful
- "Binary search is Θ(log n)" is precise
- "Binary search is O(log n)" is what people usually mean

---

## Common Complexity Classes

| Complexity | Name | Example |
|---|---|---|
| O(1) | Constant | Array index access, hash table lookup |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear search, single loop |
| O(n log n) | Linearithmic | Merge sort, quick sort (average) |
| O(n²) | Quadratic | Nested loops, bubble sort |
| O(n³) | Cubic | Matrix multiplication (naive) |
| O(2ⁿ) | Exponential | Recursive Fibonacci (naive), subsets |
| O(n!) | Factorial | Permutations, brute-force TSP |

### Growth Rate Comparison

For n = 1,000,000:

| O(1) | O(log n) | O(n) | O(n log n) | O(n²) | O(2ⁿ) |
|---|---|---|---|---|---|
| 1 | 20 | 10⁶ | 2×10⁷ | 10¹² | 10³⁰⁰⁰⁰⁰ |
| instant | instant | 1 ms | 20 ms | 11.5 days | heat death of universe |

---

## How to Analyze Code

### Rule 1: Simple Statements are O(1)

```python
x = 5                    # O(1)
y = x + 10               # O(1)
print(y)                  # O(1)
arr[0] = 42               # O(1)
```

### Rule 2: Loops

Time = iterations × body cost:

```python
# O(n) — loop runs n times, body is O(1)
for i in range(n):
    print(i)

# O(n²) — nested loops
for i in range(n):
    for j in range(n):
        print(i, j)

# O(n × m) — different loop bounds
for i in range(n):
    for j in range(m):
        print(i, j)
```

### Rule 3: Halving/Doubling Loops are O(log n)

```python
# O(log n) — i doubles each iteration
i = 1
while i < n:
    i *= 2               # log₂(n) iterations

# O(log n) — halving
i = n
while i > 1:
    i //= 2              # log₂(n) iterations
```

### Rule 4: Sequential → Add, Nested → Multiply

```python
# O(n + m) — sequential
for i in range(n):       # O(n)
    process(i)
for j in range(m):       # O(m)
    process(j)

# O(n × m) — nested
for i in range(n):       # O(n)
    for j in range(m):   # × O(m)
        process(i, j)
```

### Rule 5: Drop Constants and Lower Terms

```
3n² + 5n + 100 → O(n²)
2ⁿ + n³ → O(2ⁿ)
n log n + n → O(n log n)
```

### Rule 6: Recursive Algorithms

Use the **recurrence relation** and solve it:

```python
# T(n) = T(n-1) + O(1) → O(n)
def factorial(n):
    if n <= 1: return 1
    return n * factorial(n - 1)

# T(n) = 2T(n/2) + O(n) → O(n log n)  (merge sort)
def merge_sort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

# T(n) = 2T(n-1) + O(1) → O(2ⁿ)
def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

---

## Master Theorem

For recurrences of the form **T(n) = aT(n/b) + O(nᵈ)**:

| Condition | Result |
|---|---|
| d > log_b(a) | T(n) = O(nᵈ) |
| d = log_b(a) | T(n) = O(nᵈ log n) |
| d < log_b(a) | T(n) = O(n^(log_b(a))) |

Examples:
- **Binary search**: T(n) = T(n/2) + O(1) → a=1, b=2, d=0 → log₂(1)=0=d → O(log n)
- **Merge sort**: T(n) = 2T(n/2) + O(n) → a=2, b=2, d=1 → log₂(2)=1=d → O(n log n)
- **Strassen's**: T(n) = 7T(n/2) + O(n²) → a=7, b=2, d=2 → log₂(7)≈2.81>2 → O(n^2.81)

---

## Amortized Analysis

Some operations are occasionally expensive but cheap on average. **Amortized** analysis gives the average cost per operation over a sequence.

### Dynamic Array (ArrayList)

Appending to a dynamic array is O(1) amortized:
- Most appends: O(1) — just place element
- Occasional resize: O(n) — copy all elements to new, larger array

If we double the size each time, n appends cost n + n/2 + n/4 + ... ≈ 2n total → O(1) amortized per append.

### Methods

| Method | Idea |
|---|---|
| **Aggregate** | Total cost of n operations / n |
| **Accounting** | Charge more for cheap operations to "save" for expensive ones |
| **Potential** | Define a potential function, cost = actual + ΔΦ |

---

## Space Complexity

How much **additional memory** (beyond the input) an algorithm uses.

```python
# O(1) space — constant extra memory
def find_max(arr):
    max_val = arr[0]
    for x in arr:
        if x > max_val:
            max_val = x
    return max_val

# O(n) space — creates new array
def reverse_copy(arr):
    return arr[::-1]

# O(n) space — recursion stack
def factorial(n):
    if n <= 1: return 1
    return n * factorial(n - 1)    # n stack frames
```

### Input vs Auxiliary Space

- **Total space** = input + auxiliary
- **Auxiliary space** = only the extra space
- When we say "O(1) space," we usually mean O(1) auxiliary space (the input doesn't count)

### Recursion Stack Space

Each recursive call adds a stack frame. Depth d recursion uses O(d) space:

| Algorithm | Recursion Depth | Stack Space |
|---|---|---|
| Binary search | O(log n) | O(log n) |
| Merge sort | O(log n) | O(log n) + O(n) merge buffer |
| Quick sort | O(log n) avg, O(n) worst | O(log n) avg |
| DFS | O(V) | O(V) |
| Fibonacci (naive) | O(n) | O(n) |

---

## Practical Considerations

### Constants Matter

O(n) with constant 1000 is slower than O(n log n) with constant 1 for n < ~10,000. Big-O hides constants.

Real-world performance depends on:
- **Cache locality**: sequential array access is much faster than random pointer chasing
- **Branch prediction**: predictable branches are cheaper
- **Memory allocation**: heap allocations are expensive
- **Instruction-level parallelism**: modern CPUs execute multiple operations per cycle

### Rough Time Limits (Competitive Programming)

| n | Max Complexity | Approximate Time |
|---|---|---|
| ≤ 10 | O(n!) | permutations OK |
| ≤ 20-25 | O(2ⁿ) | subsets OK |
| ≤ 500 | O(n³) | 125M operations |
| ≤ 5,000 | O(n²) | 25M operations |
| ≤ 10⁶ | O(n log n) | 20M operations |
| ≤ 10⁸ | O(n) | 100M operations |
| > 10⁸ | O(log n) or O(1) | binary search, math |

### Best, Average, Worst

| Algorithm | Best | Average | Worst |
|---|---|---|---|
| Quick sort | O(n log n) | O(n log n) | O(n²) |
| Insertion sort | O(n) | O(n²) | O(n²) |
| Hash table lookup | O(1) | O(1) | O(n) |
| Binary search | O(1) | O(log n) | O(log n) |

Usually we care about **worst case** (guarantees) or **average case** (practical performance).

---

## Complexity Classes (P, NP, NP-Complete)

| Class | Description | Examples |
|---|---|---|
| **P** | Solvable in polynomial time | Sorting, shortest path, MST |
| **NP** | Verifiable in polynomial time | SAT, TSP, graph coloring |
| **NP-Complete** | Hardest problems in NP | 3-SAT, vertex cover, subset sum |
| **NP-Hard** | At least as hard as NP-Complete | Halting problem, optimization TSP |

The **P = NP?** question asks whether every problem that can be verified quickly can also be solved quickly. This is one of the most important open problems in computer science.

For NP-Complete problems, we use:
- **Approximation algorithms** — guaranteed near-optimal in polynomial time
- **Heuristics** — no guarantee but often work well in practice
- **Backtracking with pruning** — exact but exponential worst case
- **Parameterized algorithms** — exponential in a parameter k, polynomial in n
