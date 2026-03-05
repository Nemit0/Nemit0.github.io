---
title: "Big-O Notation and Algorithm Analysis"
description: "How to measure algorithm efficiency — Big-O, Big-Θ, Big-Ω, and common complexity classes."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "big-o", "complexity", "computer science"]
author: "Nemit"
featured: false
pinned: false
---

# Big-O Notation and Algorithm Analysis

Asymptotic notation is the mathematical language we use to describe how algorithms scale. It strips away machine-specific constants and focuses purely on growth rates. This post covers the **formal definitions**, how to **prove and derive bounds rigorously**, and the common **mistakes** that trip people up.

> **Note:** This post focuses on the notation itself and how to derive it. For a practical overview of common complexity classes and how to analyze code quickly, see the [Time Complexity post](/CS/algorithms/time_complexity).

---

## 1. Why Formal Definitions Matter

You can get far with intuitions like "O(n) means linear" and "O(n²) means nested loops." But intuitions break down on edge cases:

- Is $f(n) = 0.001n^2 + 1000n$ in $O(n)$ or $O(n^2)$?
- Is every $O(n \log n)$ algorithm faster than every $O(n^2)$ algorithm?
- When can you say $T(n) = \Theta(n \log n)$, not just $O(n \log n)$?

Formal definitions answer these questions precisely — and let you *prove* bounds rather than guess them.

---

## 2. Big-O: Formal Definition

**Definition.** $f(n) = O(g(n))$ if and only if there exist positive constants $c$ and $n_0$ such that:

$$f(n) \leq c \cdot g(n) \quad \text{for all } n \geq n_0$$

Read: "$f$ is eventually bounded above by $c \cdot g$."

### What the constants mean

- **$c$** — the constant multiplier. It absorbs any fixed overhead. If $f(n) = 100n$ and $g(n) = n$, pick $c = 100$.
- **$n_0$** — the "eventually" threshold. Below $n_0$, the bound may not hold; above it, it always does. This lets us ignore small-input behaviour.

Big-O does **not** say anything about:
- The exact runtime for a given input
- Whether $g(n)$ is a *tight* bound (it could be very loose)
- Behaviour for small $n$

### Visualising the definition

```
        value
          │              c·g(n)
          │           ╱
          │         ╱   ← f(n) stays below c·g(n)
          │       ╱       for all n ≥ n₀
          │ ╱───╱
          │╱
          └─────────────────────── n
                   n₀
```

---

## 3. Big-Ω: Formal Definition

**Definition.** $f(n) = \Omega(g(n))$ if and only if there exist positive constants $c$ and $n_0$ such that:

$$f(n) \geq c \cdot g(n) \quad \text{for all } n \geq n_0$$

Read: "$f$ is eventually bounded *below* by $c \cdot g$." Big-Ω gives the **lower bound** — the best case an algorithm can possibly achieve on all inputs of size $n$.

---

## 4. Big-Θ: Formal Definition

**Definition.** $f(n) = \Theta(g(n))$ if and only if:

$$f(n) = O(g(n)) \quad \text{AND} \quad f(n) = \Omega(g(n))$$

Equivalently, there exist positive constants $c_1$, $c_2$, and $n_0$ such that:

$$c_1 \cdot g(n) \leq f(n) \leq c_2 \cdot g(n) \quad \text{for all } n \geq n_0$$

Big-Θ is a **tight bound** — $f$ and $g$ grow at the same rate up to constant factors. This is the most precise asymptotic statement you can make.

---

## 5. Little-o and Little-ω

These are *strict* versions of Big-O and Big-Ω — they say the bound is not tight.

### Little-o

**Definition.** $f(n) = o(g(n))$ if and only if:

$$\lim_{n \to \infty} \frac{f(n)}{g(n)} = 0$$

Informally: $f$ grows *strictly slower* than $g$. For any $\epsilon > 0$, no matter how small, eventually $f(n) < \epsilon \cdot g(n)$.

**Examples:**
- $n = o(n^2)$ — linear is strictly slower than quadratic
- $\log n = o(n)$ — logarithm is strictly slower than linear
- $n^2 \neq o(n^2)$ — they grow at the same rate, so this does *not* hold

### Little-ω

**Definition.** $f(n) = \omega(g(n))$ if and only if:

$$\lim_{n \to \infty} \frac{f(n)}{g(n)} = \infty$$

