---
title: "Stacks and Queues"
description: "Stack and queue data structures — implementations, common problems (balanced parentheses, monotonic stack, sliding window), priority queues, and deques."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "stack", "queue", "data structures", "monotonic stack", "priority queue"]
author: "Nemit"
featured: false
pinned: false
---

# Stacks and Queues

## Stack — LIFO (Last In, First Out)

A **stack** allows insertion and removal only at one end (the **top**).

```
Push 1, 2, 3:

    |  3  | ← top
    |  2  |
    |  1  |
    +-----+

Pop → 3, then 2, then 1
```

### Operations

| Operation | Time | Description |
|---|---|---|
| `push(x)` | O(1) | Add element to top |
| `pop()` | O(1) | Remove and return top element |
| `peek()`/`top()` | O(1) | Return top without removing |
| `isEmpty()` | O(1) | Check if stack is empty |

### Implementation

#### Array-Based Stack

```python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)      # O(1) amortized

    def pop(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self.items.pop()      # O(1) amortized

    def peek(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self.items[-1]

    def is_empty(self):
        return len(self.items) == 0

    def size(self):
        return len(self.items)
```

#### Linked List-Based Stack

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class LinkedStack:
    def __init__(self):
        self.head = None
        self._size = 0

    def push(self, val):
        node = Node(val)
        node.next = self.head
        self.head = node
        self._size += 1

    def pop(self):
        if not self.head:
            raise IndexError("Stack is empty")
        val = self.head.val
        self.head = self.head.next
        self._size -= 1
        return val
```

### Python's Built-in Stack

```python
# Use list as stack
stack = []
stack.append(1)      # push
stack.append(2)
stack.pop()          # 2

# collections.deque is also efficient for stack use
from collections import deque
stack = deque()
stack.append(1)      # push
stack.pop()          # pop from right
```

---

## Queue — FIFO (First In, First Out)

A **queue** allows insertion at the **rear** (enqueue) and removal from the **front** (dequeue).

```
Enqueue 1, 2, 3:

Front → [1] [2] [3] ← Rear

Dequeue → 1, then 2, then 3
```

### Operations

| Operation | Time | Description |
|---|---|---|
| `enqueue(x)` | O(1) | Add element to rear |
| `dequeue()` | O(1) | Remove and return front element |
| `front()`/`peek()` | O(1) | Return front without removing |
| `isEmpty()` | O(1) | Check if queue is empty |

### Implementation

#### Circular Array Queue

```python
class CircularQueue:
    def __init__(self, capacity):
        self.capacity = capacity
        self.queue = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0

    def enqueue(self, item):
        if self.size == self.capacity:
            raise OverflowError("Queue is full")
        self.rear = (self.rear + 1) % self.capacity
        self.queue[self.rear] = item
        self.size += 1

    def dequeue(self):
        if self.size == 0:
            raise IndexError("Queue is empty")
        item = self.queue[self.front]
        self.front = (self.front + 1) % self.capacity
        self.size -= 1
        return item
```

#### Python's `deque` as Queue

```python
from collections import deque

queue = deque()
queue.append(1)       # enqueue (right end)
queue.append(2)
queue.popleft()       # dequeue (left end) → 1
```

**Do NOT use `list` as a queue**: `list.pop(0)` is O(n) because it shifts all elements. `deque.popleft()` is O(1).

---

## Deque — Double-Ended Queue

A **deque** allows insertion and removal at **both ends** in O(1).

```python
from collections import deque

d = deque()
d.append(1)          # right end: [1]
d.appendleft(0)      # left end: [0, 1]
d.append(2)          # [0, 1, 2]
d.popleft()          # 0, deque: [1, 2]
d.pop()              # 2, deque: [1]

# Bounded deque (fixed max size)
d = deque(maxlen=3)
d.extend([1, 2, 3])  # [1, 2, 3]
d.append(4)          # [2, 3, 4] — automatically drops leftmost
```

### Deque Applications

- Implement both stack and queue
- Sliding window maximum/minimum
- Palindrome checking
- BFS (standard queue use)
- Work-stealing algorithms

---

## Stack Problems

### 1. Balanced Parentheses

Check if brackets are properly matched and nested.

```python
def is_valid(s):
    stack = []
    matching = {')': '(', ']': '[', '}': '{'}

    for char in s:
        if char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack or stack[-1] != matching[char]:
                return False
            stack.pop()

    return len(stack) == 0

