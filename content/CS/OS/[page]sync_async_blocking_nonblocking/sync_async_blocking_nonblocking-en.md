---
title: "Synchronous vs Asynchronous and Blocking vs Non-Blocking"
description: "A precise explanation of synchronous vs asynchronous execution and blocking vs non-blocking I/O — two orthogonal concepts often confused, with real OS-level examples."
date: "2026-03-04"
category: "CS/OS"
tags: ["OS", "async", "sync", "blocking", "non-blocking", "I/O", "concurrency", "event loop"]
author: "Nemit"
featured: false
pinned: false
---

# Synchronous vs Asynchronous and Blocking vs Non-Blocking

These are two distinct dimensions that are frequently conflated. They are **orthogonal** — any combination is possible. Let's define each precisely before showing how they interact.

---

## Synchronous vs Asynchronous

This dimension is about **when the caller gets control back** relative to when the operation completes.

### Synchronous

The caller waits for the operation to **complete before proceeding**. After calling the operation, the next line of code runs only after the result is ready.

```c
// Synchronous file read
char buf[1024];
ssize_t n = read(fd, buf, sizeof(buf));
// n is the result. This line only runs after read() returns.
printf("Read %zd bytes\n", n);
```

Control flow is linear: call → wait → return → next instruction.

### Asynchronous

The caller **initiates the operation and continues immediately**. The result is delivered later via a callback, event, signal, or future/promise.

```javascript
// Asynchronous file read (Node.js)
fs.readFile('/etc/hosts', (err, data) => {
    // This runs later, after data is ready
    console.log('Read', data.length, 'bytes');
});
console.log('This runs immediately, before file is read');
```

Control flow splits: call → continue → ... → callback invoked when done.

---

## Blocking vs Non-Blocking

This dimension is about **what the thread does while waiting for a resource**.

### Blocking

A blocking call **suspends the calling thread** until the operation can complete. The thread is descheduled (put to sleep by the OS) and wakes up when the result is ready. The thread uses no CPU while waiting, but it cannot do other work.

```c
// Blocking read: thread sleeps until data is available
ssize_t n = read(fd, buf, sizeof(buf));
// Thread was asleep during the I/O wait
```

### Non-Blocking

A non-blocking call **returns immediately**, regardless of whether the operation succeeded. If the result is not yet available, it returns an error code (usually `EAGAIN` or `EWOULDBLOCK`) instead of waiting.

```c
// Set fd to non-blocking mode
int flags = fcntl(fd, F_GETFL, 0);
fcntl(fd, F_SETFL, flags | O_NONBLOCK);

// Non-blocking read
ssize_t n = read(fd, buf, sizeof(buf));
if (n == -1 && errno == EAGAIN) {
    // Data not ready yet — do something else, try again later
}
```

The thread never sleeps. It either gets data immediately or gets told to try again later.

---

## The 2×2 Matrix

These two dimensions combine into four modes:

|  | **Synchronous** | **Asynchronous** |
|---|---|---|
| **Blocking** | Thread waits, returns result | (Rarely makes sense — contradictory) |
| **Non-Blocking** | Returns immediately (success or error), caller polls | Returns immediately, result delivered via callback/event |

### Synchronous + Blocking (Most Common)

The everyday `read()`, `write()`, `connect()` in C. The thread calls the function, goes to sleep, wakes when done, and the result is directly returned.

```c
// The classic: thread sleeps in read(), wakes with data
char buf[4096];
read(sockfd, buf, sizeof(buf));  // Thread blocks here
```

Simple programming model. One operation per thread at a time. Scales poorly — 10,000 concurrent requests need 10,000 threads.

### Synchronous + Non-Blocking (Polling)

Call returns immediately. If result not ready, caller loops and retries.

```c
fcntl(fd, F_SETFL, O_NONBLOCK);

while (1) {
    ssize_t n = read(fd, buf, sizeof(buf));
    if (n > 0) {
        // Got data
        break;
    } else if (errno == EAGAIN) {
        // Not ready, do other work or sleep briefly
        usleep(1000);
        continue;
    } else {
        // Real error
        perror("read");
        break;
    }
}
```

