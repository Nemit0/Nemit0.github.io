---
title: "static, extern, and const Keywords in C/C++"
description: "Storage classes and type qualifiers — static, extern, const, volatile, register, constexpr, and their effects on linkage, lifetime, and optimization."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "static", "extern", "const", "storage class", "linkage"]
author: "Nemit"
featured: false
pinned: false
---

# static, extern, and const Keywords in C/C++

## Storage Duration, Scope, and Linkage

Every variable in C/C++ has three properties:

| Property | Description | Options |
|---|---|---|
| **Storage duration** | How long the variable exists | Automatic, static, dynamic, thread |
| **Scope** | Where the name is visible | Block, file, function, namespace |
| **Linkage** | Whether the name is shared across translation units | None, internal, external |

A **translation unit** is a source file after preprocessing (after all `#include` expansions).

---

## `static`

The `static` keyword has different meanings depending on context:

### 1. Static Local Variables

A local variable with `static` has **static storage duration** — it persists across function calls:

```c
void counter() {
    static int count = 0;   // Initialized ONCE, persists across calls
    count++;
    printf("Count: %d\n", count);
}

counter();   // Count: 1
counter();   // Count: 2
counter();   // Count: 3
```

Properties:
- Initialized only once (at program start or first call, depending on language)
- Retains value between function calls
- Stored in data/BSS segment (not stack)
- In C: initialized before `main()` (must be constant expression)
- In C++: initialized on first call (thread-safe since C++11)

```cpp
// C++: thread-safe initialization (Meyers' singleton)
Logger& get_logger() {
    static Logger instance;   // Created on first call, thread-safe
    return instance;
}
```

### 2. Static Global Variables — Internal Linkage

At file scope, `static` gives a variable or function **internal linkage** — visible only within the current translation unit:

```c
// file1.c
static int counter = 0;         // Only visible in file1.c
static void helper() { ... }    // Only visible in file1.c

// file2.c
// Cannot access counter or helper() from file1.c
// Can define its own 'static int counter' without conflict
```

Without `static`, file-scope variables and functions have **external linkage** by default (accessible from other files via `extern`).

### 3. Static Class Members (C++)

A `static` member belongs to the **class** rather than any instance:

```cpp
class Widget {
    static int count;        // Declaration — shared among all instances
public:
    Widget() { count++; }
    ~Widget() { count--; }
    static int getCount() { return count; }
};

int Widget::count = 0;       // Definition — must be in exactly one .cpp file

Widget a, b, c;
Widget::getCount();          // 3
```

Static member functions:
- Can be called without an object: `Widget::getCount()`
- Cannot access non-static members (no `this` pointer)
- Can access private static members

### C++17 Inline Static Members

```cpp
class Widget {
    inline static int count = 0;   // Definition in header — no separate .cpp needed
};
```

---

## `extern`

`extern` declares that a variable or function is defined **elsewhere** (in another translation unit):

### Variable Declaration vs Definition

```c
// file1.c — DEFINITION (allocates storage)
int global_counter = 0;

// file2.c — DECLARATION (no storage, references file1.c's definition)
extern int global_counter;

void increment() {
    global_counter++;    // Uses the same variable from file1.c
}
```

Rules:
- `extern int x;` — declaration (no storage allocated)
- `int x;` at file scope — tentative definition (becomes definition if no other definition exists)
- `int x = 5;` — definition with initializer
- `extern int x = 5;` — definition (initializer makes it a definition despite `extern`)
- There must be **exactly one definition** across all translation units (One Definition Rule)

### `extern` with Functions

Functions are `extern` by default — the keyword is optional:

```c
// These are equivalent:
void func();
extern void func();
```

### `extern "C"` (C++)

Disables C++ name mangling for C interoperability:

```cpp
// C++ header usable from C
#ifdef __cplusplus
extern "C" {
#endif

void c_function(int x);
int c_variable;

#ifdef __cplusplus
}
#endif
```

C++ name mangling encodes function signatures (for overloading). `extern "C"` uses C-style names so C code can link against them.

```cpp
// Without extern "C": symbol might be _Z10c_functioni
// With extern "C":    symbol is c_function
```

---

## `const`

Declares that a value cannot be modified after initialization.

### `const` Variables

```c
const int MAX = 100;
// MAX = 200;        // Error: cannot modify const

const int *p;        // Pointer to const int — can't modify *p
int *const q = &x;   // Const pointer — can't modify q itself
const int *const r = &x;  // Both const
```

