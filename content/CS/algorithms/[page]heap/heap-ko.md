---
title: "힙"
description: "힙 자료구조 — 이진 힙, 최소 힙과 최대 힙, 배열 표현, 힙ify, 힙 정렬, 그리고 주요 힙 문제 구현."
date: "2026-03-06"
category: "CS/algorithms"
tags: ["algorithms", "heap", "data structures", "priority queue", "binary heap", "heap sort"]
author: "Nemit"
featured: false
pinned: false
---

# 힙

## 힙 — 순서 있는 완전 이진 트리

**힙(Heap)**은 **힙 속성(heap property)**을 만족하는 **완전 이진 트리(complete binary tree)**입니다.

- **최소 힙(Min-Heap)**: 모든 부모 노드가 두 자식 노드 이하입니다. 루트에 **최솟값**이 위치합니다.
- **최대 힙(Max-Heap)**: 모든 부모 노드가 두 자식 노드 이상입니다. 루트에 **최댓값**이 위치합니다.

**완전 이진 트리**는 마지막 레벨을 제외한 모든 레벨이 꽉 차 있고, 마지막 레벨의 노드는 왼쪽부터 채워집니다.

### 최소 힙 vs 최대 힙

```
최소 힙:                     최대 힙:

        1                           9
      /   \                       /   \
     2     3                     7     8
    / \   / \                   / \   / \
   4   5 6   7                 3   4 5   6
```

최소 힙에서는 모든 부모가 자식보다 작고, 최대 힙에서는 모든 부모가 자식보다 큽니다.

### 배열 표현

힙은 평탄한 배열로 저장됩니다 — 포인터가 필요 없습니다. 인덱스 `i`의 노드에 대해:

```
parent(i)  = (i - 1) // 2
left(i)    = 2 * i + 1
right(i)   = 2 * i + 2
```

```
트리:                        배열 인덱스 매핑:

        1  (0)           인덱스: [0] [1] [2] [3] [4] [5] [6]
      /     \             값:   [ 1,  2,  3,  4,  5,  6,  7]
    2 (1)  3 (2)
   /  \   /  \
 4(3) 5(4) 6(5) 7(6)
```

인덱스 관계:
- 인덱스 `1`의 노드 (값 2): 부모 = 인덱스 `0`, 자식 = 인덱스 `3`과 `4`
- 인덱스 `2`의 노드 (값 3): 부모 = 인덱스 `0`, 자식 = 인덱스 `5`와 `6`
- 인덱스 `3~6`은 리프 노드: `(2*3+1) = 7`은 크기 7 배열에서 범위 초과

이 배열 구조는 캐시 친화적이며 포인터 오버헤드를 피할 수 있습니다.

---

## 연산

| 연산 | 시간 | 비고 |
|---|---|---|
| `insert(x)` | O(log n) | 추가 후 위로 올리기(sift up) |
| `extract_min()` / `extract_max()` | O(log n) | 루트를 마지막 원소로 교체 후 아래로 내리기(sift down) |
| `peek()` | O(1) | `heap[0]` 읽기 |
| `heapify(array)` | O(n) | 정렬되지 않은 배열로부터 힙 구성 |
| `heap_sort()` | O(n log n) | 힙ify 후 반복적으로 추출 |

---

## 구현 — 최소 힙 직접 구현