Useful for checking readiness without committing to blocking. Wastes CPU if polling too aggressively. Used in embedded systems and tight loops where sleeping is unacceptable.

### Asynchronous + Blocking (Rare)

The call initiates an async operation but the thread still waits for it to complete — defeating the purpose of async. Example: calling `aio_read()` then immediately calling `aio_suspend()` to wait for it.

This pattern is unusual and typically avoided. It's sometimes seen as a transitional pattern when converting sync code to async incrementally.

### Asynchronous + Non-Blocking (High-Performance I/O)

The call returns immediately and the caller doesn't wait. Results are delivered asynchronously. This is the model used by:
- **epoll** / **kqueue** / **IOCP**
- **io_uring** (Linux 5.1+)
- **Node.js** event loop
- **Python asyncio**
- **Rust async/await**

```c
// epoll-based server (simplified)
int epfd = epoll_create1(0);
struct epoll_event ev = { .events = EPOLLIN, .data.fd = sockfd };
epoll_ctl(epfd, EPOLL_CTL_ADD, sockfd, &ev);

struct epoll_event events[64];
while (1) {
    int n = epoll_wait(epfd, events, 64, -1);  // Blocks until SOME fd is ready
    for (int i = 0; i < n; i++) {
        // Handle each ready fd with non-blocking read
        handle_event(events[i].fd);
    }
}
```

A single thread can manage thousands of connections. The event loop waits (`epoll_wait`) until something is ready, then handles it with non-blocking I/O.

---

## I/O Models in Detail

POSIX defines five I/O models (Stevens, "Unix Network Programming"):

### 1. Blocking I/O

```
Application                 Kernel
   |                           |
   |── read(fd) ──────────────>|
   |   (thread sleeps)         | [waiting for data]
   |                           | [data arrives]
   |<── return data ──────────|
   |   (thread wakes)          |
   | next instruction          |
```

Default mode. Simple. One thread per concurrent operation.

### 2. Non-Blocking I/O (Polling)

```
Application                 Kernel
   |── read(fd) ──────────────>|
   |<── EAGAIN ───────────────|  (data not ready)
   | [do other work]           |
   |── read(fd) ──────────────>|
   |<── EAGAIN ───────────────|  (still not ready)
   | [do other work]           |
   |── read(fd) ──────────────>|
   |<── return data ──────────|  (data ready)
```

No sleeping, but wastes CPU if polling frequently.

### 3. I/O Multiplexing (select / poll / epoll)

```
Application                 Kernel
   |── epoll_wait({fd1,fd2..})->|
   |   (thread sleeps)         | [watching multiple fds]
   |                           | [fd1 becomes readable]
   |<── return: fd1 ready ────|
   | non-blocking read(fd1)    |
```

One thread watches many file descriptors. Sleeps until at least one is ready. Then handles ready ones with non-blocking reads.

`select()`: O(n) scan, max 1024 fds, copies fd_set to kernel on every call. Legacy.
`poll()`: O(n) scan, no hard limit, same copy overhead. Slightly better than select.
`epoll()` (Linux): O(1) notification, kernel maintains the watch list. Scales to millions of fds.
`kqueue()` (BSD/macOS): Similar to epoll.

### Edge-Triggered vs Level-Triggered

This distinction applies to epoll and kqueue:

**Level-triggered** (default): `epoll_wait()` returns a fd as ready as long as the condition is true. If you don't read all available data, the fd is reported ready again on the next call. Forgiving — hard to miss events.

```c
// Level-triggered: epoll keeps returning fd until you drain the buffer
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &(struct epoll_event){.events = EPOLLIN});
// epoll_wait returns fd every time there's data to read
```

**Edge-triggered** (`EPOLLET`): `epoll_wait()` returns a fd only when its state **changes** (e.g., new data arrives). If you don't read all available data, you won't be notified again until more data arrives. You must drain the entire buffer on each notification.

