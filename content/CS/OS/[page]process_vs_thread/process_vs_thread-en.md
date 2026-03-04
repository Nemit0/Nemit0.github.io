---
title: "Process vs Thread"
description: "A deep dive into processes and threads — how they differ, how they're managed, and why it matters for operating system design."
date: "2026-03-04"
category: "CS/OS"
tags: ["OS", "process", "thread", "concurrency", "PCB", "multithreading"]
author: "Nemit"
featured: false
pinned: false
---

# Process vs Thread

## What Is a Process?

A **process** is an instance of a program in execution. When you run a program, the OS creates a process for it — allocating memory, loading the executable, and setting up the runtime environment.

A process is the fundamental unit of resource ownership. It has:

- Its own **virtual address space** (code, data, heap, stack segments)
- Its own **file descriptors** and open handles
- Its own **environment variables**
- Security credentials (UID, GID on Unix)
- At least one **thread of execution**

Processes are **isolated** from each other. One process cannot directly access another's memory (without OS-mediated IPC). This isolation is what makes processes safe but expensive.

### Process States

A process cycles through states during its lifetime:

```
New → Ready → Running → Terminated
                ↑↓
             Waiting (blocked on I/O, sleep, etc.)
```

| State | Description |
|---|---|
| **New** | Process is being created |
| **Ready** | In memory, waiting for CPU |
| **Running** | Currently executing on CPU |
| **Waiting** | Blocked — waiting for I/O, lock, signal |
| **Terminated** | Execution finished, resources being freed |

On a single-core CPU only one process is **Running** at any moment. All others are either Ready (could run) or Waiting (cannot run yet).

### Process Control Block (PCB)

The OS tracks every process using a data structure called the **Process Control Block** (also called Task Control Block in some systems). The PCB contains everything the OS needs to manage and resume a process:

| PCB Field | Contents |
|---|---|
| Process ID (PID) | Unique identifier |
| Process state | New, Ready, Running, Waiting, Terminated |
| Program counter (PC) | Address of next instruction |
| CPU registers | General-purpose, stack pointer, flags |
| Memory management info | Page tables, segment tables, base/limit registers |
| I/O status | Open file list, pending I/O |
| Scheduling info | Priority, burst time, queue pointers |
| Accounting info | CPU time used, elapsed time |
| Parent PID | PID of the process that spawned this one |

When the CPU switches from one process to another (context switch), the OS saves the current PCB and loads the next one.

### Creating a Process

On Unix/Linux, processes are created with `fork()`:

```c
#include <unistd.h>
#include <stdio.h>

int main() {
    pid_t pid = fork();

    if (pid == 0) {
        // Child process
        printf("Child: PID = %d\n", getpid());
    } else if (pid > 0) {
        // Parent process
        printf("Parent: PID = %d, child PID = %d\n", getpid(), pid);
    }
    return 0;
}
```

`fork()` creates an **exact copy** of the current process. The child gets a duplicate of the parent's address space (copy-on-write in practice). The two processes then diverge based on the return value.

`exec()` is typically called after `fork()` in the child to replace its image with a new program.

On Windows, `CreateProcess()` performs fork + exec in a single call.

### Copy-on-Write (CoW)

`fork()` doesn't actually copy the entire address space — that would be prohibitively expensive. Instead, the parent and child initially **share** the same physical pages, marked read-only. When either process tries to **write** to a page, the CPU triggers a page fault. The OS then copies just that page, giving the writing process its own private copy.

```
Before write:
  Parent page table → [shared page A] ← Child page table  (read-only)

After child writes:
  Parent page table → [shared page A]  (still read-only for parent)
  Child page table  → [copy of page A] (now writable)
```

This is critical for performance. A `fork()` followed by `exec()` only needs to copy the page tables — not the actual data — since `exec()` replaces the address space entirely. Without CoW, `fork()` would be orders of magnitude slower.

### Process Termination

A process terminates when:
- It calls `exit()` (voluntarily)
- It returns from `main()`
- It receives an unhandled signal (e.g., SIGSEGV, SIGKILL)
- It calls `abort()`

On termination, the OS reclaims the process's resources (memory, open files, locks). However, the PCB entry remains until the parent calls `wait()` to collect the exit status.

### Zombie Processes

When a child process terminates but its parent has not yet called `wait()`, the child becomes a **zombie** (also called a defunct process). The process no longer occupies memory or CPU, but its PCB entry persists in the process table to hold the exit status.

```bash
# Zombies show as 'Z' in ps output
ps aux | grep 'Z'
# USER  PID  %CPU  %MEM  VSZ  RSS  TTY  STAT  START  TIME  COMMAND
# user  1234  0.0   0.0    0    0  ?     Z     10:00  0:00  [defunct]
```