```python
class MinHeap:
    def __init__(self):
        self.heap = []

    def size(self):
        return len(self.heap)

    def peek(self):
        if not self.heap:
            raise IndexError("힙이 비어 있습니다")
        return self.heap[0]           # 최솟값은 항상 루트에 있음

    def insert(self, val):
        self.heap.append(val)         # 끝에 추가
        self._sift_up(len(self.heap) - 1)   # 위쪽으로 힙 속성 복원

    def extract_min(self):
        if not self.heap:
            raise IndexError("힙이 비어 있습니다")
        if len(self.heap) == 1:
            return self.heap.pop()

        min_val = self.heap[0]
        self.heap[0] = self.heap.pop()  # 마지막 원소를 루트로 이동
        self._sift_down(0)              # 아래쪽으로 힙 속성 복원
        return min_val

    def _sift_up(self, i):
        # 힙 속성이 만족될 때까지 원소를 위로 올림
        while i > 0:
            parent = (i - 1) // 2
            if self.heap[i] < self.heap[parent]:
                self.heap[i], self.heap[parent] = self.heap[parent], self.heap[i]
                i = parent
            else:
                break

    def _sift_down(self, i):
        # 힙 속성이 만족될 때까지 원소를 아래로 내림
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
                break                  # 이미 올바른 위치

            self.heap[i], self.heap[smallest] = self.heap[smallest], self.heap[i]
            i = smallest

    def heapify(self, array):
        # 임의 배열로부터 O(n)에 힙 구성
        self.heap = array[:]
        # 마지막 비리프 노드부터 시작하여 각 노드를 아래로 내림
        for i in range(len(self.heap) // 2 - 1, -1, -1):
            self._sift_down(i)
```

### 최대 힙 변형

최대 힙은 `_sift_up`과 `_sift_down`의 비교 방향만 바꾸면 됩니다.

```python
class MaxHeap:
    def __init__(self):
        self.heap = []

    def size(self):
        return len(self.heap)

    def peek(self):
        if not self.heap:
            raise IndexError("힙이 비어 있습니다")
        return self.heap[0]

    def insert(self, val):
        self.heap.append(val)
        self._sift_up(len(self.heap) - 1)

    def extract_max(self):
        if not self.heap:
            raise IndexError("힙이 비어 있습니다")
        if len(self.heap) == 1:
            return self.heap.pop()

        max_val = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._sift_down(0)
        return max_val

    def _sift_up(self, i):
        while i > 0:
            parent = (i - 1) // 2
            if self.heap[i] > self.heap[parent]:   # 방향 반전: > 사용
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

            if left < n and self.heap[left] > self.heap[largest]:   # 방향 반전
                largest = left
            if right < n and self.heap[right] > self.heap[largest]: # 방향 반전
                largest = right

            if largest == i:
                break

            self.heap[i], self.heap[largest] = self.heap[largest], self.heap[i]
            i = largest
```

---

## 왜 힙ify는 O(n)인가, O(n log n)이 아니라

`insert`를 n번 호출하면 O(n log n)입니다. 하지만 **바텀업 힙ify** 알고리즘은 O(n)입니다.

**직관**: 대부분의 노드는 트리 아래쪽에 있어 `_sift_down`이 매우 적은 작업을 합니다. 루트만 끝까지 내려갈 수 있고, 대부분의 노드는 리프에서 1~2레벨 안에 있습니다.

**수학적 근거**:

높이 `h`에서, 완전 이진 트리는 최대 `⌈n / 2^(h+1)⌉`개의 노드를 가지며, 각 노드는 최대 `h`번 내려갑니다.

```
총 작업량 = Σ (h=0 to log n)  ⌈n / 2^(h+1)⌉ * h

          ≤ n * Σ (h=0 to ∞)  h / 2^h

          = n * 2        (등비급수 공식: Σ h/2^h = 2)

          = O(n)
```

핵심 아이디어: `n/2`개의 리프(h=0, 작업 없음), `n/4`개의 h=1 노드(최대 1번 교환), `n/8`개의 h=2 노드(최대 2번 교환) 등, 이 합은 선형으로 수렴합니다.

---

## 힙 정렬

힙 정렬은 최대 힙을 사용하여 제자리에서 정렬합니다.

1. 배열로부터 최대 힙을 O(n)에 구성
2. 최댓값을 반복적으로 추출: 루트(최댓값)를 정렬되지 않은 마지막 원소와 교환하고, 힙 크기를 1 줄인 뒤 새 루트를 아래로 내림

