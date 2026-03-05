---
title: "재귀와 백트래킹"
description: "재귀 기초 — 기저 조건, 호출 스택, 꼬리 재귀, 메모이제이션, 분할 정복, 백트래킹 알고리즘과 고전 문제들."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "재귀", "백트래킹", "분할 정복", "메모이제이션"]
author: "Nemit"
featured: false
pinned: false
---

# 재귀와 백트래킹

## 재귀란?

함수가 **자기 자신을 호출**하면 재귀적입니다. 모든 재귀 함수에는 다음이 필요합니다:

1. **기저 조건 (Base case)**: 재귀를 멈추는 조건
2. **재귀 조건 (Recursive case)**: 더 작은/간단한 입력으로 자기 자신을 호출
3. **기저 조건으로의 진행**: 각 호출이 기저 조건에 가까워져야 함

```python
def factorial(n):
    if n <= 1:        # 기저 조건
        return 1
    return n * factorial(n - 1)    # 재귀 조건

# factorial(4)
# = 4 * factorial(3)
# = 4 * 3 * factorial(2)
# = 4 * 3 * 2 * factorial(1)
# = 4 * 3 * 2 * 1
# = 24
```

---

## 호출 스택

각 재귀 호출은 호출 스택에 **스택 프레임**을 생성하여 지역 변수와 반환 주소를 저장합니다.

```
factorial(4)
├── factorial(3)          # 스택: [4, 3]
│   ├── factorial(2)      # 스택: [4, 3, 2]
│   │   ├── factorial(1)  # 스택: [4, 3, 2, 1]
│   │   │   └── return 1  # 기저 조건
│   │   └── return 2 * 1 = 2
│   └── return 3 * 2 = 6
└── return 4 * 6 = 24
```

**스택 오버플로**는 재귀가 너무 깊을 때 발생합니다. Python의 기본 제한은 ~1000 프레임입니다 (`sys.setrecursionlimit()`으로 변경 가능).

### 스택 프레임 내용

각 프레임에 저장되는 것:
- 함수 매개변수
- 지역 변수
- 반환 주소 (반환 후 계속할 위치)
- 저장된 레지스터

따라서 추가 자료구조를 만들지 않아도 재귀는 **O(깊이)** 공간을 사용합니다.

---

## 재귀 패턴

### 1. 선형 재귀

호출당 하나의 재귀 호출. O(n) 호출, O(n) 스택 공간.

```python
# 배열 합계
def array_sum(arr, n):
    if n == 0:
        return 0
    return arr[n - 1] + array_sum(arr, n - 1)

# 문자열 뒤집기
def reverse(s):
    if len(s) <= 1:
        return s
    return reverse(s[1:]) + s[0]

# 거듭제곱: x^n
def power(x, n):
    if n == 0:
        return 1
    return x * power(x, n - 1)
```

### 2. 이진 재귀 (두 번 호출)

호출당 두 개의 재귀 호출. 최적화 없이는 O(2^n)으로 이어집니다.

```python
# 피보나치 — O(2^n) 시간, O(n) 공간
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# n=5의 호출 트리:
#                    fib(5)
#                /          \
#           fib(4)          fib(3)
#          /     \         /     \
#      fib(3)  fib(2)  fib(2)  fib(1)
```

많은 중복 부분 문제 — 메모이제이션과 동적 프로그래밍으로 이어집니다.

### 3. 분할 정복

문제를 부분 문제로 나누고, 재귀적으로 풀고, 결과를 합칩니다.

```python
# 이진 탐색 (재귀)
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

# 빠른 거듭제곱: x^n을 O(log n)으로
def fast_power(x, n):
    if n == 0:
        return 1
    if n % 2 == 0:
        half = fast_power(x, n // 2)
        return half * half
    else:
        return x * fast_power(x, n - 1)
```

---

## 꼬리 재귀

재귀 호출이 함수의 **마지막 연산**이면 꼬리 재귀입니다 — 재귀 호출 반환 후 아무 일도 일어나지 않습니다.

