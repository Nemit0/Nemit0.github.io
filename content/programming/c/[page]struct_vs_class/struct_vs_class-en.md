---
title: "Struct vs Class in C and C++"
description: "How structs work in C, how they differ from classes in C++, default access, inheritance, memory layout, POD types, and when to use each."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "struct", "class", "OOP", "memory layout", "POD"]
author: "Nemit"
featured: false
pinned: false
---

# Struct vs Class in C and C++

## Structs in C

In C, `struct` is the only mechanism for grouping related data into a single composite type. It has **no methods, no access control, no inheritance**.

```c
struct Point {
    double x;
    double y;
};

// Must use 'struct' keyword (unless typedef'd)
struct Point p1 = {3.0, 4.0};
printf("(%f, %f)\n", p1.x, p1.y);
```

### Typedef Pattern

C programmers commonly typedef structs to avoid repeating the `struct` keyword:

```c
typedef struct {
    double x;
    double y;
} Point;

Point p1 = {3.0, 4.0};   // No 'struct' keyword needed
```

Self-referential structs need a tag:

```c
typedef struct Node {
    int data;
    struct Node *next;   // Must use 'struct Node', not just 'Node'
} Node;
```

### C Struct Limitations

- No member functions (simulate with function pointers)
- No access specifiers (everything is public)
- No constructors or destructors
- No inheritance
- No operator overloading

```c
// Simulating "methods" with function pointers
typedef struct {
    double x, y;
    double (*magnitude)(double, double);
} Vector;

double vec_magnitude(double x, double y) {
    return sqrt(x * x + y * y);
}

Vector v = {3.0, 4.0, vec_magnitude};
printf("%f\n", v.magnitude(v.x, v.y));  // 5.0
```

---

## Structs vs Classes in C++

In C++, `struct` and `class` are almost **identical**. The only differences are default access and default inheritance:

| Feature | `struct` | `class` |
|---|---|---|
| **Default member access** | `public` | `private` |
| **Default inheritance** | `public` | `private` |
| Everything else | Same | Same |

That's it. Both can have constructors, destructors, methods, static members, virtual functions, templates, and operator overloading.

```cpp
struct Point {
    double x, y;           // public by default
    double magnitude() {   // public by default
        return std::sqrt(x * x + y * y);
    }
};

class PointClass {
    double x, y;           // private by default
public:
    PointClass(double x, double y) : x(x), y(y) {}
    double magnitude() {
        return std::sqrt(x * x + y * y);
    }
};
```

### Default Inheritance

```cpp
struct Base {
    int value = 42;
};

struct DerivedStruct : Base {};       // public inheritance (default for struct)
class DerivedClass : Base {};         // private inheritance (default for class)

DerivedStruct ds;
ds.value;       // OK — public inheritance, value is accessible

DerivedClass dc;
// dc.value;    // Error — private inheritance, value is inaccessible
```

---

## Memory Layout

Both `struct` and `class` have the same memory layout rules. Members are stored in declaration order with padding for alignment:

```cpp
struct Example {
    char a;      // 1 byte
    // 3 bytes padding
    int b;       // 4 bytes
    char c;      // 1 byte
    // 7 bytes padding (align to 8 for double)
    double d;    // 8 bytes
};
// sizeof(Example) = 24

// Reordered for minimal padding:
struct Compact {
    double d;    // 8 bytes
    int b;       // 4 bytes
    char a;      // 1 byte
    char c;      // 1 byte
    // 2 bytes padding
};
// sizeof(Compact) = 16
```

### The Empty Base Class Optimization (EBCO)

An empty struct/class normally has `sizeof` = 1 (to ensure distinct addresses), but as a base class, it can occupy zero bytes:

```cpp
struct Empty {};
struct Derived : Empty {
    int x;
};

static_assert(sizeof(Empty) == 1);
static_assert(sizeof(Derived) == sizeof(int));  // EBCO applied
```

### Virtual Functions and vtable

Adding a virtual function adds a **vtable pointer** (typically 8 bytes on 64-bit):

```cpp
struct NoVirtual {
    int x;
};
// sizeof = 4

struct WithVirtual {
    int x;
    virtual void foo() {}
};
// sizeof = 16 (8 bytes vptr + 4 bytes x + 4 bytes padding)
```

The vtable is a table of function pointers. Each class with virtual functions has one vtable (shared among all instances). Each object stores a pointer to its class's vtable.

```
Object layout:        vtable:
┌──────────┐          ┌──────────────┐
│ vptr ────────────→  │ &foo()       │
├──────────┤          │ &bar()       │
│ x        │          │ &typeinfo    │
└──────────┘          └──────────────┘
```

---

## POD Types (Plain Old Data)

A **POD type** is a struct/class compatible with C's memory model — it can be safely `memcpy`'d, `memset`'d, and used across language boundaries.

### C++11 Definition (Decomposed)

POD = **trivial** + **standard-layout**

**Trivial** means:
- Default constructor/destructor (compiler-generated or `= default`)
- Trivially copyable (no user-defined copy/move operations)
- No virtual functions or virtual bases

