---
title: "Memory Allocation in C/C++ (malloc/free, new/delete)"
description: "Dynamic memory management in C and C++ — how malloc, calloc, realloc, free, new, and delete work, memory layout, common pitfalls, and smart pointers."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "memory", "malloc", "free", "new", "delete", "heap", "smart pointers"]
author: "Nemit"
featured: false
pinned: false
---

# Memory Allocation in C/C++

## Memory Regions

A C/C++ program has four main memory regions:

| Region | Contents | Lifetime | Growth |
|---|---|---|---|
| **Text (Code)** | Machine instructions | Program lifetime | Fixed |
| **Data/BSS** | Global/static variables | Program lifetime | Fixed |
| **Stack** | Local variables, function frames | Function scope (auto) | Grows downward |
| **Heap** | Dynamically allocated memory | Until explicitly freed | Grows upward |

```
High addresses
┌──────────────┐
│    Stack      │ ← grows downward
│      ↓        │
│              │
│      ↑        │
│    Heap       │ ← grows upward
├──────────────┤
│  BSS (uninit) │
├──────────────┤
│  Data (init)  │
├──────────────┤
│    Text       │
└──────────────┘
Low addresses
```

---

## Stack vs Heap

| | Stack | Heap |
|---|---|---|
| **Allocation** | Automatic (compiler manages) | Manual (`malloc`/`new`) |
| **Deallocation** | Automatic (scope exit) | Manual (`free`/`delete`) |
| **Speed** | Very fast (just move stack pointer) | Slower (allocator bookkeeping) |
| **Size** | Limited (~1-8 MB default) | Limited by available RAM |
| **Fragmentation** | None (LIFO order) | Possible |
| **Thread safety** | Each thread has own stack | Shared (needs synchronization) |
| **Access pattern** | LIFO only | Random access |

```c
void example() {
    int x = 10;                    // Stack: automatic lifetime
    int *p = malloc(sizeof(int));  // Heap: manual lifetime
    *p = 20;
    free(p);                       // Must free manually
}   // x is automatically freed when function returns
```

---

## C Memory Allocation: malloc, calloc, realloc, free

### `malloc(size_t size)`

Allocates `size` bytes of **uninitialized** memory. Returns `void *` to the allocated block, or `NULL` on failure.

```c
#include <stdlib.h>

int *arr = malloc(10 * sizeof(int));
if (arr == NULL) {
    perror("malloc failed");
    exit(1);
}

// Use arr[0] through arr[9]
// WARNING: contents are uninitialized (garbage values)

free(arr);
```

**Always check for NULL.** `malloc` can fail if memory is exhausted.

**Always use `sizeof`**, never hardcode sizes:

```c
// Good:
int *p = malloc(n * sizeof(int));
int *p = malloc(n * sizeof(*p));    // Even better: type-agnostic

// Bad:
int *p = malloc(n * 4);    // Assumes int is 4 bytes
```

### `calloc(size_t count, size_t size)`

Allocates memory for `count` elements of `size` bytes each. **Zero-initializes** the memory.

```c
int *arr = calloc(10, sizeof(int));
// arr[0] through arr[9] are all 0
```

`calloc` also checks for integer overflow in `count * size` — safer than `malloc(count * size)`.

### `realloc(void *ptr, size_t new_size)`

Resizes a previously allocated block. May move the data to a new location if it can't expand in place.

```c
int *arr = malloc(5 * sizeof(int));
// ... fill arr[0..4] ...

int *tmp = realloc(arr, 10 * sizeof(int));
if (tmp == NULL) {
    // realloc failed — arr is still valid
    free(arr);
    exit(1);
}
arr = tmp;
// arr[0..4] preserved, arr[5..9] uninitialized
```

**Critical pattern**: Never do `arr = realloc(arr, ...)`. If `realloc` fails, it returns NULL and the original pointer is lost — memory leak.

Special cases:
- `realloc(NULL, size)` ≡ `malloc(size)`
- `realloc(ptr, 0)` — implementation-defined (may free or return a minimal block)

### `free(void *ptr)`

Releases memory allocated by `malloc`/`calloc`/`realloc`. After `free`, the pointer is **dangling** — do not use it.

```c
free(arr);
arr = NULL;    // Good practice: prevent accidental reuse
```

Rules:
- Only `free` what was `malloc`'d/`calloc`'d/`realloc`'d
- Don't `free` stack memory, globals, or string literals
- Don't `free` the same pointer twice (**double free** — undefined behavior, potential security vulnerability)
- `free(NULL)` is safe (does nothing)

---

## How malloc Works Internally

