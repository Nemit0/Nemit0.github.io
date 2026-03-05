---
title: "뮤텍스 vs 세마포어"
description: "임계 구역, 경쟁 조건, 상호 배제, 뮤텍스와 세마포어의 차이 — 실용적인 예제와 고전적인 생산자-소비자 문제 포함."
date: "2026-03-05"
category: "CS/OS"
tags: ["OS", "뮤텍스", "세마포어", "동시성", "동기화", "경쟁 조건", "임계 구역"]
author: "Nemit"
featured: false
pinned: false
---

# 뮤텍스 vs 세마포어

## 문제: 공유 상태와 경쟁 조건

여러 스레드(또는 프로세스)가 공유 데이터에 접근하면 문제가 발생합니다.

```c
// 공유 카운터
int counter = 0;

// 스레드 1            // 스레드 2
counter++;             counter++;
```

`counter++`는 원자적이지 않습니다. 기계어 코드로는:
1. 메모리에서 레지스터로 `counter` 로드
2. 레지스터 증가
3. 레지스터를 메모리에 저장

스레드 1과 2가 인터리브되면:

```
스레드 1: LOAD  counter → reg1 (reg1 = 0)
스레드 2: LOAD  counter → reg2 (reg2 = 0)
스레드 1: ADD   reg1, 1  (reg1 = 1)
스레드 2: ADD   reg2, 1  (reg2 = 1)
스레드 1: STORE reg1 → counter  (counter = 1)
스레드 2: STORE reg2 → counter  (counter = 1)  ← 잘못됨, 2여야 함
```

결과: `counter = 1` (2여야 함). **경쟁 조건** — 출력이 스레드의 타이밍/인터리빙에 따라 달라집니다.

---

## 임계 구역

**임계 구역(Critical Section)**은 공유 자원에 접근하는 코드 세그먼트로, 한 번에 하나의 스레드만 실행할 수 있어야 합니다.

임계 구역 문제의 해결책은 세 가지 조건을 만족해야 합니다:

1. **상호 배제**: 한 번에 최대 하나의 스레드만 임계 구역 내에 있음
2. **진행**: 임계 구역 밖의 프로세스만 다음에 들어갈 프로세스 결정에 참여 가능
3. **한계된 대기**: 임계 구역 진입을 기다리는 스레드는 유한 번만 다른 스레드가 먼저 진입한 후 반드시 허용됨

---

## 뮤텍스 (상호 배제 락)

**뮤텍스**는 상호 배제를 제공하는 동기화 원시 타입입니다. **잠김**과 **열림** 두 상태를 가집니다. 잠근 스레드만 잠금 해제할 수 있습니다.

### POSIX 뮤텍스

```c
#include <pthread.h>

pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
int counter = 0;

void *increment(void *arg) {
    for (int i = 0; i < 100000; i++) {
        pthread_mutex_lock(&lock);    // 락 획득
        counter++;                     // 임계 구역
        pthread_mutex_unlock(&lock);  // 락 해제
    }
    return NULL;
}
```

### C++에서의 뮤텍스 (RAII)

```cpp
#include <mutex>

std::mutex mtx;
int counter = 0;

void increment() {
    for (int i = 0; i < 100000; i++) {
        std::lock_guard<std::mutex> lock(mtx);  // 생성 시 락
        counter++;
        // lock_guard 소멸 → 자동으로 뮤텍스 해제
    }
}
```

### 스핀락

**스핀락**은 대기 스레드가 슬립하지 않고 **바쁜 대기(busy-wait)**하는 뮤텍스 변형입니다:

```c
while (test_and_set(&lock)) {
    // 스핀
}
// 임계 구역
lock = 0;
```

`test_and_set`은 값을 읽고 1로 설정하는 단일 불가분 명령어입니다.

**스핀락 사용 시기**: 임계 구역이 매우 짧을 때(마이크로초)와 멀티코어 환경. 스피닝 비용이 슬립+웨이크업 컨텍스트 스위치보다 낮습니다. Linux 커널 코드에서 광범위하게 사용됩니다.

