---
title: "Mutex vs Semaphore"
description: "Understanding critical sections, race conditions, mutual exclusion, and the differences between mutexes and semaphores — with practical examples and the classic producer-consumer problem."
date: "2026-03-05"
category: "CS/OS"
tags: ["OS", "mutex", "semaphore", "concurrency", "synchronization", "race condition", "critical section"]
author: "Nemit"
featured: false
pinned: false
---

# Mutex vs Semaphore

## The Problem: Shared State and Race Conditions

When multiple threads (or processes) access shared data, things break.

```c
// Shared counter
int counter = 0;

// Thread 1                // Thread 2
counter++;                 counter++;
```

`counter++` is not atomic. In machine code it's:
1. Load `counter` from memory into register
2. Increment register
3. Store register back to memory

If Thread 1 and Thread 2 interleave:

```
Thread 1: LOAD  counter → reg1 (reg1 = 0)
Thread 2: LOAD  counter → reg2 (reg2 = 0)
Thread 1: ADD   reg1, 1  (reg1 = 1)
Thread 2: ADD   reg2, 1  (reg2 = 1)
Thread 1: STORE reg1 → counter  (counter = 1)
Thread 2: STORE reg2 → counter  (counter = 1)  ← WRONG, should be 2
```

Result: `counter = 1` instead of `2`. A **race condition** — the output depends on the timing/interleaving of threads.

---

## Critical Section

A **critical section** is a segment of code that accesses shared resources and must not be executed by more than one thread at a time.

Any solution to the critical section problem must satisfy:

1. **Mutual Exclusion**: At most one thread is in the critical section at any time.
2. **Progress**: If no thread is in the critical section and some want to enter, one must eventually be allowed in (no indefinite postponement from outside).
3. **Bounded Waiting**: A thread waiting to enter the critical section must eventually be allowed in — there's a bound on how many times others can enter before it does.

---

## Mutex (Mutual Exclusion Lock)

A **mutex** is a synchronization primitive that provides mutual exclusion. It has two states: **locked** and **unlocked**. Only the thread that locked it can unlock it.

### POSIX Mutex

```c
#include <pthread.h>

pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
int counter = 0;

void *increment(void *arg) {
    for (int i = 0; i < 100000; i++) {
        pthread_mutex_lock(&lock);    // Acquire lock
        counter++;                     // Critical section
        pthread_mutex_unlock(&lock);  // Release lock
    }
    return NULL;
}
```

`pthread_mutex_lock()`: if the mutex is unlocked, lock it and return. If already locked, **block** the calling thread until it becomes available.

`pthread_mutex_unlock()`: release the mutex. If threads are waiting, one is woken up.

### Mutex in C++ (RAII)

```cpp
#include <mutex>
#include <thread>

std::mutex mtx;
int counter = 0;

void increment() {
    for (int i = 0; i < 100000; i++) {
        std::lock_guard<std::mutex> lock(mtx);  // Locks on construction
        counter++;
        // lock_guard destructs here → mutex released automatically
    }
}
```

`std::lock_guard` uses RAII — the mutex is unlocked when the guard goes out of scope, even if an exception is thrown.

`std::unique_lock` is more flexible (can unlock manually, supports condition variables).

### Spinlock

A **spinlock** is a mutex variant where the waiting thread doesn't sleep — it **busy-waits** (spins in a loop checking if the lock is free):

```c
// Pseudocode
while (test_and_set(&lock)) {
    // spin
}
// critical section
lock = 0;
```

`test_and_set` is an atomic instruction that reads the current value and sets it to 1, all in one uninterruptible operation.

**When to use spinlocks**: When the critical section is very short (microseconds) and you're on a multicore machine. The spinning cost is less than a sleep+wakeup context switch. Linux uses spinlocks heavily in kernel code.

**When NOT to use spinlocks**: On single-core systems (spinlock holder can't run while you're spinning). When lock contention is high. When the critical section is long.

### Mutex Properties

| Property | Description |
|---|---|
| Owner | Only the locking thread can unlock it |
| Sleep | Blocked threads sleep (no CPU waste while waiting) |
| Recursion | By default, relocking from same thread → deadlock. `PTHREAD_MUTEX_RECURSIVE` prevents this |
| Priority inversion | A low-priority thread holding a mutex can block high-priority threads. Use priority inheritance mutexes to fix |

