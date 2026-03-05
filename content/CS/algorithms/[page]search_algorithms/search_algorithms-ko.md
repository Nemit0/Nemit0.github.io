---
title: "탐색 알고리즘 (이진 탐색, BFS, DFS)"
description: "기본 탐색 알고리즘 — 선형 탐색, 이진 탐색과 변형, 그래프/트리 순회를 위한 BFS와 DFS, 복잡도 분석과 구현."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "이진 탐색", "BFS", "DFS", "그래프", "트리", "탐색"]
author: "Nemit"
featured: false
pinned: false
---

# 탐색 알고리즘

## 선형 탐색

요소를 하나씩 순서대로 검사합니다. 정렬 여부에 관계없이 모든 컬렉션에서 동작합니다.

```python
def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1
```

- **O(n)** 시간, O(1) 공간
- 정렬되지 않은 데이터에 사용할 수 있는 유일한 방법
- 작은 컬렉션에 최적 (캐시 친화적인 순차 접근)

---

## 이진 탐색

**정렬된** 배열에서 탐색 범위를 반복적으로 반으로 줄여 검색합니다.

```python
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = low + (high - low) // 2    # 정수 오버플로 방지
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

```
배열: [1, 3, 5, 7, 9, 11, 13, 15]
목표: 9

단계 1: low=0, high=7, mid=3 → arr[3]=7 < 9 → low=4
단계 2: low=4, high=7, mid=5 → arr[5]=11 > 9 → high=4
단계 3: low=4, high=4, mid=4 → arr[4]=9 = 9 → 인덱스 4에서 발견
```

- **O(log n)** 시간, O(1) 공간
- **전제 조건**: 배열이 정렬되어 있어야 함
- `mid = low + (high - low) // 2`로 정수 오버플로 방지

### 이진 탐색 변형

#### 첫 번째 출현 찾기 (Lower Bound)

```python
def lower_bound(arr, target):
    low, high = 0, len(arr)
    while low < high:
        mid = low + (high - low) // 2
        if arr[mid] < target:
            low = mid + 1
        else:
            high = mid
    return low    # arr[pos] >= target인 첫 번째 위치
```

#### 마지막 출현 찾기 (Upper Bound)

```python
def upper_bound(arr, target):
    low, high = 0, len(arr)
    while low < high:
        mid = low + (high - low) // 2
        if arr[mid] <= target:
            low = mid + 1
        else:
            high = mid
    return low    # arr[pos] > target인 첫 번째 위치
```

#### 답에 대한 이진 탐색

답이 단조적일 때 (x가 가능하면 x+1도 가능), 답의 범위에서 이진 탐색합니다:

```python
# 예: D일 이내에 화물을 운송할 최소 용량 찾기
def min_capacity(weights, D):
    low, high = max(weights), sum(weights)
    while low < high:
        mid = low + (high - low) // 2
        if can_ship(weights, D, mid):
            high = mid
        else:
            low = mid + 1
    return low
```

#### 실수에 대한 이진 탐색

```python
# 제곱근 구하기
def sqrt_binary(x, epsilon=1e-10):
    low, high = 0, max(1, x)
    while high - low > epsilon:
        mid = (low + high) / 2
        if mid * mid < x:
            low = mid
        else:
            high = mid
    return (low + high) / 2
```

### Off-by-One 함정

이진 탐색은 구현 오류가 발생하기 쉽습니다. 핵심 결정:

1. **`low <= high` vs `low < high`**: 정확한 일치 검색에는 `<=`, 경계 검색에는 `<` 사용
2. **`high = len(arr)` vs `len(arr) - 1`**: 경계 검색에는 `len(arr)` (반열린 구간)
3. **`mid + 1` vs `mid`**: 확인 후 항상 mid를 제외하여 무한 루프 방지

---

## 그래프 표현

### 인접 리스트

```python
# 비가중 그래프
graph = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 4],
    3: [1, 5],
    4: [1, 2, 5],
    5: [3, 4]
}

# 또는 defaultdict 사용
from collections import defaultdict
graph = defaultdict(list)
graph[0].append(1)
graph[1].append(0)
```

**공간**: O(V + E). 희소 그래프(E << V²)와 대부분의 실제 그래프에 적합.

### 인접 행렬

```python
matrix = [
    [0, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 0],
    [1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1],
    [0, 1, 1, 0, 0, 1],
    [0, 0, 0, 1, 1, 0]
]
```

**공간**: O(V²). 밀집 그래프, O(1) 간선 존재 확인에 적합.

---

## BFS — 너비 우선 탐색

현재 깊이의 모든 이웃을 먼저 탐색한 후 다음 깊이로 이동합니다. **큐**를 사용합니다.