**스핀락 사용 금지 시기**: 단일 코어 시스템. 락 경합이 높을 때. 임계 구역이 길 때.

### 우선순위 역전

**우선순위 역전**: 낮은 우선순위 태스크가 락을 보유. 높은 우선순위 태스크가 대기. 중간 우선순위 태스크가 낮은 우선순위 태스크를 선점하여 락을 해제하지 못하게 함. 높은 우선순위 태스크가 중간 우선순위 태스크 뒤에 묶임 — 우선순위가 역전됨.

**우선순위 상속**: 락 보유자의 우선순위를 가장 높은 우선순위 대기자와 일치하도록 일시적으로 높임. 실시간 시스템에서 사용됨 (1997년 화성 패스파인더 버그가 우선순위 역전으로 발생).

---

## 세마포어 (Dijkstra, 1965)

**세마포어**는 정수 값을 보유하고 두 개의 원자적 연산을 지원하는 동기화 변수입니다:

- **P() / wait() / down()**: 값을 감소시킵니다. 값이 음수가 되면 호출 스레드를 블록합니다.
- **V() / signal() / up()**: 값을 증가시킵니다. 대기 중인 스레드가 있으면 하나를 깨웁니다.

```
wait(S):
    S--;
    if (S < 0):
        이 스레드를 S의 대기 큐에 추가
        이 스레드 블록

signal(S):
    S++;
    if (S <= 0):
        대기 큐에서 스레드 T 제거
        T 깨우기
```

### 이진 세마포어

초기값 = 1. 뮤텍스처럼 작동 — 한 번에 하나의 스레드만 임계 구역에 진입합니다.

```c
sem_t sem;
sem_init(&sem, 0, 1);  // 초기값 = 1

sem_wait(&sem);    // P() — 감소, 0이면 블록
// 임계 구역
sem_post(&sem);    // V() — 증가, 대기자 깨우기
```

### 계수 세마포어

초기값 = N. N개의 스레드가 동시에 자원에 접근할 수 있습니다.

사용 사례: N개의 연결을 가진 커넥션 풀. 각 스레드가 연결을 얻기 전 `sem_wait`를 수행하고 반환 후 `sem_post`를 수행합니다. N개가 모두 사용 중이면 (N+1)번째 스레드가 블록됩니다.

---

## 뮤텍스 vs 세마포어: 주요 차이점

| 속성 | 뮤텍스 | 세마포어 |
|---|---|---|
| **소유권** | 잠근 스레드만 해제 가능 | 어떤 스레드도 signal() 호출 가능 — 소유권 없음 |
| **값** | 이진 (잠김/열림) | 정수 (0 ~ N) |
| **목적** | 상호 배제 (임계 구역 보호) | 신호 + 자원 계수 |
| **범위** | 보통 단일 프로세스 내 | 프로세스 간 가능 (이름 있는 세마포어) |
| **교착상태 위험** | 있음 (재귀 플래그 없이 같은 스레드가 다시 잠그면) | 있음 (wait/signal 불균형 시) |

**핵심 차이**: 뮤텍스는 **소유권**에 관한 것 (잠근 자가 해제해야 함). 세마포어는 **신호**에 관한 것 (한 스레드가 다른 스레드에게 신호를 보낼 수 있음).

**뮤텍스 사용 시기:**
- 공유 변수나 자료구조 보호
- 한 스레드만 블록을 실행하도록 보장
- 소유권 의미론이 필요할 때

**세마포어 사용 시기:**
- 스레드 간 신호 (예: 생산자가 소비자에게 작업 준비 신호)
- N개 자원에 대한 접근 제한 (커넥션 풀)
- 프로세스 간 동기화 (이름 있는 세마포어)

---

## 고전 문제: 생산자-소비자

생산자는 아이템을 생산하여 유한 버퍼에 넣습니다. 소비자는 버퍼에서 아이템을 꺼냅니다. 버퍼는 최대 N개를 보관합니다.

제약:
- 버퍼가 가득 차면 생산자는 대기
- 버퍼가 비어 있으면 소비자는 대기
- 버퍼 접근은 상호 배제