```python
# 꼬리 재귀가 아님 — 재귀 호출 후 곱셈 수행
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)    # 반환 후 곱셈 필요

# 꼬리 재귀 — 누적기가 결과를 보유
def factorial_tail(n, acc=1):
    if n <= 1:
        return acc
    return factorial_tail(n - 1, acc * n)    # 이 호출 후 아무것도 없음
```

**꼬리 호출 최적화(TCO)**는 꼬리 재귀를 루프로 변환하여 O(1) 스택 공간을 사용합니다. 많은 언어가 지원하지만 (Scheme, Haskell, Scala), **Python은 지원하지 않습니다** — 스택 깊이가 문제될 때 명시적 루프를 사용하세요.

---

## 메모이제이션

비용이 큰 재귀 호출의 결과를 캐시하여 중복 계산을 피합니다.

```python
# 메모이제이션 없이: O(2^n)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

# 메모이제이션 적용: O(n)
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

# functools.lru_cache 사용
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_cached(n):
    if n <= 1:
        return n
    return fib_cached(n - 1) + fib_cached(n - 2)
```

### 메모이제이션 조건

메모이제이션이 효과적인 조건:
1. **중복 부분 문제**: 같은 부분 문제가 여러 번 풀림
2. **최적 부분 구조**: 최적해가 최적 부분해로 구성됨

이것은 동적 프로그래밍에 필요한 조건과 동일합니다. 메모이제이션은 "하향식" 접근, DP 테이블은 "상향식" 접근입니다.

---

## 재귀 vs 반복

| 측면 | 재귀 | 반복 |
|---|---|---|
| 가독성 | 트리/그래프 문제에 더 직관적 | 단순 루프에 적합 |
| 공간 | O(깊이) 스택 공간 | 일반적으로 O(1) |
| 성능 | 함수 호출 오버헤드 | 일반적으로 더 빠름 |
| 스택 오버플로 | 깊은 재귀에서 위험 | 위험 없음 |
| 상태 관리 | 호출 스택을 통해 암묵적 | 변수를 통해 명시적 |

**경험 법칙**: 문제가 자연스러운 재귀 구조를 가질 때 (트리, 그래프, 분할 정복) 재귀를 사용하고, 깊이가 무한하거나 성능이 중요할 때 반복으로 변환합니다.

### 재귀를 반복으로 변환

모든 재귀는 명시적 스택을 사용하여 반복으로 변환할 수 있습니다:

```python
# 재귀 DFS
def dfs_recursive(node, visited):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs_recursive(neighbor, visited)

# 명시적 스택을 사용한 반복 DFS
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

## 백트래킹

**백트래킹**은 후보를 점진적으로 구축하고, 유효하지 않다고 판단되면 후보를 포기("백트래킹")하여 모든 가능한 해를 체계적으로 탐색하는 방법입니다.

### 일반적인 백트래킹 템플릿

```python
def backtrack(candidate, state):
    if is_solution(candidate):
        output(candidate)
        return

    for next_choice in get_choices(state):
        if is_valid(next_choice, state):
            make_choice(next_choice, state)        # 선택
            backtrack(candidate, state)             # 탐색
            undo_choice(next_choice, state)         # 선택 취소 (백트래킹)
```

### 1. 순열

n개 요소의 모든 배열을 생성합니다.

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
            path.pop()    # 백트래킹

    backtrack([], nums)
    return result

# permutations([1, 2, 3])
# → [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
```

**시간**: O(n × n!) — n!개 순열, 각각 복사에 O(n).

### 2. 부분집합 (멱집합)

2^n개의 모든 부분집합을 생성합니다.

```python
def subsets(nums):
    result = []

    def backtrack(start, path):
        result.append(path[:])    # 모든 경로가 유효한 부분집합

        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()

    backtrack(0, [])
    return result
```

### 3. 조합

n에서 k개 선택 (순서 무관).

```python
def combinations(n, k):
    result = []

    def backtrack(start, path):
        if len(path) == k:
            result.append(path[:])
            return

        # 가지치기: (k - len(path))개 더 필요
        for i in range(start, n - (k - len(path)) + 2):
            path.append(i)
            backtrack(i + 1, path)
            path.pop()

    backtrack(1, [])
    return result
```