```python
from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order
```

### BFS 특성

- **O(V + E)** 시간, O(V) 공간
- 비가중 그래프에서 **최단 경로** 탐색
- 레벨 단위로 탐색 (거리 1, 2, 3, ...)

### BFS 최단 경로

```python
def bfs_shortest_path(graph, start, end):
    visited = {start}
    queue = deque([(start, [start])])

    while queue:
        node, path = queue.popleft()
        if node == end:
            return path

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))

    return None    # 경로 없음
```

### BFS 활용

- 비가중 그래프의 **최단 경로**
- 트리의 **레벨 순서 순회**
- **연결 요소** 탐색
- 비방향 그래프의 **사이클 감지**
- **이분 그래프 확인** (2-색칠)
- **소셜 네트워크** — N 다리 내의 사람 찾기

---

## DFS — 깊이 우선 탐색

각 분기를 가능한 깊이까지 탐색한 후 백트래킹합니다. **스택** (또는 재귀)을 사용합니다.

### 재귀 DFS

```python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()

    visited.add(start)

    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)

    return visited
```

### 반복 DFS

```python
def dfs_iterative(graph, start):
    visited = set()
    stack = [start]
    order = []

    while stack:
        node = stack.pop()
        if node not in visited:
            visited.add(node)
            order.append(node)
            for neighbor in reversed(graph[node]):
                if neighbor not in visited:
                    stack.append(neighbor)

    return order
```

### DFS 특성

- **O(V + E)** 시간, O(V) 공간
- 깊이 우선으로 탐색, 그 후 백트래킹
- 일반적으로 최단 경로를 찾지 **않음**
- 자연스러운 재귀 구조

### DFS 활용

- **위상 정렬** (DAG 순서)
- **사이클 감지**
- **연결 요소 / 강한 연결 요소**
- **경로 존재 확인**
- **미로 탐색**
- **백트래킹 알고리즘** (N-Queens, 스도쿠)

---

## BFS vs DFS 비교

| 특성 | BFS | DFS |
|---|---|---|
| 자료구조 | 큐 | 스택 / 재귀 |
| 탐색 방식 | 레벨 단위 | 분기 단위 |
| 최단 경로 (비가중) | 예 | 아니오 |
| 공간 복잡도 | O(V) — 넓을 수 있음 | O(V) — 재귀 깊이 |
| 적합한 용도 | 최단 경로, 레벨 순서 | 위상 정렬, 사이클 감지 |
| 넓은 그래프 메모리 | 높음 | 낮음 |
| 깊은 그래프 메모리 | 낮음 | 높음 (스택 오버플로 위험) |

---

## 트리 순회

트리는 특수한 그래프입니다. 트리에서의 DFS는 세 가지 순서를 가집니다:

```
        1
       / \
      2   3
     / \   \
    4   5   6
```

### 중위 순회 (왼쪽, 루트, 오른쪽)

```python
def inorder(node):
    if node:
        inorder(node.left)
        print(node.val)      # 4, 2, 5, 1, 3, 6
        inorder(node.right)
```

**BST**에서: 정렬된 순서를 생성합니다.

### 전위 순회 (루트, 왼쪽, 오른쪽)

```python
def preorder(node):
    if node:
        print(node.val)      # 1, 2, 4, 5, 3, 6
        preorder(node.left)
        preorder(node.right)
```

용도: 직렬화, 트리 복사.

### 후위 순회 (왼쪽, 오른쪽, 루트)

```python
def postorder(node):
    if node:
        postorder(node.left)
        postorder(node.right)
        print(node.val)      # 4, 5, 2, 6, 3, 1
```

용도: 삭제 (자식을 부모보다 먼저 삭제), 수식 평가.

### 레벨 순서 순회 (BFS)

```python
def level_order(root):
    if not root:
        return
    queue = deque([root])
    while queue:
        node = queue.popleft()
        print(node.val)      # 1, 2, 3, 4, 5, 6
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
```

---

## 위상 정렬

DAG의 정점을 모든 간선 u→v에 대해 u가 v보다 앞에 오도록 정렬합니다.

### DFS 기반

```python
def topological_sort(graph, n):
    visited = [False] * n
    stack = []

    def dfs(node):
        visited[node] = True
        for neighbor in graph[node]:
            if not visited[neighbor]:
                dfs(neighbor)
        stack.append(node)

    for i in range(n):
        if not visited[i]:
            dfs(i)

    return stack[::-1]    # 완료 역순
```

### Kahn 알고리즘 (BFS 기반)