```c
#define N 10

sem_t empty;   // 빈 슬롯 수 (초기값 N)
sem_t full;    // 채워진 슬롯 수 (초기값 0)
sem_t mutex;   // 버퍼 접근 보호 (초기값 1)

int buffer[N];
int in = 0, out = 0;

void *producer(void *arg) {
    while (1) {
        int item = produce_item();

        sem_wait(&empty);   // 빈 슬롯 대기
        sem_wait(&mutex);   // 임계 구역 진입

        buffer[in] = item;
        in = (in + 1) % N;

        sem_post(&mutex);   // 임계 구역 퇴장
        sem_post(&full);    // 신호: 채워진 슬롯 하나 더
    }
}

void *consumer(void *arg) {
    while (1) {
        sem_wait(&full);    // 채워진 슬롯 대기
        sem_wait(&mutex);   // 임계 구역 진입

        int item = buffer[out];
        out = (out + 1) % N;

        sem_post(&mutex);   // 임계 구역 퇴장
        sem_post(&empty);   // 신호: 빈 슬롯 하나 더

        consume_item(item);
    }
}
```

주의: `empty/full`과 `mutex`의 `sem_wait` 순서가 중요합니다 — 순서를 바꾸면 교착상태가 발생합니다.

---

## 고전 문제: 식사하는 철학자

다섯 명의 철학자가 원탁에 앉아 있습니다. 각자 먹으려면 왼쪽과 오른쪽 포크(총 5개) 두 개가 필요합니다. 모두 동시에 왼쪽 포크를 집으면 교착상태가 발생합니다.

**교착상태 해결 — 홀수/짝수 비대칭:**

```c
void philosopher(int i) {
    while (1) {
        think();

        if (i % 2 == 0) {
            sem_wait(&fork[i]);           // 왼쪽 먼저
            sem_wait(&fork[(i+1) % 5]);  // 오른쪽
        } else {
            sem_wait(&fork[(i+1) % 5]);  // 오른쪽 먼저
            sem_wait(&fork[i]);           // 왼쪽
        }

        eat();

        sem_post(&fork[i]);
        sem_post(&fork[(i+1) % 5]);
    }
}
```

비대칭이 순환 대기 조건을 깨뜨립니다.

---

## 현대적 대안

### 조건 변수

뮤텍스와 함께 "조건이 참이 될 때까지 대기" 의미론을 위해 사용합니다:

```cpp
std::mutex mtx;
std::condition_variable cv;
bool ready = false;

// 대기 스레드:
std::unique_lock<std::mutex> lock(mtx);
cv.wait(lock, [] { return ready; });  // 원자적으로 락 해제하고 대기
// 조건이 참, 락 재획득

// 알림 스레드:
{
    std::lock_guard<std::mutex> lock(mtx);
    ready = true;
}
cv.notify_one();  // 또는 notify_all()
```

### 원자적 연산

단순한 공유 변수에는 하드웨어 지원 원자적 연산을 사용합니다 — 락이 필요 없습니다:

```cpp
#include <atomic>

std::atomic<int> counter(0);

// 락 없이 스레드 안전:
counter++;              // atomic fetch_add
counter.compare_exchange_strong(expected, desired);  // CAS
```

원자적 연산은 x86의 `LOCK XADD`, `CMPXCHG` 같은 CPU 명령어를 사용합니다. 단순 연산에서 뮤텍스보다 약 10배 빠릅니다.

### 읽기-쓰기 락

```cpp
#include <shared_mutex>

std::shared_mutex rwmtx;

// 여러 독자:
std::shared_lock<std::shared_mutex> read_lock(rwmtx);

// 단일 작성자:
std::unique_lock<std::shared_mutex> write_lock(rwmtx);
```

동시 읽기 허용, 독점적 쓰기 — 읽기가 쓰기보다 훨씬 많을 때 이상적입니다.

### 모니터 (Monitor)

**모니터**는 공유 데이터, 그 데이터에 대한 연산, 접근에 필요한 동기화를 단일 모듈로 묶는 고수준 동기화 구조체입니다. 한 번에 하나의 스레드만 모니터 내에서 활성화될 수 있습니다 — 상호 배제가 자동입니다.