**Standard-layout** means:
- All non-static members have the same access specifier
- No virtual functions or virtual bases
- No non-static members in more than one class in the hierarchy
- First non-static member is not a base class type

```cpp
// POD — trivial and standard-layout
struct POD {
    int x;
    double y;
    char name[32];
};

// NOT POD — has constructor and private members
class NotPOD {
    int x;
public:
    NotPOD(int x) : x(x) {}
    virtual void foo();
};
```

### C++20: Deprecation of POD

C++20 deprecated the POD concept. Use `std::is_trivial` and `std::is_standard_layout` separately:

```cpp
#include <type_traits>

static_assert(std::is_trivial_v<POD>);
static_assert(std::is_standard_layout_v<POD>);
```

---

## Aggregate Initialization

An **aggregate** is an array or a class with no user-declared constructors, no private/protected non-static members, no virtual functions, and no virtual base classes.

Aggregates support brace initialization:

```cpp
struct Point {
    double x;
    double y;
};

Point p1 = {3.0, 4.0};        // C-style
Point p2{3.0, 4.0};           // C++11 uniform initialization
auto p3 = Point{.x = 3.0, .y = 4.0};  // C++20 designated initializers
```

Adding a constructor removes aggregate status:

```cpp
struct NotAggregate {
    double x, y;
    NotAggregate(double x, double y) : x(x), y(y) {}
};

// NotAggregate na = {3.0, 4.0};  // Error: not an aggregate
NotAggregate na(3.0, 4.0);        // Must use constructor
```

---

## Bit Fields

Both C and C++ support bit fields to pack integers into fewer bits:

```cpp
struct Flags {
    unsigned int readable  : 1;
    unsigned int writable  : 1;
    unsigned int executable: 1;
    unsigned int reserved  : 5;
};
// sizeof(Flags) = 4 (one unsigned int)

Flags f = {1, 1, 0, 0};
f.readable = 1;
f.writable = 0;
```

Bit fields cannot be addressed — you cannot take a pointer to a bit field member.

Bit field layout is **implementation-defined**: the order within a storage unit and padding between bit fields varies by compiler and platform.

---

## Nested and Anonymous Structs/Unions

### Nested Structs

```cpp
struct Outer {
    struct Inner {
        int x;
    };
    Inner inner;
    int y;
};

Outer o;
o.inner.x = 10;
o.y = 20;
```

### Anonymous Unions (C11 / C++)

Members of an anonymous union are accessed directly through the enclosing struct:

```c
struct Variant {
    int type;
    union {
        int i;
        float f;
        char s[20];
    };  // anonymous union
};

struct Variant v;
v.type = 0;
v.i = 42;      // Direct access — no union member name
```

### Anonymous Structs (C11 / non-standard in C++)

```c
struct Vector3 {
    union {
        struct { float x, y, z; };     // anonymous struct
        float data[3];
    };
};

struct Vector3 v = {1.0f, 2.0f, 3.0f};
v.x = 5.0f;        // Access via named member
v.data[0] = 5.0f;  // Same memory location
```

---

## Flexible Array Members (C99)

C99 allows the last member of a struct to be an incomplete array — a **flexible array member**:

```c
struct Buffer {
    size_t length;
    char data[];    // Flexible array member — must be last
};

// Allocate struct + space for data
struct Buffer *buf = malloc(sizeof(struct Buffer) + 100);
buf->length = 100;
memcpy(buf->data, "hello", 6);

// sizeof(struct Buffer) does NOT include data[]
printf("%zu\n", sizeof(struct Buffer));  // Only includes 'length' + padding
```

This is the standard replacement for the older "struct hack" (`char data[1]`).

C++ does not officially support flexible array members, though most compilers accept them as an extension.

---

## When to Use struct vs class

Convention (not enforced by the language):

| Use `struct` when | Use `class` when |
|---|---|
| Passive data aggregate (POD-like) | Active object with invariants |
| All members are public | Members need access control |
| No or minimal methods | Rich interface with encapsulation |
| C interoperability needed | Complex inheritance hierarchy |
| Small value types | Resource-managing types (RAII) |

The Google C++ Style Guide and C++ Core Guidelines recommend:
- **struct**: for passive objects that carry data; all fields public
- **class**: for objects with invariants, private data, and a meaningful interface

```cpp
// struct — simple data carrier
struct Color {
    uint8_t r, g, b, a;
};

// class — invariants maintained by interface
class Matrix {
    std::vector<double> data_;
    size_t rows_, cols_;
public:
    Matrix(size_t rows, size_t cols);
    double& operator()(size_t r, size_t c);
    Matrix operator*(const Matrix& other) const;
};
```

---

## C/C++ Interoperability

To use C++ structs/classes from C, wrap them in `extern "C"`:

```cpp
// header.h
#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    double x, y;
} Point;

Point point_create(double x, double y);
double point_distance(const Point *a, const Point *b);

#ifdef __cplusplus
}
#endif
```

Rules for C-compatible types:
- No virtual functions
- No non-trivial constructors/destructors
- No C++-specific features (references, templates, namespaces)
- Use `extern "C"` for function declarations
- Stick to C data types in the interface
