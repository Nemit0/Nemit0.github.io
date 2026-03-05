---
title: "정렬 알고리즘"
description: "비교 기반 및 비비교 정렬 알고리즘 — 버블, 선택, 삽입, 퀵, 병합, 힙, 계수, 기수 정렬의 분석, 구현, 장단점 비교."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "정렬", "퀵정렬", "병합정렬", "시간 복잡도"]
author: "Nemit"
featured: false
pinned: false
---

# 정렬 알고리즘

## 개요

| 알고리즘 | 최선 | 평균 | 최악 | 공간 | 안정 | 방식 |
|---|---|---|---|---|---|---|
| 버블 정렬 | O(n) | O(n²) | O(n²) | O(1) | 예 | 교환 |
| 선택 정렬 | O(n²) | O(n²) | O(n²) | O(1) | 아니오 | 선택 |
| 삽입 정렬 | O(n) | O(n²) | O(n²) | O(1) | 예 | 삽입 |
| 병합 정렬 | O(n log n) | O(n log n) | O(n log n) | O(n) | 예 | 분할 정복 |
| 퀵 정렬 | O(n log n) | O(n log n) | O(n²) | O(log n) | 아니오 | 분할 정복 |
| 힙 정렬 | O(n log n) | O(n log n) | O(n log n) | O(1) | 아니오 | 선택 |
| 계수 정렬 | O(n+k) | O(n+k) | O(n+k) | O(k) | 예 | 비비교 |
| 기수 정렬 | O(nk) | O(nk) | O(nk) | O(n+k) | 예 | 비비교 |

**안정(Stable)**: 동일한 값의 요소가 원래 상대적 순서를 유지하는 것.

---

## 버블 정렬

인접한 요소를 비교하여 순서가 잘못되면 교환합니다. 가장 큰 요소가 매 패스마다 올바른 위치로 "떠오릅니다".

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:    # 최적화: 교환이 없으면 정렬 완료
            break
```

```
패스 1: [5, 3, 8, 1, 2] → [3, 5, 1, 2, 8]   (8이 끝으로 이동)
패스 2: [3, 5, 1, 2, 8] → [3, 1, 2, 5, 8]   (5가 이동)
패스 3: [3, 1, 2, 5, 8] → [1, 2, 3, 5, 8]   (3이 이동)
```

- **최선 O(n)**: 이미 정렬된 경우 (조기 종료 시)
- **최악 O(n²)**: 역순 정렬된 경우
- 거의 정렬된 배열 감지 용도로만 실용적

---

## 선택 정렬

정렬되지 않은 부분에서 최솟값을 찾아 맨 앞과 교환합니다.

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

- 항상 O(n²) — 최선의 경우도 개선되지 않음
- 교환 횟수 최소 (최대 n-1회) — 쓰기 비용이 클 때 유용
- **비안정**: 교환 시 동일 값의 상대적 순서가 변할 수 있음

---

## 삽입 정렬

이미 정렬된 부분에 각 요소를 올바른 위치에 삽입하며 정렬된 배열을 구축합니다.

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

- **최선 O(n)**: 이미 정렬된 경우
- **소규모 배열에 효율적** (n < ~20-50)
- **거의 정렬된 데이터에 효율적** — O(n + d), d = 역전 수
- 하이브리드 정렬의 기본 케이스로 사용 (Timsort, Introsort)
- **온라인**: 데이터가 도착하는 대로 정렬 가능

---

## 병합 정렬

배열을 반으로 나누고, 재귀적으로 정렬한 후, 정렬된 반쪽들을 병합합니다.

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
        if left[i] <= right[j]:    # <=로 안정성 보장
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

- **항상 O(n log n)** — 입력에 관계없이 일정한 성능 보장
- **안정**: 동일 값의 상대적 순서 유지
- **O(n) 추가 공간** 필요
- **연결 리스트**에 적합 (병합이 O(1) 공간)
- **외부 정렬**의 기반 (메모리보다 큰 데이터 정렬)

### 자연 병합 정렬

입력에서 이미 정렬된 연속 구간(run)을 감지하여 불필요한 분할을 피합니다. **Timsort** (Python, Java)의 핵심 아이디어.

---

## 퀵 정렬

**피벗** 요소를 선택하고, 피벗보다 작은 요소는 왼쪽에, 큰 요소는 오른쪽에 배치한 후, 각 부분을 재귀적으로 정렬합니다.

```python
def quick_sort(arr, low, high):
    if low < high:
        pivot_idx = partition(arr, low, high)
        quick_sort(arr, low, pivot_idx - 1)
        quick_sort(arr, pivot_idx + 1, high)