```
초기 배열: [4, 10, 3, 5, 1]

힙ify 후:
        10
       /  \
      5    3
     / \
    4   1
배열: [10, 5, 3, 4, 1]

1단계 — 최댓값(10) 추출:
  heap[0]와 heap[4] 교환: [1, 5, 3, 4, | 10]
  인덱스 0에서 sift down, 힙 크기 = 4:
        5
       / \
      4   3
     /
    1
  배열: [5, 4, 3, 1, | 10]

2단계 — 최댓값(5) 추출:
  heap[0]와 heap[3] 교환: [1, 4, 3, | 5, 10]
  sift down, 힙 크기 = 3:
  배열: [4, 1, 3, | 5, 10]

3단계 — 최댓값(4) 추출:
  heap[0]와 heap[2] 교환: [3, 1, | 4, 5, 10]
  sift down, 힙 크기 = 2:
  배열: [3, 1, | 4, 5, 10]

4단계 — 최댓값(3) 추출:
  heap[0]와 heap[1] 교환: [1, | 3, 4, 5, 10]
  힙 크기 = 1, 완료.

정렬 결과: [1, 3, 4, 5, 10]
```

### 구현

```python
def heap_sort(arr):
    n = len(arr)

    # 1단계: 최대 힙 구성 (바텀업)
    for i in range(n // 2 - 1, -1, -1):
        _sift_down_max(arr, n, i)

    # 2단계: 원소를 하나씩 추출
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]   # 현재 루트(최댓값)를 정렬된 끝으로 이동
        _sift_down_max(arr, i, 0)          # 줄어든 힙에서 힙 속성 복원

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

**시간**: O(n log n) — 힙ify에 O(n), 각 추출에 O(log n) × n번.
**공간**: O(1) — 제자리 정렬.

### 다른 정렬 알고리즘과 비교

| 알고리즘 | 최선 | 평균 | 최악 | 공간 | 안정성 |
|---|---|---|---|---|---|
| 힙 정렬 | O(n log n) | O(n log n) | O(n log n) | O(1) | 불안정 |
| 병합 정렬 | O(n log n) | O(n log n) | O(n log n) | O(n) | 안정 |
| 퀵 정렬 | O(n log n) | O(n log n) | O(n²) | O(log n) | 불안정 |
| 팀 정렬 (Python) | O(n) | O(n log n) | O(n log n) | O(n) | 안정 |

힙 정렬은 보장된 성능에도 불구하고 실제로는 잘 쓰이지 않습니다. 배열 접근이 선형 스캔이 아니라 여기저기 뛰어다녀 캐시 성능이 나쁘기 때문입니다.

---

## Python `heapq` 모듈

Python은 `heapq` 모듈을 통해 최소 힙을 제공합니다. 모든 연산은 일반 `list`에 적용됩니다.

```python
import heapq

# --- 힙 구성 ---
nums = [5, 3, 8, 1, 2]
heapq.heapify(nums)          # O(n), 리스트를 제자리에서 변환 → [1, 2, 8, 3, 5]

# --- 삽입 ---
heapq.heappush(nums, 0)      # O(log n), 0 삽입 → [0, 2, 1, 3, 5, 8]

# --- 최솟값 추출 ---
heapq.heappop(nums)          # O(log n) → 0 반환

# --- 최솟값 확인 (제거 없음) ---
nums[0]                       # O(1), 힙을 변경하지 않음

# --- 원자적 push + pop (별도 호출보다 효율적) ---
heapq.heappushpop(nums, 4)   # 4를 push한 후 최솟값을 pop하여 반환
heapq.heapreplace(nums, 4)   # 최솟값을 pop하여 반환한 후 4를 push
                              # heapreplace는 더 빠르지만 힙이 비면 예외 발생

