---
title: "Deadlock: Conditions, Prevention, and Recovery"
description: "A thorough look at deadlocks in operating systems — the four necessary conditions, how to prevent and avoid them, and how to detect and recover when they occur."
date: "2026-03-05"
category: "CS/OS"
tags: ["OS", "deadlock", "mutex", "concurrency", "Banker's algorithm", "resource management"]
author: "Nemit"
featured: false
pinned: false
---

# Deadlock

## What Is a Deadlock?

A **deadlock** is a situation where a set of processes are permanently blocked because each process is waiting for a resource held by another process in the set. No process can make progress. The system is stuck.

Classic analogy: two cars on a one-lane bridge, one from each end. Neither can move forward without the other reversing first, but neither will reverse.

```
Process A holds R1, waiting for R2
Process B holds R2, waiting for R1
→ Deadlock
```

Deadlocks involve at minimum two processes and two resources. They can involve any number of each.

---

## The Four Necessary Conditions (Coffman Conditions)

Coffman et al. (1971) identified four conditions that must **all hold simultaneously** for a deadlock to occur. If any one is absent, deadlock is impossible.

### 1. Mutual Exclusion

At least one resource must be **non-shareable** — only one process can use it at a time. If a process holds the resource, any other requesting process must wait.

Example: a printer, a mutex, a write lock on a file.

Some resources are inherently shareable (read-only data, read locks) — those can't cause deadlock.

### 2. Hold and Wait

A process must be **holding at least one resource** while **waiting to acquire additional resources** held by other processes.

If a process could only request resources when it holds none, Hold and Wait wouldn't exist.

### 3. No Preemption

Resources cannot be forcibly taken away from a process. A resource is released **only voluntarily** by the process holding it, after that process has completed its task.

If the OS could preempt resources (take them away), it could break deadlock cycles.

### 4. Circular Wait

There exists a **circular chain** of processes where each process waits for a resource held by the next process in the chain.

```
P1 → R2 (held by P2)
P2 → R3 (held by P3)
P3 → R1 (held by P1)
```

This forms a cycle: P1 → P2 → P3 → P1. Circular Wait implies the other three conditions are met.

---

## Resource Allocation Graph (RAG)

A **Resource Allocation Graph** visualizes the state of resource allocation:

- **Circles** represent processes (P1, P2, ...)
- **Squares** represent resource types (R1, R2, ...)
- **Dots inside squares** represent instances of that resource
- **Request edge** P → R: process P is waiting for resource R
- **Assignment edge** R → P: a resource instance of R is assigned to P

**Deadlock detection via RAG:**
- If the graph has **no cycle** → no deadlock
- If every resource type has exactly **one instance**: a cycle → deadlock
- If resource types have **multiple instances**: a cycle is necessary but not sufficient; use a deadlock detection algorithm

Example cycle → deadlock (single-instance resources):

```
P1 → R1 → P2 → R2 → P1
          (R1 assigned to P2, R2 assigned to P1)
```

---

## Strategies for Handling Deadlock

There are four main strategies:

1. **Prevention** — Ensure at least one Coffman condition never holds
2. **Avoidance** — Dynamically check resource requests and only grant them if safe
3. **Detection and Recovery** — Allow deadlocks to occur, detect them, then break them
4. **Ignore (Ostrich Algorithm)** — Pretend deadlocks don't happen (valid if rare and costly to prevent)

---

## 1. Deadlock Prevention

Prevent deadlock by eliminating one of the four Coffman conditions.

### Eliminate Mutual Exclusion

Make resources shareable where possible. Read locks (shared locks) allow concurrent access. Spooling (e.g., printer spooler) virtualizes the printer so processes write to spool files instead of competing for the printer directly.

This isn't always possible — truly exclusive resources (write locks, physical devices) inherently need mutual exclusion.

### Eliminate Hold and Wait

**Option A: Request all resources at once.**
A process must request all resources it will ever need before starting. If any are unavailable, it waits without holding any.

Problem: A process may not know all future resource needs. Resources are held idle while waiting. Low resource utilization.

