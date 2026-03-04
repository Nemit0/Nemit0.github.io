---
title: "CPU Scheduling Algorithms"
description: "A detailed look at CPU scheduling — FCFS, SJF, Round Robin, Priority scheduling — with examples, Gantt charts, and performance metrics."
date: "2026-03-04"
category: "CS/OS"
tags: ["OS", "scheduling", "FCFS", "SJF", "Round Robin", "priority", "CPU", "algorithms"]
author: "Nemit"
featured: false
pinned: false
---

# CPU Scheduling Algorithms

## What Is CPU Scheduling?

The **CPU scheduler** decides which process in the ready queue gets to run next on the CPU. Since only one process can use a CPU core at a time, the scheduler must constantly make this decision.

Good scheduling is critical: it determines how responsive interactive programs feel, how fast batch jobs complete, and how efficiently the hardware is utilized.

---

## Key Terms and Metrics

| Term | Definition |
|---|---|
| **Burst time** | CPU time a process needs (without I/O waits) |
| **Arrival time** | When a process enters the ready queue |
| **Completion time** | When a process finishes execution |
| **Turnaround time** | Completion time − Arrival time |
| **Waiting time** | Time spent in ready queue (not running, not blocked) |
| **Response time** | Time from arrival to first CPU use |
| **Throughput** | Number of processes completed per unit time |
| **CPU utilization** | Fraction of time CPU is busy (not idle) |

For $n$ processes:

$$\text{Average Waiting Time} = \frac{1}{n} \sum_{i=1}^{n} \text{waiting\_time}_i$$

$$\text{Turnaround time} = \text{Completion time} - \text{Arrival time}$$

$$\text{Waiting time} = \text{Turnaround time} - \text{Burst time}$$

---

## Scheduling Types

### Preemptive vs Non-Preemptive

- **Non-preemptive**: Once a process starts running, it runs until it blocks (I/O) or terminates. The CPU cannot be taken away. Simpler but poor for interactive systems.
- **Preemptive**: The OS can interrupt a running process and switch to another (e.g., when a higher-priority process arrives or a timer fires). Required for real-time and interactive systems.

### Long-Term, Short-Term, Medium-Term

- **Long-term scheduler** (job scheduler): decides which processes to admit to the system (new → ready). Runs infrequently.
- **Short-term scheduler** (CPU scheduler): picks the next process to run from the ready queue. Runs very frequently (every few ms).
- **Medium-term scheduler**: swaps processes in/out of memory. Reduces degree of multiprogramming when needed.

---

## 1. First-Come, First-Served (FCFS)

**Approach**: Run processes in the order they arrive. Simple FIFO queue. Non-preemptive.

### Example

| Process | Arrival | Burst |
|---|---|---|
| P1 | 0 | 24 |
| P2 | 1 | 3 |
| P3 | 2 | 3 |

**Gantt Chart:**
```
| P1 (24) | P2 (3) | P3 (3) |
0        24       27       30
```

| Process | Completion | Turnaround | Waiting |
|---|---|---|---|
| P1 | 24 | 24 | 0 |
| P2 | 27 | 26 | 23 |
| P3 | 30 | 28 | 25 |
| **Average** | | **26** | **16** |

### Convoy Effect

FCFS suffers from the **convoy effect**: short processes stuck behind a long process. P2 and P3 (3ms each) wait 23 and 25ms because P1 (24ms) arrived first. CPU and I/O devices are poorly utilized when a long CPU-bound process holds up many short I/O-bound processes.

**Pros**: Simple to implement, no starvation.
**Cons**: High average waiting time, convoy effect, poor for interactive systems.

---

## 2. Shortest Job First (SJF)

**Approach**: Run the process with the **shortest next CPU burst** first. Optimal in terms of minimizing average waiting time (provably optimal for non-preemptive scheduling).

### Non-Preemptive SJF

Once a process starts, it runs to completion (or until it blocks).

| Process | Arrival | Burst |
|---|---|---|
| P1 | 0 | 6 |
| P2 | 0 | 8 |
| P3 | 0 | 7 |
| P4 | 0 | 3 |

**Gantt Chart (all arrive at 0, shortest first):**
```
| P4 (3) | P1 (6) | P3 (7) | P2 (8) |
0        3        9       16       24
```

| Process | Completion | Turnaround | Waiting |
|---|---|---|---|
| P4 | 3 | 3 | 0 |
| P1 | 9 | 9 | 3 |
| P3 | 16 | 16 | 9 |
| P2 | 24 | 24 | 16 |
| **Average** | | **13** | **7** |

Compare to FCFS order (P1→P2→P3→P4): average waiting = (0+6+14+21)/4 = 10.25.

SJF gives lower average waiting time.

### Preemptive SJF (Shortest Remaining Time First — SRTF)

