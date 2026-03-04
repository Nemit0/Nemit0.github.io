---
title: "Reference vs Pointer in C++"
description: "Detailed comparison of references and pointers in C++ — semantics, memory model, use cases, const references, rvalue references, and best practices."
date: "2026-03-04"
category: "programming/c"
tags: ["C++", "references", "pointers", "rvalue references", "move semantics"]
author: "Nemit"
featured: false
pinned: false
---

# Reference vs Pointer in C++

## Fundamental Differences

| Feature | Pointer | Reference |
|---|---|---|
| **Syntax** | `int *p = &x;` | `int &r = x;` |
| **Nullable** | Yes (`nullptr`) | No — must bind to an object |
| **Rebindable** | Yes (`p = &y;`) | No — bound for lifetime |
| **Indirection** | Explicit (`*p`, `p->m`) | Implicit (use like the object itself) |
| **Arithmetic** | Yes (`p + 1`, `p++`) | No |
| **sizeof** | Size of pointer (8 bytes on 64-bit) | Size of referenced object |
| **Address** | `&p` = address of pointer variable | `&r` = address of referenced object |
| **Multiple levels** | `int **pp;` | No reference to reference |
| **Arrays** | `int *arr[10]` (array of pointers) | `int &arr[10]` is illegal |

```cpp
int x = 10;
int y = 20;

int *p = &x;    // p points to x
p = &y;          // p now points to y — rebound
*p = 30;         // y is now 30

int &r = x;      // r IS x (alias)
// int &r2;      // Error: must initialize
r = 50;          // x is now 50
// Can't rebind r to y
```

---

## How References Work Internally

The C++ standard says a reference is not an object — it's an **alias**. However, compilers typically implement references as **const pointers** (a pointer that can't be reseated):

```cpp
int x = 42;
int &r = x;
r = 100;

// Compiler may generate equivalent to:
int x = 42;
int *const __r = &x;
*__r = 100;
```

In function parameters and return values, references are typically passed as pointers at the ABI level. For local references to local variables, the compiler may optimize away the indirection entirely.

---

## Lvalue References

An **lvalue reference** (`T &`) binds to an lvalue — a named object with a persistent address:

```cpp
int x = 10;
int &ref = x;       // OK: x is an lvalue

// int &ref2 = 42;  // Error: 42 is an rvalue (temporary)
```

### Pass by Reference

Avoids copying and allows modification of the original:

```cpp
void swap(int &a, int &b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int x = 1, y = 2;
swap(x, y);    // x=2, y=1 — no pointers needed
```

Compared to pointer version:

```cpp
void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

swap(&x, &y);   // Caller must pass addresses
```

References are cleaner: no `*` dereferencing, no `&` at call site, no null checks needed.

### Return by Reference

Returning a reference avoids copying and allows the caller to modify the original:

```cpp
int& at(std::vector<int> &v, size_t i) {
    return v[i];
}

std::vector<int> v = {10, 20, 30};
at(v, 1) = 99;   // v is now {10, 99, 30}
```

**Never return a reference to a local variable:**

```cpp
int& bad() {
    int x = 42;
    return x;      // UNDEFINED BEHAVIOR — x destroyed when function returns
}
```

---

## Const References

A `const` reference (`const T &`) can bind to:
- Lvalues
- Rvalues (temporaries)
- Values of different types (with implicit conversion)

```cpp
int x = 10;
const int &r1 = x;       // OK: lvalue
const int &r2 = 42;      // OK: rvalue — lifetime extended
const int &r3 = x + 1;   // OK: temporary — lifetime extended

// r1 = 20;  // Error: can't modify through const reference
```

### Lifetime Extension

When a `const` reference binds to a temporary, the temporary's lifetime is **extended** to match the reference's lifetime:

```cpp
const std::string &s = std::string("hello");
// The temporary string lives as long as 's' is in scope
std::cout << s << "\n";   // Safe
```

This does **not** work through function calls:

```cpp
const std::string& identity(const std::string &s) { return s; }
const std::string &bad = identity(std::string("hello"));
// Temporary destroyed at end of full expression — bad is dangling
```

### Pass by Const Reference

The most common way to pass large objects without copying:

```cpp
void print(const std::string &s) {
    std::cout << s << "\n";
    // Can read s, cannot modify it
}

print("hello");                // Implicit conversion from const char* to string
print(std::string("world"));   // Rvalue binds to const ref
std::string msg = "foo";
print(msg);                    // Lvalue binds to const ref
```

**Rule of thumb**: pass by value for cheap-to-copy types (`int`, `double`, `char`, small structs), pass by `const &` for everything else.

---

## Rvalue References (C++11)

An **rvalue reference** (`T &&`) binds to rvalues — temporaries and values about to be destroyed. This enables **move semantics**.

```cpp
int &&rr = 42;           // OK: binds to rvalue
std::string &&sr = std::string("temp");  // OK

int x = 10;
// int &&rr2 = x;        // Error: x is an lvalue
int &&rr2 = std::move(x); // OK: std::move casts lvalue to rvalue
```

### Move Semantics

Move semantics allow stealing resources from an object that's about to be destroyed, instead of copying:

