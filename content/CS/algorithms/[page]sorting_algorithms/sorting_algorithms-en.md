---
title: "Sorting Algorithms"
description: "Comparison-based and non-comparison sorting algorithms — Bubble, Selection, Insertion, Quick, Merge, Heap, Counting, Radix sort with analysis, implementation, and trade-offs."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "sorting", "quicksort", "mergesort", "complexity"]
author: "Nemit"
featured: false
pinned: false
---

# Sorting Algorithms

## Overview

| Algorithm | Best | Average | Worst | Space | Stable | Method |
|---|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes | Exchanging |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | No | Selection |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Yes | Insertion |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes | Divide & Conquer |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No | Divide & Conquer |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No | Selection |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | Yes | Non-comparison |
| Radix Sort | O(nk) | O(nk) | O(nk) | O(n+k) | Yes | Non-comparison |

**Stable** means equal elements retain their original relative order.

---

## Bubble Sort

Repeatedly swap adjacent elements if they're in the wrong order. The largest unsorted element "bubbles up" to its correct position each pass.

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:    # Optimization: stop if no swaps occurred
            break
```

```
Pass 1: [5, 3, 8, 1, 2] → [3, 5, 1, 2, 8]   (8 bubbles to end)
Pass 2: [3, 5, 1, 2, 8] → [3, 1, 2, 5, 8]   (5 bubbles up)
Pass 3: [3, 1, 2, 5, 8] → [1, 2, 3, 5, 8]   (3 bubbles up)
```

- **Best case O(n)**: already sorted (with early termination)
- **Worst case O(n²)**: reverse sorted
- Only practical use: detecting if an array is nearly sorted

---

## Selection Sort

Find the minimum element in the unsorted portion and swap it with the first unsorted position.

```python
def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
```

```
[5, 3, 8, 1, 2] → find min(1) → swap with position 0 → [1, 3, 8, 5, 2]
[1, 3, 8, 5, 2] → find min(2) → swap with position 1 → [1, 2, 8, 5, 3]
[1, 2, 8, 5, 3] → find min(3) → swap with position 2 → [1, 2, 3, 5, 8]
```

- Always O(n²) — no best-case improvement
- Minimum number of swaps (at most n-1) — useful when writes are expensive
- **Not stable**: swapping can change relative order of equal elements

---

## Insertion Sort

Build the sorted array one element at a time by inserting each element into its correct position among the already-sorted portion.

```python
def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
```

```
[5, 3, 8, 1, 2]
Insert 3: [3, 5, 8, 1, 2]
Insert 8: [3, 5, 8, 1, 2]   (already in place)
Insert 1: [1, 3, 5, 8, 2]
Insert 2: [1, 2, 3, 5, 8]
```

- **Best case O(n)**: already sorted (inner loop doesn't execute)
- Efficient for **small arrays** (n < ~20-50)
- Efficient for **nearly sorted** data — O(n + d) where d = number of inversions
- Used as the base case in hybrid sorts (Timsort, Introsort)
- **Online**: can sort as data arrives

---

## Merge Sort

Divide the array in half, recursively sort both halves, then merge the sorted halves.

```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:    # <= ensures stability
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

```
[5, 3, 8, 1, 2]
Split: [5, 3] [8, 1, 2]
Split: [5] [3] | [8] [1, 2]
Split: [5] [3] | [8] [1] [2]
Merge: [3, 5] | [1, 2] [8]
Merge: [3, 5] | [1, 2, 8]
Merge: [1, 2, 3, 5, 8]
```

- **Always O(n log n)** — guaranteed performance regardless of input
- **Stable**: preserves relative order of equal elements
- **O(n) extra space**: needs auxiliary array for merging
- Preferred for **linked lists** (merging is O(1) space with linked lists)
- Basis for **external sorting** (sorting data too large for memory)

### Natural Merge Sort