**Option B: Release before requesting.**
A process must release all currently held resources before requesting new ones.

Problem: Not always feasible (a process may need to hold one resource while using another).

### Eliminate No Preemption

If a process holding resources requests another that isn't available, preempt all its current resources. The process restarts when it can get all needed resources.

Works well for resources whose state can be saved and restored (CPU registers, memory). Works poorly for resources that can't be preempted safely (printers mid-job, locks protecting data mid-update).

### Eliminate Circular Wait

**Impose a total ordering on all resource types.** Processes must request resources in strictly increasing order of this numbering. A process holding resource type $R_i$ may only request resources $R_j$ where $j > i$.

Example ordering: R1 = mutex_A, R2 = mutex_B, R3 = file_lock.

If all threads always acquire mutexes in order (mutex_A before mutex_B), circular wait is impossible:

```c
// Always lock in order: mutex_A first, then mutex_B
pthread_mutex_lock(&mutex_A);
pthread_mutex_lock(&mutex_B);
// ... critical section ...
pthread_mutex_unlock(&mutex_B);
pthread_mutex_unlock(&mutex_A);
```

This is the most practical prevention strategy and is widely used.

---

## 2. Deadlock Avoidance

Rather than statically preventing conditions, avoidance dynamically examines each resource request and only grants it if the resulting state is **safe**.

### Safe State

A state is **safe** if there exists a **safe sequence** — an ordering of all processes such that each process can eventually acquire all needed resources using currently available resources plus resources held by preceding processes in the sequence.

A safe state guarantees no deadlock. An **unsafe state** doesn't guarantee deadlock, but it *may* lead to one.

```
Safe → no deadlock possible
Unsafe → deadlock possible (not certain)
```

### Banker's Algorithm (Dijkstra, 1965)

The most famous deadlock avoidance algorithm, originally designed for a bank that must ensure it can satisfy all clients' loan requests.

**Data structures** (for $n$ processes and $m$ resource types):

| Structure | Size | Meaning |
|---|---|---|
| `Available[m]` | vector | Available instances of each resource |
| `Max[n][m]` | matrix | Max demand of each process |
| `Allocation[n][m]` | matrix | Currently allocated to each process |
| `Need[n][m]` | matrix | Remaining need: `Need[i][j] = Max[i][j] - Allocation[i][j]` |

**Safety Algorithm:**

```
Work = Available
Finish[i] = false for all i

Repeat:
  Find i such that Finish[i] == false AND Need[i] <= Work
  If found:
    Work = Work + Allocation[i]
    Finish[i] = true
  Else:
    break

If all Finish[i] == true → Safe state
Else → Unsafe state
```

**Resource-Request Algorithm:**

When process $P_i$ requests `Request[i]`:

1. If `Request[i] > Need[i]` → error (exceeded declared maximum)
2. If `Request[i] > Available` → wait (resources not available)
3. Pretend to allocate: `Available -= Request[i]`, `Allocation[i] += Request[i]`, `Need[i] -= Request[i]`
4. Run safety algorithm on new state
5. If safe → grant request; else → restore state and make $P_i$ wait

**Limitations of Banker's Algorithm:**
- Requires knowing maximum resource needs in advance (often unrealistic)
- $O(n^2 \cdot m)$ complexity per request — overhead for every allocation
- Assumes fixed number of processes and resources
- Rarely used in practice in general-purpose OSes; more common in real-time systems

---

## 3. Deadlock Detection and Recovery

Allow deadlocks to occur. Periodically run a detection algorithm. When deadlock is found, break it.

### Detection Algorithm

Similar to Banker's safety algorithm but without the Max matrix:

**For single-instance resources:** detect a cycle in the Resource Allocation Graph. $O(n^2)$ with DFS.

**For multi-instance resources:**

```
Work = Available
Finish[i] = false if Allocation[i] != 0, else true

Repeat:
  Find i such that Finish[i] == false AND Request[i] <= Work
  If found:
    Work = Work + Allocation[i]
    Finish[i] = true
  Else:
    break

Processes with Finish[i] == false are deadlocked
```

### How Often to Run Detection?