**Priority Inversion**: Low-priority task holds lock. High-priority task waits. Medium-priority task preempts low-priority, preventing it from releasing the lock. High-priority task is stuck behind medium-priority — inverted priorities.

**Priority Inheritance**: Temporarily boost the lock-holder's priority to match the highest-priority waiter. Used in real-time systems (Mars Pathfinder bug, 1997, was caused by priority inversion).

---

## Semaphore (Dijkstra, 1965)

A **semaphore** is a synchronization variable that holds an integer value and supports two atomic operations:

- **P() / wait() / down()**: Decrement the value. If value becomes negative, block the calling thread.
- **V() / signal() / up()**: Increment the value. If threads are waiting (value was negative), wake one up.

```
wait(S):
    S--;
    if (S < 0):
        add this thread to S's wait queue
        block this thread

signal(S):
    S++;
    if (S <= 0):
        remove a thread T from S's wait queue
        wake up T
```

### Binary Semaphore

Initial value = 1. Works like a mutex — only one thread in the critical section at a time.

```c
#include <semaphore.h>

sem_t sem;
sem_init(&sem, 0, 1);  // Initial value = 1

// Thread entering critical section:
sem_wait(&sem);    // P() — decrement, block if 0
// critical section
sem_post(&sem);    // V() — increment, wake a waiter
```

### Counting Semaphore

Initial value = N. Allows up to N threads to access a resource simultaneously.

```
sem_init(&sem, 0, N);  // N concurrent accesses allowed
```

Use case: a connection pool with N connections. Each thread does `sem_wait` before taking a connection and `sem_post` after returning it. If all N connections are in use, the (N+1)th thread blocks.

---

## Mutex vs Semaphore: Key Differences

| Property | Mutex | Semaphore |
|---|---|---|
| **Ownership** | Locked by one thread, unlocked by the same thread | Any thread can call signal() — no ownership |
| **Value** | Binary (locked/unlocked) | Integer (0 to N) |
| **Purpose** | Mutual exclusion (protect critical section) | Signaling + resource counting |
| **Scope** | Usually within a single process | Can be used across processes (named semaphores) |
| **Starvation** | Implementation-dependent (fair if queued FIFO) | Possible if not careful |
| **Deadlock risk** | Yes (if same thread re-locks without recursive flag) | Yes (if wait/signal unbalanced) |

**Key insight**: A mutex is about **ownership** (the locker must be the unlocker). A semaphore is about **signaling** (one thread can signal another).

### Use Mutex When:
- Protecting a shared variable or data structure
- Ensuring only one thread executes a block at a time
- Need ownership semantics (only the thread that locked can unlock)

### Use Semaphore When:
- Signaling between threads (e.g., producer signals consumer that work is ready)
- Limiting access to N resources (connection pool, thread pool)
- Need cross-process synchronization (named semaphore)
- Implementing complex synchronization patterns

---

## Classic Problem: Producer-Consumer

The producer produces items and puts them in a bounded buffer. The consumer takes items from the buffer. The buffer holds at most N items.

Constraints:
- Producer must wait if buffer is full
- Consumer must wait if buffer is empty
- Buffer access must be mutually exclusive

```c
#define N 10

sem_t empty;   // Counts empty slots  (initially N)
sem_t full;    // Counts filled slots (initially 0)
sem_t mutex;   // Protects buffer access (initially 1 = binary semaphore)

int buffer[N];
int in = 0, out = 0;

void *producer(void *arg) {
    while (1) {
        int item = produce_item();

        sem_wait(&empty);   // Wait for an empty slot
        sem_wait(&mutex);   // Enter critical section

        buffer[in] = item;
        in = (in + 1) % N;

        sem_post(&mutex);   // Leave critical section
        sem_post(&full);    // Signal: one more full slot
    }
}

void *consumer(void *arg) {
    while (1) {
        sem_wait(&full);    // Wait for a full slot
        sem_wait(&mutex);   // Enter critical section

        int item = buffer[out];
        out = (out + 1) % N;

        sem_post(&mutex);   // Leave critical section
        sem_post(&empty);   // Signal: one more empty slot

        consume_item(item);
    }
}
```

Note: `mutex` here is a semaphore used as a mutex. The order of `sem_wait(&empty/full)` and `sem_wait(&mutex)` matters — reversing them can cause deadlock.

---

## Classic Problem: Readers-Writers

Multiple readers can read simultaneously. Only one writer at a time, and no readers can read while a writer writes.

