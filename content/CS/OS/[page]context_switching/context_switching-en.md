---
title: "Context Switching"
description: "What happens when the CPU switches between processes or threads — the mechanics, the cost, and the hardware support behind it."
date: "2026-03-04"
category: "CS/OS"
tags: ["OS", "context switch", "PCB", "scheduler", "CPU", "performance"]
author: "Nemit"
featured: false
pinned: false
---

# Context Switching

## What Is a Context Switch?

A **context switch** is the mechanism by which the CPU stops executing one process (or thread) and starts executing another. The OS saves the current execution state so it can be resumed later, then loads the saved state of the next process.

It's what makes multitasking possible. Even on a single-core CPU, dozens of processes appear to run simultaneously because the CPU switches between them thousands of times per second.

---

## What Is "Context"?

The **context** of a process is everything the CPU needs to resume execution from where it left off:

- **Program Counter (PC)** — address of the next instruction
- **CPU registers** — general-purpose registers (RAX, RBX, ...), stack pointer (RSP), base pointer (RBP), flags register
- **Memory management registers** — page table base register (CR3 on x86), segment registers
- **Kernel stack** — the process's kernel-mode stack
- **Floating-point / SIMD state** — if the process uses FPU, SSE, AVX registers

All of this is saved to the process's **PCB (Process Control Block)** and reloaded when the process is resumed.

---

## When Does a Context Switch Happen?

Context switches are triggered by specific events:

### 1. Timer Interrupt (Preemptive Scheduling)
The OS programs a hardware timer (PIT, APIC timer) to fire an interrupt every N milliseconds. When it fires, the CPU enters kernel mode and the scheduler decides whether to switch. This is the most common trigger.

### 2. I/O Request (Voluntary Yield)
A process calls `read()`, `write()`, or similar and the data isn't ready. The OS puts the process in **Waiting** state and switches to a ready process. This is a **voluntary** context switch.

### 3. System Call
A process calls a syscall that blocks (e.g., `sleep()`, `wait()`, `pthread_mutex_lock()` on a locked mutex). The scheduler runs and may switch.

### 4. Higher-Priority Process Becomes Ready
An I/O operation completes, making a high-priority process ready. On preemptive systems, the scheduler may immediately switch away from the current process.

### 5. Explicit Yield
A process calls `sched_yield()` (Linux) or `SwitchToThread()` (Windows) to voluntarily give up the CPU.

---

## The Context Switch Procedure

Here is what the OS does, step by step, when switching from Process A to Process B:

### Step 1: Save Process A's Context

The CPU is in kernel mode (either via interrupt or syscall). The OS kernel:

1. Disables interrupts (briefly, to avoid re-entrancy)
2. Saves all CPU registers into A's PCB (or kernel stack)
3. Saves the program counter
4. Saves memory management state (page table pointer)
5. Saves FPU/SIMD state if A was using it

```
A's PCB:
  PC  = 0x4005a2   ← where A was executing
  RAX = 0x0000001c
  RBX = 0x00007fff...
  RSP = 0x7ffe9120
  CR3 = 0x1a3000   ← A's page table base
  ...
```

### Step 2: Update Process A's State

- Change A's state from **Running** → **Ready** (if preempted) or **Waiting** (if blocked)
- Put A back in the appropriate queue (ready queue or I/O wait queue)

### Step 3: Select Next Process (Scheduling)

The **scheduler** picks the next process to run from the ready queue. Selection algorithm depends on the scheduling policy (FCFS, Round Robin, Priority, etc.).

### Step 4: Load Process B's Context

1. Load B's page table pointer (CR3 on x86) → this flushes the TLB
2. Load B's CPU registers from its PCB
3. Load FPU/SIMD state if B needs it
4. Load B's program counter
5. Change B's state from **Ready** → **Running**

### Step 5: Resume Process B

The kernel executes an instruction like `iret` (x86) or `eret` (ARM) to return from interrupt/syscall in the context of B. The CPU now executes B from where it left off.

---

## The Cost of a Context Switch

Context switching is **not free**. It has several layers of cost:

### Direct Cost: Saving/Restoring State

Saving and restoring registers, PCB updates, and stack manipulation. On modern CPUs this is tens to hundreds of nanoseconds.

FPU/SIMD state (especially with AVX-512: 2048 bits = 256 bytes) is expensive to save/restore. The OS uses **lazy FPU saving** — it only saves FPU state when another process actually uses the FPU.

### Indirect Cost: TLB Flush

When the OS loads a new page table (CR3), the CPU's **Translation Lookaside Buffer (TLB)** must be flushed. The TLB caches virtual-to-physical address translations. After a flush, every memory access causes a TLB miss until the cache warms up again.

This is often the **dominant cost** of a process switch. Each TLB miss adds ~100ns of memory latency.

**Thread switches are cheaper** because threads within the same process share the same page table — no TLB flush needed.

### Indirect Cost: Cache Pollution

CPU caches (L1, L2, L3) hold instructions and data for the running process. When switching to B, A's cached data is still in the cache. B's instructions and data must be loaded, evicting A's entries. This **cache pollution** causes cache misses for the new process.