- **After every request that fails**: catches deadlock immediately but expensive
- **Periodically** (every N seconds): may let deadlock persist
- **When CPU utilization drops below threshold**: deadlock often causes low utilization

### Recovery from Deadlock

Once deadlock is detected, the OS must break it.

**Option A: Process Termination**

- Kill all deadlocked processes (simple but expensive — work is lost)
- Kill one process at a time, re-run detection after each kill (until deadlock is broken)

**Which process to kill?**
- Process with lowest priority
- Process that has consumed the least CPU time (least work lost)
- Process holding the fewest resources
- Process with the most remaining work (killing it saves most resources)
- Interactive vs batch processes (prefer killing batch)

**Option B: Resource Preemption**

Preempt resources from some processes to give them to others.

- **Select victim**: minimize cost (CPU time used, resources held)
- **Rollback**: the victim process is rolled back to a safe state (requires checkpointing)
- **Starvation prevention**: ensure the same process isn't always chosen as victim; track how many times a process has been rolled back

### Checkpoint and Rollback

For resource preemption recovery to work, the system needs a mechanism to return a process to a consistent state.

**Checkpointing**: Periodically save the complete state of a process (registers, memory, open files) to stable storage. If the process must be rolled back, restore it from the most recent checkpoint.

```
Time:  0     5     10    15    20    25
       |     |     |     |     |     |
       start CP1   CP2   [deadlock]
                         ↑
                   rollback to CP2
```

Checkpointing is expensive — saving the full memory state of a process takes time and disk space. Systems that use this approach typically checkpoint infrequently and accept some lost work on rollback.

**Database-style approach**: Many database systems handle deadlocks via transaction rollback. The DBMS detects deadlock cycles in the wait-for graph and aborts (rolls back) the cheapest transaction. The application retries the aborted transaction. This is a practical, well-understood approach.

```sql
-- PostgreSQL detects deadlocks automatically:
-- ERROR: deadlock detected
-- DETAIL: Process 123 waits for ShareLock on transaction 456;
--         blocked by process 789.
-- HINT: See server log for query details.
```

---

## Deadlock in Resource Types

Different types of resources have different deadlock characteristics:

### Reusable Resources

Resources that can be used repeatedly without being consumed: CPU, memory, I/O devices, files, semaphores. Most deadlock theory focuses on reusable resources.

### Consumable Resources

Resources that are created (produced) and destroyed (consumed): signals, messages, interrupts, data in buffers. Deadlock with consumable resources:

```
P1 waits for message from P2
P2 waits for message from P1
→ Deadlock (neither can produce the message the other needs)
```

This type of deadlock is harder to detect because the resources don't exist yet — they need to be produced by the very processes that are waiting.

---

## Deadlock in Distributed Systems

In a distributed system, deadlock is harder to detect because:
- No single node has a complete view of all resource allocations
- Communication delays mean the global state is never perfectly consistent
- Phantom deadlocks can be falsely detected due to stale information

### Distributed Wait-For Graph

Each node maintains a local wait-for graph. A **coordinator** periodically collects local graphs and constructs a **global** wait-for graph to check for cycles.

Problems:
- Message delays can cause false positive detection (phantom deadlocks)
- The global graph may be inconsistent if processes change state during collection
- Coordinator failure leaves the system unable to detect deadlocks

### Edge Chasing

An alternative to centralized detection. When a process is blocked, it sends a **probe** message along the edges of the wait-for graph. If the probe returns to its origin, a cycle (deadlock) exists.

```
P1 (blocked by P2) sends probe → P2 (blocked by P3) forwards → P3 (blocked by P1) → cycle detected
```

Probes carry the initiator's ID. If a node receives a probe it originated, deadlock is confirmed.

---

## 4. The Ostrich Algorithm

Simply ignore the problem. Reboot or let users kill stuck processes manually.

Used when:
- Deadlocks are extremely rare
- The cost of prevention/detection outweighs the occasional deadlock
- Resources (e.g., process table slots) can occasionally be exhausted without full prevention