def partition(arr, low, high):
    pivot = arr[high]          # 마지막 요소를 피벗으로 선택
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
```

- **평균 O(n log n)**, 최악 O(n²) (피벗이 항상 최솟값/최댓값일 때)
- **제자리 정렬**: O(log n) 스택 공간
- 실제 랜덤 데이터에서 가장 빠름 (좋은 캐시 지역성, 낮은 상수 계수)
- **비안정**

### 피벗 선택 전략

| 전략 | 설명 | 최악 |
|---|---|---|
| 마지막/첫 요소 | 가장 간단 | 정렬된 입력에서 O(n²) |
| 랜덤 요소 | 랜덤 위치와 교환 후 분할 | O(n²) 가능성 낮음 |
| 세 값의 중앙값 | 첫, 중간, 마지막의 중앙값 | O(n²) 드묾 |
| 중앙값의 중앙값 | 진정한 O(n) 중앙값 | O(n log n) 보장, 상수 큼 |

### 3-Way 분할 (네덜란드 국기 문제)

중복 요소가 많을 때 효율적으로 세 그룹(피벗보다 작은, 같은, 큰)으로 분할합니다.

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

## 힙 정렬

배열에서 최대 힙을 구성한 후, 최대값을 반복적으로 추출하여 끝에 배치합니다.

```python
def heap_sort(arr):
    n = len(arr)
    # 최대 힙 구축 (상향식)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)

    # 요소를 하나씩 추출
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]    # 최대값을 끝으로 이동
        heapify(arr, i, 0)                  # 축소된 힙에서 재정렬

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

- **항상 O(n log n)** — 최악의 경우 성능 저하 없음
- **제자리** (O(1) 추가 공간)
- **비안정**
- 캐시 지역성이 좋지 않음 — 실제로 퀵정렬보다 느림
- **O(1) 공간**으로 **O(n log n) 보장**이 필요할 때 유용

---

## 비비교 정렬

비교 기반 정렬의 O(n log n) 하한을 요소를 직접 비교하지 않음으로써 깨뜨립니다.

### 계수 정렬

각 값의 출현 횟수를 세어 정렬합니다. 알려진 범위의 정수에만 사용 가능.

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

- **O(n + k)** 시간과 공간, k = 값의 범위
- k = O(n)일 때 효율적
- k >> n일 때 비효율적 (예: 범위 0-10⁹의 10개 정수 정렬)

### 기수 정렬

자릿수별로 정렬 (LSD = 최하위 자릿수부터), 각 자릿수에 안정한 하위 정렬(주로 계수 정렬) 사용.

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

- **O(nk)**, k = 자릿수
- 안정
- 고정 너비 정수, 동일 길이 문자열에 적합

---

## 하이브리드 정렬 알고리즘

실제 구현에서는 하이브리드 방식을 사용합니다:

### Timsort (Python, Java)

- 병합 정렬 + 삽입 정렬
- 데이터의 자연적 run(이미 정렬된 연속 구간)을 감지
- 최선 O(n), 평균/최악 O(n log n)
- 안정, O(n) 공간

### Introsort (C++ `std::sort`)

- 퀵 정렬 + 힙 정렬 + 삽입 정렬
- 퀵정렬로 시작, 재귀 깊이가 2×log₂(n) 초과 시 힙정렬로 전환
- 작은 파티션(n < 16)에 삽입 정렬 사용
- 최악 O(n log n), 비안정

---

## 상황별 알고리즘 선택

| 상황 | 최적 선택 |
|---|---|
| 작은 배열 (n < 50) | 삽입 정렬 |
| 범용 | 퀵 정렬 (또는 라이브러리 정렬) |
| O(n log n) 보장 필요 | 병합 정렬 또는 힙 정렬 |
| 안정성 필요 | 병합 정렬 또는 Timsort |
| 거의 정렬된 데이터 | 삽입 정렬 또는 Timsort |
| 작은 범위의 정수 | 계수 정렬 |
| 고정 너비 정수/문자열 | 기수 정렬 |
| 연결 리스트 | 병합 정렬 |
| 외부 정렬 (디스크) | 병합 정렬 |
| 최소 추가 공간 | 힙 정렬 |

### 비교 정렬의 하한

비교 기반 정렬은 최악의 경우 최소 **Ω(n log n)** 비교를 수행해야 합니다. 결정 트리 분석으로 증명: n!개의 순열에 대해 이진 결정 트리는 최소 log₂(n!) ≈ n log n 높이가 필요합니다.

비비교 정렬(계수, 기수, 버킷)은 데이터의 구조를 활용하여 이 하한을 우회합니다.