`malloc` doesn't directly call the OS for every allocation. It maintains a **free list** — a data structure tracking available memory blocks within a larger region obtained from the OS.

### Typical Implementation

1. First `malloc` call: request a large chunk from the OS via `brk()` or `mmap()`
2. Split the chunk into blocks as requested
3. Each block has a **header** containing size and metadata
4. When `free`'d, the block is added back to the free list
5. Adjacent free blocks are **coalesced** (merged) to reduce fragmentation

```
Memory layout with headers:
┌────────┬──────────┬────────┬──────────┬────────┬──────────┐
│ header │  used    │ header │  free    │ header │  used    │
│ (size) │  block   │ (size) │  block   │ (size) │  block   │
└────────┴──────────┴────────┴──────────┴────────┴──────────┘
```

### Allocation Strategies

| Strategy | Description | Tradeoff |
|---|---|---|
| **First Fit** | Scan list, use first block that fits | Fast but causes fragmentation at start |
| **Best Fit** | Find smallest block that fits | Less wasted space but slower scan |
| **Worst Fit** | Use largest available block | Leaves large remaining blocks |
| **Segregated Free Lists** | Separate lists by size class | Fast for common sizes (used by glibc) |

glibc's `malloc` (ptmalloc2) uses:
- **Fast bins**: small allocations (≤ 80 bytes) — singly-linked LIFO cache
- **Small bins**: medium allocations — doubly-linked, FIFO
- **Large bins**: large allocations — sorted by size
- **mmap**: very large allocations (≥ 128 KB default) — directly mapped from OS

### Memory Overhead

Each `malloc` block has a header (typically 8-16 bytes on 64-bit). Allocating 1 byte actually uses ~24-32 bytes. For many small allocations, overhead can dominate.

---

## C++ Memory Allocation: new, delete

### `new` and `delete`

C++ introduces `new` and `delete` operators that are type-safe and call constructors/destructors:

```cpp
// Single object
int *p = new int(42);       // Allocate + initialize to 42
delete p;                    // Deallocate

// Array
int *arr = new int[10];      // Allocate array of 10 ints
delete[] arr;                // MUST use delete[] for arrays

// With constructor/destructor
std::string *s = new std::string("hello");
delete s;                    // Calls ~string() destructor, then frees memory
```

### `new` vs `malloc`

| Feature | `malloc` (C) | `new` (C++) |
|---|---|---|
| Returns | `void *` (must cast in C++) | Correct type (no cast needed) |
| Initialization | Uninitialized | Calls constructor |
| Failure | Returns `NULL` | Throws `std::bad_alloc` |
| Size | Manual `sizeof` | Compiler computes size |
| Deallocation | `free()` | `delete` / `delete[]` |
| Overloadable | No | Yes (per-class or global) |

```cpp
// malloc in C++: must cast, no constructor
MyClass *obj = (MyClass *)malloc(sizeof(MyClass));
// obj->member is garbage — constructor NOT called
free(obj);  // destructor NOT called — resource leak if MyClass owns resources

// new in C++: type-safe, constructor called
MyClass *obj = new MyClass(args);
delete obj;  // destructor called, then memory freed
```

### Placement `new`

Construct an object at a **specific memory address** without allocating:

```cpp
#include <new>

char buffer[sizeof(MyClass)];
MyClass *obj = new (buffer) MyClass(args);  // Construct in buffer

// Must manually call destructor (no delete — memory isn't from new)
obj->~MyClass();
```

Used in memory pools, custom allocators, and embedded systems.

### `new` Failure Handling

```cpp
// Default: throws std::bad_alloc
try {
    int *p = new int[1000000000000];
} catch (std::bad_alloc &e) {
    std::cerr << "Allocation failed: " << e.what() << std::endl;
}

// nothrow version: returns nullptr instead
int *p = new (std::nothrow) int[1000000000000];
if (p == nullptr) {
    // Handle failure
}
```

---

## C++ Smart Pointers (RAII)

Raw `new`/`delete` is error-prone. Modern C++ uses **smart pointers** that automatically manage memory through **RAII** (Resource Acquisition Is Initialization):

### `std::unique_ptr` (Exclusive Ownership)

```cpp
#include <memory>

auto p = std::make_unique<int>(42);
// p owns the int. When p goes out of scope, the int is deleted.

std::unique_ptr<int[]> arr = std::make_unique<int[]>(10);
// Array version

// Cannot copy — ownership is exclusive
// std::unique_ptr<int> q = p;   // Error: deleted copy constructor

// Can move
std::unique_ptr<int> q = std::move(p);  // p is now nullptr
```

### `std::shared_ptr` (Shared Ownership)

