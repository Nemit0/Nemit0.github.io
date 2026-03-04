---
title: "Bit Operations in C/C++"
description: "Bitwise operators, bit manipulation techniques, common patterns, flags, masks, and practical applications in systems programming."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "bitwise", "bit manipulation", "binary", "flags"]
author: "Nemit"
featured: false
pinned: false
---

# Bit Operations in C/C++

## Bitwise Operators

| Operator | Name | Description | Example (8-bit) |
|---|---|---|---|
| `&` | AND | 1 if both bits are 1 | `0b11001010 & 0b10101100 = 0b10001000` |
| `\|` | OR | 1 if either bit is 1 | `0b11001010 \| 0b10101100 = 0b11101110` |
| `^` | XOR | 1 if bits differ | `0b11001010 ^ 0b10101100 = 0b01100110` |
| `~` | NOT | Flip all bits | `~0b11001010 = 0b00110101` |
| `<<` | Left Shift | Shift bits left, fill with 0 | `0b00001010 << 2 = 0b00101000` |
| `>>` | Right Shift | Shift bits right | `0b00101000 >> 2 = 0b00001010` |

### Truth Tables

```
AND (&)    OR (|)     XOR (^)    NOT (~)
0 & 0 = 0  0 | 0 = 0  0 ^ 0 = 0  ~0 = 1
0 & 1 = 0  0 | 1 = 1  0 ^ 1 = 1  ~1 = 0
1 & 0 = 0  1 | 0 = 1  1 ^ 0 = 1
1 & 1 = 1  1 | 1 = 1  1 ^ 1 = 0
```

---

## Shift Operations

### Left Shift (`<<`)

Shifts bits left by n positions, filling with zeros. Equivalent to multiplying by 2^n:

```c
unsigned int x = 5;        // 0b00000101
x << 1;                    // 0b00001010 = 10  (× 2)
x << 3;                    // 0b00101000 = 40  (× 8)
```

### Right Shift (`>>`)

For **unsigned** types: fills with zeros (logical shift).
For **signed** types: implementation-defined — usually fills with sign bit (arithmetic shift).

```c
unsigned int u = 40;       // 0b00101000
u >> 2;                    // 0b00001010 = 10  (÷ 4)

int s = -8;                // 0b11111...11000 (two's complement)
s >> 1;                    // Typically 0b11111...11100 = -4 (arithmetic shift)
```

### Undefined Behavior with Shifts

- Shifting by negative amount: `x << -1` — UB
- Shifting by >= bit width: `x << 32` (for 32-bit int) — UB
- Left-shifting a negative number: `(-1) << 1` — UB in C (defined in C++20)
- Left-shifting into the sign bit: UB in C (defined in C++14)

```c
// Always use unsigned types for bit manipulation:
unsigned int flags = 0;
flags |= (1u << 5);    // 'u' suffix ensures unsigned
```

---

## Common Bit Manipulation Patterns

### Set a Bit

```c
x |= (1u << n);       // Set bit n to 1
```

### Clear a Bit

```c
x &= ~(1u << n);      // Set bit n to 0
```

### Toggle a Bit

```c
x ^= (1u << n);       // Flip bit n
```

### Check a Bit

```c
if (x & (1u << n))    // True if bit n is 1
```

### Extract Bits (Field)

```c
// Extract bits [high:low] from x
unsigned int field = (x >> low) & ((1u << (high - low + 1)) - 1);

// Example: extract bits [7:4] from 0xAB (10101011)
unsigned int x = 0xAB;
unsigned int nibble = (x >> 4) & 0xF;  // 0xA = 10
```

### Set a Field

```c
// Set bits [high:low] to value
x = (x & ~(mask << low)) | ((value & mask) << low);

// Example: set bits [7:4] to 0x5
unsigned int mask = 0xF;
x = (x & ~(mask << 4)) | ((0x5 & mask) << 4);
```

---

## Bit Tricks

### Check if Power of 2

```c
bool is_power_of_2(unsigned int x) {
    return x != 0 && (x & (x - 1)) == 0;
}
// Works because power of 2 has exactly one bit set:
// 8 = 1000, 7 = 0111, 8 & 7 = 0000
```

### Count Set Bits (Population Count)