```c
sem_t mutex;    // Protects reader_count
sem_t wrt;      // Exclusive access for writers (and first/last reader)
int reader_count = 0;

void *reader(void *arg) {
    while (1) {
        sem_wait(&mutex);
        reader_count++;
        if (reader_count == 1)
            sem_wait(&wrt);    // First reader locks out writers
        sem_post(&mutex);

        // READ — multiple readers can be here simultaneously

        sem_wait(&mutex);
        reader_count--;
        if (reader_count == 0)
            sem_post(&wrt);    // Last reader releases writers
        sem_post(&mutex);
    }
}

void *writer(void *arg) {
    while (1) {
        sem_wait(&wrt);    // Exclusive access
        // WRITE
        sem_post(&wrt);
    }
}
```

This solution prioritizes readers — if readers keep arriving, a writer may starve. Writers-preference and fair solutions exist.

---

## Classic Problem: Dining Philosophers

Five philosophers sit around a table. Each needs two forks (left and right) to eat. Only five forks total. If all pick up their left fork simultaneously, deadlock.

```
    🍝
  🍴   🍴
🧑      🧑
  🍴   🍴
    🧑
```

**Deadlock solution — odd/even asymmetry:**

```c
void philosopher(int i) {
    while (1) {
        think();

        if (i % 2 == 0) {
            sem_wait(&fork[i]);           // Pick up left first
            sem_wait(&fork[(i+1) % 5]);  // Pick up right
        } else {
            sem_wait(&fork[(i+1) % 5]);  // Pick up right first
            sem_wait(&fork[i]);           // Pick up left
        }

        eat();

        sem_post(&fork[i]);
        sem_post(&fork[(i+1) % 5]);
    }
}
```

Asymmetry breaks the circular wait condition.

---

## Modern Alternatives

### Condition Variables

Used with mutexes for "wait until condition is true" semantics:

```cpp
std::mutex mtx;
std::condition_variable cv;
bool ready = false;

// Waiter thread:
std::unique_lock<std::mutex> lock(mtx);
cv.wait(lock, [] { return ready; });  // Atomically releases lock and waits
// ... condition is true, lock re-acquired

// Notifier thread:
{
    std::lock_guard<std::mutex> lock(mtx);
    ready = true;
}
cv.notify_one();  // or notify_all()
```

`cv.wait()` atomically releases the mutex and sleeps — prevents the race condition between checking the condition and going to sleep.

### Atomic Operations

For simple shared variables, use hardware-supported atomic operations — no lock needed:

```cpp
#include <atomic>

std::atomic<int> counter(0);

// Thread-safe without any lock:
counter++;              // atomic fetch_add
counter.fetch_add(1);   // explicit
counter.compare_exchange_strong(expected, desired);  // CAS
```

Atomic operations use CPU instructions like `LOCK XADD`, `CMPXCHG` on x86. Order of magnitude faster than mutex for simple operations.

### Read-Write Lock

```cpp
#include <shared_mutex>

std::shared_mutex rwmtx;

// Multiple readers:
std::shared_lock<std::shared_mutex> read_lock(rwmtx);

// Single writer:
std::unique_lock<std::shared_mutex> write_lock(rwmtx);
```

Allows concurrent reads, exclusive writes — ideal when reads greatly outnumber writes.

### Monitors

A **monitor** is a high-level synchronization construct that bundles shared data, operations on that data, and the synchronization needed to access it, into a single module. Only one thread can be active inside a monitor at a time — mutual exclusion is automatic.

Monitors were proposed by C.A.R. Hoare (1974) and Per Brinch Hansen (1973). They're the foundation of Java's `synchronized` keyword and C#'s `lock` statement.

```java
// Java: synchronized keyword implements a monitor
class BoundedBuffer {
    private int[] buffer = new int[10];
    private int count = 0, in = 0, out = 0;

    public synchronized void produce(int item) throws InterruptedException {
        while (count == buffer.length)
            wait();            // Release monitor lock, sleep until notified
        buffer[in] = item;
        in = (in + 1) % buffer.length;
        count++;
        notifyAll();           // Wake up waiting consumers
    }

    public synchronized int consume() throws InterruptedException {
        while (count == 0)
            wait();            // Release monitor lock, sleep until notified
        int item = buffer[out];
        out = (out + 1) % buffer.length;
        count--;
        notifyAll();           // Wake up waiting producers
        return item;
    }
}
```