Hoare (1974)와 Brinch Hansen (1973)이 제안했습니다. Java의 `synchronized` 키워드와 C#의 `lock` 문의 기반입니다.

```java
// Java: synchronized 키워드는 모니터를 구현합니다
class BoundedBuffer {
    private int[] buffer = new int[10];
    private int count = 0, in = 0, out = 0;

    public synchronized void produce(int item) throws InterruptedException {
        while (count == buffer.length)
            wait();            // 모니터 락 해제, 알림까지 슬립
        buffer[in] = item;
        in = (in + 1) % buffer.length;
        count++;
        notifyAll();           // 대기 중인 소비자 깨우기
    }

    public synchronized int consume() throws InterruptedException {
        while (count == 0)
            wait();
        int item = buffer[out];
        out = (out + 1) % buffer.length;
        count--;
        notifyAll();
        return item;
    }
}
```

**Hoare vs Mesa 의미론**: `signal()` 호출 시 신호자가 즉시 모니터를 신호받은 스레드에 양보하는가 (Hoare), 아니면 신호받은 스레드가 단순히 실행 가능해지는가 (Mesa)? Mesa 의미론 (Java, POSIX, C++에서 사용)은 신호받은 스레드가 `while` 루프에서 조건을 재확인해야 합니다.

```c
// POSIX: Mesa 의미론 — while 루프 필수
pthread_mutex_lock(&mutex);
while (!condition)                   // if가 아님 — 재확인 필요
    pthread_cond_wait(&cond, &mutex);
pthread_mutex_unlock(&mutex);
```

### 배리어 동기화

**배리어**는 지정된 수의 스레드가 배리어 지점에 도달할 때까지 모든 스레드를 차단한 후 동시에 해제합니다.

```c
pthread_barrier_t barrier;
pthread_barrier_init(&barrier, NULL, NUM_THREADS);

void *worker(void *arg) {
    compute_phase1();
    pthread_barrier_wait(&barrier);  // 모든 스레드가 phase 1 완료할 때까지 대기
    compute_phase2();
    return NULL;
}
```

배리어는 병렬 컴퓨팅에서 필수적입니다 — 행렬 분해, 병렬 정렬, 반복 솔버 — 각 단계가 모든 스레드의 이전 단계 완료에 의존하는 경우.

### Futex (Fast Userspace Mutex)

Linux의 **futex**는 POSIX 뮤텍스와 조건 변수의 기반 메커니즘입니다. 빠른 유저 공간 원자적 연산과 경합 발생 시 커널 공간 블로킹을 결합합니다:

**비경합 (빠른 경로)**: 유저 공간에서 단일 원자적 명령어로 잠금/해제 — 시스템 콜 불필요. 다른 스레드가 경합하지 않으면 `pthread_mutex_lock()`은 커널에 진입하지 않습니다.

**경합 (느린 경로)**: 락이 보유 중이면 스레드가 `futex(FUTEX_WAIT)` 시스템 콜로 커널에서 슬립합니다. 락 보유자가 해제할 때 대기자가 있는지 확인하고 `futex(FUTEX_WAKE)`를 호출합니다.

일반적인 경우(경합 없음)에서 뮤텍스 연산 비용은 약 25ns(원자적 명령어 하나)입니다. 경합이 있을 때만 시스템 콜 오버헤드(~1μs)가 발생합니다.

### 메모리 순서화와 배리어

현대 멀티코어 CPU에서 하드웨어는 성능을 위해 메모리 연산을 **재순서화**할 수 있습니다. 컴파일러도 명령어를 재순서화할 수 있습니다. 이것이 락 프리 알고리즘을 깨뜨릴 수 있습니다:

```c
// 스레드 1               // 스레드 2
data = 42;               while (!ready) {}
ready = true;            printf("%d\n", data);  // 0이 출력될 수 있음!
```

배리어 없이 스레드 2는 하드웨어 재순서화로 `data = 42` 전에 `ready = true`를 볼 수 있습니다.

**메모리 순서화 모델**:

| 모델 | 보장 |
|---|---|
| **순차 일관성** | 모든 연산이 모든 코어에서 프로그램 순서대로 나타남. 가장 강하지만 가장 느림. |
| **획득-해제** | 획득 로드가 매칭 해제 전의 모든 저장을 봄. 뮤텍스 잠금/해제에 사용. |
| **완화** | 순서 보장 없음. 원자성만 보장. 가장 빠름. |

C++ `std::atomic`은 명시적 메모리 순서를 지원합니다:

```cpp
std::atomic<bool> ready(false);
int data = 0;

// 스레드 1
data = 42;
ready.store(true, std::memory_order_release);

// 스레드 2
while (!ready.load(std::memory_order_acquire)) {}
assert(data == 42);  // 보장됨
```

### 락 프리와 대기 프리 자료구조

**락 프리**: 유한 단계 내에 적어도 하나의 스레드가 진행 (데드락 없음, 개별 스레드는 지연될 수 있음).

**대기 프리**: 모든 스레드가 한정된 단계 내에 진행 (가장 강한 보장, 구현이 가장 어려움).

기본 구성 요소는 **Compare-and-Swap (CAS)**:

```c
// 원자적 CAS: *addr == expected이면 *addr = desired로 설정, true 반환
// 그렇지 않으면 expected = *addr으로 설정, false 반환
bool cas(int *addr, int *expected, int desired);
```

**ABA 문제**: 스레드의 읽기와 CAS 사이에 다른 스레드가 값을 A→B→A로 변경할 수 있습니다. CAS는 성공하지만 상태가 변경되었을 수 있습니다. 해결: 태그 포인터 (포인터와 함께 버전 카운터 포함).

### RCU (Read-Copy-Update)

**RCU**는 읽기 위주 자료구조에 최적화된 동기화 메커니즘입니다 (Linux 커널에서 광범위하게 사용). 읽기 측은 어떤 락이나 원자적 명령어도 없이 데이터에 접근합니다 — 제로 오버헤드. 쓰기 측은 데이터의 새 버전을 생성하고 포인터를 교체합니다. 기존 읽기 측이 모두 완료된 후 이전 버전을 해제합니다.

RCU는 초당 수백만 번 읽히지만 드물게 업데이트되는 자료구조(라우팅 테이블, 설정 데이터, 커널의 모듈 리스트)에 이상적입니다. Linux 커널에는 약 15,000개의 RCU 사용 지점이 있습니다.

---

## 풀이 예제: 세마포어를 이용한 생산자-소비자

**생산자-소비자** (유한 버퍼) 문제는 계수 세마포어의 대표적인 사용 사례입니다. 고정 크기 버퍼가 생산자와 소비자 사이에 위치하며, 생산자는 버퍼를 초과해서는 안 되고 소비자는 빈 버퍼에서 읽어서는 안 됩니다.

### 설정

- **버퍼 크기**: 3칸
- `empty` (계수 세마포어, 초기값 **3**) — 사용 가능한 빈 칸의 수를 추적. 생산자는 쓰기 전에 `wait(empty)` 호출, 소비자가 칸을 해제한 후 `signal(empty)` 호출
- `full` (계수 세마포어, 초기값 **0**) — 채워진 칸의 수를 추적. 생산자는 쓰기 후 `signal(full)` 호출, 소비자는 읽기 전에 `wait(full)` 호출
- `mutex` (이진 세마포어 / 뮤텍스, 초기값 **1**) — 버퍼 자체를 동시 접근으로부터 보호

### 단계별 트레이스