```c
// Brian Kernighan's algorithm — O(number of set bits)
int popcount(unsigned int x) {
    int count = 0;
    while (x) {
        x &= (x - 1);   // Clear lowest set bit
        count++;
    }
    return count;
}

// Built-in (GCC/Clang):
__builtin_popcount(x);       // unsigned int
__builtin_popcountll(x);     // unsigned long long

// C++20:
#include <bit>
std::popcount(x);
```

### Find Lowest Set Bit

```c
int lowest_bit = x & (-x);
// -x is two's complement: flip bits and add 1
// Example: x = 0b10110100, -x = 0b01001100
//          x & -x = 0b00000100

// Built-in:
__builtin_ctz(x);     // Count trailing zeros (position of lowest set bit)
// C++20: std::countr_zero(x);
```

### Find Highest Set Bit

```c
// Built-in:
int pos = 31 - __builtin_clz(x);   // Count leading zeros
// C++20: std::countl_zero(x), std::bit_width(x)

// Floor of log2:
int log2_floor = 31 - __builtin_clz(x);   // For 32-bit unsigned
```

### Round Up to Next Power of 2

```c
unsigned int next_power_of_2(unsigned int x) {
    x--;
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 16;
    return x + 1;
}
// C++20: std::bit_ceil(x);
```

### Swap Without Temporary

```c
a ^= b;
b ^= a;
a ^= b;
// Works because XOR is self-inverse: a ^ a = 0
// Don't use in practice — optimizer handles tmp swaps better
```

### Absolute Value Without Branching

```c
int abs_val(int x) {
    int mask = x >> 31;       // All 1s if negative, all 0s if positive
    return (x ^ mask) - mask;
}
```

### Sign Extension

```c
// Sign-extend a k-bit value to int:
int sign_extend(int x, int bits) {
    int mask = 1 << (bits - 1);
    return (x ^ mask) - mask;
}
```

---

## Bit Flags

Use bits as boolean flags — pack multiple booleans into one integer:

```c
// Define flags as powers of 2
#define READ    (1u << 0)   // 0b001
#define WRITE   (1u << 1)   // 0b010
#define EXECUTE (1u << 2)   // 0b100

unsigned int permissions = 0;

// Set flags
permissions |= READ | WRITE;      // 0b011

// Check flag
if (permissions & READ) { /* readable */ }

// Clear flag
permissions &= ~WRITE;            // 0b001

// Toggle flag
permissions ^= EXECUTE;           // 0b101
```

### Enum Flags (C++)

```cpp
enum Permission : unsigned int {
    None    = 0,
    Read    = 1 << 0,
    Write   = 1 << 1,
    Execute = 1 << 2,
    All     = Read | Write | Execute
};

// Type-safe with operator overloading:
Permission operator|(Permission a, Permission b) {
    return static_cast<Permission>(
        static_cast<unsigned>(a) | static_cast<unsigned>(b)
    );
}

Permission p = Read | Execute;
```

---

## Bitmasks and Bit Fields

### Bitmask Operations

```c
// Create mask of n bits
unsigned int mask_n_bits(int n) {
    return (1u << n) - 1;
}
// mask_n_bits(4) = 0b1111 = 0xF

// Create mask from bit a to bit b (inclusive)
unsigned int mask_range(int a, int b) {
    return ((1u << (b - a + 1)) - 1) << a;
}
// mask_range(2, 5) = 0b00111100

// Apply mask
unsigned int extract = (value & mask) >> shift;
```

### Struct Bit Fields vs Manual Bit Manipulation

```c
// Bit field approach — compiler manages layout
struct Flags {
    unsigned int read    : 1;
    unsigned int write   : 1;
    unsigned int execute : 1;
    unsigned int reserved: 5;
};

// Manual approach — full control over layout
typedef uint8_t Flags;
#define READ_BIT    0
#define WRITE_BIT   1
#define EXECUTE_BIT 2
```

Bit fields: more readable but layout is implementation-defined (bit order, padding).
Manual: portable and explicit, but more verbose.

---

## Endianness

**Byte order** — how multi-byte values are stored in memory:

| Endianness | First Byte | Systems |
|---|---|---|
| **Little-endian** | Least significant byte | x86, x86-64, ARM (default) |
| **Big-endian** | Most significant byte | Network byte order, some MIPS, PowerPC |

```c
uint32_t x = 0x12345678;

// Little-endian memory layout (x86):
// Address:  [0]  [1]  [2]  [3]
// Value:    0x78 0x56 0x34 0x12

// Big-endian memory layout:
// Address:  [0]  [1]  [2]  [3]
// Value:    0x12 0x34 0x56 0x78
```