# Examples:
# "({[]})" → True
# "({[}])" → False (mismatched)
# "((("    → False (unclosed)
```

**Time**: O(n), **Space**: O(n)

### 2. Evaluate Reverse Polish Notation (Postfix)

```python
def eval_rpn(tokens):
    stack = []
    ops = {
        '+': lambda a, b: a + b,
        '-': lambda a, b: a - b,
        '*': lambda a, b: a * b,
        '/': lambda a, b: int(a / b),    # Truncate toward zero
    }

    for token in tokens:
        if token in ops:
            b = stack.pop()
            a = stack.pop()
            stack.append(ops[token](a, b))
        else:
            stack.append(int(token))

    return stack[0]

# ["3", "4", "+", "2", "*"] → (3 + 4) * 2 = 14
```

### 3. Min Stack

Stack that supports `getMin()` in O(1).

```python
class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []    # Tracks minimums

    def push(self, val):
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)

    def pop(self):
        val = self.stack.pop()
        if val == self.min_stack[-1]:
            self.min_stack.pop()
        return val

    def getMin(self):
        return self.min_stack[-1]
```

### 4. Monotonic Stack

A stack that maintains elements in increasing or decreasing order. Used to find the **next greater/smaller element** efficiently.

#### Next Greater Element

For each element, find the first element to its right that is greater.

```python
def next_greater_element(arr):
    n = len(arr)
    result = [-1] * n
    stack = []    # Stores indices

    for i in range(n):
        while stack and arr[i] > arr[stack[-1]]:
            idx = stack.pop()
            result[idx] = arr[i]
        stack.append(i)

    return result

# [4, 5, 2, 25, 7] → [5, 25, 25, -1, -1]
```

**Time**: O(n) — each element is pushed and popped at most once.

#### Largest Rectangle in Histogram

```python
def largest_rectangle(heights):
    stack = []    # Indices of increasing heights
    max_area = 0
    heights.append(0)    # Sentinel to flush remaining bars

    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    heights.pop()    # Remove sentinel
    return max_area

# [2, 1, 5, 6, 2, 3] → 10 (5×2 rectangle at indices 2-3)
```

### 5. Daily Temperatures

Find how many days until a warmer temperature.

```python
def daily_temperatures(temperatures):
    n = len(temperatures)
    result = [0] * n
    stack = []    # Stack of indices

    for i in range(n):
        while stack and temperatures[i] > temperatures[stack[-1]]:
            prev = stack.pop()
            result[prev] = i - prev
        stack.append(i)

    return result

# [73, 74, 75, 71, 69, 72, 76, 73] → [1, 1, 4, 2, 1, 1, 0, 0]
```

### 6. Infix to Postfix (Shunting Yard Algorithm)

```python
def infix_to_postfix(expression):
    precedence = {'+': 1, '-': 1, '*': 2, '/': 2, '^': 3}
    right_associative = {'^'}
    output = []
    stack = []

    for token in expression:
        if token.isalnum():
            output.append(token)
        elif token == '(':
            stack.append(token)
        elif token == ')':
            while stack and stack[-1] != '(':
                output.append(stack.pop())
            stack.pop()    # Remove '('
        else:    # Operator
            while (stack and stack[-1] != '(' and
                   stack[-1] in precedence and
                   (precedence[stack[-1]] > precedence[token] or
                    (precedence[stack[-1]] == precedence[token] and
                     token not in right_associative))):
                output.append(stack.pop())
            stack.append(token)

    while stack:
        output.append(stack.pop())

    return output
```

---

## Queue Problems

### 1. BFS — Level Order Traversal

```python
from collections import deque

def level_order(root):
    if not root:
        return []
    result = []
    queue = deque([root])

    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)

    return result
```

### 2. Sliding Window Maximum

Find the maximum in every window of size k. Uses a **monotonic deque**.

```python
from collections import deque