| 단계 | 스레드 | 동작 | empty | full | mutex | 버퍼 |
|------|--------|------|-------|------|-------|------|
| 0 | — | 초기 상태 | 3 | 0 | 1 | `[]` |
| 1 | P | `wait(empty)` 성공 | **2** | 0 | 1 | `[]` |
| 2 | P | `wait(mutex)` 성공 | 2 | 0 | **0** | `[]` |
| 3 | P | 버퍼에 항목 **A** 쓰기 | 2 | 0 | 0 | `[A]` |
| 4 | P | `signal(mutex)` | 2 | 0 | **1** | `[A]` |
| 5 | P | `signal(full)` | 2 | **1** | 1 | `[A]` |
| 6 | P | `wait(empty)` 성공 | **1** | 1 | 1 | `[A]` |
| 7 | P | `wait(mutex)` 성공 | 1 | 1 | **0** | `[A]` |
| 8 | P | 버퍼에 항목 **B** 쓰기 | 1 | 1 | 0 | `[A, B]` |
| 9 | P | `signal(mutex)` | 1 | 1 | **1** | `[A, B]` |
| 10 | P | `signal(full)` | 1 | **2** | 1 | `[A, B]` |
| 11 | C | `wait(full)` 성공 | 1 | **1** | 1 | `[A, B]` |
| 12 | C | `wait(mutex)` 성공 | 1 | 1 | **0** | `[A, B]` |
| 13 | C | 버퍼에서 항목 **A** 읽기 | 1 | 1 | 0 | `[B]` |
| 14 | C | `signal(mutex)` | 1 | 1 | **1** | `[B]` |
| 15 | C | `signal(empty)` | **2** | 1 | 1 | `[B]` |
| 16 | P | `wait(empty)` 성공 | **1** | 1 | 1 | `[B]` |
| 17 | P | `wait(mutex)` 성공 | 1 | 1 | **0** | `[B]` |
| 18 | P | 버퍼에 항목 **C** 쓰기 | 1 | 1 | 0 | `[B, C]` |
| 19 | P | `signal(mutex)` | 1 | 1 | **1** | `[B, C]` |
| 20 | P | `signal(full)` | 1 | **2** | 1 | `[B, C]` |
| 21 | P | `wait(empty)` 성공 | **0** | 2 | 1 | `[B, C]` |
| 22 | P | `wait(mutex)` 성공 | 0 | 2 | **0** | `[B, C]` |
| 23 | P | 버퍼에 항목 **D** 쓰기 | 0 | 2 | 0 | `[B, C, D]` |
| 24 | P | `signal(mutex)` | 0 | 2 | **1** | `[B, C, D]` |
| 25 | P | `signal(full)` | 0 | **3** | 1 | `[B, C, D]` |

### 버퍼 가득 참 — 생산자 블록

25단계에서 `empty = 0`입니다. 생산자가 또 다른 항목을 시도하면:

```
P: wait(empty)  →  empty = 0이므로 P가 블록됨 (OS에 의해 일시 중단)
```

생산자는 디스케줄되어 소비자가 `signal(empty)`를 호출할 때(15단계 패턴)만 깨어납니다. 이것이 세마포어의 **흐름 제어** 보장입니다: 바쁜 대기 없음, 버퍼 오버플로 없음.

### 버퍼 비어 있음 — 소비자 블록

25단계 이후 두 번째 소비자가 즉시 읽기를 시도한다고 가정하면:

```
C2: wait(full)  →  full = 3, 성공  (full → 2)
C2: wait(mutex) →  성공
C2: 버퍼에서 항목 읽기
C2: signal(mutex)
C2: signal(empty)  (empty → 1)

C3: wait(full)  →  ...
    (full = 0이 될 때까지 계속 소비)

C3: wait(full)  →  full = 0이므로 C3가 블록됨
```

C3는 생산자가 `signal(full)`을 호출할 때까지 일시 중단됩니다. 항목 손실도, 중복 읽기도 없습니다.

### Python 구현