Informally: $f$ grows *strictly faster* than $g$.

**Examples:**
- $n^2 = \omega(n)$
- $2^n = \omega(n^{100})$ — exponential dominates any polynomial

### Summary table

| Notation | Meaning | Analogy |
|---|---|---|
| $f = O(g)$ | $f$ grows at most as fast as $g$ | $f \leq g$ |
| $f = \Omega(g)$ | $f$ grows at least as fast as $g$ | $f \geq g$ |
| $f = \Theta(g)$ | $f$ grows exactly as fast as $g$ | $f = g$ |
| $f = o(g)$ | $f$ grows strictly slower than $g$ | $f < g$ |
| $f = \omega(g)$ | $f$ grows strictly faster than $g$ | $f > g$ |

---

## 6. Proving Bounds: Step-by-Step

Proving $f(n) = O(g(n))$ means **finding explicit values** of $c$ and $n_0$ that satisfy the definition. There is no magic — it is just algebra.

### Proof strategy

1. Write out $f(n)$
2. Upper-bound each term by something involving only $g(n)$
3. Pick $n_0$ large enough that your bounding steps are valid
4. Name the resulting $c$ explicitly

---

### Example 1: Proving $3n^2 + 5n + 7 = O(n^2)$

**Claim:** $f(n) = 3n^2 + 5n + 7 = O(n^2)$

**Proof:**

For $n \geq 1$:

$$5n \leq 5n^2 \quad \text{(since } n \leq n^2 \text{ for } n \geq 1\text{)}$$
$$7 \leq 7n^2 \quad \text{(since } 1 \leq n^2 \text{ for } n \geq 1\text{)}$$

Therefore:

$$3n^2 + 5n + 7 \leq 3n^2 + 5n^2 + 7n^2 = 15n^2$$

We have found $c = 15$ and $n_0 = 1$ such that $f(n) \leq 15 \cdot n^2$ for all $n \geq 1$. $\blacksquare$

> **Key trick:** Replace every lower-order term with $\text{(coefficient)} \cdot n^d$ where $d$ is the degree of the highest term.

---

### Example 2: Proving $\frac{1}{2}n^2 - 3n = \Omega(n^2)$

**Claim:** $f(n) = \frac{1}{2}n^2 - 3n = \Omega(n^2)$

**Proof:**

We need $f(n) \geq c \cdot n^2$ for some $c > 0$.

$$\frac{1}{2}n^2 - 3n \geq c \cdot n^2$$

Divide both sides by $n^2$ (valid for $n > 0$):

$$\frac{1}{2} - \frac{3}{n} \geq c$$

For $n \geq 12$: $\frac{3}{n} \leq \frac{3}{12} = \frac{1}{4}$, so $\frac{1}{2} - \frac{3}{n} \geq \frac{1}{4}$.

Pick $c = \frac{1}{4}$ and $n_0 = 12$. Then $f(n) \geq \frac{1}{4} n^2$ for all $n \geq 12$. $\blacksquare$

---

### Example 3: Proving $\frac{1}{2}n^2 - 3n = \Theta(n^2)$

**Claim:** $f(n) = \frac{1}{2}n^2 - 3n = \Theta(n^2)$

**Proof:**