def max_sliding_window(nums, k):
    dq = deque()    # Stores indices, front is always the max
    result = []

    for i in range(len(nums)):
        # Remove indices outside window
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Remove smaller elements from back (they'll never be the max)
        while dq and nums[dq[-1]] < nums[i]:
            dq.pop()

        dq.append(i)

        if i >= k - 1:
            result.append(nums[dq[0]])

    return result

# nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
# Windows: [1,3,-1], [3,-1,-3], [-1,-3,5], [-3,5,3], [5,3,6], [3,6,7]
# Result:  [3, 3, 5, 5, 6, 7]
```

**Time**: O(n) — each element is added and removed from deque at most once.

### 3. Implement Queue Using Two Stacks

```python
class QueueFromStacks:
    def __init__(self):
        self.in_stack = []     # For enqueue
        self.out_stack = []    # For dequeue

    def enqueue(self, x):
        self.in_stack.append(x)

    def dequeue(self):
        if not self.out_stack:
            while self.in_stack:
                self.out_stack.append(self.in_stack.pop())
        return self.out_stack.pop()
```

**Amortized O(1)** per operation: each element is moved between stacks at most once.

### 4. Implement Stack Using Two Queues

```python
from collections import deque

class StackFromQueues:
    def __init__(self):
        self.q = deque()

    def push(self, x):
        self.q.append(x)
        # Rotate so the new element is at front
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())

    def pop(self):
        return self.q.popleft()
```

`push` is O(n), `pop` is O(1).

---

## Priority Queue (Heap)

A **priority queue** dequeues elements by priority (not insertion order). Implemented with a **binary heap**.

### Min-Heap Operations

| Operation | Time |
|---|---|
| `insert(x)` | O(log n) |
| `extract_min()` | O(log n) |
| `peek_min()` | O(1) |
| `heapify(array)` | O(n) |

### Python `heapq` (Min-Heap)

```python
import heapq

# Create heap from list
nums = [5, 3, 8, 1, 2]
heapq.heapify(nums)           # O(n), in-place → [1, 2, 8, 5, 3]

heapq.heappush(nums, 0)       # Insert → [0, 2, 1, 5, 3, 8]
heapq.heappop(nums)           # Extract min → 0

# Peek without removing
nums[0]                        # Minimum element

# Push and pop in one operation
heapq.heappushpop(nums, 4)    # Push 4, then pop min
heapq.heapreplace(nums, 4)    # Pop min, then push 4

# N largest/smallest
heapq.nlargest(3, nums)       # 3 largest elements
heapq.nsmallest(3, nums)      # 3 smallest elements
```

### Max-Heap Trick

Python only has min-heap. For max-heap, negate values:

```python
import heapq

max_heap = []
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -3)
heapq.heappush(max_heap, -8)

max_val = -heapq.heappop(max_heap)    # 8
```

### Priority Queue with Custom Priority

```python
import heapq

# Use tuple (priority, item)
pq = []
heapq.heappush(pq, (3, "low priority"))
heapq.heappush(pq, (1, "high priority"))
heapq.heappush(pq, (2, "medium priority"))

priority, item = heapq.heappop(pq)    # (1, "high priority")
```

### Top K Elements

```python
import heapq

def top_k_frequent(nums, k):
    freq = {}
    for n in nums:
        freq[n] = freq.get(n, 0) + 1

    # Use min-heap of size k
    return heapq.nlargest(k, freq.keys(), key=freq.get)

# [1,1,1,2,2,3], k=2 → [1, 2]
```

### Merge K Sorted Lists

```python
import heapq

def merge_k_sorted(lists):
    heap = []
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))

    result = []
    while heap:
        val, list_idx, elem_idx = heapq.heappop(heap)
        result.append(val)
        if elem_idx + 1 < len(lists[list_idx]):
            next_val = lists[list_idx][elem_idx + 1]
            heapq.heappush(heap, (next_val, list_idx, elem_idx + 1))

    return result