```python
import threading
import time
import random
from collections import deque

BUFFER_SIZE = 3

buffer: deque = deque()
empty = threading.Semaphore(BUFFER_SIZE)   # 사용 가능한 빈 슬롯
full  = threading.Semaphore(0)             # 채워진 슬롯
mutex = threading.Semaphore(1)            # 버퍼 접근에 대한 상호 배제

def producer(name: str, items: list[str]) -> None:
    for item in items:
        time.sleep(random.uniform(0.1, 0.3))  # 생산 시간 시뮬레이션
        empty.acquire()          # 빈 슬롯 대기
        mutex.acquire()          # 임계 구역 진입
        buffer.append(item)
        print(f"[{name}] 생산: {item!r}  buffer={list(buffer)}")
        mutex.release()          # 임계 구역 퇴출
        full.release()           # 새 항목 사용 가능 신호

def consumer(name: str, n: int) -> None:
    for _ in range(n):
        full.acquire()           # 채워진 슬롯 대기
        mutex.acquire()          # 임계 구역 진입
        item = buffer.popleft()
        print(f"[{name}] 소비: {item!r}  buffer={list(buffer)}")
        mutex.release()          # 임계 구역 퇴출
        empty.release()          # 슬롯이 이제 비어 있음을 신호
        time.sleep(random.uniform(0.1, 0.4))  # 소비 시간 시뮬레이션

if __name__ == "__main__":
    items = ["A", "B", "C", "D", "E", "F"]
    t_prod = threading.Thread(target=producer, args=("생산자", items))
    t_cons = threading.Thread(target=consumer, args=("소비자", len(items)))
    t_prod.start()
    t_cons.start()
    t_prod.join()
    t_cons.join()
    print("완료.")
```

핵심 포인트:
- 쓰기 전 `empty.acquire()`와 소비 후 `empty.release()`가 상한을 강제합니다.
- 읽기 전 `full.acquire()`와 생산 후 `full.release()`가 하한을 강제합니다.
- `mutex`는 실제 버퍼 조작만 감싸 임계 구역을 최대한 짧게 유지합니다.

---

## 풀이 예제: 독자-저자 문제

**독자-저자** 문제는 공유 자원(데이터베이스, 파일, 캐시)을 동시에 읽을 수 있지만 독점적으로 써야 하는 모든 시스템을 모델링합니다.

### 규칙

1. 여러 독자가 **동시에** 읽을 수 있습니다.
2. 저자는 **독점** 접근이 필요합니다 — 다른 독자나 저자 없음.

### 구현

```python
import threading
import time

# 공유 상태
read_count = 0
data = 0

# 동기화 기본 요소
read_count_mutex = threading.Lock()   # read_count 보호
write_lock       = threading.Lock()   # 저자(및 첫/마지막 독자)에 대한 독점 접근

def reader(name: str) -> None:
    global read_count, data

    # --- 진입 구역 ---
    with read_count_mutex:
        read_count += 1
        if read_count == 1:
            write_lock.acquire()   # 첫 번째 독자가 저자를 블록
    # read_count_mutex 해제; 여러 독자가 동시에 진입

    # --- 읽기 (데이터에 대한 임계 구역) ---
    print(f"[{name}] data = {data} 읽기 중  (활성 독자: {read_count})")
    time.sleep(0.2)

    # --- 퇴출 구역 ---
    with read_count_mutex:
        read_count -= 1
        if read_count == 0:
            write_lock.release()   # 마지막 독자가 저자를 언블록

def writer(name: str, value: int) -> None:
    global data

    # --- 진입 구역 ---
    write_lock.acquire()

    # --- 쓰기 (임계 구역) ---
    data = value
    print(f"[{name}] data = {data} 쓰기 중")
    time.sleep(0.3)

    # --- 퇴출 구역 ---
    write_lock.release()
```

### 실행 트레이스

```
시간 흐름 →

독자1   ──[read_count_mutex 획득, read_count=1, write_lock 획득]──[읽기 중]──[read_count=0, write_lock 해제]──
독자2   ──────[read_count_mutex 획득, read_count=2]──[읽기 중]──[read_count=1]──[read_count=0, write_lock 해제]──
저자1   ────────────────────[write_lock 획득 시도 … 블록됨]──────────────────────────────────[언블록됨, 쓰기 중]──

단계별:
1. 독자1 진입: read_count → 1, write_lock 획득 (저자1 블록), 읽기 시작.
2. 독자2 진입: read_count → 2, write_lock 이미 보유 — 독자2가 독자1과 동시에 읽기.
3. 저자1이 write_lock.acquire() 호출 → 블록됨 (write_lock이 독자에게 보유됨).
4. 독자1 완료: read_count → 1 (0이 아님, write_lock 유지됨).
5. 독자2 완료: read_count → 0, 마지막 독자가 write_lock 해제.
6. 저자1이 언블록됨, write_lock 획득, 독점적으로 쓰기.
7. 저자1이 write_lock 해제 — 다음 독자 또는 저자 진행 가능.
```

