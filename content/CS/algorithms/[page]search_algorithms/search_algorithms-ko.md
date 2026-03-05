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
