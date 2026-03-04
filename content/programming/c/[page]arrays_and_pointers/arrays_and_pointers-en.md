---
title: "Arrays and Pointers in C"
description: "The relationship between arrays and pointers in C — decay rules, multidimensional arrays, dynamic arrays, VLAs, and common misconceptions."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "arrays", "pointers", "memory", "multidimensional arrays"]
author: "Nemit"
featured: false
pinned: false
---

# Arrays and Pointers in C

## Arrays Are Not Pointers

A common misconception: "arrays and pointers are the same thing in C." They are **not**. An array is a contiguous block of elements. A pointer is a variable holding an address. They interact closely because of **decay**, but they are fundamentally different.

```c
int arr[5] = {10, 20, 30, 40, 50};
int *ptr = arr;   // arr decays to &arr[0]

// Proof they're different:
sizeof(arr);    // 20 (5 * sizeof(int))
sizeof(ptr);    // 8  (size of a pointer)

// &arr has type int (*)[5] — pointer to array of 5 ints
// &ptr has type int **     — pointer to pointer to int
```

---

## Array-to-Pointer Decay

In most expressions, an array name **decays** (is implicitly converted) to a pointer to its first element:

```c
int arr[5];
int *p = arr;       // decay: arr → &arr[0]
func(arr);          // decay: function receives int *
arr + 2;            // decay: pointer arithmetic on &arr[0]
```

### When Decay Does NOT Happen

1. **`sizeof` operator**: returns size of the entire array

```c
int arr[5];
sizeof(arr);        // 20 — size of array, not pointer
sizeof(arr[0]);     // 4  — size of one element
int n = sizeof(arr) / sizeof(arr[0]);  // 5 — number of elements
```

2. **Address-of operator `&`**: produces a pointer to the array type

```c
int arr[5];
int *p = arr;       // Type: int *       — pointer to int
int (*pa)[5] = &arr; // Type: int (*)[5] — pointer to array of 5 ints

// Both point to the same address, but different types:
printf("%p\n", (void *)p);    // Same address
printf("%p\n", (void *)pa);   // Same address
// But:
p + 1;     // advances by sizeof(int) = 4 bytes
pa + 1;    // advances by sizeof(int[5]) = 20 bytes
```

3. **String literal initializer**: copies the string into the array

```c
char str[] = "hello";   // Array of 6 chars (includes '\0'), copies data
char *ptr = "hello";    // Pointer to string literal in read-only memory
```

4. **`_Alignof` / `alignof` operator** (C11)

---

## Subscript Operator: `arr[i]` ≡ `*(arr + i)`

The subscript operator is defined in terms of pointer arithmetic:

```
a[b]  ≡  *(a + b)
```

Since addition is commutative:

```c
arr[3]  ≡  *(arr + 3)  ≡  *(3 + arr)  ≡  3[arr]
```

This works because `arr` decays to a pointer, and pointer + integer is well-defined.

```c
int arr[5] = {10, 20, 30, 40, 50};
printf("%d\n", arr[2]);     // 30
printf("%d\n", *(arr + 2)); // 30
printf("%d\n", 2[arr]);     // 30 — legal but don't write this
```

---

## Passing Arrays to Functions

When you pass an array to a function, it **always** decays to a pointer. The function has no information about the array's size:

```c
// These three declarations are IDENTICAL:
void func(int arr[]);
void func(int arr[100]);    // The 100 is ignored
void func(int *arr);

// Must pass size separately:
void process(int *arr, int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
}

int data[] = {1, 2, 3, 4, 5};
process(data, 5);
```

### Preserving Array Size with Pointer-to-Array Parameters

You can preserve the size by passing a pointer to the array:

```c
void func(int (*arr)[5]) {
    // (*arr)[i] to access elements
    for (int i = 0; i < 5; i++) {
        printf("%d ", (*arr)[i]);
    }
}

int data[5] = {1, 2, 3, 4, 5};
func(&data);       // OK
// int bad[3] = {1, 2, 3};
// func(&bad);     // Warning: incompatible pointer type
```

### C99 Variable-Length Array Parameters

```c
void process(int n, int arr[n]) {   // n must come before arr
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
}
```

With `static` qualifier (C99) — guarantees the array has at least n elements:

```c
void process(int arr[static 5]) {
    // Compiler may warn if called with fewer than 5 elements
    // Enables compiler optimizations (pointer is non-null, at least 5 elements)
}
```

---

## Multidimensional Arrays

### Stack-Allocated 2D Array

A 2D array is a contiguous block of memory — an "array of arrays":

```c
int matrix[3][4] = {
    {1,  2,  3,  4},
    {5,  6,  7,  8},
    {9, 10, 11, 12}
};
```

Memory layout is **row-major** (rows stored contiguously):

```
Address:  [0][0] [0][1] [0][2] [0][3] [1][0] [1][1] [1][2] [1][3] [2][0] ...
Value:       1      2      3      4      5      6      7      8      9   ...
Offset:      0      4      8     12     16     20     24     28     32   ...
```

Access: `matrix[i][j]` ≡ `*(*(matrix + i) + j)` ≡ `*((int *)matrix + i * 4 + j)`

### Pointer Decay with 2D Arrays

```c
int matrix[3][4];

// matrix decays to: int (*)[4] — pointer to array of 4 ints
int (*row_ptr)[4] = matrix;

// row_ptr[i] is the i-th row (an array of 4 ints)
// row_ptr[i][j] accesses element [i][j]
```

