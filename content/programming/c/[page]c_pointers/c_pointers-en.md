---
title: "Pointer Arithmetic in C"
description: "A thorough guide to pointer arithmetic — how pointer math works, why it's type-aware, and how it connects to arrays and memory layout."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "pointers", "pointer arithmetic", "memory", "arrays"]
author: "Nemit"
featured: false
pinned: false
---

# Pointer Arithmetic in C

## What Is a Pointer?

A **pointer** is a variable that stores a memory address. It "points to" a location in memory where a value is stored.

```c
int x = 42;
int *p = &x;    // p holds the address of x

printf("Address: %p\n", (void *)p);   // e.g., 0x7ffd5e8a3c4c
printf("Value:   %d\n", *p);          // 42 (dereference)
```

`&x` — **address-of** operator: returns the address of `x`.
`*p` — **dereference** operator: reads the value at the address `p` holds.

### Pointer Size

A pointer's size depends on the architecture, not the type it points to:

| Architecture | Pointer Size |
|---|---|
| 32-bit | 4 bytes |
| 64-bit | 8 bytes |

```c
printf("sizeof(int *):    %zu\n", sizeof(int *));     // 8 (on 64-bit)
printf("sizeof(char *):   %zu\n", sizeof(char *));    // 8
printf("sizeof(double *): %zu\n", sizeof(double *));  // 8
```

All pointer types are the same size on a given platform — they all hold a memory address.

---

## Pointer Arithmetic Basics

C allows integer addition and subtraction on pointers. The key insight: **pointer arithmetic is type-aware**. Adding 1 to a pointer advances it by `sizeof(*pointer)` bytes, not by 1 byte.

```c
int arr[] = {10, 20, 30, 40, 50};
int *p = arr;       // p points to arr[0]

printf("%d\n", *p);        // 10
printf("%d\n", *(p + 1));  // 20  (advanced by sizeof(int) = 4 bytes)
printf("%d\n", *(p + 2));  // 30  (advanced by 8 bytes)
```

### Why Type-Aware?

Because arrays store elements contiguously in memory. If `int` is 4 bytes:

```
Address:  0x100  0x104  0x108  0x10C  0x110
Value:    [10]   [20]   [30]   [40]   [50]
Index:     [0]    [1]    [2]    [3]    [4]
```

`p + 1` doesn't mean "add 1 to the raw address." It means "advance to the next element." The compiler multiplies by `sizeof(int)`:

```
p + n  →  (char *)p + n * sizeof(*p)
```

For `char *`, adding 1 advances by 1 byte. For `double *`, adding 1 advances by 8 bytes.

---

## Legal Pointer Operations

### Addition of Integer to Pointer

```c
int *p = arr;
int *q = p + 3;     // Points to arr[3]
```

### Subtraction of Integer from Pointer

```c
int *q = &arr[4];
int *r = q - 2;     // Points to arr[2]
```

### Subtraction of Two Pointers

When two pointers point into the same array, subtracting them gives the number of **elements** between them (not bytes):

```c
int *start = &arr[0];
int *end = &arr[4];
ptrdiff_t diff = end - start;   // 4 (elements, not 16 bytes)
```

The result type is `ptrdiff_t` (a signed integer type from `<stddef.h>`).

### Increment and Decrement

```c
int *p = arr;
p++;        // Now points to arr[1]
p++;        // Now points to arr[2]
p--;        // Back to arr[1]
```

### Comparison

Pointers into the same array can be compared with `<`, `>`, `<=`, `>=`, `==`, `!=`:

```c
int *p = &arr[1];
int *q = &arr[3];
if (p < q) {
    printf("p comes before q\n");   // True
}
```

### Illegal Operations

- **Adding two pointers**: `p + q` — meaningless (two addresses added together)
- **Multiplying/dividing pointers**: `p * 2`, `p / q` — meaningless
- **Pointer arithmetic on `void *`**: `void *` has no type size — GCC allows it as an extension (treating as `char *`), but it's undefined by the standard

---

## Pointer Arithmetic and Arrays

In C, an array name **decays** to a pointer to its first element in most contexts:

```c
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;           // arr decays to &arr[0]

// These are equivalent:
arr[i]    ≡  *(arr + i)
&arr[i]   ≡  arr + i
p[i]      ≡  *(p + i)
```

The **subscript operator** `[]` is just syntactic sugar for pointer arithmetic + dereference.

Even stranger: since addition is commutative, `arr[3]` is the same as `3[arr]`:

```c
printf("%d\n", 3[arr]);   // 40 — because *(3 + arr) == *(arr + 3)
```

Don't write this in production code.

### Array Decay Exceptions

An array does **not** decay to a pointer in these contexts:
- `sizeof(arr)` — returns the size of the entire array, not a pointer
- `&arr` — returns a pointer to the **array type** (`int (*)[5]`), not `int *`
- String literal initializer: `char str[] = "hello"` copies the string

```c
int arr[5];
printf("sizeof(arr) = %zu\n", sizeof(arr));     // 20 (5 * 4 bytes)
printf("sizeof(&arr[0]) = %zu\n", sizeof(&arr[0])); // 8 (pointer size)
```

---

## Iterating with Pointer Arithmetic

Pointer-based iteration is the classic C pattern and can be more efficient than indexing (avoids multiplying index by element size):

```c
// Index-based iteration
for (int i = 0; i < n; i++) {
    process(arr[i]);
}

// Pointer-based iteration
for (int *p = arr; p < arr + n; p++) {
    process(*p);
}

// Using end pointer (STL-style)
int *begin = arr;
int *end = arr + n;    // One past the last element
for (int *p = begin; p != end; p++) {
    process(*p);
}
```