# --- N개 최대/최소 ---
heapq.nlargest(3, nums)      # 가장 큰 3개 원소 (내림차순 정렬)
heapq.nsmallest(3, nums)     # 가장 작은 3개 원소 (오름차순 정렬)
```

### 최대 힙 트릭

Python의 `heapq`는 최소 힙만 지원합니다. **값을 음수로 저장**하면 최대 힙을 흉내 낼 수 있습니다.

```python
import heapq

max_heap = []
heapq.heappush(max_heap, -5)
heapq.heappush(max_heap, -3)
heapq.heappush(max_heap, -8)

max_val = -heapq.heappop(max_heap)    # 8 (읽을 때 다시 부호 반전)

# 리스트의 경우:
nums = [5, 3, 8, 1, 2]
max_heap = [-x for x in nums]
heapq.heapify(max_heap)
largest = -heapq.heappop(max_heap)    # 8
```

### 튜플을 이용한 사용자 정의 우선순위

`heapq`는 튜플을 사전순으로 비교합니다. `(우선순위, 항목)` 쌍을 사용하세요.

```python
import heapq

pq = []
heapq.heappush(pq, (3, "낮은 우선순위 작업"))
heapq.heappush(pq, (1, "높은 우선순위 작업"))
heapq.heappush(pq, (2, "중간 우선순위 작업"))

priority, task = heapq.heappop(pq)    # (1, "높은 우선순위 작업")

# 항목이 자연적으로 비교 불가능한 경우 (예: 사용자 정의 객체)
# (우선순위, 동점 처리, 항목) 형태로 비교 오류 방지:
import itertools
counter = itertools.count()
heapq.heappush(pq, (1, next(counter), some_object))
```

### `heapq` vs `sorted()` vs 직접 구현 사용 기준

| 상황 | 권장 방법 |
|---|---|
| 대용량 스트림에서 상위 k개 추출 | `heapq.nsmallest` / `nlargest` |
| 삽입과 최소/최대 추출이 교대로 반복 | `heapq` |
| 전체 리스트를 한 번만 정렬 | `sorted()` 또는 `list.sort()` |
| 최솟값과 최댓값을 동시에 필요 | 두 힙 (중앙값 문제 참조) |
| 성능이 중요한 많은 push/pop 작업 | `heapq` (C로 구현, 매우 빠름) |

---

## 힙 문제

### 1. 배열에서 K번째 큰 원소

**문제**: 정렬되지 않은 배열에서 k번째로 큰 원소를 찾으세요.

**접근**: **크기 k의 최소 힙**을 유지합니다. 루트가 k번째로 큰 원소가 됩니다.

```python
import heapq

def find_kth_largest(nums, k):
    heap = []

    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)    # 가장 작은 값 제거 — 상위 k개만 유지

    return heap[0]    # 루트가 k번째로 큰 원소 (상위 k개 중 최솟값)

# nums = [3, 2, 1, 5, 6, 4], k = 2 → 5
# nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4 → 4
```

**시간**: O(n log k) — n개의 원소 각각이 크기 ≤ k인 힙에서 push/pop됩니다.
**공간**: O(k)

### 2. 상위 K개 빈도 원소

**문제**: 배열에서 가장 자주 등장하는 k개의 원소를 반환하세요.

```python
import heapq
from collections import Counter

def top_k_frequent(nums, k):
    count = Counter(nums)                           # {원소: 빈도수}

    # (빈도수, 원소)로 구성된 크기 k의 최소 힙
    heap = []
    for num, freq in count.items():
        heapq.heappush(heap, (freq, num))
        if len(heap) > k:
            heapq.heappop(heap)                     # 빈도수가 가장 낮은 것 제거

    return [num for freq, num in heap]

# [1,1,1,2,2,3], k=2 → [1, 2]
```

**시간**: O(n log k), **공간**: O(n) (카운터) + O(k) (힙).

### 3. K개 정렬 리스트 병합

**문제**: k개의 정렬된 배열을 하나의 정렬된 배열로 병합하세요.

**접근**: 각 리스트의 첫 번째 원소로 최소 힙을 초기화합니다. 가장 작은 값을 추출하고, 해당 리스트의 다음 원소를 추가합니다.

```python
import heapq