*Upper bound* (from Example 1's technique): For $n \geq 1$, $3n \leq 3n^2$, so:

$$\frac{1}{2}n^2 - 3n \leq \frac{1}{2}n^2 \leq n^2$$

So $f(n) \leq 1 \cdot n^2$ for $n \geq 1$ → $f(n) = O(n^2)$ with $c_2 = 1$.

*Lower bound*: from Example 2, $f(n) \geq \frac{1}{4} n^2$ for $n \geq 12$.

Combined with $n_0 = 12$, $c_1 = \frac{1}{4}$, $c_2 = 1$:

$$\frac{1}{4} n^2 \leq \frac{1}{2}n^2 - 3n \leq n^2 \quad \text{for all } n \geq 12$$

Therefore $f(n) = \Theta(n^2)$. $\blacksquare$

---

### Example 4: Proving $2^n \neq O(n^{100})$

**Claim:** $2^n$ is not $O(n^{100})$.

**Proof by contradiction:** Suppose $2^n = O(n^{100})$. Then there exist $c, n_0$ such that $2^n \leq c \cdot n^{100}$ for all $n \geq n_0$. But:

$$\frac{2^n}{n^{100}} \to \infty \quad \text{as } n \to \infty$$

(exponentials grow faster than any polynomial — by L'Hôpital or induction). So no constant $c$ can bound $2^n / n^{100}$ above for large $n$. Contradiction. $\blacksquare$

This is equivalently written $n^{100} = o(2^n)$.

---

## 7. Useful Properties and Rules

### Transitivity

If $f = O(g)$ and $g = O(h)$, then $f = O(h)$. (Same for $\Omega$ and $\Theta$.)

### Sum Rule (Sequential Composition)

$$O(f) + O(g) = O(\max(f, g))$$

```python
def example(n):
    # Phase 1: O(n)
    for i in range(n):
        print(i)

    # Phase 2: O(n^2)
    for i in range(n):
        for j in range(n):
            print(i, j)

# Total: O(n) + O(n²) = O(n²)
```

The dominant term wins. Lower-order phases are absorbed.

### Product Rule (Nested Composition)

$$O(f) \cdot O(g) = O(f \cdot g)$$

```python
def example(n):
    for i in range(n):        # O(n) iterations
        for j in range(n):    # O(n) iterations each
            print(i + j)      # O(1) per iteration

# Total: O(n) * O(n) * O(1) = O(n²)
```

### Polynomial Rule

For any polynomial $p(n) = a_k n^k + a_{k-1} n^{k-1} + \ldots + a_0$:

$$p(n) = \Theta(n^k)$$

Only the leading term matters.

### Logarithm Base Change

$$\log_a n = \frac{\log_b n}{\log_b a} = \Theta(\log_b n)$$

All logarithms differ by only a constant factor, so **the base never matters in asymptotic notation**. We always write $O(\log n)$.

### Constant Multiples

$$O(c \cdot f(n)) = O(f(n)) \quad \text{for any constant } c > 0$$

This is a direct consequence of the definition: the scalar multiplier can always be absorbed into the constant $c$ from the Big-O definition (Section 2), so it has no effect on the class.

---

## 8. Deriving Big-O from Code

### 8.1 Single Loop

```python
def linear_search(arr, target):
    for i in range(len(arr)):   # n iterations
        if arr[i] == target:    # O(1) per iteration
            return i
    return -1
```

**Derivation:** The loop runs at most $n$ times. Each iteration does $O(1)$ work (an array access and a comparison). By the product rule: $n \cdot O(1) = O(n)$.

---

### 8.2 Nested Loops — Dependent Bounds

```python
def print_pairs(n):
    for i in range(n):          # outer: n iterations
        for j in range(i + 1, n):   # inner: n-1-i iterations
            print(i, j)
```

**Derivation:** Count the total iterations of the inner loop:

$$\sum_{i=0}^{n-1} (n - 1 - i) = \sum_{k=0}^{n-1} k = \frac{n(n-1)}{2}$$

By the polynomial rule, $\frac{n(n-1)}{2} = \Theta(n^2)$, so the function is $O(n^2)$.

> This is a common source of confusion: not all nested loops are $O(n^2)$. The inner bound must be checked carefully.

---

### 8.3 Nested Loops — Independent Bounds

```python
def matrix_add(A, B, n, m):
    for i in range(n):
        for j in range(m):
            A[i][j] += B[i][j]
```

**Derivation:** Outer loop runs $n$ times, inner runs $m$ times, body is $O(1)$.

$$T(n, m) = n \cdot m \cdot O(1) = O(nm)$$

When $m = n$, this simplifies to $O(n^2)$.

---

### 8.4 Logarithmic Loop

```python
def count_halvings(n):
    count = 0
    i = n
    while i > 1:     # halves each iteration
        i //= 2
        count += 1
    return count
```

**Derivation:** After $k$ iterations, $i = \lfloor n / 2^k \rfloor$. The loop ends when $i \leq 1$, i.e., when $n / 2^k \leq 1$, i.e., $k \geq \log_2 n$. The loop runs $\lfloor \log_2 n \rfloor + 1 = O(\log n)$ times.

---

### 8.5 Recognising O(n log n)

```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])   # T(n/2)
    right = merge_sort(arr[mid:])  # T(n/2)
    return merge(left, right)      # O(n)
```

**Derivation via recurrence:** The recurrence is:

$$T(n) = 2T(n/2) + O(n)$$

Expanding the recursion tree:

```
Level 0:  1 problem of size n  →  cost: n
Level 1:  2 problems of size n/2  →  cost: 2 × n/2 = n
Level 2:  4 problems of size n/4  →  cost: 4 × n/4 = n
...
Level k:  2^k problems of size n/2^k  →  cost: n
...
Level log₂n:  n problems of size 1  →  cost: n
```

There are $\log_2 n + 1$ levels, each contributing $O(n)$ work. Total: $O(n \log n)$.

This is also solvable by the **Master Theorem** (see below).

---

## 9. The Master Theorem

For recurrences of the form $T(n) = aT(n/b) + f(n)$ where $a \geq 1$, $b > 1$:

Let $d = \log_b a$.

| Case | Condition | Result |
|---|---|---|
| Case 1 | $f(n) = O(n^{d - \epsilon})$ for some $\epsilon > 0$ | $T(n) = \Theta(n^d)$ |
| Case 2 | $f(n) = \Theta(n^d)$ | $T(n) = \Theta(n^d \log n)$ |
| Case 3 | $f(n) = \Omega(n^{d + \epsilon})$ for some $\epsilon > 0$ (and regularity condition) | $T(n) = \Theta(f(n))$ |

### Applying the Master Theorem

**Merge sort:** $T(n) = 2T(n/2) + O(n)$

- $a = 2$, $b = 2$, $d = \log_2 2 = 1$
- $f(n) = O(n) = O(n^1) = \Theta(n^d)$ → Case 2
- Result: $T(n) = \Theta(n \log n)$ ✓

**Binary search:** $T(n) = T(n/2) + O(1)$

- $a = 1$, $b = 2$, $d = \log_2 1 = 0$
- $f(n) = O(1) = \Theta(n^0) = \Theta(n^d)$ → Case 2
- Result: $T(n) = \Theta(\log n)$ ✓

**Naive matrix multiply:** $T(n) = 8T(n/2) + O(n^2)$

- $a = 8$, $b = 2$, $d = \log_2 8 = 3$
- $f(n) = O(n^2) = O(n^{3 - 1})$ → Case 1 (with $\epsilon = 1$)
- Result: $T(n) = \Theta(n^3)$ ✓

---

## 10. Visual Growth Rate Comparison

The following table shows approximate values for each complexity class and what they mean in practice for large inputs.

```
Growth rates (approximate operations for given n):

n          │ O(1)  O(log n) O(n)   O(n log n) O(n²)     O(2ⁿ)
───────────┼───────────────────────────────────────────────────────────
10         │ 1     3        10     30         100        1,024
100        │ 1     7        100    700        10,000     1.27 × 10³⁰
1,000      │ 1     10       1,000  10,000     1,000,000  too large
1,000,000  │ 1     20       10⁶    2×10⁷     10¹²       absurdly large

Visual slope (log scale):

2ⁿ    ╱  (nearly vertical)
      │
n²   ╱╱
    ╱
n log n ─╱
        ╱
n    ──╱
      ╱╱╱
log n ──────────────
1    ════════════════  (flat)
```

**Key takeaway:** The gap between $O(n^2)$ and $O(n \log n)$ is enormous at scale. An $O(n^2)$ algorithm on $n = 10^6$ inputs does about $10^{12}$ operations (days of compute), while $O(n \log n)$ does $2 \times 10^7$ (milliseconds).

---

## 11. Common Mistakes and Pitfalls

### Mistake 1: Thinking O(2n) ≠ O(n)

```python
# This is O(n), not O(2n):
def two_passes(arr):
    total = 0
    for x in arr:   # first pass
        total += x
    for x in arr:   # second pass
        print(x)
    return total
```

$O(2n) = O(n)$ because scalar constants are absorbed into the constant $c$ in the Big-O definition (Section 2). The 2 simply becomes part of $c$, and the bound still holds. Two sequential loops over $n$ elements is $O(n)$, not $O(2n)$.

---

### Mistake 2: Confusing O with Θ

Saying "bubble sort is O(n)" is **technically true** but useless — bubble sort is also $O(n^{1000})$, $O(2^n)$, etc. Big-O is an upper bound; anything above the true growth rate is valid.

| What you say | What it means | Is it correct? |
|---|---|---|
| Bubble sort is $O(n^2)$ | true upper bound | ✓ accurate |
| Bubble sort is $\Theta(n^2)$ | tight bound | ✓ precise |
| Bubble sort is $O(n)$ | true but misleading | technically valid, practically wrong |
| Bubble sort is $O(n^3)$ | true upper bound | ✓ but loose |

When people say "binary search is $O(\log n)$", they typically mean $\Theta(\log n)$. Cultivate the habit of using $\Theta$ when you mean a tight bound.

---

### Mistake 3: Dropping Non-Dominant Terms Too Early

```python
def process(n, m):
    for i in range(n):       # O(n)
        pass
    for i in range(m * m):   # O(m²)
        pass
```

If $n$ and $m$ are **independent variables**, the complexity is $O(n + m^2)$, *not* $O(m^2)$. You can only drop $n$ if you know $n = O(m^2)$.

---

### Mistake 4: Nested Loops Are Not Always O(n²)

```python
# This is O(n log n), not O(n²):
def halving_inner(n):
    for i in range(n):   # O(n) outer
        j = n
        while j > 0:     # O(log n) inner
            j //= 2
```

The inner loop halves each time, so it runs $O(\log n)$ times — regardless of `i`. Total: $O(n \log n)$.

---

### Mistake 5: Ignoring Input-Dependent Behaviour

```python
def search_and_process(arr, target):
    for i, x in enumerate(arr):   # up to O(n)
        if x == target:
            # ... O(1) work
            return i
    return -1
```

The **worst case** is $O(n)$ (target not found). The **best case** is $O(1)$ (target is first element). The **average case** (uniform distribution) is $O(n/2) = O(n)$.

Big-O on its own does not tell you which case applies — be explicit:
- Worst case: $O(n)$
- Best case: $\Omega(1)$
- Average case: $\Theta(n)$

---

### Mistake 6: Assuming O(log n) Means Binary Search Only

$O(\log n)$ appears anywhere the problem size is *divided by a constant factor* each step:
- Binary search (divide by 2)
- Counting digits of $n$ (divide by 10)
- Traversing a balanced binary tree (height $= \log_2 n$)
- Exponentiation by squaring (`pow(x, n)` in $O(\log n)$)

```python
def fast_power(base, exp):
    if exp == 0:
        return 1
    if exp % 2 == 0:
        half = fast_power(base, exp // 2)  # problem halves
        return half * half
    return base * fast_power(base, exp - 1)
```

Each recursive call halves `exp` (when even), so this is $O(\log n)$ multiplications.

---

### Mistake 7: Treating Amortised Cost as Worst-Case

Python's `list.append()` is $O(1)$ **amortised** — occasionally it triggers a $O(n)$ resize. The single-call worst case is $O(n)$, but across $n$ appends the total cost is $O(n)$, so the amortised cost per append is $O(1)$.

```python
arr = []
for i in range(n):
    arr.append(i)   # O(1) amortised — total loop is O(n), not O(n²)
```

Using worst-case per operation would over-count to $O(n^2)$, which is incorrect.

---

## 12. Worked Examples from Scratch

### Example A: Find the Complexity of This Function

```python
def mystery(n):
    result = 0
    i = 1
    while i <= n:         # (1)
        j = 0
        while j < i:      # (2)
            result += 1
            j += 1
        i *= 2            # (3)
    return result
```

**Step 1:** How many times does the outer loop (1) run?  
`i` takes values $1, 2, 4, 8, \ldots, 2^k$ until $2^k > n$, so $k = \lfloor \log_2 n \rfloor$. Outer loop runs $O(\log n)$ times.

**Step 2:** How many times does the inner loop (2) run per outer iteration?  
When `i = 2^k`, the inner loop runs $2^k$ times.

**Step 3:** Total inner iterations:

$$\sum_{k=0}^{\lfloor \log_2 n \rfloor} 2^k = 2^{\lfloor \log_2 n \rfloor + 1} - 1 \leq 2n - 1$$

**Conclusion:** $T(n) = O(n)$. Not $O(n \log n)$ or $O(\log n)$ — the doubling outer index makes the inner sum telescope to $O(n)$.

---

### Example B: Matrix Power (Naive)

```python
def mat_pow(M, n, size):
    """Raise matrix M to the power n."""
    result = identity_matrix(size)       # O(size²)
    for _ in range(n):                   # n iterations
        result = mat_multiply(result, M, size)  # O(size³) each
    return result
```

**Derivation:**
- `identity_matrix`: $O(s^2)$ where $s =$ `size`
- Loop: $n$ iterations
- `mat_multiply`: $O(s^3)$ per call (naive triple-nested loop)
- Total: $O(s^2) + n \cdot O(s^3) = O(n \cdot s^3)$

If both $n$ and $s$ are variables, complexity is $O(n s^3)$. If $s$ is fixed (e.g., $4 \times 4$ rotation matrices), it degenerates to $O(n)$.

---

### Example C: String Building in a Loop

```python
# Version 1 — naive concatenation
def build_string_v1(n):
    s = ""
    for i in range(n):
        s += str(i)    # O(len(s)) per concatenation in Python!
    return s

# Version 2 — join
def build_string_v2(n):
    parts = []
    for i in range(n):
        parts.append(str(i))   # O(1) amortised
    return "".join(parts)      # O(total length) = O(n log n) — digits vary
```

**Version 1 analysis:**  
At iteration $i$, `s` has length roughly $i \cdot \lceil \log_{10} i \rceil$. The concatenation copies the entire string:

$$T(n) = \sum_{i=0}^{n-1} O(i \log i) = O(n^2 \log n)$$

**Version 2 analysis:**  
`append` is $O(1)$ amortised, so the loop is $O(n)$. `join` copies all characters once, costing $O(\text{total characters}) = O(n \log n)$ (digits of numbers $0..n$ sum to $O(n \log n)$). Total: $O(n \log n)$.

> Naive string concatenation in a loop is a classic $O(n^2)$ trap.

---

## 13. Relationship Between the Notations

The hierarchy, from slowest-growing to fastest-growing, of the complexity classes you will encounter:

$$O(1) \subset O(\log n) \subset O(\sqrt{n}) \subset O(n) \subset O(n \log n) \subset O(n^2) \subset O(n^3) \subset O(2^n) \subset O(n!)$$

Here $\subset$ means "is a strict subset of" — every $O(1)$ function is also $O(\log n)$, $O(n)$, etc. Big-O accumulates upward.

The corresponding $\Theta$ classes are **disjoint**: a function is in exactly one $\Theta$ class. Knowing a function's $\Theta$ class tells you its exact growth rate.

---

## 14. Quick Reference

### Proving $f = O(g)$

1. Write $f(n)$
2. Upper-bound lower-order terms: replace each $a \cdot n^k$ with $a \cdot n^d$ where $d$ is the degree of the dominant term
3. Sum constants → your $c$
4. Find $n_0 \geq 1$ such that all replacements in step 2 are valid

### Proving $f \neq O(g)$

Show $\lim_{n \to \infty} f(n)/g(n) = \infty$.

### Deriving from code

| Code pattern | Complexity |
|---|---|
| Single statement | $O(1)$ |
| Loop of $n$ with $O(1)$ body | $O(n)$ |
| Loop halving each step | $O(\log n)$ |
| Two sequential loops of $n$ | $O(n)$ |
| Nested loops, both $n$ | $O(n^2)$ |
| Loop $n$, inner halves | $O(n \log n)$ |
| Divide-and-conquer, halving | Apply Master Theorem |
| Recurrence $T(n) = 2T(n/2) + O(n)$ | $O(n \log n)$ |
| Recurrence $T(n) = T(n-1) + O(1)$ | $O(n)$ |
| Recurrence $T(n) = 2T(n-1) + O(1)$ | $O(2^n)$ |

---

## Summary

- **Big-O** ($O$) is an upper bound: the algorithm uses *at most* this many resources.
- **Big-Ω** ($\Omega$) is a lower bound: the algorithm uses *at least* this many resources.
- **Big-Θ** ($\Theta$) is a tight bound: both bounds match — the most precise statement.
- **Little-o** ($o$) and **little-ω** ($\omega$) express *strict* (non-tight) orderings.
- To *prove* a bound, find explicit constants $c$ and $n_0$ that satisfy the definition.
- Constants and lower-order terms are always dropped — but only *after* you've confirmed which term dominates.
- When someone says "$O(f(n))$" in everyday speech, they usually mean $\Theta(f(n))$. Be precise in formal contexts.

For practical application — how these notations map onto sorting algorithms, data structures, and real problem analysis — see the [Time Complexity post](/CS/algorithms/time_complexity).