Inside a monitor, **condition variables** allow threads to wait for specific conditions:

- `wait()` — release the monitor lock and sleep until signaled
- `signal()` (or `notify()`) — wake one waiting thread
- `broadcast()` (or `notifyAll()`) — wake all waiting threads

**Hoare vs Mesa semantics**: When `signal()` is called, does the signaler immediately give up the monitor to the signaled thread (Hoare) or does the signaled thread merely become eligible to run (Mesa)? Mesa semantics (used by Java, POSIX, C++) requires the signaled thread to re-check its condition in a `while` loop, because another thread may have changed the state between the signal and when the thread actually runs.

```c
// POSIX: Mesa semantics — MUST use while loop
pthread_mutex_lock(&mutex);
while (!condition)                   // NOT if (!condition) — must re-check
    pthread_cond_wait(&cond, &mutex);
// condition is now true
pthread_mutex_unlock(&mutex);
```

### Barrier Synchronization

A **barrier** blocks all threads until a specified number of threads have reached the barrier point, then releases them all simultaneously.

```c
#include <pthread.h>

pthread_barrier_t barrier;
pthread_barrier_init(&barrier, NULL, NUM_THREADS);

void *worker(void *arg) {
    // Phase 1: each thread does its work
    compute_phase1();

    // Wait for ALL threads to finish phase 1
    pthread_barrier_wait(&barrier);

    // Phase 2: all threads proceed together
    compute_phase2();
    return NULL;
}
```

Barriers are essential in parallel computing — matrix decomposition, parallel sorting, iterative solvers — where each phase depends on all threads completing the previous phase.

### Futex (Fast Userspace Mutex)

Linux's **futex** (`man futex`) is the underlying mechanism for POSIX mutexes and condition variables. It combines fast user-space atomic operations with kernel-space blocking for the contended case:

**Uncontended (fast path)**: Lock/unlock with a single atomic instruction in user space — no syscall needed. If no other thread is contending, `pthread_mutex_lock()` never enters the kernel.

**Contended (slow path)**: If the lock is held, the thread makes a `futex(FUTEX_WAIT)` syscall to sleep in the kernel. When the lock holder releases, it checks if anyone is waiting and calls `futex(FUTEX_WAKE)` to wake them.

```
Uncontended lock:
  atomic_cmpxchg(lock, 0, 1)  →  success  →  return  (no syscall!)

Contended lock:
  atomic_cmpxchg(lock, 0, 1)  →  fail (lock held)
  futex(FUTEX_WAIT, &lock, 1) →  kernel puts thread to sleep
  [woken up by FUTEX_WAKE]    →  retry atomic_cmpxchg
```

This design means that in the common case (no contention), mutex operations cost only ~25ns (one atomic instruction). Only under contention do they incur syscall overhead (~1μs).

### Memory Ordering and Barriers

On modern multi-core CPUs, the hardware may **reorder** memory operations for performance. Compilers may also reorder instructions. This can break lock-free algorithms:

```c
// Thread 1               // Thread 2
data = 42;               while (!ready) {}
ready = true;            printf("%d\n", data);  // Might print 0!
```

Without barriers, Thread 2 might see `ready = true` before `data = 42` due to hardware reordering.

**Memory ordering models**:

| Model | Guarantee |
|---|---|
| **Sequential consistency** | All operations appear in program order across all cores. Strongest but slowest. |
| **Acquire-release** | Acquire load sees all stores that happened before the matching release. Used by mutex lock/unlock. |
| **Relaxed** | No ordering guarantees. Only guarantees atomicity. Fastest. |

C++ `std::atomic` supports explicit memory orders:

```cpp
std::atomic<bool> ready(false);
int data = 0;

// Thread 1
data = 42;
ready.store(true, std::memory_order_release);  // Everything before this is visible

// Thread 2
while (!ready.load(std::memory_order_acquire)) {}  // Sees everything before release
assert(data == 42);  // Guaranteed
```

**Hardware memory barriers** (fences):
- x86: `mfence` (full fence), `sfence` (store fence), `lfence` (load fence)
- ARM: `dmb` (data memory barrier), `dsb` (data synchronization barrier)
- C11/C++11: `atomic_thread_fence()`

x86 has a **relatively strong** memory model (Total Store Order — stores are seen in order by all cores). ARM and RISC-V have **weak** memory models — explicit barriers are needed more often.