If a new process arrives with a burst shorter than the **remaining** burst of the currently running process, preempt immediately.

| Process | Arrival | Burst |
|---|---|---|
| P1 | 0 | 8 |
| P2 | 1 | 4 |
| P3 | 2 | 9 |
| P4 | 3 | 5 |

```
t=0: P1 starts (burst 8, nothing else)
t=1: P2 arrives (burst 4 < P1 remaining 7) → preempt P1, run P2
t=2: P3 arrives (burst 9 > P2 remaining 3) → continue P2
t=3: P4 arrives (burst 5 > P2 remaining 2) → continue P2
t=5: P2 finishes. Remaining: P1(7), P3(9), P4(5). Run P4.
t=10: P4 finishes. Remaining: P1(7), P3(9). Run P1.
t=17: P1 finishes. Run P3.
t=26: P3 finishes.
```

**Gantt Chart:**
```
| P1 | P2     | P4     | P1          | P3             |
0    1        5       10            17               26
```

| Process | Completion | Turnaround | Waiting |
|---|---|---|---|
| P1 | 17 | 17 | 9 |
| P2 | 5 | 4 | 0 |
| P3 | 26 | 24 | 15 |
| P4 | 10 | 7 | 2 |
| **Average** | | **13** | **6.5** |

### The Problem: Predicting Burst Time

SJF requires knowing the next CPU burst in advance — impossible for general-purpose scheduling. Solution: **predict** using exponential averaging:

$$\tau_{n+1} = \alpha \cdot t_n + (1 - \alpha) \cdot \tau_n$$

Where $t_n$ = actual $n$th burst, $\tau_n$ = predicted $n$th burst, $\alpha \in [0,1]$.

With $\alpha = 0.5$: recent history and old history contribute equally. The prediction adapts to recent behavior.

**Pros**: Optimal average waiting time (non-preemptive), minimizes response time (SRTF).
**Cons**: Cannot know actual burst times; prediction may be wrong; starvation (long jobs may never run if short jobs keep arriving).

---

## 3. Round Robin (RR)

**Approach**: Each process gets a fixed time slice called a **time quantum** (or time slice), typically 10–100ms. After the quantum expires, the process is preempted and placed at the back of the ready queue. FIFO order, circular rotation.

Designed specifically for **time-sharing systems** and interactive responsiveness.

### Example

Time quantum = 4ms.

| Process | Arrival | Burst |
|---|---|---|
| P1 | 0 | 24 |
| P2 | 0 | 3 |
| P3 | 0 | 3 |

**Gantt Chart:**
```
| P1(4) | P2(3) | P3(3) | P1(4) | P1(4) | P1(4) | P1(4) | P1(4) |
0       4       7      10      14      18      22      26      30
```

P2 finishes at t=7 (only needed 3ms of its 4ms quantum).
P3 finishes at t=10.
P1 gets 4ms slices until it finishes at t=30.

| Process | Completion | Turnaround | Waiting |
|---|---|---|---|
| P1 | 30 | 30 | 6 |
| P2 | 7 | 7 | 4 |
| P3 | 10 | 10 | 7 |
| **Average** | | **15.7** | **5.7** |

### Choosing the Time Quantum

The quantum size critically affects performance:

**Too large** → degenerates to FCFS. Long processes hold CPU. Poor response time.

**Too small** → frequent context switches dominate. If quantum = 1ms and context switch = 0.1ms, then 10% of CPU time is wasted on overhead.

Rule of thumb: **80% of CPU bursts should be shorter than the quantum**. Typical values: 10–100ms.

### Response Time

Round Robin gives excellent response time for interactive processes. In the worst case, a process waits at most $(n-1) \times q$ time before getting CPU (where $n$ = number of ready processes, $q$ = quantum).

**Pros**: Fair, good response time, no starvation.
**Cons**: Higher average turnaround than SJF, context switch overhead.

---

## 4. Priority Scheduling

**Approach**: Each process is assigned a priority number. The CPU runs the highest-priority ready process. When priorities are equal, use FCFS.

Priority can be **static** (fixed at creation) or **dynamic** (adjusted at runtime).

Priority can be assigned based on:
- Memory requirements
- Time limits
- Importance to the user
- I/O vs CPU bound (I/O bound often gets higher priority)

### Non-Preemptive Example

| Process | Arrival | Burst | Priority (lower = higher) |
|---|---|---|---|
| P1 | 0 | 10 | 3 |
| P2 | 0 | 1 | 1 |
| P3 | 0 | 2 | 4 |
| P4 | 0 | 1 | 5 |
| P5 | 0 | 5 | 2 |

**Execution order**: P2 (priority 1), P5 (priority 2), P1 (priority 3), P3 (priority 4), P4 (priority 5)