### 4. N-Queens

n×n 체스판에 n개의 퀸을 서로 공격하지 않도록 배치합니다.

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

            cols.add(col)
            diag1.add(row - col)
            diag2.add(row + col)
            board[row] = '.' * col + 'Q' + '.' * (n - col - 1)

            backtrack(row + 1)

            cols.remove(col)
            diag1.remove(row - col)
            diag2.remove(row + col)
            board[row] = '.' * n

    backtrack(0)
    return results
```

### 5. 스도쿠 풀기

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
                            board[i][j] = '.'    # 백트래킹
                    return False
        return True
```

### 6. 단어 검색

2D 그리드에서 가로/세로로 이동하며 단어가 존재하는지 찾습니다.

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
        board[r][c] = '#'    # 방문 표시

        found = (backtrack(r + 1, c, idx + 1) or
                 backtrack(r - 1, c, idx + 1) or
                 backtrack(r, c + 1, idx + 1) or
                 backtrack(r, c - 1, idx + 1))

        board[r][c] = temp    # 복원 (백트래킹)
        return found

    for i in range(rows):
        for j in range(cols):
            if backtrack(i, j, 0):
                return True
    return False
```

---

## 가지치기 전략

가지치기는 가지를 일찍 잘라내어 백트래킹을 효율적으로 만듭니다.

| 전략 | 설명 | 예시 |
|---|---|---|
| 제약 검사 | 유효하지 않은 선택을 즉시 건너뜀 | N-Queens: 공격받는 칸 건너뜀 |
| 한계 검사 | 최선의 가능한 결과가 현재 최선보다 나쁘면 중단 | 분기 한정법 |
| 대칭 깨기 | 동등한 구성 회피 | 첫 퀸을 왼쪽 절반에만 |
| 순서 휴리스틱 | 가장 제약이 큰 선택을 먼저 시도 | 스도쿠: 선택지 가장 적은 칸 |
| 메모이제이션 | 부분 문제 결과 캐시 | 그리드 경로 세기 |

---

## 고전 재귀 문제

| 문제 | 시간 | 공간 | 기법 |
|---|---|---|---|
| 팩토리얼 | O(n) | O(n) | 선형 재귀 |
| 피보나치 | O(n) 메모이즈 | O(n) | 메모이제이션 |
| 하노이 탑 | O(2^n) | O(n) | 이진 재귀 |
| 이진 탐색 | O(log n) | O(log n) | 분할 정복 |
| 병합 정렬 | O(n log n) | O(n) | 분할 정복 |
| 순열 | O(n × n!) | O(n) | 백트래킹 |
| 부분집합 | O(n × 2^n) | O(n) | 백트래킹 |
| N-Queens | O(n!) | O(n) | 백트래킹 + 가지치기 |
| 스도쿠 | O(9^(빈칸수)) | O(1) | 백트래킹 + 가지치기 |

### 하노이 탑

```python
def hanoi(n, source, target, auxiliary):
    if n == 1:
        print(f"원판 1을 {source}에서 {target}으로 이동")
        return

    hanoi(n - 1, source, auxiliary, target)
    print(f"원판 {n}을 {source}에서 {target}으로 이동")
    hanoi(n - 1, auxiliary, target, source)

# hanoi(3, 'A', 'C', 'B')
# 최소 이동 횟수: 2^n - 1
```

---

## 풀이 예제: 4×4 N-퀸 문제

4×4 보드에는 정확히 **2가지 해**가 존재합니다. 백트래킹 탐색 전체를 추적하여 알고리즘이 두 해를 어떻게 찾는지 살펴봅니다.

### 설정

```
열(Column): 0   1   2   3
           --- --- --- ---