Zombies are harmless individually, but thousands of them can exhaust the process table (PID space). The fix is for the parent to properly call `wait()` or `waitpid()`:

```c
#include <sys/wait.h>

int status;
pid_t child = wait(&status);      // Blocks until any child terminates
// or
waitpid(pid, &status, 0);         // Wait for a specific child
waitpid(-1, &status, WNOHANG);    // Non-blocking wait for any child
```

### Orphan Processes

If a parent terminates before its children, the children become **orphans**. The OS **reparents** orphan processes to `init` (PID 1) or a subreaper process. The new parent will eventually call `wait()` to clean up the orphan when it terminates, preventing it from becoming a permanent zombie.

```c
// Process that will become an orphan
pid_t pid = fork();
if (pid == 0) {
    // Child: parent will exit first
    sleep(60);  // Parent exits during this sleep
    // After parent exits, getppid() will return 1 (init)
    printf("My new parent: %d\n", getppid());
}
// Parent exits immediately
```

On modern Linux with systemd, `systemd --user` or a designated subreaper (set via `prctl(PR_SET_CHILD_SUBREAPER)`) may adopt orphans instead of PID 1.

### Process Hierarchy and Groups

Unix processes form a **tree** rooted at `init` (PID 1). Every process has a parent (except `init`). You can visualize this with:

```bash
pstree -p
# systemd(1)─┬─sshd(800)───sshd(1200)───bash(1201)───vim(1500)
#             ├─cron(500)
#             └─nginx(900)─┬─nginx(901)
#                          └─nginx(902)
```

Processes are organized into **process groups** and **sessions**:

- **Process group**: A collection of related processes (e.g., all processes in a pipeline `ls | grep | sort`). Signals can be sent to the entire group.
- **Session**: A collection of process groups, typically tied to a terminal login. Has a **session leader** (usually the shell) and at most one **foreground process group**.

```c
// Get/set process group
pid_t pgid = getpgrp();          // Get own process group ID
setpgid(pid, pgid);              // Set process group

// Create new session
setsid();                         // Create new session, become leader

// Send signal to entire process group
kill(-pgid, SIGTERM);             // Negative PID = send to group
```

This hierarchy is fundamental to **job control** in shells — `Ctrl+C` sends `SIGINT` to the foreground process group, `Ctrl+Z` sends `SIGTSTP`, `bg` and `fg` manage background/foreground groups.

### Signals

**Signals** are software interrupts delivered to processes. They're the most basic form of IPC on Unix.

| Signal | Default Action | Description |
|---|---|---|
| `SIGINT` (2) | Terminate | Interrupt from keyboard (Ctrl+C) |
| `SIGTERM` (15) | Terminate | Polite termination request |
| `SIGKILL` (9) | Terminate | **Cannot be caught or ignored** |
| `SIGSEGV` (11) | Core dump | Segmentation fault (invalid memory access) |
| `SIGSTOP` (19) | Stop | **Cannot be caught** — pause process |
| `SIGCONT` (18) | Continue | Resume stopped process |
| `SIGCHLD` (17) | Ignore | Child process terminated or stopped |
| `SIGALRM` (14) | Terminate | Timer expired (`alarm()`) |
| `SIGUSR1/2` (10/12) | Terminate | User-defined signals |
| `SIGPIPE` (13) | Terminate | Write to pipe with no reader |

Processes can install **signal handlers** to override default behavior:

```c
#include <signal.h>

void handler(int signum) {
    // Called asynchronously when signal is delivered
    // Only use async-signal-safe functions here (write, _exit, etc.)
    // NOT printf, malloc, etc.
    write(STDOUT_FILENO, "caught signal\n", 14);
}

int main() {
    struct sigaction sa;
    sa.sa_handler = handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    sigaction(SIGINT, &sa, NULL);   // Install handler for Ctrl+C

    // SIGKILL and SIGSTOP cannot be caught:
    // sigaction(SIGKILL, &sa, NULL);  // Would fail
}
```

Signals are **asynchronous** — they can arrive at any point during execution, which makes writing correct signal handlers notoriously difficult. Only a limited set of functions are **async-signal-safe** (the list is defined by POSIX).

### Inter-Process Communication (IPC)

Since processes are isolated, they need OS-mediated mechanisms to communicate:

| IPC Mechanism | Type | Description | Speed |
|---|---|---|---|
| **Pipe** | Byte stream | Unidirectional, between parent-child | Fast |
| **Named pipe (FIFO)** | Byte stream | Between unrelated processes | Fast |
| **Message queue** | Messages | Kernel-maintained message buffer | Medium |
| **Shared memory** | Memory region | Fastest IPC — direct memory access | Fastest |
| **Socket** | Byte stream / datagram | Network or local (Unix domain) | Medium |
| **Signal** | Notification | Async notification, no data payload | Fast |
| **Semaphore** | Synchronization | Cross-process synchronization primitive | N/A |