Detects existing runs (already-sorted subsequences) in the input, avoiding unnecessary splitting. This is the core idea behind **Timsort** (Python, Java's `Arrays.sort` for objects).

---

## Quick Sort

Choose a **pivot** element, partition the array so all elements less than the pivot come before it and all greater come after, then recursively sort the partitions.

```python
def quick_sort(arr, low, high):
    if low < high:
        pivot_idx = partition(arr, low, high)
        quick_sort(arr, low, pivot_idx - 1)
        quick_sort(arr, pivot_idx + 1, high)

def partition(arr, low, high):
    pivot = arr[high]          # Choose last element as pivot
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
```

```
[5, 3, 8, 1, 2]  pivot=2
Partition: [1, 2, 8, 5, 3]  (elements ≤2 on left)
Recurse on [1] and [8, 5, 3]
[8, 5, 3] pivot=3 → [3, 5, 8]
Result: [1, 2, 3, 5, 8]
```

- **Average O(n log n)**, worst O(n²) (when pivot is always min/max)
- **In-place**: O(log n) stack space
- Fastest in practice for random data (good cache locality, low constant factors)
- **Not stable**

### Pivot Selection Strategies

| Strategy | Description | Worst Case |
|---|---|---|
| Last/First element | Simplest | O(n²) for sorted input |
| Random element | Swap random with last, then partition | O(n²) unlikely |
| Median of three | Median of first, middle, last | O(n²) rare |
| Median of medians | True O(n) median | Guaranteed O(n log n) but slow constant |

### 3-Way Partition (Dutch National Flag)

Handles many duplicate elements efficiently by partitioning into three groups: less than, equal to, and greater than pivot.

```python
def quick_sort_3way(arr, low, high):
    if low >= high:
        return
    lt, gt = low, high
    pivot = arr[low]
    i = low
    while i <= gt:
        if arr[i] < pivot:
            arr[lt], arr[i] = arr[i], arr[lt]
            lt += 1; i += 1
        elif arr[i] > pivot:
            arr[gt], arr[i] = arr[i], arr[gt]
            gt -= 1
        else:
            i += 1
    quick_sort_3way(arr, low, lt - 1)
    quick_sort_3way(arr, gt + 1, high)
```

---

## Heap Sort

Build a max-heap from the array, then repeatedly extract the maximum and place it at the end.

```python
def heap_sort(arr):
    n = len(arr)
    # Build max heap (bottom-up)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)

    # Extract elements one by one
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]    # Move max to end
        heapify(arr, i, 0)                  # Re-heapify reduced heap

def heapify(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2

    if left < n and arr[left] > arr[largest]:
        largest = left
    if right < n and arr[right] > arr[largest]:
        largest = right
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)
```

- **Always O(n log n)** — no worst-case degradation
- **In-place** (O(1) extra space)
- **Not stable**
- Poor cache locality (jumps around array) — slower in practice than quicksort
- Useful when **guaranteed O(n log n)** with O(1) space is needed

---

## Non-Comparison Sorts

These break the O(n log n) lower bound for comparison-based sorting by not comparing elements directly.

### Counting Sort

Counts occurrences of each value. Only works for integers in a known range.

```python
def counting_sort(arr, max_val):
    count = [0] * (max_val + 1)
    for x in arr:
        count[x] += 1

    result = []
    for i in range(max_val + 1):
        result.extend([i] * count[i])
    return result
```

- **O(n + k)** time and space, where k is the range of values
- Efficient when k = O(n)
- Useless when k >> n (e.g., sorting 10 integers in range 0-10⁹)

### Radix Sort

Sort digit by digit (LSD = least significant digit first), using a stable sub-sort (usually counting sort) for each digit.

```python
def radix_sort(arr):
    max_val = max(arr)
    exp = 1
    while max_val // exp > 0:
        counting_sort_by_digit(arr, exp)
        exp *= 10

def counting_sort_by_digit(arr, exp):
    n = len(arr)
    output = [0] * n
    count = [0] * 10

    for x in arr:
        digit = (x // exp) % 10
        count[digit] += 1
    for i in range(1, 10):
        count[i] += count[i - 1]
    for i in range(n - 1, -1, -1):
        digit = (arr[i] // exp) % 10
        output[count[digit] - 1] = arr[i]
        count[digit] -= 1
    arr[:] = output
```

- **O(nk)** where k = number of digits
- Stable
- Great for fixed-width integers, strings of equal length

---

## Hybrid Sorting Algorithms

Real-world implementations use hybrid approaches:

### Timsort (Python, Java)

- Merge sort + insertion sort
- Detects natural runs in data
- Best O(n), average/worst O(n log n)
- Stable, O(n) space

### Introsort (C++ `std::sort`)

- Quick sort + heap sort + insertion sort
- Starts with quicksort, switches to heapsort if recursion depth exceeds 2×log₂(n)
- Uses insertion sort for small partitions (n < 16)
- Worst case O(n log n), not stable

---

## When to Use Which

| Situation | Best Choice |
|---|---|
| Small arrays (n < 50) | Insertion sort |
| General purpose | Quick sort (or library sort) |
| Guaranteed O(n log n) needed | Merge sort or heap sort |
| Stability required | Merge sort or Timsort |
| Nearly sorted data | Insertion sort or Timsort |
| Integers in small range | Counting sort |
| Fixed-width integers/strings | Radix sort |
| Linked lists | Merge sort |
| External sorting (disk) | Merge sort |
| Minimal extra space | Heap sort |

### Lower Bound for Comparison Sorting

Any comparison-based sort must make at least **Ω(n log n)** comparisons in the worst case. This is proven via decision tree analysis: with n! possible permutations, a binary decision tree needs at least log₂(n!) ≈ n log n height.

Non-comparison sorts (counting, radix, bucket) bypass this by exploiting the structure of the data.
