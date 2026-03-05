---
title: "스택과 큐"
description: "스택과 큐 자료구조 — 구현, 주요 문제 (균형 괄호, 단조 스택, 슬라이딩 윈도우), 우선순위 큐, 덱."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "스택", "큐", "자료구조", "단조 스택", "우선순위 큐"]
author: "Nemit"
featured: false
pinned: false
---

# 스택과 큐

## 스택 — LIFO (후입선출)

**스택**은 한쪽 끝(**Top**)에서만 삽입과 삭제가 가능합니다.

```
Push 1, 2, 3:

    |  3  | ← top
    |  2  |
    |  1  |
    +-----+

Pop → 3, 그 다음 2, 그 다음 1
```

### 연산

| 연산 | 시간 | 설명 |
|---|---|---|
| `push(x)` | O(1) | top에 요소 추가 |
| `pop()` | O(1) | top 요소 제거 후 반환 |
| `peek()`/`top()` | O(1) | 제거 없이 top 반환 |
| `isEmpty()` | O(1) | 스택이 비었는지 확인 |

### 구현

#### 배열 기반 스택

```python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)      # 분할 상환 O(1)

    def pop(self):
        if self.is_empty():
            raise IndexError("스택이 비어 있습니다")
        return self.items.pop()      # 분할 상환 O(1)

    def peek(self):
        if self.is_empty():
            raise IndexError("스택이 비어 있습니다")
        return self.items[-1]

    def is_empty(self):
        return len(self.items) == 0
```

#### 연결 리스트 기반 스택

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
            raise IndexError("스택이 비어 있습니다")
        val = self.head.val
        self.head = self.head.next
        self._size -= 1
        return val
```

### Python 내장 스택

```python
# 리스트를 스택으로 사용
stack = []
stack.append(1)      # push
stack.append(2)
stack.pop()          # 2

# collections.deque도 스택에 효율적
from collections import deque
stack = deque()
stack.append(1)      # push
stack.pop()          # 오른쪽에서 pop
```

---

## 큐 — FIFO (선입선출)

**큐**는 **뒤쪽(rear)**에서 삽입하고 **앞쪽(front)**에서 삭제합니다.

```
Enqueue 1, 2, 3:

Front → [1] [2] [3] ← Rear

Dequeue → 1, 그 다음 2, 그 다음 3
```

### 연산

| 연산 | 시간 | 설명 |
|---|---|---|
| `enqueue(x)` | O(1) | rear에 요소 추가 |
| `dequeue()` | O(1) | front 요소 제거 후 반환 |
| `front()`/`peek()` | O(1) | 제거 없이 front 반환 |
| `isEmpty()` | O(1) | 큐가 비었는지 확인 |

### 원형 배열 큐

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
            raise OverflowError("큐가 가득 찼습니다")
        self.rear = (self.rear + 1) % self.capacity
        self.queue[self.rear] = item
        self.size += 1

    def dequeue(self):
        if self.size == 0:
            raise IndexError("큐가 비어 있습니다")
        item = self.queue[self.front]
        self.front = (self.front + 1) % self.capacity
        self.size -= 1
        return item
```

### Python의 `deque`를 큐로 사용

```python
from collections import deque

queue = deque()
queue.append(1)       # enqueue (오른쪽 끝)
queue.append(2)
queue.popleft()       # dequeue (왼쪽 끝) → 1
```

**`list`를 큐로 사용하지 마세요**: `list.pop(0)`은 모든 요소를 이동시키므로 O(n)입니다. `deque.popleft()`는 O(1)입니다.

---

## 덱 — 양방향 큐

**덱(Deque)**은 **양쪽 끝**에서 O(1)으로 삽입과 삭제가 가능합니다.

```python
from collections import deque

d = deque()
d.append(1)          # 오른쪽: [1]
d.appendleft(0)      # 왼쪽: [0, 1]
d.append(2)          # [0, 1, 2]
d.popleft()          # 0, deque: [1, 2]
d.pop()              # 2, deque: [1]

# 크기 제한 덱
d = deque(maxlen=3)
d.extend([1, 2, 3])  # [1, 2, 3]
d.append(4)          # [2, 3, 4] — 왼쪽이 자동 제거
```

---

## 스택 문제

### 1. 균형 괄호

괄호가 올바르게 매칭되고 중첩되었는지 확인합니다.

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

