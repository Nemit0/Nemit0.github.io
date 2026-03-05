---
title: "해시 테이블과 해싱"
description: "해시 테이블의 작동 원리 — 해시 함수, 충돌 해결(체이닝, 개방 주소법), 부하율, 리해싱, 실전 활용."
date: "2026-03-05"
category: "CS/algorithms"
tags: ["algorithms", "해시 테이블", "해시 맵", "해싱", "자료구조"]
author: "Nemit"
featured: false
pinned: false
---

# 해시 테이블과 해싱

## 해시 테이블이란?

**해시 테이블**(해시 맵)은 **해시 함수**를 사용하여 키를 값에 매핑하는 자료구조입니다. **평균 O(1)**의 조회, 삽입, 삭제를 제공합니다.

```
키 → 해시 함수 → 인덱스 → 값

"alice" → hash("alice") → 3 → {name: "Alice", age: 30}
"bob"   → hash("bob")   → 7 → {name: "Bob", age: 25}
```

### 핵심 연산

| 연산 | 평균 | 최악 |
|---|---|---|
| 검색 | O(1) | O(n) |
| 삽입 | O(1) | O(n) |
| 삭제 | O(1) | O(n) |

최악 O(n)은 모든 키가 같은 버킷으로 해싱될 때 발생합니다 (퇴화 사례).

---

## 해시 함수

해시 함수는 임의 크기의 키를 고정 크기 정수(해시 코드)로 변환하고, 이를 배열 인덱스에 매핑합니다.

### 좋은 해시 함수의 특성

1. **결정적**: 같은 키는 항상 같은 해시 생성
2. **균일 분포**: 키가 버킷에 고르게 분산
3. **빠른 계산**: 이상적으로 O(1) 또는 O(키 길이)
4. **눈사태 효과**: 키의 작은 변화가 매우 다른 해시를 생성

### 일반적인 해시 함수

#### 나눗셈 방법

```
h(k) = k mod m
```

더 나은 분포를 위해 m을 2의 거듭제곱에 가깝지 않은 소수로 선택합니다.

#### 곱셈 방법

```
h(k) = ⌊m × (k × A mod 1)⌋    여기서 A ≈ 0.6180339887 (황금비)
```

m의 선택에 덜 민감합니다.

#### 문자열 해싱

```python
def hash_string(s, m):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % m    # 다항식 롤링 해시
    return h
```

Java의 `String.hashCode()`는 승수 31을 사용합니다.

#### 암호학적 해시 함수

MD5, SHA-1, SHA-256 — 보안을 위해 설계 (충돌 저항성, 역상 저항성). 해시 테이블에는 너무 느리지만 체크섬, 디지털 서명, 비밀번호 저장에 사용됩니다.

---

## 충돌 해결

가능한 키의 수가 배열 크기보다 훨씬 크므로, 여러 키가 같은 인덱스로 해싱될 수 있습니다. 이것이 **충돌**입니다.

### 1. 체이닝 (분리 체이닝)

각 버킷이 해당 인덱스로 해싱된 모든 항목의 **연결 리스트**(또는 다른 컬렉션)를 저장합니다:

```
인덱스 0: → [("alice", 30)] → [("charlie", 35)]
인덱스 1: → [("bob", 25)]
인덱스 2: → (비어 있음)
인덱스 3: → [("dave", 28)]
```

```python
class HashTableChaining:
    def __init__(self, size=16):
        self.size = size
        self.buckets = [[] for _ in range(size)]

    def _hash(self, key):
        return hash(key) % self.size

    def put(self, key, value):
        idx = self._hash(key)
        for i, (k, v) in enumerate(self.buckets[idx]):
            if k == key:
                self.buckets[idx][i] = (key, value)
                return
        self.buckets[idx].append((key, value))

    def get(self, key):
        idx = self._hash(key)
        for k, v in self.buckets[idx]:
            if k == key:
                return v
        raise KeyError(key)

    def delete(self, key):
        idx = self._hash(key)
        for i, (k, v) in enumerate(self.buckets[idx]):
            if k == key:
                self.buckets[idx].pop(i)
                return
        raise KeyError(key)
```

**장점**: 간단, 높은 부하율에서 잘 작동, 삭제 용이
**단점**: 포인터 추가 메모리, 캐시 지역성 불량

### 2. 개방 주소법

모든 항목이 배열 자체에 저장됩니다. 충돌 시 다음 빈 슬롯을 **탐사**합니다.

#### 선형 탐사

```
h(k, i) = (h(k) + i) mod m      i = 0, 1, 2, ...
```

**문제**: **1차 클러스터링** — 연속된 점유 슬롯이 클러스터를 형성하여 이후 삽입이 느려집니다.

#### 이차 탐사

```
h(k, i) = (h(k) + c₁i + c₂i²) mod m
```

1차 클러스터링은 줄이지만 **2차 클러스터링** 발생 가능 (같은 해시값의 키들이 같은 탐사 순서를 따름).

#### 이중 해싱

```
h(k, i) = (h₁(k) + i × h₂(k)) mod m
```

스텝 크기에 두 번째 해시 함수를 사용합니다. 개방 주소법 중 가장 좋은 분포.

### 개방 주소법에서의 삭제