```cpp
auto p = std::make_shared<int>(42);
auto q = p;    // Both p and q own the int. Reference count = 2.

// When both p and q go out of scope, the int is deleted.
printf("use_count: %ld\n", p.use_count());  // 2
```

`shared_ptr` uses **reference counting**. Every copy increments the count; every destructor decrements it. When count reaches 0, the object is deleted.

**Cost**: extra allocation for control block (reference count), atomic increment/decrement on copy/destroy.

### `std::weak_ptr` (Non-Owning Observer)

```cpp
std::shared_ptr<int> sp = std::make_shared<int>(42);
std::weak_ptr<int> wp = sp;   // Does NOT increment reference count

if (auto locked = wp.lock()) {
    // locked is a shared_ptr — object still alive
    printf("%d\n", *locked);
} else {
    // Object has been destroyed
}
```

Breaks circular references that would prevent `shared_ptr` from ever freeing memory.

### The Rule of Zero / Three / Five

**Rule of Zero**: If your class doesn't manage resources directly (uses smart pointers, standard containers), you don't need to write any special member functions.

**Rule of Three** (C++03): If you define any of destructor, copy constructor, or copy assignment operator, you probably need all three.

**Rule of Five** (C++11): Add move constructor and move assignment operator to the three.

```cpp
// Rule of Zero — preferred
class Modern {
    std::unique_ptr<int[]> data;
    std::string name;
    // No destructor, copy/move constructors, or assignment operators needed
    // The compiler generates correct ones automatically
};
```

---

## Common Memory Bugs

### Memory Leak

Allocated memory is never freed:

```c
void leak() {
    int *p = malloc(1000);
    // ... use p ...
    return;    // p is never freed — 1000 bytes leaked
}
```

Detect with: **Valgrind** (`valgrind --leak-check=full ./program`), **AddressSanitizer** (`-fsanitize=address`).

### Use After Free

Accessing memory after it's been freed:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
printf("%d\n", *p);   // UNDEFINED BEHAVIOR — might print 42, might crash
```

### Double Free

Freeing the same memory twice:

```c
free(p);
free(p);   // UNDEFINED BEHAVIOR — heap corruption, potential exploit
```

### Buffer Overflow

Writing beyond allocated bounds:

```c
int *p = malloc(5 * sizeof(int));
p[5] = 99;    // Out of bounds — overwrites heap metadata or adjacent data
```

### Stack Overflow

Exceeding the stack size limit (deep recursion, large local arrays):

```c
void recurse() { recurse(); }           // Infinite recursion — stack overflow
void big() { int arr[10000000]; }       // 40 MB local array — likely overflow
```

---

## Debugging Tools

| Tool | Detects | Usage |
|---|---|---|
| **Valgrind (memcheck)** | Leaks, use-after-free, uninitialized reads, invalid reads/writes | `valgrind --leak-check=full ./prog` |
| **AddressSanitizer (ASan)** | Buffer overflow, use-after-free, double free, leaks | `gcc -fsanitize=address -g` |
| **MemorySanitizer (MSan)** | Uninitialized memory reads | `clang -fsanitize=memory` |
| **UndefinedBehaviorSanitizer** | UB including null deref, signed overflow | `gcc -fsanitize=undefined` |

```bash
# Compile with AddressSanitizer
gcc -fsanitize=address -g -o program program.c
./program
# Reports errors with source location and stack trace

# Valgrind (no recompilation needed, but slower)
valgrind --leak-check=full --show-leak-kinds=all ./program
```

---

## Memory Alignment

Modern CPUs access memory most efficiently when data is **aligned** to its natural boundary:

- `char`: 1-byte aligned (any address)
- `short`: 2-byte aligned (address divisible by 2)
- `int`: 4-byte aligned
- `double`: 8-byte aligned
- Pointers: 4 or 8-byte aligned

Structs are padded by the compiler to maintain alignment:

```c
struct Padded {
    char a;     // 1 byte
    // 3 bytes padding
    int b;      // 4 bytes (must be 4-byte aligned)
    char c;     // 1 byte
    // 3 bytes padding (struct size must be multiple of largest member alignment)
};
// sizeof(struct Padded) = 12, not 6

struct Packed {
    int b;      // 4 bytes
    char a;     // 1 byte
    char c;     // 1 byte
    // 2 bytes padding
};
// sizeof(struct Packed) = 8 — better layout by reordering
```

`malloc` returns memory aligned for any standard type (at least 16-byte aligned on most 64-bit systems). For stricter alignment (SIMD, page boundaries), use `aligned_alloc()` (C11) or `posix_memalign()`.