def merge_k_sorted(lists):
    heap = []

    # 각 리스트의 첫 원소로 힙 초기화: (값, 리스트_인덱스, 원소_인덱스)
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))

    result = []
    while heap:
        val, list_idx, elem_idx = heapq.heappop(heap)
        result.append(val)

        # 같은 리스트의 다음 원소를 push
        next_idx = elem_idx + 1
        if next_idx < len(lists[list_idx]):
            heapq.heappush(heap, (lists[list_idx][next_idx], list_idx, next_idx))

    return result

# [[1,4,7], [2,5,8], [3,6,9]] → [1,2,3,4,5,6,7,8,9]
```

**시간**: O(n log k) (n = 전체 원소 수, k = 리스트 수).
**공간**: O(k) (힙).

### 4. 데이터 스트림에서 중앙값 찾기

**문제**: 숫자를 하나씩 추가하면서 언제든지 중앙값을 계산할 수 있는 자료구조를 설계하세요.

**접근**: 두 개의 힙을 유지합니다:
- `lower`: 작은 절반을 저장하는 최대 힙 (음수로 변환하여 구현)
- `upper`: 큰 절반을 저장하는 최소 힙

불변식: `len(lower) == len(upper)` 또는 `len(lower) == len(upper) + 1`.

```python
import heapq

class MedianFinder:
    def __init__(self):
        self.lower = []    # 최대 힙 (음수 저장) — 작은 절반
        self.upper = []    # 최소 힙 — 큰 절반

    def add_num(self, num):
        # lower에 먼저 push (음수로 변환하여 최대 힙처럼 사용)
        heapq.heappush(self.lower, -num)

        # 균형 조정: lower의 최댓값 ≤ upper의 최솟값 보장
        if self.lower and self.upper and (-self.lower[0] > self.upper[0]):
            val = -heapq.heappop(self.lower)
            heapq.heappush(self.upper, val)

        # 크기 균형: lower는 upper보다 최대 1개 더 많을 수 있음
        if len(self.lower) > len(self.upper) + 1:
            val = -heapq.heappop(self.lower)
            heapq.heappush(self.upper, val)
        elif len(self.upper) > len(self.lower):
            val = heapq.heappop(self.upper)
            heapq.heappush(self.lower, -val)

    def find_median(self):
        if len(self.lower) > len(self.upper):
            return -self.lower[0]              # 홀수 개: 중앙값은 lower의 top
        return (-self.lower[0] + self.upper[0]) / 2.0   # 짝수 개: 두 중간값의 평균

# mf = MedianFinder()
# mf.add_num(1) → lower=[-1], upper=[]   → 중앙값 = 1
# mf.add_num(2) → lower=[-1], upper=[2]  → 중앙값 = 1.5
# mf.add_num(3) → lower=[-2,-1], upper=[3] → 중앙값 = 2
```

**시간**: `add_num`마다 O(log n), `find_median`은 O(1).

### 5. 작업 스케줄러

**문제**: 작업 목록(A~Z로 표시)과 대기 시간 `n`이 주어질 때, 모든 작업을 완료하는 데 필요한 최소 시간을 구하세요. 같은 작업은 `n`구간 간격을 두어야 합니다.

**접근**: 남은 작업 중 가장 빈도가 높은 것을 우선 스케줄링합니다. 최대 힙으로 작업 횟수를 관리하고, 대기 큐로 냉각 중인 작업을 추적합니다.

```python
import heapq
from collections import Counter, deque