### Lock-Free and Wait-Free Data Structures

**Lock-free**: At least one thread makes progress in a finite number of steps (no deadlock, but individual threads may be delayed).

**Wait-free**: Every thread makes progress in a bounded number of steps (strongest guarantee, but hardest to implement).

The fundamental building block is **Compare-and-Swap (CAS)**:

```c
// Atomic CAS: if *addr == expected, set *addr = desired, return true
// Otherwise, set expected = *addr, return false
bool cas(int *addr, int *expected, int desired);
```

**Lock-free stack** (Treiber stack):

```c
struct Node { int data; struct Node *next; };
_Atomic(struct Node *) top = NULL;

void push(int value) {
    struct Node *new_node = malloc(sizeof(struct Node));
    new_node->data = value;
    new_node->next = atomic_load(&top);
    while (!atomic_compare_exchange_weak(&top, &new_node->next, new_node)) {
        // CAS failed — top changed, retry with updated value
    }
}
```

No mutex is needed. Multiple threads can push simultaneously. CAS ensures only one succeeds per cycle; others retry.

**ABA problem**: Between a thread's read and CAS, another thread could change the value from A to B and back to A. The CAS succeeds but the state may have changed. Solution: tagged pointers (include a version counter alongside the pointer).

### RCU (Read-Copy-Update)

**RCU** is a synchronization mechanism optimized for read-mostly data structures (used extensively in the Linux kernel). Readers access data without any locks or atomic instructions — zero overhead. Writers create a new version of the data and swap in the pointer. Old versions are freed after all pre-existing readers have finished.

```
Reader: read pointer → access data (no lock needed)
Writer: copy data → modify copy → atomic pointer swap → wait for readers to finish → free old data
```

RCU is ideal for data structures that are read millions of times per second but updated rarely (routing tables, configuration data, module lists in the kernel). The Linux kernel has ~15,000 RCU usage sites.

---

## Worked Example: Producer-Consumer with Semaphores

The **producer-consumer** (bounded-buffer) problem is the canonical use case for counting semaphores. A fixed-size buffer sits between producers and consumers; producers must not overflow it and consumers must not underflow it.

### Setup

- **Buffer size**: 3 slots
- `empty` (counting semaphore, initial value **3**) — tracks available empty slots; a producer calls `wait(empty)` before writing and `signal(empty)` after a consumer frees a slot
- `full` (counting semaphore, initial value **0**) — tracks filled slots; a producer calls `signal(full)` after writing and a consumer calls `wait(full)` before reading
- `mutex` (binary semaphore / mutex, initial value **1**) — protects the buffer itself from concurrent access

### Step-by-step Trace

| Step | Thread | Action | empty | full | mutex | Buffer |
|------|--------|--------|-------|------|-------|--------|
| 0 | — | Initial state | 3 | 0 | 1 | `[]` |
| 1 | P | `wait(empty)` succeeds | **2** | 0 | 1 | `[]` |
| 2 | P | `wait(mutex)` succeeds | 2 | 0 | **0** | `[]` |
| 3 | P | writes item **A** to buffer | 2 | 0 | 0 | `[A]` |
| 4 | P | `signal(mutex)` | 2 | 0 | **1** | `[A]` |
| 5 | P | `signal(full)` | 2 | **1** | 1 | `[A]` |
| 6 | P | `wait(empty)` succeeds | **1** | 1 | 1 | `[A]` |
| 7 | P | `wait(mutex)` succeeds | 1 | 1 | **0** | `[A]` |
| 8 | P | writes item **B** to buffer | 1 | 1 | 0 | `[A, B]` |
| 9 | P | `signal(mutex)` | 1 | 1 | **1** | `[A, B]` |
| 10 | P | `signal(full)` | 1 | **2** | 1 | `[A, B]` |
| 11 | C | `wait(full)` succeeds | 1 | **1** | 1 | `[A, B]` |
| 12 | C | `wait(mutex)` succeeds | 1 | 1 | **0** | `[A, B]` |
| 13 | C | reads item **A** from buffer | 1 | 1 | 0 | `[B]` |
| 14 | C | `signal(mutex)` | 1 | 1 | **1** | `[B]` |
| 15 | C | `signal(empty)` | **2** | 1 | 1 | `[B]` |
| 16 | P | `wait(empty)` succeeds | **1** | 1 | 1 | `[B]` |
| 17 | P | `wait(mutex)` succeeds | 1 | 1 | **0** | `[B]` |
| 18 | P | writes item **C** to buffer | 1 | 1 | 0 | `[B, C]` |
| 19 | P | `signal(mutex)` | 1 | 1 | **1** | `[B, C]` |
| 20 | P | `signal(full)` | 1 | **2** | 1 | `[B, C]` |
| 21 | P | `wait(empty)` succeeds | **0** | 2 | 1 | `[B, C]` |
| 22 | P | `wait(mutex)` succeeds | 0 | 2 | **0** | `[B, C]` |
| 23 | P | writes item **D** to buffer | 0 | 2 | 0 | `[B, C, D]` |
| 24 | P | `signal(mutex)` | 0 | 2 | **1** | `[B, C, D]` |
| 25 | P | `signal(full)` | 0 | **3** | 1 | `[B, C, D]` |