For workloads with large working sets, this can cost thousands of cycles.

### Kernel Mode Switch Overhead

Even without a full context switch, entering/exiting kernel mode for a syscall or interrupt costs ~100-300 ns due to privilege level change, stack switch, and bookkeeping.

### Approximate Costs (Modern x86)

| Operation | Approximate Cost |
|---|---|
| Kernel mode entry/exit (syscall) | ~100–300 ns |
| Thread switch (same process) | ~1–5 μs |
| Process switch (different address space) | ~5–30 μs |
| TLB warm-up after switch | Hundreds of μs (workload-dependent) |

These numbers vary significantly based on CPU, cache size, working set, and OS.

---

## Mode Switch vs Context Switch

A common confusion: a **mode switch** is not the same as a **context switch**.

**Mode switch** (privilege level change): Transition between user mode and kernel mode. Happens on every syscall and interrupt. The CPU changes privilege level, switches to the kernel stack, saves a few registers, and executes kernel code — but the same process is still running. When the syscall/interrupt returns, it switches back to user mode.

**Context switch**: The OS replaces the entire running task. Includes a mode switch (to enter the kernel) plus saving/restoring all state and potentially switching the address space.

```
Syscall:   User mode → Kernel mode → User mode   (same process)
                       [mode switch only]

Preemption: User mode → Kernel mode → [save A, load B] → User mode
                        [mode switch]  [context switch]
```

Every context switch includes a mode switch, but not every mode switch is a context switch. Mode switches are cheap (~100-300 ns). Context switches are expensive (~1-30 μs).

---

## Interrupt Handling and Context Switching

Interrupts are central to how context switches get triggered. Understanding the full interrupt flow matters:

### Interrupt Lifecycle

1. **Device raises interrupt** (hardware IRQ) or CPU detects a fault/trap
2. CPU finishes current instruction, saves minimal state (PC, flags) onto the **kernel stack**
3. CPU looks up the **Interrupt Descriptor Table (IDT)** to find the handler address
4. CPU switches to **ring 0** (kernel mode) and jumps to the handler
5. The interrupt handler runs:
   - For hardware IRQ: acknowledges the interrupt, handles the device, possibly wakes a waiting process
   - For timer IRQ: decrements the current process's remaining quantum
6. Before returning from the interrupt, the kernel checks if a **reschedule** is needed (`need_resched` flag on Linux)
7. If reschedule needed → **context switch** happens now
8. Return from interrupt (`iret`) resumes execution in the (possibly different) process

### Top Half vs Bottom Half (Linux)

To minimize interrupt latency, Linux splits interrupt handling:

- **Top half** (hardirq): Runs immediately in interrupt context. Does the minimum necessary work — acknowledge the interrupt, read data from device, schedule deferred work. Cannot sleep.
- **Bottom half** (softirq / tasklet / workqueue): Runs later with interrupts enabled. Handles the bulk of processing. Can sleep (workqueues only).

```
[Hardware IRQ]
    ↓
[Top half: minimal, fast, interrupts disabled]
    ↓ schedules
[Bottom half: bulk processing, interrupts enabled]
    ↓ may set need_resched
[Context switch if needed]
```

This split keeps interrupt latency low while still doing substantial work.

---

## Multicore and NUMA Considerations

On multicore systems, context switching interacts with cache topology and memory architecture.

### Per-Core Scheduling

Each CPU core has its own **run queue** (in Linux CFS, each core has its own red-black tree). Context switches happen independently on each core. A process on core 0 can be context-switched without affecting core 1.

### Cache Hierarchy Effects

Modern CPUs have private L1/L2 caches per core and shared L3 cache:

```
Core 0: [L1d] [L1i] [L2]  ←  private
Core 1: [L1d] [L1i] [L2]  ←  private
         └───────┬───────┘
              [L3 shared]
              [DRAM]
```

When a process is context-switched and later resumes on the **same core**, its L1/L2 data may still be warm. If it resumes on a **different core**, L1/L2 is completely cold — all data must be fetched from L3 or DRAM.

This is why **CPU affinity** matters so much. The `sched_setaffinity()` syscall pins a process to specific cores.

### NUMA (Non-Uniform Memory Access)

On multi-socket servers, each CPU socket has its own local memory. Accessing remote memory (attached to another socket) takes ~2× longer:

```
Socket 0: [Core0..Core7] ← Local Memory (fast: ~80ns)
                ↓ (QPI/UPI interconnect: slow: ~150ns)
Socket 1: [Core8..Core15] ← Local Memory
```

A context switch that moves a process from Socket 0 to Socket 1 is catastrophic: all cached memory references become remote. Linux's NUMA-aware scheduler tries to keep processes on their original NUMA node.

```bash
# View NUMA topology
numactl --hardware

# Pin process to NUMA node 0
numactl --membind=0 --cpunodebind=0 ./program

# Check per-node memory stats
numastat -p <pid>
```

### Migration Cost

Linux's CFS scheduler weighs the cost of migrating a task to another core against the benefit of load balancing. The `sched_migration_cost_ns` tunable (default 500μs) defines the period after a task's last run during which it won't be migrated — giving its cache time to warm up.