```cpp
class Buffer {
    int *data_;
    size_t size_;
public:
    // Copy constructor — expensive (allocate + copy)
    Buffer(const Buffer &other) : size_(other.size_) {
        data_ = new int[size_];
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // Move constructor — cheap (steal pointers)
    Buffer(Buffer &&other) noexcept
        : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;   // Leave source in valid state
        other.size_ = 0;
    }

    // Move assignment
    Buffer& operator=(Buffer &&other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }

    ~Buffer() { delete[] data_; }
};

Buffer a(1000000);
Buffer b = std::move(a);   // Move: b steals a's data. a is now empty.
```

### `std::move`

`std::move` doesn't move anything — it's just a cast to `T &&`. The actual move happens when the rvalue reference is used by a move constructor or move assignment:

```cpp
template <typename T>
constexpr std::remove_reference_t<T>&& move(T&& t) noexcept {
    return static_cast<std::remove_reference_t<T>&&>(t);
}
```

After `std::move`, the source object is in a **valid but unspecified state**. You can reassign it or destroy it, but don't read its value.

---

## Forwarding References (Universal References)

`T &&` in a template context is a **forwarding reference**, not an rvalue reference:

```cpp
template <typename T>
void wrapper(T &&arg) {
    // arg could be lvalue ref or rvalue ref depending on what's passed
    inner(std::forward<T>(arg));   // Perfect forwarding
}

int x = 10;
wrapper(x);     // T = int&,  arg is int& (lvalue reference)
wrapper(42);    // T = int,   arg is int&& (rvalue reference)
```

### Reference Collapsing Rules

When references combine through templates or typedefs:

| Combination | Result |
|---|---|
| `T& &` | `T&` |
| `T& &&` | `T&` |
| `T&& &` | `T&` |
| `T&& &&` | `T&&` |

Lvalue reference always wins — the result is only an rvalue reference when both sides are rvalue references.

### `std::forward` (Perfect Forwarding)

`std::forward<T>(arg)` preserves the value category of the original argument:

```cpp
template <typename T>
void factory(T &&arg) {
    // Without forward: arg is always lvalue (it has a name)
    // With forward: preserves whether caller passed lvalue or rvalue
    auto obj = MyClass(std::forward<T>(arg));
}
```

This is critical for avoiding unnecessary copies in generic code (e.g., `std::make_unique`, `emplace_back`).

---

## Pointer-to-Member

C++ has pointers to members — a feature that references don't have:

```cpp
struct S {
    int x;
    int y;
    void print() { std::cout << x << ", " << y << "\n"; }
};

// Pointer to data member
int S::*pm = &S::x;
S s{10, 20};
std::cout << s.*pm << "\n";    // 10 (access x through pointer-to-member)
pm = &S::y;
std::cout << s.*pm << "\n";    // 20

// Pointer to member function
void (S::*pmf)() = &S::print;
(s.*pmf)();                     // Calls s.print()

// Through pointer to object
S *sp = &s;
std::cout << sp->*pm << "\n";
(sp->*pmf)();
```

---

## Smart Pointers: Reference-Like Semantics with Pointer Flexibility

Smart pointers combine the flexibility of pointers (nullable, rebindable, heap allocation) with automatic resource management:

```cpp
// unique_ptr: exclusive ownership
auto up = std::make_unique<Widget>();
up->doWork();         // Arrow operator, like raw pointer
Widget &ref = *up;    // Dereference to get reference

// shared_ptr: shared ownership
auto sp = std::make_shared<Widget>();
auto sp2 = sp;        // Reference count incremented
```

| Feature | Raw Pointer | Smart Pointer | Reference |
|---|---|---|---|
| Nullable | Yes | Yes (except not recommended for unique_ptr) | No |
| Rebindable | Yes | Yes | No |
| Owns resource | No | Yes | No |
| Automatic cleanup | No | Yes | N/A |
| Can be stored in containers | Yes | Yes | No (use `std::reference_wrapper`) |

---

## `std::reference_wrapper`

Since references can't be stored in containers, `std::reference_wrapper` provides a copyable, assignable wrapper:

```cpp
#include <functional>

int a = 1, b = 2, c = 3;
std::vector<std::reference_wrapper<int>> refs = {a, b, c};

for (int &val : refs) {
    val *= 10;
}
// a=10, b=20, c=30
```

Also used with `std::bind` and `std::thread` to pass references:

```cpp
void increment(int &x) { x++; }

int val = 0;
std::thread t(increment, std::ref(val));
t.join();
// val = 1
```

---

## When to Use Each

| Situation | Use |
|---|---|
| Always refers to an existing object, never null | Reference |
| Might be null or need reseating | Pointer |
| Function parameter (read-only, large object) | `const T &` |
| Function parameter (modify original) | `T &` |
| Function parameter (sink — will move from) | `T` (by value) or `T &&` |
| Optional value (modern C++) | `std::optional<T>` |
| Heap allocation with ownership | `std::unique_ptr<T>` |
| Shared ownership | `std::shared_ptr<T>` |
| Generic code needing perfect forwarding | `T &&` (forwarding ref) |
| Need pointer arithmetic | Raw pointer |
| C API interop | Raw pointer |
| Polymorphic types (via base) | Pointer or reference to base |