Most desktop operating systems (Windows, macOS, Linux) use this approach for some resource types and rely on users or watchdogs to detect and kill stuck processes. Full prevention would be too expensive and restrict programming models.

---

## Deadlock vs Livelock vs Starvation

These are related but distinct concepts:

| Condition | Description |
|---|---|
| **Deadlock** | Processes are stuck — none can make progress |
| **Livelock** | Processes actively execute but don't make progress (they keep responding to each other without advancing) |
| **Starvation** | A process can't get the resources it needs because others keep getting them first (not stuck, but indefinitely delayed) |

**Livelock example:**

```
Two people in a hallway keep moving to the same side to let each other pass.
Both keep moving, neither makes progress.
```

In software:

```c
// Thread A                    // Thread B
while (!try_lock(A)) {        while (!try_lock(B)) {
    release(B);                    release(A);
    sleep(random());               sleep(random());
}                              }
```

If the random backoffs don't diverge, they may repeatedly release and retry forever.

**Starvation** is solved by **aging** — gradually increase a waiting process's priority so it eventually gets served.

---

## Practical Deadlock Prevention in Real Code

**Lock ordering**: always acquire locks in the same order everywhere in the codebase.

```c
// Bad: Thread 1 locks A then B, Thread 2 locks B then A → deadlock risk
// Good: Both always lock in order A → B
```

**Lock timeouts**: use `pthread_mutex_timedlock()` or `std::try_lock()` with a timeout. If a lock can't be acquired within N ms, back off and retry.

**std::lock (C++)**: acquires multiple locks simultaneously without deadlock, using a deadlock-free algorithm:

```cpp
std::lock(mutex_a, mutex_b);  // Deadlock-free
std::lock_guard<std::mutex> la(mutex_a, std::adopt_lock);
std::lock_guard<std::mutex> lb(mutex_b, std::adopt_lock);
```

**Tools**: ThreadSanitizer (TSan) detects potential deadlocks and race conditions at runtime. Valgrind's helgrind does similar analysis.

```bash
# Compile with ThreadSanitizer
g++ -fsanitize=thread -g -o program program.cpp
./program
```

---

## Worked Example: Banker's Algorithm — Safe Sequence Detection

This example walks through the Banker's Algorithm with 5 processes (P0–P4) and 3 resource types (A, B, C).

### Initial State

**Available vector:**

| A | B | C |
|---|---|---|
| 3 | 3 | 2 |

**Max matrix** (maximum resources each process may ever request):

| Process | A | B | C |
|---------|---|---|---|
| P0      | 7 | 5 | 3 |
| P1      | 3 | 2 | 2 |
| P2      | 9 | 0 | 2 |
| P3      | 2 | 2 | 2 |
| P4      | 4 | 3 | 3 |

**Allocation matrix** (resources currently allocated to each process):

| Process | A | B | C |
|---------|---|---|---|
| P0      | 0 | 1 | 0 |
| P1      | 2 | 0 | 0 |
| P2      | 3 | 0 | 2 |
| P3      | 2 | 1 | 1 |
| P4      | 0 | 0 | 2 |

### Step 1 — Calculate the Need Matrix

`Need[i] = Max[i] − Allocation[i]` for each process:

| Process | A (Max−Alloc) | B (Max−Alloc) | C (Max−Alloc) |
|---------|--------------|--------------|--------------|
| P0      | 7 − 0 = **7** | 5 − 1 = **4** | 3 − 0 = **3** |
| P1      | 3 − 2 = **1** | 2 − 0 = **2** | 2 − 0 = **2** |
| P2      | 9 − 3 = **6** | 0 − 0 = **0** | 2 − 2 = **0** |
| P3      | 2 − 2 = **0** | 2 − 1 = **1** | 2 − 1 = **1** |
| P4      | 4 − 0 = **4** | 3 − 0 = **3** | 3 − 2 = **1** |

**Need matrix:**

| Process | A | B | C |
|---------|---|---|---|
| P0      | 7 | 4 | 3 |
| P1      | 1 | 2 | 2 |
| P2      | 6 | 0 | 0 |
| P3      | 0 | 1 | 1 |
| P4      | 4 | 3 | 1 |