행(Row) 0: |   |   |   |   |
행(Row) 1: |   |   |   |   |
행(Row) 2: |   |   |   |   |
행(Row) 3: |   |   |   |   |
```

충돌을 O(1)에 감지하기 위해 세 가지 집합을 관리합니다:
- **`cols`** — 이미 퀸이 놓인 열 인덱스
- **`diag1`** — `행 - 열` 값 (왼쪽 위 → 오른쪽 아래 대각선 `\`)
- **`diag2`** — `행 + 열` 값 (오른쪽 위 → 왼쪽 아래 대각선 `/`)

두 퀸이 `행 - 열` 또는 `행 + 열` 값을 공유하면 같은 대각선에 있습니다.

---

### 1단계: col 0 시도 → 막힘

**행 0, col 0 시도** ✓  
`(0,0)`에 퀸 배치.  
`cols={0}`, `diag1={0}`, `diag2={0}`

**행 1:**
- col 0 → col 0 ∈ `cols` ✗ (같은 열)
- col 1 → `diag1`: 1−1 = **0** ∈ `diag1` ✗ ((0,0)과 같은 `\` 대각선)
- col 2 → 모든 검사 통과 ✓ → `(1,2)`에 퀸 배치  
  `cols={0,2}`, `diag1={0,−1}`, `diag2={0,3}`

**행 2 ((0,0)과 (1,2)에 퀸 있음):**
- col 0 → col 0 ∈ `cols` ✗
- col 1 → `diag2`: 2+1 = **3** ∈ `diag2` ✗ ((1,2)과 같은 `/` 대각선)
- col 2 → col 2 ∈ `cols` ✗
- col 3 → `diag1`: 2−3 = **−1** ∈ `diag1` ✗ ((1,2)과 같은 `\` 대각선)

4개 열 모두 가지치기됨 → **백트래킹**, `(1,2)` 취소.

**행 1 (이어서 col 3):**
- col 3 → 모든 검사 통과 ✓ → `(1,3)`에 퀸 배치  
  `cols={0,3}`, `diag1={0,−2}`, `diag2={0,4}`

**행 2 ((0,0)과 (1,3)에 퀸 있음):**
- col 0 → col 0 ∈ `cols` ✗
- col 1 → 모든 검사 통과 ✓ → `(2,1)`에 퀸 배치  
  `cols={0,1,3}`, `diag1={0,−2,1}`, `diag2={0,4,3}`

**행 3 ((0,0), (1,3), (2,1)에 퀸 있음):**
- col 0 → col 0 ∈ `cols` ✗
- col 1 → col 1 ∈ `cols` ✗
- col 2 → `diag1`: 3−2 = **1** ∈ `diag1` ✗ ((2,1)과 같은 `\` 대각선)
- col 3 → col 3 ∈ `cols` ✗

4개 열 모두 가지치기됨 → **백트래킹**, `(2,1)` 취소.

**행 2 (이어서):**
- col 2 → `diag1`: 2−2 = **0** ∈ `diag1` ✗ ((0,0)과 같은 `\` 대각선)
- col 3 → col 3 ∈ `cols` ✗

모든 열 가지치기됨 → **백트래킹**, `(1,3)` 취소.

행 1 선택지 소진 → **백트래킹**, `(0,0)` 취소.

---

### 2단계: 첫 번째 해 — 행 0에서 col 1

**행 0, col 1 시도** ✓  
`(0,1)`에 퀸 배치.  
`cols={1}`, `diag1={−1}`, `diag2={1}`

**행 1:**
- col 0 → `diag2`: 1+0 = **1** ∈ `diag2` ✗ ((0,1)과 같은 `/` 대각선)
- col 1 → col 1 ∈ `cols` ✗
- col 2 → `diag1`: 1−2 = **−1** ∈ `diag1` ✗ ((0,1)과 같은 `\` 대각선)
- col 3 → 모든 검사 통과 ✓ → `(1,3)`에 퀸 배치  
  `cols={1,3}`, `diag1={−1,−2}`, `diag2={1,4}`

**행 2:**
- col 0 → `diag1`: 2−0 = **2** ∉ `diag1`, `diag2`: 2+0 = **2** ∉ `diag2`, col 0 ∉ `cols` ✓  
  `(2,0)`에 퀸 배치.  
  `cols={0,1,3}`, `diag1={−1,−2,2}`, `diag2={1,4,2}`

**행 3:**
- col 0 → col 0 ∈ `cols` ✗
- col 1 → col 1 ∈ `cols` ✗
- col 2 → `diag1`: 3−2 = **1** ∉ `diag1`, `diag2`: 3+2 = **5** ∉ `diag2`, col 2 ∉ `cols` ✓  
  `(3,2)`에 퀸 배치.  
  `cols={0,1,2,3}` — 4개 행 모두 완료!

🎉 **첫 번째 해 발견:** `[(0,1), (1,3), (2,0), (3,2)]`

```
. Q . .
. . . Q
Q . . .
. . Q .
```

---

### 3단계: 두 번째 해 — 행 0에서 col 2

첫 번째 해를 기록한 후, 알고리즘은 완전히 백트래킹하여 행 0을 이어갑니다:

**행 0, col 2 시도** ✓  
`(0,2)`에 퀸 배치.  
`cols={2}`, `diag1={−2}`, `diag2={2}`

**행 1:**
- col 0 → `diag1`: 1−0 = **1** ∉ `diag1`, `diag2`: 1+0 = **1** ∉ `diag2`, col 0 ∉ `cols` ✓  
  `(1,0)`에 퀸 배치.  
  `cols={0,2}`, `diag1={−2,1}`, `diag2={2,1}`

**행 2:**
- col 0 → col 0 ∈ `cols` ✗
- col 1 → `diag1`: 2−1 = **1** ∈ `diag1` ✗ ((1,0)과 같은 `\` 대각선)
- col 2 → col 2 ∈ `cols` ✗
- col 3 → 모든 검사 통과 ✓ → `(2,3)`에 퀸 배치  
  `cols={0,2,3}`, `diag1={−2,1,−1}`, `diag2={2,1,5}`

**행 3:**
- col 0 → col 0 ∈ `cols` ✗
- col 1 → `diag1`: 3−1 = **2** ∉ `diag1`, `diag2`: 3+1 = **4** ∉ `diag2`, col 1 ∉ `cols` ✓  
  `(3,1)`에 퀸 배치.  
  `cols={0,1,2,3}` — 4개 행 모두 완료!

🎉 **두 번째 해 발견:** `[(0,2), (1,0), (2,3), (3,1)]`

```
. . Q .
Q . . .
. . . Q
. Q . .
```

---

### 정리

**4-퀸 문제에는 정확히 2가지 해가 있습니다.**

| 해 | 퀸 배치 순서 | 보드 행 |
|---|---|---|
| 1 | (0,1) → (1,3) → (2,0) → (3,2) | `. Q . .` / `. . . Q` / `Q . . .` / `. . Q .` |
| 2 | (0,2) → (1,0) → (2,3) → (3,1) | `. . Q .` / `Q . . .` / `. . . Q` / `. Q . .` |

두 해는 수직 중심축을 기준으로 서로 거울 대칭 관계입니다.

### 가지치기가 강력한 이유

무차별 탐색(brute force)은 제약 없이 각 행에서 모든 열을 시도합니다:

```
4 선택 × 4 선택 × 4 선택 × 4 선택 = 4⁴ = 256가지 후보 조합
```

백트래킹은 충돌이 감지되는 즉시 해당 열을 제거합니다 — 보통 1~2개의 퀸을 놓은 후에 결정됩니다. 예를 들어 `(0,1)`에 퀸이 있을 때 행 1의 4개 열을 평가하면 3개가 즉시 가지치기되어 col 3만 재귀 탐색 대상이 됩니다.

| 루트 선택 | 결과 |
|---|---|
| 행 0, col 0 | 막힘 — 해 없음 |
| 행 0, col 1 | ✓ 첫 번째 해 발견 |
| 행 0, col 2 | ✓ 두 번째 해 발견 |
| 행 0, col 3 | 막힘 (col 0과 대칭) |

백트래킹 알고리즘은 두 해를 모두 찾는 데 약 **~20개 노드**만 방문합니다. 무차별 탐색의 **256개**와 비교하면 약 **12배 감소**입니다. N=8에서 무차별 탐색이 8⁸ = 16,777,216개의 조합을 검토해야 하는 반면, 가지치기가 포함된 백트래킹은 수천 개의 노드만 탐색하여 수십 배 이상의 속도 향상을 달성합니다.