```c
// Edge-triggered: MUST read until EAGAIN, or data will be silently lost
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &(struct epoll_event){.events = EPOLLIN | EPOLLET});

// When epoll_wait returns:
while (1) {
    ssize_t n = read(fd, buf, sizeof(buf));
    if (n == -1 && errno == EAGAIN) break;  // Buffer fully drained
    process(buf, n);
}
```

**Edge-triggered is more efficient** (fewer epoll_wait returns) but more error-prone (failure to drain = silent data loss). High-performance servers (nginx, Redis) use edge-triggered mode.

| | Level-Triggered | Edge-Triggered |
|---|---|---|
| Notification | While condition holds | On state change only |
| Partial read | OK (re-notified) | Must drain (or lose events) |
| Programming | Simpler | Must handle carefully |
| Performance | More syscalls | Fewer syscalls |
| `select`/`poll` | Level-triggered only | N/A |
| `epoll` | Default (`EPOLLIN`) | `EPOLLIN \| EPOLLET` |

### 4. Signal-Driven I/O (SIGIO)

The kernel sends `SIGIO` signal when a fd becomes ready. Rarely used in practice — signal handlers have severe restrictions.

### 5. Asynchronous I/O (POSIX AIO / io_uring)

```
Application                 Kernel
   |── aio_read(fd, buf) ─────>|  (returns immediately)
   | [do other work]           | [I/O in progress]
   |                           | [I/O complete]
   |<── SIGIO/callback ───────|
   | process result            |
```

The kernel does all I/O in the background. The application is notified when complete. The application thread never sleeps waiting for I/O.

**io_uring** (Linux 5.1+) is the modern high-performance AIO interface — submission and completion rings in shared memory, zero-copy, batched syscalls:

```c
struct io_uring ring;
io_uring_queue_init(32, &ring, 0);

// Submit read request
struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
io_uring_prep_read(sqe, fd, buf, sizeof(buf), 0);
io_uring_submit(&ring);

// Do other work...

// Wait for completion
struct io_uring_cqe *cqe;
io_uring_wait_cqe(&ring, &cqe);
// cqe->res = bytes read
io_uring_cqe_seen(&ring, cqe);
```

---

## Practical Comparison

### Thread-per-Connection (Sync + Blocking)

```
Client 1 ──→ Thread 1 (blocking read/write)
Client 2 ──→ Thread 2 (blocking read/write)
Client 3 ──→ Thread 3 (blocking read/write)
...
```

**Pros**: Simple code. Natural sequential flow.
**Cons**: 10,000 clients = 10,000 threads. Each thread = ~8MB stack by default. 10K threads = 80GB RAM just for stacks. Context switch overhead explodes.

### Event Loop (Async + Non-Blocking)

```
Client 1 ──→ [Event Loop] ──→ handles fd 1 (non-blocking)
Client 2 ──→ [Event Loop] ──→ handles fd 2 (non-blocking)
...
All clients handled by ONE thread
```

**Pros**: Handles millions of connections with a single thread. No context switch overhead between connections.
**Cons**: Single-threaded — one slow operation blocks all others. CPU-bound work must be offloaded. Callback hell / complex control flow.

### Async + Thread Pool (Hybrid)

Used by most production systems (Node.js libuv, Tokio in Rust, Java's NIO, .NET's async/await):

- I/O: async non-blocking (epoll/io_uring)
- CPU-bound: offloaded to thread pool
- Coordination: event loop / runtime

---

## Language-Level Async Models

### Callbacks (JavaScript, C)

```javascript
readFile('a.txt', (err, a) => {
    readFile('b.txt', (err, b) => {
        writeFile('c.txt', a + b, (err) => {
            // Callback hell
        });
    });
});
```

Hard to compose. Error handling scattered. "Callback hell".

### Promises / Futures

```javascript
readFile('a.txt')
    .then(a => readFile('b.txt').then(b => [a, b]))
    .then(([a, b]) => writeFile('c.txt', a + b))
    .catch(err => console.error(err));
```