### Step 2 — Run the Safety Algorithm

Starting values: `Work = [3, 3, 2]`, `Finish = [false, false, false, false, false]`

**Iteration 1 — Find a process where Need[i] ≤ Work:**

- P0: Need = [7,4,3] ≤ [3,3,2]? **No** (7 > 3)
- P1: Need = [1,2,2] ≤ [3,3,2]? **Yes** ✓

Select **P1**: `Work = Work + Allocation[P1] = [3,3,2] + [2,0,0] = [5,3,2]`, `Finish[P1] = true`

**Iteration 2 — Work = [5, 3, 2]:**

- P0: Need = [7,4,3] ≤ [5,3,2]? **No** (7 > 5, 4 > 3)
- P2: Need = [6,0,0] ≤ [5,3,2]? **No** (6 > 5)
- P3: Need = [0,1,1] ≤ [5,3,2]? **Yes** ✓

Select **P3**: `Work = [5,3,2] + [2,1,1] = [7,4,3]`, `Finish[P3] = true`

**Iteration 3 — Work = [7, 4, 3]:**

- P0: Need = [7,4,3] ≤ [7,4,3]? **Yes** ✓ ← but let's check P4 first
- P4: Need = [4,3,1] ≤ [7,4,3]? **Yes** ✓

Select **P4**: `Work = [7,4,3] + [0,0,2] = [7,4,5]`, `Finish[P4] = true`

**Iteration 4 — Work = [7, 4, 5]:**

- P0: Need = [7,4,3] ≤ [7,4,5]? **Yes** ✓

Select **P0**: `Work = [7,4,5] + [0,1,0] = [7,5,5]`, `Finish[P0] = true`

**Iteration 5 — Work = [7, 5, 5]:**

- P2: Need = [6,0,0] ≤ [7,5,5]? **Yes** ✓

Select **P2**: `Work = [7,5,5] + [3,0,2] = [10,5,7]`, `Finish[P2] = true`

All `Finish[i] = true` → **Safe state confirmed.**

### Step 3 — Safe Sequence

> **P1 → P3 → P4 → P0 → P2**

### Step 4 — Verification

| Step | Process | Work before | Need     | Can proceed? | Work after  |
|------|---------|-------------|----------|--------------|-------------|
| 1    | P1      | [3, 3, 2]   | [1, 2, 2] | Yes          | [5, 3, 2]  |
| 2    | P3      | [5, 3, 2]   | [0, 1, 1] | Yes          | [7, 4, 3]  |
| 3    | P4      | [7, 4, 3]   | [4, 3, 1] | Yes          | [7, 4, 5]  |
| 4    | P0      | [7, 4, 5]   | [7, 4, 3] | Yes          | [7, 5, 5]  |
| 5    | P2      | [7, 5, 5]   | [6, 0, 0] | Yes          | [10, 5, 7] |

Each process in the safe sequence can obtain all remaining resources it needs using whatever `Work` has accumulated from processes that ran before it — confirming no deadlock is possible.

---

## Worked Example: Resource Allocation Graph — Cycle Detection

A **Resource Allocation Graph (RAG)** uses directed edges to represent requests and assignments:

- `P → R` : process P is **requesting** resource R
- `R → P` : resource R is **assigned to** process P

### Example 1: Deadlock Exists

**Setup:**
- 3 processes: P1, P2, P3
- 2 resource types: R1 (1 instance), R2 (2 instances)
- Assignments: R1 → P1, R2 → P2, R2 → P3
- Requests: P1 → R2, P2 → R1, P3 → R1

**ASCII Graph:**

```
        ┌─────┐          ┌─────┐
        │     │◄─────────│     │
        │ P1  │          │ R1  │  (1 instance, assigned to P1)
        │     │─────────►│ [●] │
        └─────┘          └──┬──┘
            │               │
            │ requests R2   │ P2 requests R1
            ▼               │
        ┌───┴─┐          ┌──▼──┐
        │     │◄─────────│     │
        │ R2  │  assign  │ P2  │
        │[●][●]─────────►│     │
        └──┬──┘          └─────┘
           │
           │ assigned to P3
           ▼
        ┌─────┐
        │ P3  │─────────► R1 (P3 also requests R1)
        └─────┘
```