### Byte Swapping

```c
#include <byteswap.h>    // Linux
uint32_t swapped = __builtin_bswap32(x);   // GCC/Clang
// C++23: std::byteswap(x);

// Network byte order conversion (POSIX):
#include <arpa/inet.h>
uint32_t net = htonl(host_val);    // Host to network (big-endian)
uint32_t host = ntohl(net_val);    // Network to host
uint16_t net16 = htons(host_val);
```

### Runtime Endianness Check

```c
int is_little_endian() {
    uint32_t x = 1;
    return *(uint8_t *)&x == 1;
}

// C++20:
#include <bit>
if constexpr (std::endian::native == std::endian::little) { ... }
```

---

## Practical Applications

### IP Address Manipulation

```c
uint32_t ip = (192u << 24) | (168u << 16) | (1u << 8) | 100u;
// ip = 0xC0A80164

// Extract octets:
uint8_t octet1 = (ip >> 24) & 0xFF;   // 192
uint8_t octet2 = (ip >> 16) & 0xFF;   // 168
uint8_t octet3 = (ip >> 8)  & 0xFF;   // 1
uint8_t octet4 = ip & 0xFF;           // 100
```

### RGB Color Packing

```c
// Pack RGBA into 32-bit integer
uint32_t rgba(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    return ((uint32_t)r << 24) | ((uint32_t)g << 16) |
           ((uint32_t)b << 8) | a;
}

// Unpack
uint8_t red   = (color >> 24) & 0xFF;
uint8_t green = (color >> 16) & 0xFF;
uint8_t blue  = (color >> 8)  & 0xFF;
uint8_t alpha = color & 0xFF;
```

### Bitmap / Bit Array

```c
#define BITMAP_SIZE 1024
uint8_t bitmap[BITMAP_SIZE / 8];

void set_bit(uint8_t *bm, int n) {
    bm[n / 8] |= (1u << (n % 8));
}

void clear_bit(uint8_t *bm, int n) {
    bm[n / 8] &= ~(1u << (n % 8));
}

int test_bit(const uint8_t *bm, int n) {
    return (bm[n / 8] >> (n % 8)) & 1;
}
```

### Alignment

```c
// Align x up to next multiple of align (align must be power of 2)
uintptr_t align_up(uintptr_t x, size_t align) {
    return (x + align - 1) & ~(align - 1);
}

// Check if aligned
int is_aligned(uintptr_t x, size_t align) {
    return (x & (align - 1)) == 0;
}
```

---

## Two's Complement Representation

Most modern systems use **two's complement** for signed integers:

```
For 8-bit integers:
 0 = 00000000
 1 = 00000001
127 = 01111111
-1  = 11111111  (all 1s)
-2  = 11111110
-128 = 10000000
```

Properties:
- Negate: flip all bits, add 1 (`-x = ~x + 1`)
- Range: -2^(n-1) to 2^(n-1) - 1
- MSB (most significant bit) is the sign bit
- One representation of zero (unlike one's complement)

```c
int x = 5;    // 00000101
int y = ~x;   // 11111010 = -6
// ~x + 1 = -x: ~5 + 1 = -6 + 1 = -5 ✓
```

### Signed Integer Overflow

Signed integer overflow is **undefined behavior** in C/C++:

```c
int x = INT_MAX;
x + 1;           // UB — compiler may optimize assuming this never happens

// Unsigned overflow is defined (wraps around):
unsigned int u = UINT_MAX;
u + 1;           // 0 — well-defined wraparound
```

The compiler may optimize based on the assumption that signed overflow never occurs. This can eliminate bounds checks and break seemingly correct code.

---

## C++20 `<bit>` Header

```cpp
#include <bit>

std::rotl(x, n);          // Rotate left
std::rotr(x, n);          // Rotate right
std::countl_zero(x);      // Count leading zeros
std::countl_one(x);       // Count leading ones
std::countr_zero(x);      // Count trailing zeros
std::countr_one(x);       // Count trailing ones
std::popcount(x);         // Count set bits
std::has_single_bit(x);   // Is power of 2?
std::bit_ceil(x);         // Round up to next power of 2
std::bit_floor(x);        // Round down to power of 2
std::bit_width(x);        // min bits to represent x
std::bit_cast<To>(from);  // Reinterpret bits as different type (safe)
```