### `const` in C vs C++

| Feature | C | C++ |
|---|---|---|
| Linkage | External (like regular variables) | **Internal** (like `static`) |
| Compile-time constant | No (just read-only) | Yes (if initialized with constant expression) |
| Array size | Cannot use `const int` as array size | Can (treated as compile-time constant) |
| Required initializer | No (`extern const int x;` ok) | Yes (must initialize) |

```c
// C:
const int N = 10;
int arr[N];          // ERROR in C (N is not a compile-time constant)
                     // Use #define N 10 instead

// C++:
const int N = 10;
int arr[N];          // OK in C++ (N is a compile-time constant)
```

### `const` with Pointers (Read Right-to-Left)

```c
      int *p;              // Pointer to int
const int *p;              // Pointer to const int (can't modify *p)
      int *const p;        // Const pointer to int (can't modify p)
const int *const p;        // Const pointer to const int
```

Mnemonic: read right-to-left from the variable name.

### `const` Parameters

```c
// Promise not to modify the pointed-to data:
void print(const char *s) {
    // s[0] = 'X';   // Error: s points to const char
    printf("%s\n", s);
}

// The pointer itself is also const (less useful in declaration):
void func(int *const p) {
    *p = 42;         // OK: can modify pointed-to value
    // p = NULL;     // Error: can't modify the pointer
}
```

### `const` Correctness

Const correctness means consistently using `const` where data shouldn't be modified. It catches bugs at compile time and enables optimizations.

```cpp
class Matrix {
    std::vector<double> data_;
    size_t rows_, cols_;
public:
    // const method — promises not to modify the object
    double at(size_t r, size_t c) const {
        return data_[r * cols_ + c];
    }

    // Non-const method — can modify
    double& at(size_t r, size_t c) {
        return data_[r * cols_ + c];
    }
};

void print(const Matrix &m) {
    m.at(0, 0);     // Calls const version
    // m.at(0, 0) = 5; // Error: const reference
}
```

### `mutable` (C++)

Allows a member to be modified even in a `const` context:

```cpp
class Cache {
    mutable std::unordered_map<int, int> cache_;
    mutable std::mutex mtx_;

public:
    int compute(int x) const {   // const method
        std::lock_guard<std::mutex> lock(mtx_);  // OK: mtx_ is mutable
        auto it = cache_.find(x);
        if (it != cache_.end()) return it->second;
        int result = expensive(x);
        cache_[x] = result;      // OK: cache_ is mutable
        return result;
    }
};
```

---

## `constexpr` (C++11)

Declares that a value or function **can** be evaluated at compile time:

```cpp
constexpr int square(int x) { return x * x; }

constexpr int N = square(5);     // Computed at compile time: 25
int arr[N];                       // OK: N is compile-time constant

// Can also be used at runtime:
int x;
std::cin >> x;
int y = square(x);               // Computed at runtime
```

### `constexpr` vs `const`

| | `const` | `constexpr` |
|---|---|---|
| Must be compile-time? | No (in C); usually yes (in C++) | Yes (when used in constexpr context) |
| Can be runtime value? | Yes | Yes (when not in constexpr context) |
| Functions? | No | Yes (C++11+) |
| Complex logic? | N/A | Yes (C++14: loops, variables; C++20: dynamic alloc) |

```cpp
const int a = 10;          // Compile-time (probably)
const int b = rand();      // Runtime — still const (can't modify after init)

constexpr int c = 10;      // Guaranteed compile-time
// constexpr int d = rand(); // Error: rand() is not constexpr
```

### `consteval` (C++20) and `constinit` (C++20)

```cpp
consteval int must_compile_time(int x) { return x * x; }
// MUST be evaluated at compile time — error if called at runtime

constinit int global = square(5);
// Must be initialized at compile time, but can be modified at runtime
// Prevents "static initialization order fiasco"
```

---

## `volatile`

Tells the compiler that a variable's value may change **outside the program's control** — prevents optimization of reads/writes:

```c
volatile int *hardware_reg = (volatile int *)0x40001000;

// Without volatile: compiler might cache the value in a register
// With volatile: every read/write goes to the actual memory address
while (*hardware_reg & 0x01) {
    // Compiler MUST re-read *hardware_reg each iteration
}
```