### 참고

- 이것은 **첫 번째 독자-저자** 해법입니다(독자 우선). 독자가 계속 도착하면 저자가 기아 상태에 빠질 수 있습니다.
- **두 번째 해법**은 저자 우선을 제공합니다; 독자가 기아 상태에 빠질 수 있습니다.
- 실제 시스템(예: `pthread_rwlock`, Java `ReadWriteLock`, Python의 커스텀 `threading` 로직)은 기아를 피하기 위해 공정한 정책을 구현합니다.

---

## 언제 무엇을 쓸까: 뮤텍스 vs 이진 세마포어 vs 계수 세마포어

### 비교 표

| 사용 사례 | 최적 기본 요소 | 이유 |
|----------|--------------|------|
| 상호 배제 (임계 구역 보호) | **뮤텍스** | 소유권 의미론: 잠근 스레드만 해제 가능. 다른 스레드의 실수로 인한 해제를 방지. 우선순위 상속 지원. |
| N개의 동일한 슬롯을 가진 자원 풀 | **계수 세마포어** | 사용 가능한 자원의 수를 자연스럽게 추적. 값은 0에서 N까지 범위. |
| 일회성 이벤트 / 스레드 신호 | **이진 세마포어** | 스레드 A가 작업 후 `signal()`; 스레드 B가 신호를 기다려 `wait()`. 소유권 불필요 — B는 A에 의해 해제됨. |
| 유한 버퍼 (생산자-소비자) | **계수 세마포어** (×2) + **뮤텍스** | `empty`와 `full` 세마포어가 버퍼 한계를 강제; 뮤텍스가 버퍼 자료구조를 보호. |
| 독자-저자 | **뮤텍스** (read_count용) + **뮤텍스** (write_lock용) | `read_count_mutex`가 카운터를 보호; `write_lock`이 저자 독점성을 강제. |
| 일회성 초기화 (정확히 한 번만 실행) | **뮤텍스** + 플래그, 또는 언어 기본 요소 (`std::call_once`, `sync.Once`) | 뮤텍스가 플래그 확인-설정을 보호; 플래그가 첫 초기화 후 재진입을 방지. |

### 핵심 의미론적 차이: 소유권

| 속성 | 뮤텍스 | 세마포어 |
|------|--------|---------|
| 소유권 | **있음** — 잠근 스레드만 해제 가능 | **없음** — 어떤 스레드든 `signal()` 호출 가능 |
| 교착상태 감지 | 용이 (OS가 소유자 == 대기 스레드 감지 가능) | 어려움 |
| 우선순위 상속 | 지원 (우선순위 역전 방지) | 해당 없음 |
| 스레드 간 신호 | 의도된 용도 아님 | 이진 세마포어의 주요 사용 사례 |
| 재귀적 잠금 | 종종 지원 (`PTHREAD_MUTEX_RECURSIVE`) | 해당 없음 |

**소유권**이 결정적인 차이입니다:

- **뮤텍스**는 *소유권의 토큰*입니다. 획득한 스레드가 해제 책임이 있습니다. 다른 스레드가 소유하지 않은 뮤텍스를 해제하려 하면 오류이거나 정의되지 않은 동작 — 버그를 조기에 발견합니다.
- **세마포어**는 *신호 카운터*입니다. 한 스레드가 `wait()`하고 완전히 다른 스레드가 `signal()`할 수 있습니다. 이는 생산자-소비자 조정에 이상적이지만 뮤텍스 대체로 사용하면 위험합니다(누가 해제하는지 강제하는 것이 없음).

> **경험칙**: 자원을 소유하고 스스로 해제해야 할 때는 뮤텍스를 사용하세요. 다른 스레드에 신호를 보내거나 N개 자원 풀에 대한 접근을 제한할 때는 세마포어를 사용하세요.