The "one past the end" pointer (`arr + n`) is legal to form and compare but **not** to dereference.

---

## Pointers to Pointers

A **pointer to a pointer** stores the address of a pointer variable:

```c
int x = 42;
int *p = &x;
int **pp = &p;

printf("%d\n", **pp);    // 42  (dereference twice)
```

Common uses:
- **Dynamic 2D arrays**: `int **matrix` — array of pointers to rows
- **Modifying a pointer in a function**: pass `int **` to change what `int *` points to

```c
void allocate(int **ptr, int size) {
    *ptr = malloc(size * sizeof(int));
}

int *arr = NULL;
allocate(&arr, 10);   // arr now points to allocated memory
```

- **`argv` in main**: `char **argv` or `char *argv[]` — array of strings

---

## Function Pointers

Pointers can point to functions:

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

// Declare function pointer
int (*op)(int, int);

op = add;
printf("%d\n", op(3, 4));   // 7

op = sub;
printf("%d\n", op(3, 4));   // -1
```

**Function pointer syntax**: `return_type (*name)(param_types)`

Function pointers enable:
- **Callbacks**: pass behavior as an argument
- **Dispatch tables**: array of function pointers for state machines
- **qsort comparator**: `int (*compar)(const void *, const void *)`

```c
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    return (*(int *)a - *(int *)b);
}

int arr[] = {5, 2, 8, 1, 9};
qsort(arr, 5, sizeof(int), cmp);
// arr is now {1, 2, 5, 8, 9}
```

### Typedef for Readability

```c
typedef int (*BinaryOp)(int, int);

BinaryOp op = add;
printf("%d\n", op(10, 20));  // 30
```

---

## `void *` — The Generic Pointer

`void *` can hold the address of any data type. It's C's mechanism for generic programming:

```c
int x = 42;
double y = 3.14;

void *generic = &x;
printf("%d\n", *(int *)generic);     // Must cast before dereference

generic = &y;
printf("%f\n", *(double *)generic);
```

`void *` is used by:
- `malloc()` — returns `void *`
- `memcpy()`, `memset()` — operate on raw bytes
- `qsort()`, `bsearch()` — generic algorithms

You cannot dereference or do arithmetic on `void *` without casting (in standard C).

---

## Null Pointers

A **null pointer** points to nothing. Dereferencing it is undefined behavior (usually a crash via segfault):

```c
int *p = NULL;   // or: int *p = 0;
// *p = 42;      // UNDEFINED BEHAVIOR — segfault

if (p != NULL) {
    *p = 42;     // Safe
}
```

`NULL` is defined as `((void *)0)` in C. In C++11+, use `nullptr` instead.

Always check for null before dereferencing, especially for:
- Return values from `malloc()` (returns NULL on failure)
- Function parameters that might be optional
- Linked list traversal (end of list)

---

## Common Pointer Pitfalls

### Dangling Pointer

A pointer that refers to memory that has been freed or is out of scope:

```c
int *p;
{
    int x = 42;
    p = &x;
}   // x goes out of scope
// p is now dangling — *p is undefined behavior

// Also:
int *q = malloc(sizeof(int));
*q = 10;
free(q);
// q is now dangling — *q is undefined behavior
q = NULL;   // Good practice: set to NULL after free
```

### Buffer Overflow

Writing past the end of an array via pointer arithmetic:

```c
int arr[5];
int *p = arr;
for (int i = 0; i <= 5; i++) {   // Bug: should be i < 5
    p[i] = i;                     // p[5] writes past the array — UB
}
```

### Uninitialized Pointer

```c
int *p;        // Points to garbage address
*p = 42;       // UNDEFINED BEHAVIOR — writing to random memory
```

### Type Mismatch

```c
float f = 3.14;
int *p = (int *)&f;    // Technically undefined behavior (strict aliasing)
printf("%d\n", *p);     // Prints garbage (IEEE 754 bits interpreted as int)
```

### Memory Leak

```c
int *p = malloc(100 * sizeof(int));
p = malloc(200 * sizeof(int));   // First allocation is leaked — no way to free it
```

---

## `restrict` Keyword (C99)

The `restrict` qualifier tells the compiler that a pointer is the **only** way to access the memory it points to. This enables aggressive optimization:

```c
void add_arrays(int *restrict a, int *restrict b, int *restrict c, int n) {
    for (int i = 0; i < n; i++)
        c[i] = a[i] + b[i];
}
```

Without `restrict`, the compiler must assume `a`, `b`, and `c` might alias (overlap) and reload values after each store. With `restrict`, it can vectorize the loop with SIMD instructions.

`memcpy()` uses `restrict` (no overlap allowed). `memmove()` does not (handles overlap correctly but is slower).

---

## Pointer Arithmetic and `const`

`const` with pointers has two meanings depending on placement:

```c
const int *p;       // Pointer to const int: can't modify *p, can change p
int *const q;       // Const pointer to int: can modify *q, can't change q
const int *const r; // Const pointer to const int: can't modify either
```

Read right-to-left: `const int *p` — "p is a pointer to int that is const."

```c
int x = 10, y = 20;
const int *p = &x;
// *p = 30;      // Error: can't modify through p
p = &y;          // OK: can change what p points to

int *const q = &x;
*q = 30;         // OK: can modify the value
// q = &y;       // Error: can't change q itself
```