---

## The Idle Process

When no runnable processes exist on a CPU core, the kernel runs the **idle process** (or idle task). On Linux, this is a per-CPU kernel thread that executes `cpu_idle_loop()`.

The idle process does **not** busy-wait. It uses hardware power-saving instructions:

| Architecture | Idle Instruction | Effect |
|---|---|---|
| x86 | `hlt` | Halts CPU until next interrupt |
| x86 | `mwait` | Monitors a memory address, halts until write |
| ARM | `wfi` (Wait For Interrupt) | Halts CPU until interrupt |

Modern CPUs have multiple **C-states** (power states) with increasing power savings and increasing wake-up latency:

| C-State | Name | Power Saving | Wake-up Latency |
|---|---|---|---|
| C0 | Active | None (running) | 0 |
| C1 | Halt | Low | ~1 μs |
| C1E | Enhanced Halt | Medium | ~10 μs |
| C3 | Sleep | High (L1/L2 flushed) | ~50 μs |
| C6 | Deep Sleep | Very High (voltage reduced) | ~100 μs |

Deeper C-states save more power but increase the latency of the next context switch (the CPU takes longer to wake up). The `cpuidle` governor in Linux decides which C-state to enter based on predicted idle duration.

For latency-sensitive applications (real-time, HFT), you can disable deep C-states:

```bash
# Limit to C1 (lowest latency)
echo 1 > /sys/devices/system/cpu/cpu0/cpuidle/state2/disable

# Or at boot: intel_idle.max_cstate=1
```

---

## Voluntary vs Involuntary Context Switches

Linux tracks both kinds per process:

```bash
cat /proc/<pid>/status | grep ctxt
# voluntary_ctxt_switches:    1024
# nonvoluntary_ctxt_switches:  57
```

- **Voluntary**: Process gave up CPU (blocked on I/O, lock, sleep)
- **Involuntary**: Scheduler preempted the process (timer expired, higher-priority process became ready)

High involuntary switches may indicate a process is CPU-bound and being frequently preempted. High voluntary switches are normal for I/O-bound processes.

You can also monitor system-wide context switches:

```bash
vmstat 1
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
#  2  0      0  8192   1024  16384    0    0     0     0  500 1200  5  2 93  0  0
#                                                              ^^^ ^^^
#                                                              in  cs (interrupts, context switches per sec)
```

---

## Hardware Support for Context Switching

Modern CPUs include features that reduce context switch overhead:

### ASID (Address Space Identifier)

On ARM and some x86 implementations (PCID on x86-64), the TLB stores an **ASID** alongside each cached translation. This lets the TLB hold entries from multiple processes simultaneously — no full flush needed on switch, only entries with a matching ASID are used.

Linux uses PCID (Process-Context IDentifier) on x86-64 to avoid TLB flushes on context switches when possible.

### TSS (Task State Segment) on x86

The x86 architecture defines a **Task State Segment** hardware mechanism originally designed to support hardware task switching. Modern OSes use it only minimally — mostly to store the kernel stack pointer (RSP0) that the CPU loads automatically on privilege escalation. Software context switching is used instead of hardware task switching for performance.

### fxsave / xsave Instructions

Used to save/restore FPU and SIMD register state. `xsave` saves only the components actually used by the task, reducing overhead when AVX registers aren't in use.

---

## Context Switch in the Linux Kernel

In Linux, the core context switch is in `kernel/sched/core.c`, function `context_switch()`:

```c
static __always_inline struct rq *
context_switch(struct rq *rq, struct task_struct *prev, struct task_struct *next, ...)
{
    // 1. Switch memory context (page tables)
    switch_mm_irqs_off(prev->active_mm, next->mm, next);

    // 2. Switch CPU registers and stack
    switch_to(prev, next, prev);

    // Returns in the context of `next`
    return finish_task_switch(prev);
}
```

`switch_to()` is architecture-specific assembly that saves/restores registers and jumps to the next task.

---

## Minimizing Context Switch Overhead

Strategies used in practice:

**Thread pools**: Keep a fixed number of threads alive and reuse them for tasks. Avoids the overhead of creating/destroying threads.

**CPU affinity**: Pin threads/processes to specific CPU cores with `sched_setaffinity()` (Linux) or `SetThreadAffinityMask()` (Windows). Reduces cache pollution by keeping the thread's data on the same core's cache.

**Cooperative scheduling / coroutines**: User-space task switching (Go's goroutines, Rust's async/await, Python's asyncio). The runtime switches tasks without entering the kernel, making the switch ~10x cheaper. The downside: a blocking syscall blocks the entire OS thread.

**Huge pages**: Reduce TLB pressure. A 2MB huge page covers 512× the range of a 4KB page, so the TLB covers more memory with fewer entries — fewer misses after a switch.

**Lock-free data structures**: Reduce blocking and therefore voluntary context switches.

**Batch I/O (io_uring on Linux)**: Submit many I/O operations in a single syscall, reducing the frequency of kernel mode transitions.