Composable. Better error handling. Still awkward for complex control flow.

### Async/Await (syntactic sugar over promises/futures)

```python
async def process():
    a = await read_file('a.txt')  # Non-blocking — yields to event loop
    b = await read_file('b.txt')  # Non-blocking — yields to event loop
    await write_file('c.txt', a + b)
```

Looks synchronous but is non-blocking. The `await` yields control to the event loop while waiting — other coroutines can run.

```rust
// Rust async/await — zero-cost abstraction
async fn process() -> Result<(), Error> {
    let a = read_file("a.txt").await?;
    let b = read_file("b.txt").await?;
    write_file("c.txt", &(a + &b)).await?;
    Ok(())
}
```

---

## Summary: Which to Use When

| Scenario | Recommended Model |
|---|---|
| Simple scripts, low concurrency | Sync + Blocking (simple threads) |
| High-concurrency network servers | Async + Non-Blocking (event loop, io_uring) |
| Mixed I/O + CPU work | Async I/O + Thread pool for CPU |
| Real-time, latency-sensitive | Non-blocking + careful timing |
| Polling hardware (embedded) | Non-blocking polling loop |
| File I/O in Linux (traditional) | Sync blocking (async file I/O is complex) |
| File I/O in Linux (modern, high-perf) | io_uring |

The key insight: **blocking vs non-blocking** is a property of the OS/system call interface. **Sync vs async** is a property of the programming model layered on top. You can build an async programming model on top of blocking I/O (by dedicating threads), or you can use non-blocking I/O synchronously (by polling).

High-performance systems separate the concerns: use non-blocking I/O at the OS level and build a clean async programming model on top (coroutines, async/await, futures) to keep code readable.

---

## Reactor and Proactor Patterns

These are the two main architectural patterns for building event-driven I/O systems.

### Reactor Pattern

The application registers interest in I/O events (readable, writable) and provides callbacks. The reactor (event loop) waits for events and dispatches callbacks when events occur. The application performs the actual I/O (non-blocking reads/writes) inside the callbacks.

```
[Event Loop / Reactor]
    |
    ├── epoll_wait() → fd1 readable → call on_read(fd1)
    |                                  → application does read(fd1)
    ├── epoll_wait() → fd2 writable → call on_write(fd2)
    |                                  → application does write(fd2)
    └── ...
```

The reactor **demultiplexes** events; the application **handles** them. Used by: Node.js (libuv), Python (asyncio), Java NIO, nginx, Redis.

The I/O itself is still synchronous from the callback's perspective — it happens inside the callback, just non-blocking.

### Proactor Pattern

The application initiates async I/O operations and provides completion callbacks. The proactor (OS or runtime) performs the I/O in the background. When I/O completes, the proactor calls the completion callback with the result already available.

```
[Application]
    |── async_read(fd1, buf, callback) → [OS does I/O in background]
    |── async_write(fd2, data, callback) → [OS does I/O in background]
    |
[OS completes I/O]
    ├── call callback(fd1, bytes_read)   → data already in buf
    └── call callback(fd2, bytes_written) → write already done
```

The application never calls `read()` or `write()` directly. The OS does the I/O and delivers results. Used by: Windows IOCP, Linux io_uring, Boost.Asio (on Windows).

| | Reactor | Proactor |
|---|---|---|
| I/O performed by | Application (in callback) | OS (in background) |
| Event notification | "fd is ready for I/O" | "I/O is complete" |
| Complexity | Simpler | More complex |
| OS support | epoll, kqueue, poll | IOCP, io_uring |
| Examples | Node.js, nginx, Redis | Windows IOCP, io_uring apps |

### io_uring as a Proactor

io_uring on Linux is a true proactor: the application submits I/O requests to the **submission queue (SQ)**, and the kernel completes them and posts results to the **completion queue (CQ)**. Both queues are in shared memory — submissions and completions can happen without any syscalls.

