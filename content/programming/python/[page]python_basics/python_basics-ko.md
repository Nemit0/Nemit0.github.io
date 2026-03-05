---
title: "Python: 핵심 특성과 GIL"
description: "Python의 중요한 특성들 — 동적 타이핑, 메모리 관리, 표준 라이브러리 — 과 GIL(전역 인터프리터 잠금)에 대한 심층 분석: GIL이란 무엇인지, 왜 존재하는지, 어떻게 우회하는지."
date: "2026-03-05"
category: "programming/python"
tags: ["Python", "GIL", "동시성", "스레딩", "멀티프로세싱", "동적 타이핑", "메모리 관리"]
author: "Nemit"
featured: false
pinned: false
---

# Python: 핵심 특성과 GIL

Python은 깔끔한 문법과 가독성을 강조하는 동적 타입 인터프리터 범용 언어입니다. 데이터 과학, 머신러닝, 스크립팅, 웹 백엔드에서 지배적인 위치를 차지하고 있습니다. Python의 단순함은 배우기 쉽게 만들고, 방대한 생태계(NumPy, Pandas, Django, Flask, PyTorch)는 실용적으로 강력하게 만듭니다.

---

## 핵심 언어 특성

### 동적 타이핑

Python은 **동적 타입**입니다 — 변수에 타입이 없고 값에 타입이 있습니다. 타입 검사는 런타임에 이루어집니다.

```python
x = 42          # int
x = "hello"     # str — 재바인딩 가능
x = [1, 2, 3]  # list

print(type(x))  # <class 'list'>
```

문서화와 `mypy` 같은 정적 분석 도구를 위해 **타입 힌트**(PEP 484)를 추가할 수 있지만, 런타임 강제성은 없습니다:

```python
def greet(name: str) -> str:
    return f"안녕하세요, {name}!"

greet(42)  # 런타임에는 잘 실행됨 (타입이 틀려도)
```

### 모든 것이 객체

Python에서는 정수, 문자열, 함수, 클래스, 모듈 등 **문자 그대로 모든 것이 객체**입니다. 모든 값이 속성과 메서드를 가집니다.

```python
(42).bit_length()         # 6 — 정수도 메서드를 가짐
"hello".upper()           # 'HELLO'
[1, 2, 3].append(4)       # 리스트를 인플레이스 변경

def add(a, b): return a + b
add.__name__              # 'add' — 함수도 객체
type(add)                 # <class 'function'>
```

### 들여쓰기가 문법

Python은 중괄호나 키워드 대신 **들여쓰기(공백)**로 코드 블록을 구분합니다.

```python
def classify(n):
    if n > 0:
        return "양수"
    elif n < 0:
        return "음수"
    else:
        return "영"
```

이는 모든 Python 코드에 일관된 스타일을 강제하지만, 탭과 스페이스를 섞으면 `TabError`가 발생합니다.

---

## 메모리 관리

### 참조 카운팅

Python은 **참조 카운팅**을 주된 메모리 관리 방식으로 사용합니다. 모든 객체는 자신을 가리키는 참조의 수를 저장합니다. 카운트가 0이 되면 메모리가 즉시 해제됩니다.

```python
import sys

x = [1, 2, 3]
print(sys.getrefcount(x))  # 2 (x + getrefcount의 인수)

y = x                      # 참조 추가
print(sys.getrefcount(x))  # 3

del y                      # 참조 하나 제거
print(sys.getrefcount(x))  # 다시 2
```

참조 카운팅은 **확정적 정리**를 제공합니다 — 객체는 스코프를 벗어나는 즉시 해제됩니다. 이것이 파일과 잠금에 `with` 문(컨텍스트 매니저)이 그토록 안정적으로 동작하는 이유입니다.

### 순환 가비지 컬렉터

참조 카운팅은 **참조 순환**을 처리할 수 없습니다 — A가 B를 참조하고 B가 A를 참조하면, 외부에서 어느 것도 참조하지 않아도 둘 다 살아있습니다.

```python
import gc

a = []
b = []
a.append(b)  # a → b
b.append(a)  # b → a

del a
del b
# 순환으로 인해 둘 다 refcount > 0
# CPython의 순환 GC가 주기적으로 이를 감지하고 수집

gc.collect()  # 수동으로 순환 수집 트리거
```

Python의 **순환 가비지 컬렉터**(`gc` 모듈)는 주기적으로 실행되어 이러한 순환을 감지하고 정리합니다. Java의 세대별 알고리즘과 유사한 방식을 사용합니다.

### 변수 바인딩 vs 할당

Python 변수는 **값을 담는 상자가 아니라 객체에 바인딩된 이름**입니다. 할당은 새 바인딩을 생성하고, 복사본을 만들지 않습니다.

```python
a = [1, 2, 3]
b = a         # b와 a는 같은 리스트를 가리킴
b.append(4)
print(a)      # [1, 2, 3, 4] — a도 변경됨

# 복사하려면:
c = a.copy()  # 얕은 복사
import copy
d = copy.deepcopy(a)  # 깊은 복사 (중첩된 객체까지 재귀적으로 복사)
```