**Pipes** — the simplest IPC. Data written to one end can be read from the other:

```c
int fd[2];
pipe(fd);       // fd[0] = read end, fd[1] = write end

if (fork() == 0) {
    close(fd[1]);                    // Child closes write end
    read(fd[0], buf, sizeof(buf));   // Read from parent
} else {
    close(fd[0]);                    // Parent closes read end
    write(fd[1], "hello", 5);       // Write to child
}
```

Shell pipelines (`ls | grep | sort`) chain processes using pipes.

**Shared memory** — fastest IPC because data is not copied through the kernel:

```c
#include <sys/mman.h>

// Create shared memory
int fd = shm_open("/my_shm", O_CREAT | O_RDWR, 0666);
ftruncate(fd, 4096);
void *ptr = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

// Both processes can read/write *ptr directly
// Must use synchronization (semaphore/mutex) to avoid race conditions
```

**Message queues** — send discrete messages with types/priorities:

```c
#include <mqueue.h>

mqd_t mq = mq_open("/my_queue", O_CREAT | O_RDWR, 0666, &attr);
mq_send(mq, "hello", 5, 0);        // Send
mq_receive(mq, buf, sizeof(buf), NULL);  // Receive
```

### Threading Models: 1:1, M:1, M:N

The mapping between user-level threads and kernel-level threads defines the threading model:

**One-to-One (1:1)**: Each user thread maps to one kernel thread. Used by Linux (NPTL), Windows, and modern macOS. True parallelism on multicore. The downside: kernel thread creation overhead limits scalability (thousands of threads are fine, millions are not).

```
User threads:   T1  T2  T3  T4
                |   |   |   |
Kernel threads: K1  K2  K3  K4
```

**Many-to-One (M:1)**: All user threads map to one kernel thread. User-space scheduling is fast but no parallelism — one blocking syscall blocks all threads. Used by early green thread implementations.

```
User threads:   T1  T2  T3  T4
                 \  |  /  /
Kernel threads:     K1
```

**Many-to-Many (M:N)**: M user threads map to N kernel threads (N ≤ M). Combines benefits: true parallelism with lightweight user-space scheduling. More complex to implement. Used by Go's goroutine scheduler (with work-stealing), and historically by Solaris's LWP (lightweight processes).

```
User threads:   T1  T2  T3  T4  T5  T6
                 \  |  /    \  |  /
Kernel threads:    K1         K2
```

Go's runtime uses M:N with a work-stealing scheduler: goroutines (user threads) are multiplexed onto a smaller pool of OS threads. When one goroutine blocks on a syscall, the runtime moves other goroutines to a different OS thread.

---

## What Is a Thread?

A **thread** is the smallest unit of execution scheduled by the OS. Threads live *inside* a process — they share the process's resources but each has its own execution context.

Every process starts with one thread (the main thread). Additional threads can be created within the same process.

Threads within the same process share:
- **Virtual address space** (code, heap, global data)
- **File descriptors**
- **Signal handlers**
- **Working directory**

Each thread has its own:
- **Stack** (local variables, function call frames)
- **Program counter**
- **CPU registers**
- **Thread ID (TID)**
- **Signal mask** (which signals are blocked)

### Thread States

Threads have the same states as processes (Ready, Running, Waiting, Terminated) but the scheduling and state transitions happen at the thread level.

### Thread Control Block (TCB)

Each thread is represented by a TCB — smaller than a PCB since most resource info lives in the parent PCB:

| TCB Field | Contents |
|---|---|
| Thread ID | Unique identifier |
| State | Ready/Running/Waiting |
| Program counter | Next instruction |
| Stack pointer | Points to thread's stack |
| Register set | CPU registers at last context switch |
| Priority | Scheduling priority |
| Pointer to PCB | Reference to owning process |

### Creating a Thread (POSIX)

```c
#include <pthread.h>
#include <stdio.h>

void *worker(void *arg) {
    printf("Thread running, arg = %d\n", *(int *)arg);
    return NULL;
}

int main() {
    pthread_t tid;
    int value = 42;

    pthread_create(&tid, NULL, worker, &value);
    pthread_join(tid, NULL);  // Wait for thread to finish

    return 0;
}
```

### User-Level Threads vs Kernel-Level Threads