```python
from collections import deque

def topological_sort_bfs(graph, n):
    in_degree = [0] * n
    for u in range(n):
        for v in graph[u]:
            in_degree[v] += 1

    queue = deque([i for i in range(n) if in_degree[i] == 0])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != n:
        return None    # 사이클 감지
    return order
```

활용: 빌드 시스템 (Makefile), 수강 선수과목, 작업 스케줄링.

---

## 풀이 예제: 샘플 그래프에서의 BFS/DFS 추적

### 그래프 설정

```
A -- B -- D
|    |
C -- E -- F
```

**인접 리스트:**
- A: [B, C]
- B: [A, D, E]
- C: [A, E]
- D: [B]
- E: [B, C, F]
- F: [E]

```python
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'E'],
    'D': ['B'],
    'E': ['B', 'C', 'F'],
    'F': ['E'],
}
```

---

### A에서 시작하는 BFS 추적

BFS는 **큐** (FIFO)를 사용합니다. 노드를 방문할 때 방문하지 않은 이웃을 즉시 큐에 추가합니다.

```
초기 상태 — 큐: [A],  방문: {}
```

| 단계 | 방문 | 큐 (꺼낸 후 + 추가 후) | 방문 집합 |
|------|------|----------------------|----------|
| 1 | **A** | [B, C] | {A, B, C} |
| 2 | **B** | [C, D, E] | {A, B, C, D, E} |
| 3 | **C** | [D, E] | {A, B, C, D, E} |
| 4 | **D** | [E] | {A, B, C, D, E} |
| 5 | **E** | [F] | {A, B, C, D, E, F} |
| 6 | **F** | [] | {A, B, C, D, E, F} |

**단계별 메모:**
- 1단계: A 방문, 이웃 B와 C를 큐에 추가
- 2단계: B 방문, A는 이미 방문 — D, E를 큐에 추가
- 3단계: C 방문, A와 E는 이미 방문 집합에 있음 — 새로 추가 없음
- 4단계: D 방문, B는 이미 방문 — 새로 추가 없음
- 5단계: E 방문, B와 C는 이미 방문 — F를 큐에 추가
- 6단계: F 방문, E는 이미 방문 — 큐 비어 있음, 종료

**BFS 순회 순서: A → B → C → D → E → F**

BFS는 *레이어* 단위로 탐색합니다: A에서 거리 1인 노드(B, C), 거리 2인 노드(D, E), 거리 3인 노드(F) 순서.

---

### A에서 시작하는 DFS 추적

DFS는 **스택** (LIFO)을 사용합니다. 반복 구현에서는 이웃을 *역순*으로 push하여 첫 번째 이웃이 먼저 처리됩니다.

```
초기 상태 — 스택: [A],  방문: {}
```

| 단계 | pop | 동작 | push 후 스택 | 방문 집합 |
|------|-----|------|------------|----------|
| 1 | **A** | reversed([B,C]) 추가 → C, B push | [C, B] | {A} |
| 2 | **B** | reversed([A,D,E]) → A 방문됨, E, D push | [C, E, D] | {A, B} |
| 3 | **D** | reversed([B]) → B 방문됨, 추가 없음 | [C, E] | {A, B, D} |
| 4 | **E** | reversed([B,C,F]) → B 방문됨, F, C push | [C, F, C] | {A, B, D, E} |
| 5 | **C** | reversed([A,E]) → 모두 방문됨, 추가 없음 | [C, F] | {A, B, C, D, E} |
| 6 | **F** | reversed([E]) → E 방문됨, 추가 없음 | [C] | {A, B, C, D, E, F} |
| 7 | ~~C~~ | 이미 방문됨, 건너뜀 | [] | {A, B, C, D, E, F} |

**DFS 순회 순서: A → B → D → E → C → F**

DFS는 가능한 한 *깊이* 먼저 탐색합니다: A → B → D (막힘, 백트래킹) → E → C (막힘) → F.

---

### 두 순회 방식 비교

| | BFS | DFS |
|---|---|---|
| 순회 순서 | A, B, C, D, E, F | A, B, D, E, C, F |
| 전략 | 레이어 단위 (거리 기반) | 분기를 최대한 깊이 탐색 |
| D를 방문하는 시점 | 4단계 (C 이후) | 3단계 (B 바로 다음) |
| C를 방문하는 시점 | 3단계 (A와 같은 거리라 일찍) | 5단계 (B-D-E-F 전체 분기 이후) |

BFS는 C가 A에서 1홉 거리이므로 일찍 방문합니다. DFS는 B의 서브 분기(B → D → E → F)를 먼저 탐색한 후 백트래킹으로 C에 도달하므로 늦게 방문합니다.