### Buffer Full — Producer Blocks

At step 25 `empty = 0`. If the producer attempts another item:

```
P: wait(empty)  →  empty = 0, so P BLOCKS (suspended by the OS)
```

The producer is descheduled and will only be woken when a consumer calls `signal(empty)` (step 15 pattern). This is the **flow-control** guarantee of the semaphore: no busy-waiting, no overflow.

### Buffer Empty — Consumer Blocks

Suppose after step 25 a second consumer tries to read immediately:

```
C2: wait(full)  →  full = 3, succeeds  (full → 2)
C2: wait(mutex) →  succeeds
C2: reads item from buffer
C2: signal(mutex)
C2: signal(empty)  (empty → 1)

C3: wait(full)  →  ...
    (keep consuming until full = 0)

C3: wait(full)  →  full = 0, so C3 BLOCKS
```

C3 is suspended until a producer calls `signal(full)`. No items are lost; no item is read twice.

### Python Implementation

```python
import threading
import time
import random
from collections import deque

BUFFER_SIZE = 3

buffer: deque = deque()
empty = threading.Semaphore(BUFFER_SIZE)   # empty slots available
full  = threading.Semaphore(0)             # filled slots available
mutex = threading.Semaphore(1)            # mutual exclusion for buffer access

def producer(name: str, items: list[str]) -> None:
    for item in items:
        time.sleep(random.uniform(0.1, 0.3))  # simulate production time
        empty.acquire()          # wait for an empty slot
        mutex.acquire()          # enter critical section
        buffer.append(item)
        print(f"[{name}] produced {item!r}  buffer={list(buffer)}")
        mutex.release()          # leave critical section
        full.release()           # signal that a new item is available

def consumer(name: str, n: int) -> None:
    for _ in range(n):
        full.acquire()           # wait for a filled slot
        mutex.acquire()          # enter critical section
        item = buffer.popleft()
        print(f"[{name}] consumed {item!r}  buffer={list(buffer)}")
        mutex.release()          # leave critical section
        empty.release()          # signal that a slot is now empty
        time.sleep(random.uniform(0.1, 0.4))  # simulate consumption time

if __name__ == "__main__":
    items = ["A", "B", "C", "D", "E", "F"]
    t_prod = threading.Thread(target=producer, args=("Producer", items))
    t_cons = threading.Thread(target=consumer, args=("Consumer", len(items)))
    t_prod.start()
    t_cons.start()
    t_prod.join()
    t_cons.join()
    print("Done.")
```

Key points:
- `empty.acquire()` before writing and `empty.release()` after consuming enforce the upper bound.
- `full.acquire()` before reading and `full.release()` after producing enforce the lower bound.
- `mutex` wraps only the actual buffer manipulation — keeping the critical section as short as possible.

---

## Worked Example: Readers-Writers Problem

The **readers-writers** problem models any system where a shared resource (database, file, cache) can be read concurrently but must be written exclusively.

### Rules

1. Any number of readers may read **simultaneously**.
2. A writer requires **exclusive** access — no other readers or writers.

### Implementation

