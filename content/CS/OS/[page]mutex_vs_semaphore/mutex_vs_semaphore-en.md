---
title: "Mutex vs Semaphore"
description: "Understanding critical sections, race conditions, mutual exclusion, and the differences between mutexes and semaphores — with practical examples and the classic producer-consumer problem."
date: "2026-03-04"
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