---

## 풀이 예제: 이진 탐색으로 답 구하기

### 문제

> 무게가 `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`인 화물을 **D = 5일** 이내에 모두 운송해야 합니다. 매일 연속된 화물을 선박 용량까지 적재합니다. 모든 화물을 기한 내 운송할 수 있는 **최소 선박 용량**을 구하세요.

### 핵심 아이디어

용량 `mid`로 운송이 가능하다면 `mid + 1`로도 가능합니다 — 답이 **단조적**입니다. 따라서 답의 범위에 이진 탐색을 적용할 수 있습니다.

- **Low = 10** (가장 무거운 화물이라도 반드시 적재 가능해야 함)
- **High = 55** (모든 화물을 하루에 운송 = 전체 무게 합)

```python
def can_ship(weights, D, capacity):
    days_needed, current_load = 1, 0
    for w in weights:
        if current_load + w > capacity:
            days_needed += 1
            current_load = 0
        current_load += w
    return days_needed <= D

def min_capacity(weights, D):
    low, high = max(weights), sum(weights)
    while low < high:
        mid = low + (high - low) // 2
        if can_ship(weights, D, mid):
            high = mid
        else:
            low = mid + 1
    return low
```

---

### 이진 탐색 추적

**초기값:** low = 10, high = 55

#### 반복 1 — mid = 32

`can_ship([1..10], 5, 용량=32)`:
```
1일차: 1+2+3+4+5+6+7 = 28  (8 추가 → 36 > 32, 중단)
2일차: 8+9+10 = 27
→ 필요 일수: 2 ≤ 5  ✓  True
```
→ `high = 32`

#### 반복 2 — mid = 21

`can_ship([1..10], 5, 용량=21)`:
```
1일차: 1+2+3+4+5+6 = 21  (7 추가 → 28 > 21, 중단)
2일차: 7+8 = 15           (9 추가 → 24 > 21, 중단)
3일차: 9+10 = 19
→ 필요 일수: 3 ≤ 5  ✓  True
```
→ `high = 21`

#### 반복 3 — mid = 15

`can_ship([1..10], 5, 용량=15)`:
```
1일차: 1+2+3+4+5 = 15  (6 추가 → 21 > 15, 중단)
2일차: 6+7 = 13        (8 추가 → 21 > 15, 중단)
3일차: 8               (9 추가 → 17 > 15, 중단)
4일차: 9               (10 추가 → 19 > 15, 중단)
5일차: 10
→ 필요 일수: 5 ≤ 5  ✓  True
```
→ `high = 15`

#### 반복 4 — mid = 12

`can_ship([1..10], 5, 용량=12)`:
```
1일차: 1+2+3+4 = 10  (5 추가 → 15 > 12, 중단)
2일차: 5+6 = 11      (7 추가 → 18 > 12, 중단)
3일차: 7             (8 추가 → 15 > 12, 중단)
4일차: 8             (9 추가 → 17 > 12, 중단)
5일차: 9             (10 추가 → 19 > 12, 중단)
6일차: 10
→ 필요 일수: 6 > 5  ✗  False
```
→ `low = 13`

#### 반복 5 — mid = 14

`can_ship([1..10], 5, 용량=14)`:
```
1일차: 1+2+3+4 = 10  (5 추가 → 15 > 14, 중단)
2일차: 5+6 = 11      (7 추가 → 18 > 14, 중단)
3일차: 7             (8 추가 → 15 > 14, 중단)
4일차: 8             (9 추가 → 17 > 14, 중단)
5일차: 9             (10 추가 → 19 > 14, 중단)
6일차: 10
→ 필요 일수: 6 > 5  ✗  False
```
→ `low = 15`

#### 종료 — low = 15, high = 15

`low == high` → 루프 종료.

---

### 요약 테이블

| 반복 | low | high | mid | can_ship(mid)? | 동작 |
|------|-----|------|-----|----------------|------|
| 1 | 10 | 55 | 32 | True (2일) | high = 32 |
| 2 | 10 | 32 | 21 | True (3일) | high = 21 |
| 3 | 10 | 21 | 15 | True (5일) | high = 15 |
| 4 | 10 | 15 | 12 | False (6일) | low = 13 |
| 5 | 13 | 15 | 14 | False (6일) | low = 15 |
| — | 15 | 15 | — | 수렴 | **정답 = 15** |

### 정답: **15**

용량 15일 때 화물을 정확히 5일에 나누어 운송할 수 있습니다:
`[1,2,3,4,5]` · `[6,7]` · `[8]` · `[9]` · `[10]`

용량 14는 6일이 필요하므로 15가 최솟값입니다.