def least_interval(tasks, n):
    count = Counter(tasks)
    max_heap = [-c for c in count.values()]   # 최대 힙을 위해 음수로 변환
    heapq.heapify(max_heap)

    time = 0
    wait_queue = deque()    # (음수_횟수, 재사용_가능_시각)

    while max_heap or wait_queue:
        time += 1

        if max_heap:
            cnt = 1 + heapq.heappop(max_heap)  # 작업 1회 수행 (cnt가 음수이므로 +1은 크기를 줄임)
            if cnt < 0:                         # 남은 작업 있음
                wait_queue.append((cnt, time + n))

        # 냉각 시간이 끝난 작업 재추가
        if wait_queue and wait_queue[0][1] == time:
            heapq.heappush(max_heap, wait_queue.popleft()[0])

    return time

# tasks = ["A","A","A","B","B","B"], n = 2 → 8
# 스케줄: A B _ A B _ A B  (8 슬롯)
```

**시간**: 힙 연산은 전체 작업 수 N과 고유 작업 수 m에 대해 O(N log m), 루프 반복은 아이들 포함 전체 스케줄 길이 T(= 반환값)에 대해 O(T).

### 6. 다익스트라 최단 경로

**문제**: 가중치 그래프(비음수 가중치)에서 출발 노드로부터 모든 다른 노드까지의 최단 경로를 구하세요.

**접근**: 최소 힙을 우선순위 큐로 사용합니다. 방문하지 않은 노드 중 알려진 거리가 가장 짧은 노드를 항상 먼저 처리합니다.

```python
import heapq
from collections import defaultdict

def dijkstra(graph, source):
    # graph: {노드: [(이웃, 가중치), ...]}
    dist = defaultdict(lambda: float('inf'))
    dist[source] = 0

    heap = [(0, source)]    # (거리, 노드)

    while heap:
        d, u = heapq.heappop(heap)

        if d > dist[u]:
            continue    # 오래된 항목 — 이미 더 짧은 경로 발견

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

**시간**: O((V + E) log V), **공간**: O(V + E).

---

## 풀이 예제: 삽입과 추출 — 단계별 추적

`[5, 3, 8, 1, 2, 7]`을 빈 최소 힙에 하나씩 삽입한 후, 최솟값을 두 번 추출합니다.

### 삽입

**5 삽입** — 힙이 비어 있으므로 그냥 추가:
```
배열: [5]
트리:    5
```

**3 삽입** — 인덱스 1에 추가, sift up: parent(1) = 0, heap[1]=3 < heap[0]=5 → 교환
```
배열: [3, 5]       (sift up 후: 3이 5와 교환)
트리:    3
        /
       5
```

**8 삽입** — 인덱스 2에 추가, sift up: parent(2) = 0, heap[2]=8 ≥ heap[0]=3 → 교환 없음
```
배열: [3, 5, 8]
트리:    3
        / \
       5   8
```

**1 삽입** — 인덱스 3에 추가, sift up:
- parent(3) = 1, heap[3]=1 < heap[1]=5 → 교환 → 배열: [3, 1, 8, 5]
- parent(1) = 0, heap[1]=1 < heap[0]=3 → 교환 → 배열: [1, 3, 8, 5]

```
배열: [1, 3, 8, 5]
트리:      1
          / \
         3   8
        /
       5
```

**2 삽입** — 인덱스 4에 추가, sift up:
- parent(4) = 1, heap[4]=2 < heap[1]=3 → 교환 → 배열: [1, 2, 8, 5, 3]
- parent(1) = 0, heap[1]=2 ≥ heap[0]=1 → 중단

```
배열: [1, 2, 8, 5, 3]
트리:      1
          / \
         2   8
        / \
       5   3
```

**7 삽입** — 인덱스 5에 추가, sift up:
- parent(5) = 2, heap[5]=7 < heap[2]=8 → 교환 → 배열: [1, 2, 7, 5, 3, 8]
- parent(2) = 0, heap[2]=7 ≥ heap[0]=1 → 중단

```
배열: [1, 2, 7, 5, 3, 8]
트리:        1
           /   \
          2     7
         / \   /
        5   3 8
```

### 삽입 추적 표