# "({[]})" → True
# "({[}])" → False (불일치)
# "((("    → False (닫히지 않음)
```

### 2. 역폴란드 표기법 계산 (후위)

```python
def eval_rpn(tokens):
    stack = []
    ops = {
        '+': lambda a, b: a + b,
        '-': lambda a, b: a - b,
        '*': lambda a, b: a * b,
        '/': lambda a, b: int(a / b),
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

### 3. 최소 스택

`getMin()`을 O(1)으로 지원하는 스택.

```python
class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []    # 최소값 추적

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

### 4. 단조 스택

요소를 증가 또는 감소 순서로 유지하는 스택. **다음 큰/작은 요소**를 효율적으로 찾는 데 사용됩니다.

#### 다음 큰 요소

각 요소에 대해 오른쪽에서 첫 번째로 큰 요소를 찾습니다.

```python
def next_greater_element(arr):
    n = len(arr)
    result = [-1] * n
    stack = []    # 인덱스 저장

    for i in range(n):
        while stack and arr[i] > arr[stack[-1]]:
            idx = stack.pop()
            result[idx] = arr[i]
        stack.append(i)

    return result

# [4, 5, 2, 25, 7] → [5, 25, 25, -1, -1]
```

**시간**: O(n) — 각 요소가 최대 한 번 push/pop.

#### 히스토그램에서 가장 큰 직사각형

```python
def largest_rectangle(heights):
    stack = []    # 증가하는 높이의 인덱스
    max_area = 0
    heights.append(0)    # 남은 막대 처리용 보초값

    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    heights.pop()
    return max_area
```

### 5. 일일 온도

더 따뜻한 온도까지 며칠을 기다려야 하는지 찾습니다.

```python
def daily_temperatures(temperatures):
    n = len(temperatures)
    result = [0] * n
    stack = []

    for i in range(n):
        while stack and temperatures[i] > temperatures[stack[-1]]:
            prev = stack.pop()
            result[prev] = i - prev
        stack.append(i)

    return result

# [73, 74, 75, 71, 69, 72, 76, 73] → [1, 1, 4, 2, 1, 1, 0, 0]
```

---

## 큐 문제

### 1. 슬라이딩 윈도우 최대값

크기 k의 모든 윈도우에서 최대값을 찾습니다. **단조 덱**을 사용합니다.

```python
from collections import deque

def max_sliding_window(nums, k):
    dq = deque()    # 인덱스 저장, 앞쪽이 항상 최대
    result = []

    for i in range(len(nums)):
        # 윈도우 밖의 인덱스 제거
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # 뒤에서 더 작은 요소 제거 (최대가 될 수 없으므로)
        while dq and nums[dq[-1]] < nums[i]:
            dq.pop()

        dq.append(i)

        if i >= k - 1:
            result.append(nums[dq[0]])

    return result

# nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
# 결과: [3, 3, 5, 5, 6, 7]
```

**시간**: O(n) — 각 요소가 덱에 최대 한 번 추가/제거.

### 2. 두 스택으로 큐 구현

```python
class QueueFromStacks:
    def __init__(self):
        self.in_stack = []     # enqueue용
        self.out_stack = []    # dequeue용

    def enqueue(self, x):
        self.in_stack.append(x)

    def dequeue(self):
        if not self.out_stack:
            while self.in_stack:
                self.out_stack.append(self.in_stack.pop())
        return self.out_stack.pop()
```

연산당 **분할 상환 O(1)**: 각 요소가 스택 간에 최대 한 번 이동.

### 3. 두 큐로 스택 구현

```python
from collections import deque

class StackFromQueues:
    def __init__(self):
        self.q = deque()

    def push(self, x):
        self.q.append(x)
        # 새 요소가 앞에 오도록 회전
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())

    def pop(self):
        return self.q.popleft()
```

`push`는 O(n), `pop`은 O(1).

---

## 우선순위 큐 (힙)

**우선순위 큐**는 우선순위에 따라 요소를 꺼냅니다 (삽입 순서가 아님). **이진 힙**으로 구현합니다.

### 최소 힙 연산

| 연산 | 시간 |
|---|---|
| `insert(x)` | O(log n) |
| `extract_min()` | O(log n) |
| `peek_min()` | O(1) |
| `heapify(array)` | O(n) |

### Python `heapq` (최소 힙)

```python
import heapq

# 리스트에서 힙 생성
nums = [5, 3, 8, 1, 2]
heapq.heapify(nums)           # O(n), 제자리 → [1, 2, 8, 5, 3]

heapq.heappush(nums, 0)       # 삽입
heapq.heappop(nums)           # 최소값 추출 → 0

# 제거 없이 최소값 확인
nums[0]                        # 최소 요소

# N개 최대/최소
heapq.nlargest(3, nums)       # 가장 큰 3개
heapq.nsmallest(3, nums)      # 가장 작은 3개
```

### 최대 힙 트릭

Python은 최소 힙만 제공합니다. 최대 힙은 값을 음수로:

```python
import heapq

max_heap = []
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -3)
heapq.heappush(max_heap, -8)

max_val = -heapq.heappop(max_heap)    # 8
```

### 사용자 정의 우선순위

```python
import heapq

# 튜플 (우선순위, 항목) 사용
pq = []
heapq.heappush(pq, (3, "낮은 우선순위"))
heapq.heappush(pq, (1, "높은 우선순위"))
heapq.heappush(pq, (2, "중간 우선순위"))

priority, item = heapq.heappop(pq)    # (1, "높은 우선순위")
```

### Top K 요소

```python
import heapq

def top_k_frequent(nums, k):
    freq = {}
    for n in nums:
        freq[n] = freq.get(n, 0) + 1
    return heapq.nlargest(k, freq.keys(), key=freq.get)

# [1,1,1,2,2,3], k=2 → [1, 2]
```

### K개 정렬 리스트 병합

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
```

**시간**: O(n log k), n = 총 요소 수, k = 리스트 수.

---

## 비교

| 자료구조 | 삽입 | 삭제 | 접근 | 용도 |
|---|---|---|---|---|
| 스택 | O(1) push | O(1) pop | O(1) top | 되돌리기, 파싱, DFS |
| 큐 | O(1) enqueue | O(1) dequeue | O(1) front | BFS, 스케줄링 |
| 덱 | O(1) 양쪽 | O(1) 양쪽 | O(1) 양쪽 | 슬라이딩 윈도우 |
| 우선순위 큐 | O(log n) | O(log n) | O(1) min/max | 다익스트라, 스케줄링 |
| 단조 스택 | O(1) 분할상환 | O(1) 분할상환 | O(1) top | 다음 큰/작은 요소 |