A cleaner representation:

```
  P1 ──requests──► R2
  ▲                │
  │             assigned
  │                ▼
assigned          P2 ──requests──► R1
  │                                │
  │                             assigned
  └──────────────────────────────── P1  (cycle!)

  P3 ──requests──► R1
  ▲                │
  └── assigned ────┘  (R2 has 2 instances, one goes to P2, one to P3)
```

**Why this IS a deadlock:**

The cycle `P1 → R2 → P2 → R1 → P1` exists:

1. P1 holds R1 and waits for R2
2. P2 holds one instance of R2 and waits for R1
3. R1's only instance is held by P1, which is waiting for R2
4. R2's two instances are both allocated (P2 and P3 each hold one)
5. Neither P2 nor P3 can proceed → R2 is never freed → P1 waits forever

Since R1 has only **one** instance and R2 has only **two** instances (both allocated), no process can obtain the resource it needs. The cycle involves all instances of every relevant resource — this is a true deadlock.

### Example 2: Cycle But NO Deadlock

Same structure, but **P3 no longer requests R1** (P3 can run to completion):

```
  P1 ──requests──► R2
  ▲                │
assigned         assigned
  │                ▼
  R1              P2 ──requests──► R1
  │                                ▲
assigned                        assigned
  │                                │
  P1 (R1→P1)                      P1  ← wait, let's re-read...
```

More clearly:

```
Assignments : R1 → P1,  R2 → P2,  R2 → P3
Requests    : P1 → R2,  P2 → R1
(P3 makes NO request — it can finish and release its R2 instance)
```

**Why no deadlock:**

- P3 holds an instance of R2 and needs nothing → P3 runs and finishes, releasing its R2 instance
- Now R2 has a free instance → P1's request for R2 can be granted
- P1 runs and finishes, releasing R1
- R1 is now free → P2's request for R1 can be granted → P2 runs and finishes

Even though there is a cycle `P1 → R2 → P2 → R1 → P1`, R2 has **two instances** and one of them is held by P3 which doesn't need anything more. That breaks the deadlock: P3 can complete and release its R2 instance, unblocking the rest.

**Key insight:** With multi-instance resources, a cycle in the RAG is a **necessary but not sufficient** condition for deadlock. You must verify that every instance of every resource in the cycle is tied up with no way out.

---

## Real Code Example: Deadlock and How to Fix It

### The Problem: Classic Mutex Deadlock

Two threads each hold one lock and wait for the other:

```python
import threading
import time

lock_a = threading.Lock()
lock_b = threading.Lock()

def thread1():
    with lock_a:
        time.sleep(0.1)  # simulate work
        with lock_b:
            print("Thread 1 done")

def thread2():
    with lock_b:
        time.sleep(0.1)
        with lock_a:  # ← deadlock!
            print("Thread 2 done")

t1 = threading.Thread(target=thread1)
t2 = threading.Thread(target=thread2)
t1.start()
t2.start()
t1.join()
t2.join()
# Program hangs forever — neither thread prints anything
```

### Why Deadlock Happens: Interleaving Timeline

```
Time  Thread 1                          Thread 2
────  ────────────────────────────      ────────────────────────────
 0    acquires lock_a ✓
 1                                      acquires lock_b ✓
 2    sleeps 0.1 s …
 3                                      sleeps 0.1 s …
 4    tries to acquire lock_b → BLOCKS  (lock_b held by Thread 2)
 5                                      tries to acquire lock_a → BLOCKS
                                        (lock_a held by Thread 1)
 ∞    waiting …                         waiting …
```

All four Coffman conditions are met:
- **Mutual exclusion**: each lock is non-shareable
- **Hold and wait**: Thread 1 holds `lock_a` while waiting for `lock_b`
- **No preemption**: neither lock is forcibly taken away
- **Circular wait**: Thread 1 → `lock_b` → Thread 2 → `lock_a` → Thread 1