| | User-Level Threads | Kernel-Level Threads |
|---|---|---|
| **Managed by** | User-space library (e.g., green threads) | OS kernel |
| **Context switch cost** | Low (no kernel mode switch) | Higher (syscall overhead) |
| **Blocking I/O** | Blocks entire process | Only blocks calling thread |
| **True parallelism** | No (single kernel thread) | Yes (multiple cores) |
| **Examples** | Early Java threads, Go goroutines (hybrid) | pthreads, Win32 threads |

Modern systems use **hybrid models** (M:N threading) — multiple user threads mapped to multiple kernel threads.

---

## Process vs Thread: Side-by-Side

| Aspect | Process | Thread |
|---|---|---|
| **Address space** | Separate (isolated) | Shared (within process) |
| **Creation cost** | High (full duplication) | Low (minimal overhead) |
| **Context switch cost** | High (flush TLB, swap page tables) | Low (same address space) |
| **Communication** | IPC (pipes, sockets, shared memory, signals) | Direct memory access (but needs sync) |
| **Fault isolation** | One crash doesn't affect others | One thread crash can kill entire process |
| **Memory** | Each has its own heap and stack | Shared heap, separate stacks |
| **Scheduling unit** | Thread (processes are containers) | Thread |
| **Creation syscall (Linux)** | `fork()` | `clone()` with shared flags |

> On Linux, both `fork()` and `pthread_create()` ultimately call `clone()` — the difference is *which resources* are shared. Processes share nothing (by default); threads share almost everything.

---

## Why Use Threads Instead of Processes?

**Threads are lighter.** Creating a thread is faster and uses less memory than creating a process. Communication between threads is just reading/writing shared memory — no IPC overhead.

**Threads enable parallelism within one program.** A web server can handle multiple requests simultaneously using a thread pool. A video encoder can split frames across CPU cores.

**But threads are riskier.** Shared memory means race conditions. One misbehaving thread can corrupt the entire process's memory. Bugs are harder to reproduce because thread scheduling is non-deterministic.

---

## Why Use Processes Instead of Threads?

**Processes give isolation.** Web browsers use separate processes per tab so a crashed tab doesn't take down the whole browser. Microservices run in separate processes (or containers) for fault tolerance.

**Security boundaries.** Processes with different UIDs can't access each other's memory. Threads in the same process run with the same privileges.

**Fault tolerance.** If a process crashes, the OS cleans up all its resources automatically. A crashed thread leaves the process in a potentially corrupted state.

---

## Multi-threading: Real-World Considerations

### Race Conditions

When two threads access shared data without synchronization:

```c
// Thread 1               // Thread 2
counter++;                counter++;
// Both read 0, both write 1 → counter = 1 instead of 2
```

This is a **race condition** — the result depends on which thread runs first. The fix is a mutex (mutual exclusion lock) — see the Mutex vs Semaphore post.

### Thread-Safe Code

A function is **thread-safe** if it behaves correctly when called concurrently by multiple threads. Common patterns:

- Use local variables instead of globals
- Use mutexes to protect shared state
- Use atomic operations for simple counters
- Use thread-local storage (TLS) for per-thread data

### Thread Pool Pattern

Instead of creating a new thread per task (expensive), maintain a pool of pre-created threads that pick up work from a queue:

```
[Main Thread] → [Task Queue] → [Thread 1]
                             → [Thread 2]
                             → [Thread 3]
```

This amortizes thread creation cost and caps resource usage.

---

## Linux Implementation Details

On Linux, processes and threads are both represented as **tasks** (`struct task_struct`). The kernel doesn't truly distinguish between them — the difference is which resources are shared via `clone()` flags:

| `clone()` Flag | Shared Resource |
|---|---|
| `CLONE_VM` | Virtual address space (heap, globals) |
| `CLONE_FILES` | File descriptor table |
| `CLONE_FS` | Filesystem info (cwd, root) |
| `CLONE_SIGHAND` | Signal handlers |
| `CLONE_THREAD` | Thread group (same PID) |

`pthread_create()` passes `CLONE_VM | CLONE_FILES | CLONE_FS | CLONE_SIGHAND | CLONE_THREAD` and more.

`fork()` passes none of these — the child gets copies of everything.

### `/proc` Filesystem

You can inspect processes and threads via `/proc`:

```bash
# List all processes
ls /proc/ | grep -E '^[0-9]+'

# See threads of process 1234
ls /proc/1234/task/

# Memory map of a process
cat /proc/1234/maps

# Status of a process
cat /proc/1234/status
```

---

## Summary

- A **process** is a running program with its own address space and resources. Heavy to create, strongly isolated.
- A **thread** is a unit of execution inside a process. Lightweight, shares memory with siblings, requires synchronization.
- The OS schedules **threads**, not processes. Processes are resource containers.
- Use threads for performance within a single task. Use processes for isolation between tasks.
- The cost of flexibility in threads (shared memory) is the burden of synchronization correctness.