### Passing 2D Arrays to Functions

Must specify all dimensions except the first:

```c
void print_matrix(int mat[][4], int rows) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < 4; j++)
            printf("%d ", mat[i][j]);
}

// Or equivalently:
void print_matrix(int (*mat)[4], int rows);
```

### Dynamic 2D Arrays

**Method 1: Array of pointers** (rows can have different lengths)

```c
int **matrix = malloc(rows * sizeof(int *));
for (int i = 0; i < rows; i++)
    matrix[i] = malloc(cols * sizeof(int));

// Access: matrix[i][j]
// Memory: NOT contiguous across rows

// Free:
for (int i = 0; i < rows; i++)
    free(matrix[i]);
free(matrix);
```

**Method 2: Single contiguous block** (better cache performance)

```c
int *matrix = malloc(rows * cols * sizeof(int));

// Access: matrix[i * cols + j]

free(matrix);
```

**Method 3: Contiguous block + row pointers** (best of both)

```c
int **matrix = malloc(rows * sizeof(int *));
matrix[0] = malloc(rows * cols * sizeof(int));
for (int i = 1; i < rows; i++)
    matrix[i] = matrix[0] + i * cols;

// Access: matrix[i][j]  — uses double subscript
// Memory: contiguous      — good cache performance

free(matrix[0]);
free(matrix);
```

---

## Variable-Length Arrays (VLAs) — C99

VLAs allow stack-allocated arrays with runtime-determined size:

```c
void func(int n) {
    int arr[n];          // Size determined at runtime
    for (int i = 0; i < n; i++)
        arr[i] = i * i;
}
```

### VLA Characteristics

- Allocated on the **stack** (no `malloc`, no `free`)
- Size fixed after creation (cannot resize)
- Cannot have initializers
- `sizeof` is evaluated at **runtime** (not compile time)
- Scope is the enclosing block

### VLA Risks

- **Stack overflow**: no size check — large `n` can overflow the stack
- **Optional in C11**: compilers may not support them (`__STDC_NO_VLA__`)
- **Not in C++**: C++ never adopted VLAs (use `std::vector` instead)
- **alloca()**: similar risks — allocates on stack with runtime size

```c
// Dangerous:
void bad(size_t n) {
    int arr[n];   // If n = 10000000, stack overflow
}

// Safer alternative:
void good(size_t n) {
    int *arr = malloc(n * sizeof(int));
    if (!arr) return;
    // ... use arr ...
    free(arr);
}
```

---

## Arrays of Pointers vs Pointer to Array

These look similar but are very different:

```c
int *arr_of_ptrs[5];      // Array of 5 pointers to int
int (*ptr_to_arr)[5];     // Pointer to an array of 5 ints
```

Reading declarations: use the **right-left rule** or **clockwise/spiral rule**:

```
int *arr[5]:
  arr          — is a
  [5]          — array of 5
  *            — pointers to
  int          — int

int (*ptr)[5]:
  ptr          — is a
  *            — pointer to
  [5]          — array of 5
  int          — int
```

### Array of Strings (Array of Pointers)

```c
const char *months[] = {
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
};
// months[0] is a pointer to "January" (string literal)
// Each string can be a different length
```

### Comparison

```c
int arr[3][4];         // 3×4 matrix, 48 bytes contiguous
int *ptrs[3];          // 3 pointers, rows can be anywhere in memory

int (*p)[4] = arr;     // p points to first row
p++;                   // p now points to second row (advances 16 bytes)

int **pp = ptrs;       // pp points to first pointer
pp++;                  // pp now points to second pointer (advances 8 bytes)
```

---

## Compound Literals (C99)

Create anonymous arrays and structs inline:

```c
// Pass an array literal to a function
process((int[]){1, 2, 3, 4, 5}, 5);

// Pointer to an anonymous array
int *p = (int[]){10, 20, 30};
p[1] = 99;   // OK — compound literal is modifiable (unlike string literals)

// In file scope: static storage duration
// In block scope: automatic storage duration (same as local variables)
```

---

## `char` Arrays vs `char *`

```c
char arr[] = "hello";    // Array of 6 chars on the stack, mutable
char *ptr = "hello";     // Pointer to string literal in .rodata, immutable

arr[0] = 'H';           // OK — modifying stack array
// ptr[0] = 'H';        // UNDEFINED BEHAVIOR — modifying string literal

sizeof(arr);             // 6 (array size including '\0')
sizeof(ptr);             // 8 (pointer size)

strlen(arr);             // 5 (string length excluding '\0')
strlen(ptr);             // 5
```

String literals have **static storage duration** and may be stored in read-only memory. Multiple identical string literals may share the same address (implementation-defined).

---

## Designated Initializers (C99)

Initialize specific elements of an array:

```c
int arr[10] = {
    [0] = 1,
    [5] = 50,
    [9] = 99
};
// arr = {1, 0, 0, 0, 0, 50, 0, 0, 0, 99}

// Range initializer (GCC extension):
int arr[10] = {[3 ... 7] = 42};
// arr = {0, 0, 0, 42, 42, 42, 42, 42, 0, 0}
```

For structs:

```c
struct Point p = {.y = 4.0, .x = 3.0};   // Order doesn't matter
```