| 단계 | 삽입 | 추가 후 배열 | Sift-Up 교환 | 최종 배열 |
|------|------|------------|-------------|---------|
| 1 | 5 | `[5]` | 없음 | `[5]` |
| 2 | 3 | `[5, 3]` | i=1 ↔ i=0 (3<5) | `[3, 5]` |
| 3 | 8 | `[3, 5, 8]` | 없음 (8≥3) | `[3, 5, 8]` |
| 4 | 1 | `[3, 5, 8, 1]` | i=3↔i=1 (1<5), i=1↔i=0 (1<3) | `[1, 3, 8, 5]` |
| 5 | 2 | `[1, 3, 8, 5, 2]` | i=4↔i=1 (2<3) | `[1, 2, 8, 5, 3]` |
| 6 | 7 | `[1, 2, 8, 5, 3, 7]` | i=5↔i=2 (7<8) | `[1, 2, 7, 5, 3, 8]` |

### 추출

**최솟값 추출 #1** from `[1, 2, 7, 5, 3, 8]`:
1. 루트 저장: `min_val = 1`
2. 마지막 원소를 루트로 이동: `[8, 2, 7, 5, 3]` (마지막 8 제거)
3. 인덱스 0에서 sift down:
   - 자식: 왼쪽=2 (인덱스 1), 오른쪽=7 (인덱스 2); 최소 자식 = 2 (인덱스 1)
   - heap[0]=8 > 2 → 교환 → `[2, 8, 7, 5, 3]`
   - 인덱스 1에서: 자식 5 (인덱스 3), 3 (인덱스 4); 최소 = 3 (인덱스 4)
   - heap[1]=8 > 3 → 교환 → `[2, 3, 7, 5, 8]`
   - 인덱스 4: 자식 없음 → 완료
4. 반환: `1`

```
추출 후 배열: [2, 3, 7, 5, 8]
트리:        2
           /   \
          3     7
         / \
        5   8
```

**최솟값 추출 #2** from `[2, 3, 7, 5, 8]`:
1. 루트 저장: `min_val = 2`
2. 마지막 원소를 루트로 이동: `[8, 3, 7, 5]`
3. 인덱스 0에서 sift down:
   - 자식: 3 (인덱스 1), 7 (인덱스 2); 최소 = 3 (인덱스 1)
   - heap[0]=8 > 3 → 교환 → `[3, 8, 7, 5]`
   - 인덱스 1에서: 자식 5 (인덱스 3), 오른쪽 자식 없음; 8 > 5 → 교환 → `[3, 5, 7, 8]`
   - 인덱스 3: 자식 없음 → 완료
4. 반환: `2`

```
추출 후 배열: [3, 5, 7, 8]
트리:      3
          / \
         5   7
        /
       8
```

### 추출 추적 표

| 단계 | 연산 | 이전 배열 | 동작 | 이후 배열 | 반환값 |
|------|------|---------|------|---------|-------|
| 1 | extract_min | `[1, 2, 7, 5, 3, 8]` | 루트←마지막(8), sift down: 0↔1, 1↔4 | `[2, 3, 7, 5, 8]` | `1` |
| 2 | extract_min | `[2, 3, 7, 5, 8]` | 루트←마지막(8), sift down: 0↔1, 1↔3 | `[3, 5, 7, 8]` | `2` |

---

## 풀이 예제: 힙ify — 단계별 추적

**목표**: 정렬되지 않은 배열 `[9, 4, 7, 2, 8, 1, 5]`를 바텀업 힙ify로 최소 힙으로 변환합니다.

**배열 인덱스와 초기 트리**:
```
인덱스: [0] [1] [2] [3] [4] [5] [6]
값:    [ 9,  4,  7,  2,  8,  1,  5]

트리:
          9  (0)
        /     \
      4 (1)   7 (2)
     /  \    /  \
   2(3) 8(4) 1(5) 5(6)
```

마지막 비리프 인덱스 = `n // 2 - 1 = 7 // 2 - 1 = 2`. 인덱스 2, 1, 0 순서로 sift down합니다.