# [[1,4,7], [2,5,8], [3,6,9]] → [1,2,3,4,5,6,7,8,9]
```

**Time**: O(n log k) where n = total elements, k = number of lists.

---

## Comparison

| Data Structure | Insert | Remove | Access | Use Case |
|---|---|---|---|---|
| Stack | O(1) push | O(1) pop | O(1) top | Undo, parsing, DFS |
| Queue | O(1) enqueue | O(1) dequeue | O(1) front | BFS, scheduling |
| Deque | O(1) both ends | O(1) both ends | O(1) both ends | Sliding window |
| Priority Queue | O(log n) | O(log n) | O(1) min/max | Dijkstra, scheduling |
| Monotonic Stack | O(1) amortized | O(1) amortized | O(1) top | Next greater/smaller |

---

## Worked Example: Balanced Parentheses — Step-by-Step Trace

We trace through two input strings to show exactly how the stack-based algorithm works.

**Matching pairs**: `(` ↔ `)`, `{` ↔ `}`, `[` ↔ `]`

**Algorithm**: Push every opening bracket. On a closing bracket, pop the top — if it matches, continue; if it doesn't (or the stack is empty), the string is **invalid**. After processing all characters, the string is valid only if the stack is **empty**.

### Valid string: `"({[]})"`

| Step | Character | Action | Stack State | Notes |
|------|-----------|--------|-------------|-------|
| 1 | `(` | Push | `(` | Opening bracket → push |
| 2 | `{` | Push | `( {` | Opening bracket → push |
| 3 | `[` | Push | `( { [` | Opening bracket → push |
| 4 | `]` | Pop `[` | `( {` | Closing bracket; top is `[` → match ✓ |
| 5 | `}` | Pop `{` | `(` | Closing bracket; top is `{` → match ✓ |
| 6 | `)` | Pop `(` | *(empty)* | Closing bracket; top is `(` → match ✓ |

Stack is empty after all characters → **VALID** ✅

### Invalid string: `"({[}])"`

| Step | Character | Action | Stack State | Notes |
|------|-----------|--------|-------------|-------|
| 1 | `(` | Push | `(` | Opening bracket → push |
| 2 | `{` | Push | `( {` | Opening bracket → push |
| 3 | `[` | Push | `( { [` | Opening bracket → push |
| 4 | `}` | Pop `[` | — | Closing bracket; top is `[`, expected `]` → **MISMATCH** ✗ |

**Failure at step 4**: The character `}` expects to close a `{`, but the top of the stack is `[`. The innermost open bracket `[` was never closed before attempting to close `{`. → **INVALID** ❌

---

## Worked Example: Monotonic Stack — Next Greater Element

**Problem**: Given `arr = [2, 1, 5, 6, 2, 3]`, find for each element the next element to its right that is strictly greater. If none exists, the answer is `-1`.

**Algorithm**: Maintain a stack of **indices** whose elements have not yet found their next greater element. The stack stays **monotonically decreasing** in value. When a new element `arr[i]` is larger than `arr[stack.top()]`, pop and record the answer.

**Initial state**: `result = [-1, -1, -1, -1, -1, -1]`, stack = `[]`

| Step | Element `arr[i]` | Stack Before (indices) | Action | Stack After (indices) | Result Array Update |
|------|-----------------|------------------------|--------|-----------------------|---------------------|
| i=0 | `2` | `[]` | Push 0 (no larger element seen yet) | `[0]` | no change |
| i=1 | `1` | `[0]` | `arr[0]=2 > 1` → no pop; Push 1 | `[0, 1]` | no change |
| i=2 | `5` | `[0, 1]` | `arr[1]=1 < 5` → pop 1: **result[1]=5**; `arr[0]=2 < 5` → pop 0: **result[0]=5**; Push 2 | `[2]` | `result = [5, 5, -1, -1, -1, -1]` |
| i=3 | `6` | `[2]` | `arr[2]=5 < 6` → pop 2: **result[2]=6**; Push 3 | `[3]` | `result = [5, 5, 6, -1, -1, -1]` |
| i=4 | `2` | `[3]` | `arr[3]=6 > 2` → no pop; Push 4 | `[3, 4]` | no change |
| i=5 | `3` | `[3, 4]` | `arr[4]=2 < 3` → pop 4: **result[4]=3**; `arr[3]=6 > 3` → no pop; Push 5 | `[3, 5]` | `result = [5, 5, 6, -1, 3, -1]` |
| end | — | `[3, 5]` | Remaining indices 3, 5 have no next greater → result stays `-1` | `[]` | `result = [5, 5, 6, -1, 3, -1]` |

**Final result**: `[5, 5, 6, -1, 3, -1]`

Meaning:
- `arr[0]=2` → next greater is `5` (at index 2)
- `arr[1]=1` → next greater is `5` (at index 2)
- `arr[2]=5` → next greater is `6` (at index 3)
- `arr[3]=6` → no next greater → `-1`
- `arr[4]=2` → next greater is `3` (at index 5)
- `arr[5]=3` → no next greater → `-1`

### Why this is O(n)

Each element (index) is **pushed onto the stack exactly once** and **popped from the stack at most once**. The total number of push + pop operations across the entire algorithm is therefore bounded by `2n`. Even though there is a nested `while` loop, its total iterations over the entire run cannot exceed `n`. This gives **O(n)** time overall, not O(n²).