---

## GIL (전역 인터프리터 잠금)

**GIL**은 CPython(표준 Python 인터프리터) 내부의 뮤텍스(상호 배제 잠금)입니다. 멀티코어 머신에서도 **한 번에 하나의 스레드만 Python 바이트코드를 실행할 수 있도록** 보장합니다.

### GIL이 존재하는 이유

CPython의 메모리 관리는 설계상 스레드 안전하지 않습니다. 모든 객체의 참조 카운트는 원자적으로 업데이트되어야 합니다. GIL이 없다면 두 스레드가 동시에 참조 카운트를 0으로 감소시키고 같은 메모리를 해제하려 시도할 수 있습니다 — 크래시나 메모리 손상을 일으키는 경쟁 조건입니다.

모든 객체에 세밀한 잠금을 추가하는 대신(비용이 큼), CPython은 단일 전역 잠금을 사용합니다. 이것은 멀티코어 머신이 희귀하던 1992년의 실용적인 결정이었습니다. GIL은 CPython 구현을 단순하게 만들고 싱글 스레드 코드를 더 빠르게 만듭니다(객체별 잠금 오버헤드 없음).

```
스레드 1이 GIL 획득 → Python 바이트코드 실행
스레드 2가 GIL 대기
스레드 1이 GIL 해제 (약 100 바이트코드마다, 또는 I/O 시)
스레드 2가 GIL 획득 → 실행
...
```

### GIL의 실제 영향

**CPU 바운드 작업 (연산):**

```python
import threading
import time

def count_up(n):
    while n > 0:
        n -= 1

# 싱글 스레드
start = time.time()
count_up(100_000_000)
count_up(100_000_000)
print(f"순차: {time.time() - start:.2f}s")

# 멀티 스레드 — GIL로 인해 빠르지 않음
t1 = threading.Thread(target=count_up, args=(100_000_000,))
t2 = threading.Thread(target=count_up, args=(100_000_000,))
start = time.time()
t1.start(); t2.start()
t1.join(); t2.join()
print(f"스레드: {time.time() - start:.2f}s")

# 결과: 스레드 버전이 GIL 경합 오버헤드로 인해 오히려 느릴 수 있음
```

**I/O 바운드 작업:**

```python
import threading
import urllib.request

def fetch(url):
    urllib.request.urlopen(url).read()  # 네트워크 대기 중 GIL 해제

urls = ["https://example.com"] * 10

# I/O에는 스레딩이 도움됨 — I/O 대기 중 GIL이 해제됨
threads = [threading.Thread(target=fetch, args=(url,)) for url in urls]
for t in threads: t.start()
for t in threads: t.join()
# 순차 실행보다 빠름
```

GIL이 **해제**되는 경우:
- I/O 작업 (파일 읽기/쓰기, 네트워크, 소켓)
- GIL을 명시적으로 해제하는 C 확장 호출 (NumPy, Pandas 무거운 연산)
- `time.sleep()`

즉 **I/O 바운드 프로그램은 GIL이 있어도 스레딩의 혜택**을 받습니다. **순수 Python CPU 바운드 코드**만 제약을 받습니다.

### 요약: GIL 영향

| 작업 유형 | 스레딩 도움? | 이유 |
|---|---|---|
| CPU 바운드 (순수 Python) | 아니오 — 오히려 느릴 수 있음 | GIL이 진정한 병렬성 방지 + 오버헤드 추가 |
| I/O 바운드 (네트워크, 디스크) | 예 | 블로킹 I/O 중 GIL 해제 |
| C 확장 CPU 작업 (NumPy) | 예 | 확장이 GIL을 명시적으로 해제 |

---

## GIL 우회하기

### `multiprocessing` — 진정한 병렬성

각 프로세스는 자체 Python 인터프리터와 GIL을 가집니다. 여러 프로세스를 사용하면 진정한 CPU 병렬성을 달성할 수 있습니다.

```python
from multiprocessing import Pool

def square(n):
    return n * n

with Pool(processes=4) as pool:  # 4개의 워커 프로세스
    results = pool.map(square, range(10))

print(results)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

프로세스는 스레드보다 무겁지만(더 많은 메모리, 느린 시작, IPC 필요), GIL을 완전히 우회합니다.

### `concurrent.futures` — 통합 인터페이스

`concurrent.futures`는 스레드와 프로세스 모두에 대한 깔끔한 인터페이스를 제공합니다:

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import requests

urls = ["https://api.example.com/1", "https://api.example.com/2"]

# I/O 바운드: 스레드 사용
with ThreadPoolExecutor(max_workers=8) as executor:
    responses = list(executor.map(requests.get, urls))

# CPU 바운드: 프로세스 사용
def heavy_compute(n):
    return sum(i * i for i in range(n))

with ProcessPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(heavy_compute, [10**6] * 4))
```