**1단계 — sift_down(2)**: 노드 7, 자식: 1 (인덱스 5), 5 (인덱스 6). 최소 자식 = 1.
- 7 > 1 → 인덱스 2와 5 교환 → `[9, 4, 1, 2, 8, 7, 5]`

```
          9
        /     \
       4       1     ← 인덱스 5에서 1이 올라옴
     /  \    /  \
    2    8  7    5   ← 7이 인덱스 5로 내려감
```

**2단계 — sift_down(1)**: 노드 4, 자식: 2 (인덱스 3), 8 (인덱스 4). 최소 자식 = 2.
- 4 > 2 → 인덱스 1과 3 교환 → `[9, 2, 1, 4, 8, 7, 5]`
- 인덱스 3 (노드 4)에서: 자식 없음 (2*3+1=7 ≥ n=7) → 완료

```
          9
        /     \
       2       1     ← 2가 올라옴
     /  \    /  \
    4    8  7    5   ← 4가 내려감
```

**3단계 — sift_down(0)**: 노드 9, 자식: 2 (인덱스 1), 1 (인덱스 2). 최소 자식 = 1.
- 9 > 1 → 인덱스 0과 2 교환 → `[1, 2, 9, 4, 8, 7, 5]`
- 인덱스 2 (노드 9)에서: 자식 7 (인덱스 5), 5 (인덱스 6). 최소 = 5.
- 9 > 5 → 인덱스 2와 6 교환 → `[1, 2, 5, 4, 8, 7, 9]`
- 인덱스 6: 자식 없음 → 완료

```
          1
        /     \
       2       5
     /  \    /  \
    4    8  7    9
```

### 힙ify 추적 표

| 단계 | 연산 | 교환 | 이후 배열 |
|------|------|------|---------|
| 초기 | — | — | `[9, 4, 7, 2, 8, 1, 5]` |
| sift_down(2) | 7 vs 자식(1,5): 최소=1 | 인덱스 2 ↔ 인덱스 5 | `[9, 4, 1, 2, 8, 7, 5]` |
| sift_down(1) | 4 vs 자식(2,8): 최소=2 | 인덱스 1 ↔ 인덱스 3 | `[9, 2, 1, 4, 8, 7, 5]` |
| sift_down(0) 1패스 | 9 vs 자식(2,1): 최소=1 | 인덱스 0 ↔ 인덱스 2 | `[1, 2, 9, 4, 8, 7, 5]` |
| sift_down(0) 2패스 | 9 vs 자식(7,5): 최소=5 | 인덱스 2 ↔ 인덱스 6 | `[1, 2, 5, 4, 8, 7, 9]` |

**최종 힙**: `[1, 2, 5, 4, 8, 7, 9]` — 유효한 최소 힙 ✓

검증: 모든 부모 ≤ 자식:
- `heap[0]=1` ≤ `heap[1]=2` ✓ 그리고 ≤ `heap[2]=5` ✓
- `heap[1]=2` ≤ `heap[3]=4` ✓ 그리고 ≤ `heap[4]=8` ✓
- `heap[2]=5` ≤ `heap[5]=7` ✓ 그리고 ≤ `heap[6]=9` ✓

---

## 비교

| 자료구조 | 삽입 | 최소/최대 삭제 | 검색 | 최솟/최댓값 확인 | 용도 |
|---|---|---|---|---|---|
| 최소/최대 힙 | O(log n) | O(log n) | O(n) | O(1) | 우선순위 큐, 스케줄링, 다익스트라 |
| BST (균형) | O(log n) | O(log n) | O(log n) | O(log n) | 순서 있는 순회, 범위 쿼리 |
| 정렬된 배열 | O(n) | O(n) | O(log n) | O(1) | 정적 데이터, 이진 탐색 |
| 정렬되지 않은 배열 | O(1) | O(n) | O(n) | O(n) | 추가 위주 작업 |