```
| P2(1) | P5(5) | P1(10) | P3(2) | P4(1) |
0       1       6       16      18      19
```

Average waiting time = (0+1+6+16+18)/5 = 8.2

### Starvation and Aging

**Starvation**: Low-priority processes may never execute if high-priority processes keep arriving.

**Aging**: Gradually increase the priority of processes that have been waiting for a long time. Prevents starvation. Example: increase priority by 1 every 15 minutes. Eventually every process becomes high enough priority to run.

### Preemptive Priority Scheduling

When a new process arrives with higher priority than the running process, immediately preempt.

```c
// Linux nice values: -20 (highest priority) to 19 (lowest)
nice(10);            // Lower own priority by 10
setpriority(PRIO_PROCESS, 0, -5);  // Set priority to -5 (higher)
```

---

## 5. Multilevel Queue Scheduling

Divide the ready queue into multiple queues, each with its own scheduling algorithm and priority:

```
Queue 1 (highest priority): Real-time processes → FCFS/RR with tiny quantum
Queue 2: Interactive (foreground): Round Robin
Queue 3: Interactive (background): Round Robin with larger quantum
Queue 4: Batch processes: FCFS
Queue 5 (lowest): Student/idle jobs: FCFS
```

Processes are permanently assigned to a queue based on type. Queue 1 is always served before Queue 2, etc. Each queue can use a different algorithm internally.

### Multilevel Feedback Queue (MLFQ)

Extends multilevel queue by allowing processes to move between queues based on behavior:

- Process starts in highest-priority queue
- If it uses its full quantum (CPU-bound behavior), move down to lower queue (longer quantum, lower priority)
- If it gives up CPU before quantum expires (I/O-bound behavior), stay in current queue or move up
- Aging: boost priority of long-waiting processes periodically

MLFQ adapts to process behavior without requiring knowledge in advance. It's the basis for real-world schedulers. Linux's **Completely Fair Scheduler (CFS)** uses a related approach.

---

## Real-World: Linux CFS

Linux's **Completely Fair Scheduler** doesn't use fixed time quanta or simple priority queues.

**Core idea**: Every process deserves an equal share of CPU time. CFS tracks how much CPU time each process has received (`vruntime`). The process with the **smallest vruntime** always runs next.

- `vruntime` increments during execution, scaled by priority (nice value): lower priority → vruntime grows faster → gets preempted sooner
- Implemented with a **red-black tree** ordered by vruntime for O(log n) selection
- Target latency: all processes get CPU within a configurable window (default 6ms, minimum per process: 0.75ms)

```bash
# View scheduler stats per process
cat /proc/<pid>/sched

# View scheduling policy
chrt -p <pid>

# Set real-time priority
chrt -f -p 50 <pid>   # SCHED_FIFO, priority 50
```

Linux scheduling classes (highest to lowest):
1. `SCHED_DEADLINE` — EDF (Earliest Deadline First) for real-time tasks with deadlines
2. `SCHED_FIFO` / `SCHED_RR` — POSIX real-time (fixed priority, 1–99)
3. `SCHED_NORMAL` (SCHED_OTHER) — CFS for regular processes
4. `SCHED_BATCH` — CFS variant for batch work (lower priority)
5. `SCHED_IDLE` — only runs when nothing else can

---

## 6. Real-Time Scheduling

**Real-time systems** have timing constraints — tasks must complete before their deadlines. Missing a deadline can range from degraded quality (soft real-time: video playback) to catastrophic failure (hard real-time: aircraft flight control).

### Hard vs Soft Real-Time

| | Hard Real-Time | Soft Real-Time |
|---|---|---|
| **Deadline miss** | System failure | Degraded quality |
| **Examples** | ABS brakes, pacemakers, nuclear plant | Video streaming, VoIP, games |
| **Guarantee** | Must prove all deadlines are met | Best-effort, occasional miss OK |
| **Scheduling** | Static analysis required | Dynamic, priority-based |

### Rate-Monotonic Scheduling (RMS)

A **static-priority** algorithm for periodic tasks. Priority is assigned based on period: shorter period → higher priority. Once assigned, priorities never change.

Given periodic tasks $T_i$ with period $P_i$ and worst-case execution time $C_i$:

**CPU utilization**: $U = \sum_{i=1}^{n} \frac{C_i}{P_i}$

**Schedulability test** (sufficient but not necessary):

$$U \leq n \cdot (2^{1/n} - 1)$$

For large $n$, this converges to $\ln 2 \approx 0.693$. If total utilization ≤ 69.3%, RMS guarantees all deadlines are met.

| n (tasks) | Utilization Bound |
|---|---|
| 1 | 100% |
| 2 | 82.8% |
| 3 | 78.0% |
| 10 | 71.8% |
| ∞ | 69.3% |

**Example**:

| Task | Period ($P$) | Execution ($C$) | Utilization |
|---|---|---|---|
| T1 | 20ms | 5ms | 0.25 |
| T2 | 50ms | 10ms | 0.20 |
| T3 | 100ms | 25ms | 0.25 |
| **Total** | | | **0.70** |

$n = 3$, bound = $3(2^{1/3} - 1) \approx 0.780$. Since $0.70 \leq 0.780$, RMS is feasible.

RMS is **optimal** among fixed-priority algorithms — if any fixed-priority algorithm can schedule a task set, RMS can too.

### Earliest Deadline First (EDF)

A **dynamic-priority** algorithm. At every scheduling point, the task with the **earliest absolute deadline** gets the highest priority.

**Schedulability test** (necessary and sufficient for preemptive EDF):

$$U = \sum_{i=1}^{n} \frac{C_i}{P_i} \leq 1.0$$

EDF can achieve 100% CPU utilization while meeting all deadlines — better than RMS's 69.3% bound. The tradeoff: dynamic priorities require more scheduler overhead, and behavior under overload is unpredictable (all tasks may miss deadlines when overloaded).

### Deadline-Monotonic Scheduling (DMS)

Like RMS, but priority is based on **relative deadline** instead of period. Equivalent to RMS when deadline equals period. More general when deadlines differ from periods.

### Priority Inversion in Real-Time

A critical issue: a low-priority task holding a lock blocks a high-priority task, while medium-priority tasks preempt the lock holder — effectively inverting priorities.

**Mars Pathfinder (1997)**: The Sojourner rover experienced repeated system resets due to priority inversion. A low-priority meteorological task held a mutex needed by a high-priority bus management task. A medium-priority communication task preempted the low-priority task, preventing it from releasing the mutex. The watchdog timer interpreted the high-priority task's stall as a system hang and reset the computer.

**Fix**: Priority inheritance (temporarily boost the lock holder's priority) or priority ceiling (pre-assign each lock a ceiling priority equal to the highest-priority task that uses it).

---

## 7. Multiprocessor Scheduling

Scheduling on multicore/multiprocessor systems introduces new challenges.

### Symmetric Multiprocessing (SMP)

All CPUs are equal. Each CPU runs the scheduler independently. Processes can run on any CPU.

### Asymmetric Multiprocessing

One CPU (master) handles all scheduling and system activities. Other CPUs (slaves) run user code only. Simpler but the master becomes a bottleneck.

### Load Balancing

The scheduler must distribute work evenly across CPUs:

- **Push migration**: A periodic kernel thread checks load imbalance and moves processes from overloaded CPUs to idle ones
- **Pull migration**: An idle CPU "steals" processes from busy CPUs' run queues

Linux CFS performs both — periodic load balancing and idle CPU work stealing, respecting scheduling domains (NUMA topology).

### Processor Affinity

Moving a process between CPUs invalidates its L1/L2 cache (cold cache on the new CPU). **Soft affinity** is the scheduler's preference to keep a process on the same CPU. **Hard affinity** is a mandatory pinning set by the user:

```c
cpu_set_t cpuset;
CPU_ZERO(&cpuset);
CPU_SET(0, &cpuset);    // Pin to CPU 0
sched_setaffinity(pid, sizeof(cpuset), &cpuset);
```

### Gang Scheduling (Co-scheduling)

For parallel programs (e.g., MPI), all threads of a process are scheduled simultaneously on different CPUs. If one thread is descheduled while others are running, the running threads may spin-wait on synchronization, wasting CPU time. Gang scheduling prevents this by scheduling all threads of a process together as a unit.

---

## Scheduling Algorithm Comparison

| Algorithm | Preemptive | Starvation | Overhead | Best For |
|---|---|---|---|---|
| FCFS | No | No | Very Low | Batch, simple systems |
| SJF (non-preemptive) | No | Yes | Low | Batch jobs (known burst times) |
| SRTF | Yes | Yes | Medium | Minimizing avg wait |
| Round Robin | Yes | No | Medium | Time-sharing, interactive |
| Priority | Both | Yes (without aging) | Low | Systems with priority classes |
| MLFQ | Yes | No (with aging) | High | General-purpose |
| CFS | Yes | No | Medium | Linux general-purpose |

### Gantt Chart Summary for All (P1=10ms, P2=1ms, P3=2ms, P4=1ms, P5=5ms, all arrive at 0):

| Algorithm | Avg Turnaround | Avg Waiting |
|---|---|---|
| FCFS (P1→P2→P3→P4→P5 order) | 13.0 | 6.8 |
| SJF | 8.4 | 2.2 |
| RR (q=1) | 13.8 | 7.6 |
| Priority (P2=1,P5=2,P1=3,P3=4,P4=5) | 12.0 | 5.8 |