### `asyncio` — 협력적 동시성

I/O 바운드 작업에 `asyncio`는 코루틴을 사용하여 고성능 싱글 스레드 동시성을 제공합니다. 한 번에 하나의 코루틴만 실행되고 자발적으로 제어를 양보하므로 GIL 문제가 없습니다.

```python
import asyncio
import aiohttp  # 비동기 HTTP 클라이언트

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main():
    urls = ["https://example.com"] * 10
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)  # 모두 동시에 실행
    return results

asyncio.run(main())
```

`asyncio`는 단일 스레드로 수천 개의 동시 I/O 작업을 처리할 수 있어, 수천 개의 스레드를 생성하는 것보다 훨씬 효율적입니다.

### NumPy / C 확장

NumPy 연산은 GIL을 해제하고 네이티브 BLAS/LAPACK 루틴을 사용하므로, 스레드와 결합할 때 자동으로 병렬로 실행됩니다:

```python
import numpy as np
import threading

def compute(arr):
    return np.dot(arr, arr.T)  # GIL 해제, 내부적으로 네이티브 스레드 사용

a = np.random.rand(1000, 1000)
# NumPy는 내부적으로 멀티코어 BLAS 사용 — 여기서 스레딩이 도움됨
```

---

## 동시성 전략 가이드

| 시나리오 | 최적 도구 |
|---|---|
| CPU 바운드 순수 Python | `multiprocessing` 또는 `ProcessPoolExecutor` |
| 많은 연결의 I/O 바운드 | `asyncio` + 비동기 라이브러리 |
| 더 단순한 I/O 바운드 | `threading` 또는 `ThreadPoolExecutor` |
| CPU 바운드 NumPy/SciPy | `threading` (확장이 GIL 해제) |
| 혼합 작업 | 적절한 executor와 `concurrent.futures` |

---

## 기타 주요 Python 기능

### 리스트 컴프리헨션과 제너레이터

```python
# 리스트 컴프리헨션 — 전체 리스트를 메모리에 생성
squares = [x * x for x in range(10) if x % 2 == 0]

# 제너레이터 표현식 — 지연 평가, 한 번에 하나씩 생성
squares_gen = (x * x for x in range(10_000_000))  # 메모리 비용 없음
total = sum(squares_gen)  # 한 번에 하나씩만 처리

# 제너레이터 함수
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
print([next(fib) for _ in range(8)])  # [0, 1, 1, 2, 3, 5, 8, 13]
```

### 데코레이터

데코레이터는 다른 함수를 감싸 전후에 동작을 추가하는 함수입니다.

```python
import time
import functools

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} 소요 시간: {elapsed:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(0.1)

slow_function()  # slow_function 소요 시간: 0.1001s
```

### 컨텍스트 매니저

`with` 문은 예외가 발생해도 정리 코드가 항상 실행되도록 보장합니다.

```python
# 예외가 발생해도 파일이 자동으로 닫힘
with open('data.txt', 'r') as f:
    content = f.read()

# 커스텀 컨텍스트 매니저
from contextlib import contextmanager

@contextmanager
def timer_ctx(label):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(f"{label}: {time.perf_counter() - start:.4f}s")

with timer_ctx("연산"):
    result = sum(range(10_000_000))
```

### 데이터 클래스

`dataclasses`(Python 3.7+)는 데이터를 담는 클래스의 보일러플레이트를 제거합니다:

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
    z: float = 0.0

    def distance_from_origin(self) -> float:
        return (self.x**2 + self.y**2 + self.z**2) ** 0.5

p = Point(3.0, 4.0)
print(p)                       # Point(x=3.0, y=4.0, z=0.0)
print(p.distance_from_origin()) # 5.0
```

---

## 빠른 참조

```python
# 동시성 패턴
import threading, multiprocessing, asyncio
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# I/O 바운드: 스레드
with ThreadPoolExecutor(max_workers=10) as ex:
    results = list(ex.map(io_task, items))

# CPU 바운드: 멀티프로세싱
with ProcessPoolExecutor(max_workers=4) as ex:
    results = list(ex.map(cpu_task, items))

# 비동기 I/O
async def main():
    results = await asyncio.gather(*[async_task(i) for i in items])
asyncio.run(main())
```

| 기능 | Python 동작 |
|---|---|
| 타이핑 | 동적 (런타임); `mypy`를 통한 선택적 정적 힌트 |
| 메모리 관리 | 참조 카운팅 + 순환 GC |
| GIL | 스레드 간 병렬 Python 바이트코드 실행 방지 |
| 스레딩 | I/O 바운드에 안전; CPU 바운드에 제한적 |
| 진정한 CPU 병렬성 | `multiprocessing` 또는 C 확장 사용 |
| 비동기 동시성 | 고동시성 I/O를 위한 `asyncio` |
| 객체 모델 | 모든 것이 객체; 프로토타입 없는 클래스 기반 OOP |
| 오류 처리 | 예외; `try/except/else/finally` |