```
User space:                    Kernel:
[SQ Ring] ──submit──→ [Kernel I/O workers]
                               ↓
[CQ Ring] ←─complete─ [Completed I/O results]
```

io_uring can even operate in **submission queue polling** mode (`IORING_SETUP_SQPOLL`), where a kernel thread continuously polls the SQ — the application never makes a single syscall for I/O.

---

## Coroutines and Structured Concurrency

### Stackful vs Stackless Coroutines

**Stackful coroutines** (fibers, green threads): Each coroutine has its own stack. Can yield from any depth in the call stack. More memory per coroutine (~4-64 KB stack). Examples: Go goroutines, Lua coroutines, Java virtual threads (Project Loom).

```
goroutine stack:
[main() → helper() → io_call() → yield]
                                   ↑ can yield from anywhere
```

**Stackless coroutines**: The coroutine is a state machine. Can only yield at `await` points. No separate stack needed — just a small struct holding local variables. More memory-efficient (~few hundred bytes per coroutine). Examples: Rust async/await, C++20 coroutines, Python async/await.

```rust
// Rust: compiled into a state machine
async fn example() {
    let a = fetch_data().await;    // yield point 1
    let b = process(a).await;      // yield point 2
    save(b).await;                 // yield point 3
}
// Each await splits the function into states; local variables stored in the future struct
```

| | Stackful | Stackless |
|---|---|---|
| Memory per coroutine | ~4-64 KB | ~100-500 bytes |
| Yield location | Anywhere in call stack | Only at `await` points |
| Max concurrency | ~100K-1M | ~1M-100M |
| Examples | Go, Java Loom, Lua | Rust, C++20, Python asyncio |
| Overhead | Higher (stack allocation) | Lower (state machine) |

### Structured Concurrency

Traditional concurrency (spawning threads/tasks ad-hoc) leads to fire-and-forget patterns where tasks outlive their parent scope, making error handling and cancellation difficult.

**Structured concurrency** ensures that concurrent tasks are scoped to their parent — a parent task waits for all child tasks to complete before it can complete. If a child fails, the parent and siblings are notified.

```python
# Python: structured concurrency with TaskGroup (Python 3.11+)
async with asyncio.TaskGroup() as tg:
    task1 = tg.create_task(fetch("url1"))
    task2 = tg.create_task(fetch("url2"))
    task3 = tg.create_task(fetch("url3"))
# All tasks are guaranteed to be done here
# If any task fails, the others are cancelled automatically
```

```kotlin
// Kotlin: structured concurrency with coroutineScope
coroutineScope {
    val a = async { fetchData("A") }
    val b = async { fetchData("B") }
    println("Results: ${a.await()}, ${b.await()}")
}
// Scope doesn't exit until both async tasks complete
// If one fails, the other is cancelled
```

Benefits:
- No leaked tasks (every task has an owner)
- Automatic cancellation propagation
- Error handling follows the call stack
- Resource cleanup is deterministic

---

## Backpressure

In async systems, producers can generate work faster than consumers can process it. Without **backpressure**, buffers grow unbounded → memory exhaustion.

Backpressure mechanisms:
- **Bounded channels/queues**: Producer blocks (or gets an error) when the queue is full
- **Flow control in TCP**: TCP's sliding window automatically slows the sender when the receiver can't keep up
- **Reactive Streams**: The consumer tells the producer how many items it can handle (`request(n)`)
- **epoll edge-triggered + non-blocking writes**: If `write()` returns `EAGAIN`, the buffer is full — stop writing until the fd becomes writable again

```
Without backpressure:
  Producer (fast) → [buffer grows forever] → Consumer (slow) → OOM

With backpressure:
  Producer → [bounded buffer, size N] → Consumer
  Buffer full? → Producer blocks/slows down → system stays stable
```

This is critical for production systems. A fast database query dumping results into a slow network connection, or a fast producer feeding a slow consumer through a channel — without backpressure, the intermediary buffer consumes all available memory.
