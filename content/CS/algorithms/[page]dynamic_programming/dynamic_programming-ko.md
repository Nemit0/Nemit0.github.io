---
title: "동적 프로그래밍"
description: "동적 프로그래밍 기초 — 최적 부분 구조, 중복 부분 문제, 하향식 vs 상향식, 고전 DP 문제 (배낭, LCS, LIS, 동전 교환, 그리드 경로)."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "동적 프로그래밍", "DP", "메모이제이션", "최적화"]
author: "Nemit"
featured: false
pinned: false
---

# 동적 프로그래밍

## 동적 프로그래밍이란?

**동적 프로그래밍(DP)**은 복잡한 문제를 중복되는 부분 문제로 나누고, 결과를 저장하여 중복 계산을 피하는 방법입니다.

### 두 가지 필수 속성

1. **최적 부분 구조**: 최적해가 부분 문제의 최적해를 포함
2. **중복 부분 문제**: 같은 부분 문제가 여러 번 풀림

이 속성들이 있으면 DP는 지수적 풀이를 다항적으로 변환할 수 있습니다.

```
DP 없이 피보나치:    O(2^n)    — 지수적
DP로 피보나치:       O(n)      — 선형
```

---

## 하향식 vs 상향식

### 하향식 (메모이제이션)

원래 문제에서 시작하여 부분 문제로 재귀하고, 결과를 캐시합니다.

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
```

딕셔너리로 명시적 구현:

```python
def fib(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
```

### 상향식 (테이블 채우기)

가장 작은 부분 문제부터 해를 구축합니다. 재귀 대신 테이블(배열)을 사용합니다.

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

### 공간 최적화

마지막 몇 값만 필요할 때, O(n)에서 O(1)로 줄일 수 있습니다:

```python
def fib(n):
    if n <= 1:
        return n
    prev2, prev1 = 0, 1
    for _ in range(2, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    return prev1
```

### 비교

| 측면 | 하향식 | 상향식 |
|---|---|---|
| 접근법 | 재귀 + 캐시 | 반복 + 테이블 |
| 계산 범위 | 필요한 부분 문제만 | 모든 부분 문제 |
| 스택 | O(깊이) 재귀 스택 | 재귀 없음 |
| 코딩 난이도 | 종종 더 직관적 | 신중한 순서 필요 가능 |
| 공간 최적화 | 어려움 | 더 쉬움 |

---

## DP 문제 해결 프레임워크

1. **상태 정의**: `dp[i]` (또는 `dp[i][j]`)가 무엇을 나타내는지?
2. **점화식 찾기**: `dp[i]`가 더 작은 부분 문제와 어떻게 관련되는지?
3. **기저 조건 설정**: 자명하게 알려진 값은?
4. **계산 순서 결정**: 의존성이 먼저 계산되는지 확인
5. **공간 최적화** (롤링 배열, 필요한 행만 유지)

---

## 고전 DP 문제

### 1. 계단 오르기

1 또는 2칸 오를 수 있습니다. 정상에 도달하는 방법의 수는?

```python
# dp[i] = i번째 계단에 도달하는 방법 수
# dp[i] = dp[i-1] + dp[i-2]
# 이것은 피보나치와 같습니다!

def climb_stairs(n):
    if n <= 2:
        return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    return prev1
```

**시간**: O(n), **공간**: O(1)

### 2. 동전 교환

주어진 금액을 만드는 최소 동전 수를 찾습니다.

```python
# dp[i] = 금액 i를 만드는 최소 동전 수
# dp[i] = min(dp[i - coin] + 1) 각 동전에 대해

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

### 동전 교환 2 — 방법 수 세기

```python
# dp[i] = 금액 i를 만드는 방법 수
def coin_change_ways(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1

    for coin in coins:            # 각 동전 유형 처리
        for i in range(coin, amount + 1):
            dp[i] += dp[i - coin]

    return dp[amount]
```

동전을 외부 루프에서 반복하면 순열이 아닌 조합만 세게 됩니다.

### 3. 최장 공통 부분 수열 (LCS)

두 문자열의 공통인 가장 긴 부분 수열의 길이를 찾습니다.

```python
# dp[i][j] = text1[:i]와 text2[:j]의 LCS
# text1[i-1] == text2[j-1]이면: dp[i][j] = dp[i-1][j-1] + 1
# 아니면: dp[i][j] = max(dp[i-1][j], dp[i][j-1])

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

**시간**: O(m × n), **공간**: O(m × n), O(min(m, n))으로 최적화 가능

### 4. 최장 증가 부분 수열 (LIS)

순증가하는 가장 긴 부분 수열의 길이를 찾습니다.

```python
# O(n²) DP 풀이
# dp[i] = 인덱스 i에서 끝나는 LIS의 길이
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

#### O(n log n) 이진 탐색 풀이

```python
import bisect

def lis_fast(nums):
    tails = []    # tails[i] = 길이 i+1인 증가 부분수열의 최소 마지막 값

    for num in nums:
        pos = bisect.bisect_left(tails, num)
        if pos == len(tails):
            tails.append(num)
        else:
            tails[pos] = num

    return len(tails)
```

### 5. 0/1 배낭 문제

무게와 가치가 있는 물건들에서 용량을 초과하지 않으면서 가치를 최대화합니다.

```python
# dp[i][w] = 처음 i개 물건으로 용량 w에서의 최대 가치
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i - 1][w]    # 안 가져감
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i][w],
                               dp[i - 1][w - weights[i - 1]] + values[i - 1])

    return dp[n][capacity]
```

#### 공간 최적화 0/1 배낭

```python
def knapsack_optimized(weights, values, capacity):
    dp = [0] * (capacity + 1)

    for i in range(len(weights)):
        for w in range(capacity, weights[i] - 1, -1):    # 역순!
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])

    return dp[capacity]
```

같은 물건을 두 번 사용하지 않기 위해 용량을 **역순**으로 순회합니다.

### 무한 배낭

각 물건을 무제한 사용 가능. 용량을 **정순**으로 순회:

```python
def unbounded_knapsack(weights, values, capacity):
    dp = [0] * (capacity + 1)

    for i in range(len(weights)):
        for w in range(weights[i], capacity + 1):    # 정순
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])

    return dp[capacity]
```

### 6. 그리드 경로

왼쪽 상단에서 오른쪽 하단까지의 경로 수 (오른쪽 또는 아래로만 이동).

```python
# dp[i][j] = 셀 (i, j)까지의 경로 수
# dp[i][j] = dp[i-1][j] + dp[i][j-1]

def unique_paths(m, n):
    dp = [[1] * n for _ in range(m)]

    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1]

    return dp[m - 1][n - 1]
```

#### 장애물이 있는 경우

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

### 7. 최소 경로 합

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

### 8. 편집 거리 (레벤슈타인 거리)

한 문자열을 다른 문자열로 변환하는 최소 삽입, 삭제, 치환 횟수.

```python
# dp[i][j] = word1[:i]와 word2[:j] 간의 편집 거리
def edit_distance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i    # 모두 삭제
    for j in range(n + 1):
        dp[0][j] = j    # 모두 삽입

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]    # 연산 불필요
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],       # 삭제
                    dp[i][j - 1],       # 삽입
                    dp[i - 1][j - 1]    # 치환
                )

    return dp[m][n]

# edit_distance("kitten", "sitting") = 3
# kitten → sitten → sittin → sitting
```

### 9. 최장 회문 부분 수열

```python
# dp[i][j] = s[i:j+1]에서 최장 회문 부분 수열의 길이
def lps(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]

    for i in range(n):
        dp[i][i] = 1

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])

    return dp[0][n - 1]
```

### 10. 행렬 체인 곱셈

행렬 곱셈을 최적으로 괄호화하는 방법을 찾습니다.

```python
# dp[i][j] = 행렬 i부터 j까지 계산하는 최소 곱셈 수
def matrix_chain(dims):
    n = len(dims) - 1
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
```

---

## DP 문자열 문제

| 문제 | 점화식 | 시간 |
|---|---|---|
| LCS | 일치 → 대각+1, 아니면 max(위, 왼) | O(m×n) |
| 편집 거리 | 일치 → 대각, 아니면 1+min(위, 왼, 대각) | O(m×n) |
| 최장 회문 부분수열 | 일치 → 안쪽+2, 아니면 max(축소) | O(n²) |
| 최장 공통 부분문자열 | 일치 → 대각+1, 아니면 0 | O(m×n) |
| 고유 부분수열 수 | 일치 → 대각+위, 아니면 위 | O(m×n) |

---

## DP 패턴 요약

| 패턴 | 상태 | 예시 |
|---|---|---|
| 선형 | `dp[i]` | 계단 오르기, 집 도둑 |
| 두 수열 | `dp[i][j]` | LCS, 편집 거리 |
| 구간 | `dp[i][j]` 범위 | 행렬 체인, 회문 |
| 배낭 | `dp[i][w]` | 0/1 배낭, 동전 교환 |
| 그리드 | `dp[i][j]` 좌표 | 고유 경로, 최소 경로 합 |
| 비트마스크 | `dp[mask]` | TSP, 할당 문제 |
| 트리 | `dp[node]` | 트리 지름, 집 도둑 III |
| 자릿수 | `dp[pos][tight][...]` | 속성을 가진 숫자 세기 |

### DP 문제 인식하기

다음과 같으면 DP 가능성이 높습니다:
- **최적** (최소/최대) 또는 **개수**를 묻는 문제
- 각 단계에서 **선택**이 있음
- 브루트포스가 지수적
- 중복 부분 문제가 있음
- 키워드: "최소 비용", "최대 이익", "방법의 수", "도달할 수 있는가"