### Fix 1: Lock Ordering (Recommended)

Always acquire locks in the **same global order** across all threads. If every thread acquires `lock_a` before `lock_b`, circular wait is impossible.

```python
import threading
import time

lock_a = threading.Lock()
lock_b = threading.Lock()

def thread1():
    with lock_a:          # always acquire lock_a first
        time.sleep(0.1)
        with lock_b:      # then lock_b
            print("Thread 1 done")

def thread2():
    with lock_a:          # same order: lock_a first
        time.sleep(0.1)
        with lock_b:      # then lock_b — no deadlock possible
            print("Thread 2 done")

t1 = threading.Thread(target=thread1)
t2 = threading.Thread(target=thread2)
t1.start()
t2.start()
t1.join()
t2.join()
```

Circular wait is eliminated because both threads always compete for `lock_a` first; whichever wins proceeds to acquire `lock_b` uncontested.

### Fix 2: Lock Acquisition with Timeout

Use `acquire(timeout=...)` to avoid waiting forever. If a lock cannot be obtained in time, release held locks, back off, and retry.

```python
import threading
import time
import random

lock_a = threading.Lock()
lock_b = threading.Lock()

def thread1():
    while True:
        if lock_a.acquire(timeout=0.05):
            try:
                if lock_b.acquire(timeout=0.05):
                    try:
                        print("Thread 1 done")
                        return
                    finally:
                        lock_b.release()
                # Could not get lock_b — release lock_a and retry
            finally:
                lock_a.release()
        time.sleep(random.uniform(0, 0.02))  # randomised back-off

def thread2():
    while True:
        if lock_b.acquire(timeout=0.05):
            try:
                if lock_a.acquire(timeout=0.05):
                    try:
                        print("Thread 2 done")
                        return
                    finally:
                        lock_a.release()
            finally:
                lock_b.release()
        time.sleep(random.uniform(0, 0.02))
```

> **Note:** Timeout-based retry can theoretically livelock if both threads always back off at the same time. The randomised sleep breaks that symmetry.

### Fix 3: Acquire Multiple Locks Atomically

Python's `threading` module exposes `threading.Lock` but not a built-in multi-lock acquire. Use a context manager that sorts locks by `id()` to enforce a consistent global order automatically:

```python
import threading
from contextlib import contextmanager

lock_a = threading.Lock()
lock_b = threading.Lock()

@contextmanager
def acquire_locks(*locks):
    # Sort by object id to enforce a consistent acquisition order
    sorted_locks = sorted(locks, key=id)
    for lock in sorted_locks:
        lock.acquire()
    try:
        yield
    finally:
        for lock in reversed(sorted_locks):
            lock.release()

def thread1():
    with acquire_locks(lock_a, lock_b):
        print("Thread 1 done")

def thread2():
    with acquire_locks(lock_b, lock_a):  # order doesn't matter here
        print("Thread 2 done")
```

Regardless of the order the caller passes the locks in, `acquire_locks` always acquires them in the same order (by memory address), making deadlock impossible.

### Fix 4: Higher-Level Abstractions

Avoid raw lock management entirely by using higher-level concurrency primitives:

```python
import concurrent.futures

def work(value):
    # No manual locking needed — executor serialises calls automatically
    return value * 2

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(work, i) for i in range(5)]
    results = [f.result() for f in futures]
    print(results)
```

Other options:
- **`queue.Queue`** — thread-safe producer/consumer without explicit locks
- **`threading.RLock`** — re-entrant lock; a thread that already holds it can acquire it again without deadlocking itself
- **`asyncio`** — single-threaded concurrency avoids most locking issues entirely

### Summary: Which Fix to Use?

| Approach | When to use |
|---|---|
| **Lock ordering** | Best default — simple, zero overhead, eliminates circular wait |
| **Timeout + retry** | When lock order can't be enforced (e.g., third-party libraries) |
| **Atomic multi-lock** | When you must hold multiple unordered locks simultaneously |
| **Higher-level primitives** | New code — avoid raw locks wherever possible |