```python
import threading
import time

# Shared state
read_count = 0
data = 0

# Synchronization primitives
read_count_mutex = threading.Lock()   # protects read_count
write_lock       = threading.Lock()   # exclusive access for writers (and first/last reader)

def reader(name: str) -> None:
    global read_count, data

    # --- Entry section ---
    with read_count_mutex:
        read_count += 1
        if read_count == 1:
            write_lock.acquire()   # first reader blocks writers
    # write_count_mutex released; multiple readers now inside

    # --- Reading (critical section for data) ---
    print(f"[{name}] reading data = {data}  (active readers: {read_count})")
    time.sleep(0.2)

    # --- Exit section ---
    with read_count_mutex:
        read_count -= 1
        if read_count == 0:
            write_lock.release()   # last reader unblocks writers

def writer(name: str, value: int) -> None:
    global data

    # --- Entry section ---
    write_lock.acquire()

    # --- Writing (critical section) ---
    data = value
    print(f"[{name}] writing data = {data}")
    time.sleep(0.3)

    # --- Exit section ---
    write_lock.release()
```

### Execution Trace

```
Timeline →

Reader1  ──[acquire read_count_mutex, read_count=1, acquire write_lock]──[reading]──[read_count=0, release write_lock]──
Reader2  ──────[acquire read_count_mutex, read_count=2]──[reading]──[read_count=1]──[read_count=0, release write_lock]──
Writer1  ────────────────────[acquire write_lock … BLOCKED]──────────────────────────────────[UNBLOCKED, writing]──

Step-by-step:
1. Reader1 enters: read_count → 1, acquires write_lock (blocks Writer1), starts reading.
2. Reader2 enters: read_count → 2, write_lock already held — Reader2 reads concurrently with Reader1.
3. Writer1 calls write_lock.acquire() → BLOCKS (write_lock is held by readers).
4. Reader1 finishes: read_count → 1 (not zero, write_lock stays held).
5. Reader2 finishes: read_count → 0, last reader releases write_lock.
6. Writer1 is unblocked, acquires write_lock, writes exclusively.
7. Writer1 releases write_lock — next reader or writer may proceed.
```

### Notes

- This is the **first readers-writers** solution (readers have priority). A writer can starve if readers arrive continuously.
- The **second solution** gives writers priority; a reader can starve.
- Production systems (e.g., `pthread_rwlock`, Java `ReadWriteLock`, Python `threading.RLock` with custom logic) implement fair policies to avoid starvation.

---

## When to Use: Mutex vs Binary Semaphore vs Counting Semaphore

### Comparison Table

| Use case | Best primitive | Why |
|----------|---------------|-----|
| Mutual exclusion (protect a critical section) | **Mutex** | Ownership semantics: only the thread that locked it can unlock it. Prevents accidental unlock by another thread. Supports priority inheritance. |
| Resource pool with N identical slots | **Counting semaphore** | Naturally tracks the number of available resources. Value ranges from 0 to N. |
| One-shot event / thread signaling | **Binary semaphore** | Thread A does work, then `signal()`s; Thread B `wait()`s until signaled. No ownership needed — B is released by A. |
| Bounded-buffer (producer-consumer) | **Counting semaphore** (×2) + **Mutex** | `empty` and `full` semaphores enforce buffer bounds; mutex protects the buffer data structure. |
| Readers-writers | **Mutex** (read_count) + **Mutex** (write_lock) | `read_count_mutex` protects a counter; `write_lock` enforces writer exclusivity. |
| Once-only initialization (run exactly once) | **Mutex** + flag, or language primitive (`std::call_once`, `sync.Once`) | Mutex guards the flag check-and-set; the flag prevents re-entry after first initialization. |

### The Key Semantic Difference: Ownership

| Property | Mutex | Semaphore |
|----------|-------|-----------|
| Ownership | **Yes** — only the locking thread may unlock | **No** — any thread may call `signal()` |
| Deadlock detection | Easier (OS can detect owner == waiting thread) | Harder |
| Priority inheritance | Supported (avoids priority inversion) | Not applicable |
| Signaling between threads | Not the intended use | Primary use case for binary semaphore |
| Recursive locking | Often supported (`PTHREAD_MUTEX_RECURSIVE`) | Not applicable |

**Ownership** is the defining distinction:

- A **mutex** is a *token of ownership*. The thread that acquires it is responsible for releasing it. If another thread tries to release a mutex it does not own, the behavior is either an error or undefined — which catches bugs early.
- A **semaphore** is a *signal counter*. One thread can `wait()` and a completely different thread can `signal()`. This makes semaphores ideal for producer-consumer coordination but dangerous as a drop-in mutex replacement (no one enforces who releases it).

> **Rule of thumb**: Use a mutex when you own a resource and must release it yourself. Use a semaphore when you need to signal another thread or limit access to a pool of N resources.