단순히 항목을 제거하면 탐사 체인이 끊어집니다. **톰스톤**(삭제 표시)을 사용합니다:

```
슬롯: [alice] [DELETED] [charlie] [비어있음]
               ↑ 톰스톤
charlie 검색: hash=0, 탐사 0 (alice), 탐사 1 (DELETED, 계속), 탐사 2 (charlie, 발견!)
```

톰스톤이 축적되면 성능이 저하됩니다. 주기적으로 테이블을 재구성합니다.

### 로빈 후드 해싱

**탐사 거리가 가장 짧은** 요소가 자리를 양보하는 개방 주소법의 변형입니다. 탐사 길이의 분산을 줄여줍니다.

---

## 부하율과 리해싱

### 부하율

```
α = n / m    (항목 수 / 버킷 수)
```

| 부하율 | 체이닝 | 개방 주소법 |
|---|---|---|
| α < 0.5 | 빠름 | 빠름 |
| α ≈ 0.75 | 양호 | 수용 가능 (Java HashMap은 여기서 리사이즈) |
| α > 1.0 | 가능 (체인 증가) | 불가능 (빈 슬롯 없음) |

### 리해싱

부하율이 임계값을 초과하면 **배열 크기를 2배로** 늘리고 모든 요소를 재삽입합니다:

```python
def _resize(self):
    old_buckets = self.buckets
    self.size *= 2
    self.buckets = [[] for _ in range(self.size)]
    for bucket in old_buckets:
        for key, value in bucket:
            self.put(key, value)    # 새 테이블에 리해시
```

리해싱은 O(n)이지만 드물게 발생 → 연산당 분할 상환 O(1).

---

## 실전 해시 테이블

### Python `dict`

Python의 dict는 컴팩트 레이아웃의 개방 주소법을 사용합니다:

```python
d = {"name": "Alice", "age": 30}
d["email"] = "alice@example.com"    # O(1) 삽입
print(d["name"])                     # O(1) 조회
del d["age"]                         # O(1) 삭제
"name" in d                          # O(1) 멤버십 테스트
```

Python 3.7부터 dict는 **삽입 순서**를 유지합니다.

### Java `HashMap`

- 기본 초기 용량: 16
- 부하율 임계값: 0.75
- 버킷에 8개 초과 항목 시, 연결 리스트에서 **레드-블랙 트리**로 변환 (최악 O(log n))

### C++ `std::unordered_map`

```cpp
std::unordered_map<std::string, int> map;
map["alice"] = 30;
map.count("alice");    // 1 (존재) 또는 0
```

체이닝 사용. 개방 주소법은 `absl::flat_hash_map` 등을 사용합니다.

---

## 해시 셋

**해시 셋**은 키만 저장합니다 (값 없음). 동일한 O(1) 연산.

```python
s = {1, 2, 3}
s.add(4)           # O(1)
s.remove(2)        # O(1)
3 in s             # O(1)
```

활용:
- 중복 감지
- 멤버십 테스트
- 집합 연산 (합집합, 교집합, 차집합)

---

## 활용 예시

### 빈도 세기

```python
from collections import Counter

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
freq = Counter(words)
# Counter({'apple': 3, 'banana': 2, 'cherry': 1})
```

### Two Sum 문제

```python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
```

O(n) 시간, O(n) 공간 — 브루트포스 O(n²) 대비.

### 캐싱 / 메모이제이션

```python
cache = {}
def fibonacci(n):
    if n in cache:
        return cache[n]
    if n <= 1:
        return n
    cache[n] = fibonacci(n - 1) + fibonacci(n - 2)
    return cache[n]
```

### 중복 제거

```python
unique = list(set(items))    # 중복 제거 (순서 미보장)

# 순서 유지:
seen = set()
unique = [x for x in items if not (x in seen or seen.add(x))]
```

---

## 해시 충돌과 보안

### 해시 플러딩 공격

공격자가 의도적으로 충돌하는 키를 보내 O(1)을 O(n)으로 퇴화시킵니다. 대응책:
- **랜덤화된 해시 시드** (Python은 3.3부터 적용)
- **높은 충돌 시 균형 트리로 전환** (Java 8+ HashMap)
- 신뢰할 수 없는 입력에 **암호학적 해시** 사용

### 생일 역설

m개의 가능한 값을 생성하는 해시에서, 약 **√m**번 삽입 후 충돌이 예상됩니다. 32비트 해시(m = 2³²)의 경우, ~65,536개 항목 후 충돌 예상.

따라서 해시 테이블에 좋은 충돌 해결이 필요합니다 — 충돌은 불가피합니다.

---

## 다른 자료구조와 비교

| 연산 | 해시 테이블 | BST (균형) | 정렬 배열 |
|---|---|---|---|
| 검색 | O(1) 평균 | O(log n) | O(log n) |
| 삽입 | O(1) 평균 | O(log n) | O(n) |
| 삭제 | O(1) 평균 | O(log n) | O(n) |
| 최솟/최댓값 | O(n) | O(log n) | O(1) |
| 범위 질의 | O(n) | O(log n + k) | O(log n + k) |
| 정렬 순서 순회 | O(n log n) | O(n) | O(n) |

순서가 필요 없이 빠른 조회/삽입/삭제가 필요할 때 해시 테이블, 정렬 연산이 필요할 때 BST를 사용합니다.