Use cases:
- Memory-mapped hardware registers
- Signal handlers (with `sig_atomic_t`)
- `setjmp`/`longjmp` variables

**NOT** useful for:
- Thread synchronization (use atomics or mutexes instead)
- Making operations atomic (volatile ≠ atomic)

```c
// WRONG — volatile does NOT make this thread-safe:
volatile int shared_counter = 0;
shared_counter++;  // Still a read-modify-write — not atomic

// CORRECT — use atomics:
#include <stdatomic.h>
atomic_int shared_counter = 0;
atomic_fetch_add(&shared_counter, 1);  // Atomic increment
```

### `const volatile`

Seems contradictory but is valid — the program can't modify it, but hardware can:

```c
const volatile int *status_reg = (const volatile int *)0x40002000;
// Program can only read; hardware may change the value
int status = *status_reg;   // Must read from memory each time
```

---

## `register` (Deprecated)

Suggests that a variable be stored in a CPU register. Compilers ignore this hint — they do register allocation better than humans.

```c
register int i;          // Hint: keep i in a register
// &i;                   // ERROR in C: can't take address of register variable
                         // OK in C++ (keyword effectively ignored)
```

`register` was deprecated in C++11 and removed in C++17. Don't use it.

---

## Storage Class Summary

| Keyword | Scope | Storage Duration | Linkage | Notes |
|---|---|---|---|---|
| (none, local) | Block | Automatic | None | Default for local variables |
| `static` (local) | Block | Static | None | Persists across calls |
| `static` (global) | File | Static | Internal | Hidden from other TUs |
| `extern` | File | Static | External | Defined elsewhere |
| `register` | Block | Automatic | None | Deprecated hint |
| `thread_local` | Block/File | Thread | Internal/External | Per-thread variable |
| `inline` (C++17 var) | File | Static | External | Multiple definitions OK |

---

## `thread_local` (C++11) / `_Thread_local` (C11)

Each thread gets its own copy of the variable:

```cpp
thread_local int tls_counter = 0;

void thread_func() {
    tls_counter++;    // Each thread has its own counter
    printf("Thread counter: %d\n", tls_counter);
}

// Thread 1: tls_counter = 1
// Thread 2: tls_counter = 1
// (independent copies)
```

Use cases: per-thread caches, error codes (`errno` is typically thread-local), thread-local allocators.

---

## Linkage Rules Summary

### C Linkage

| Declaration | Linkage |
|---|---|
| `int x;` (file scope) | External |
| `static int x;` (file scope) | Internal |
| `extern int x;` | External |
| `void func();` | External |
| `static void func();` | Internal |
| `int x;` (block scope) | None |

### C++ Differences

| Declaration | C Linkage | C++ Linkage |
|---|---|---|
| `const int x = 5;` (file scope) | External | **Internal** |
| `inline` functions | N/A (C99: complex rules) | External |
| Anonymous namespace members | N/A | **Internal** |

```cpp
// C++: anonymous namespace = better alternative to static
namespace {
    int internal_var = 42;       // Internal linkage
    void internal_func() { }    // Internal linkage
}
// Preferred over 'static' at file scope in C++
```

---

## One Definition Rule (ODR)

- **One definition** of each variable/function across all translation units (for external linkage)
- **One definition** per translation unit for internal linkage entities
- Exception: `inline` functions/variables, templates, and `constexpr` functions can have multiple identical definitions (one per TU)

```cpp
// header.h — WRONG (multiple definitions if included from multiple .cpp files)
int global = 42;

// header.h — CORRECT options:
extern int global;                    // Declaration only (define in one .cpp)
inline int global = 42;              // C++17: inline variable
constexpr int global = 42;           // constexpr implies internal linkage
static int global = 42;              // Internal linkage (separate copy per TU)
```

### The Static Initialization Order Fiasco

```cpp
// file1.cpp
int a = 10;

// file2.cpp
extern int a;
int b = a + 1;   // DANGER: a might not be initialized yet
```

Global variables across translation units have **unspecified** initialization order. Fix with the **Construct On First Use** idiom:

```cpp
int& get_a() {
    static int a = 10;    // Guaranteed initialized on first call
    return a;
}

int b = get_a() + 1;     // Safe
```

Or use C++20 `constinit`:

```cpp
constinit int a = 10;    // Guaranteed compile-time initialization
```
