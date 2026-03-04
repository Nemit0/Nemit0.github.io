---
title: "C/C++ 비트 연산"
description: "비트 연산자, 비트 조작 기법, 일반적인 패턴, 플래그, 마스크, 시스템 프로그래밍에서의 실용적 응용."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "비트 연산", "비트 조작", "이진법", "플래그"]
author: "Nemit"
featured: false
pinned: false
---

# C/C++ 비트 연산

## 비트 연산자

| 연산자 | 이름 | 설명 | 예시 (8비트) |
|---|---|---|---|
| `&` | AND | 두 비트가 모두 1이면 1 | `0b11001010 & 0b10101100 = 0b10001000` |
| `\|` | OR | 어느 한 비트가 1이면 1 | `0b11001010 \| 0b10101100 = 0b11101110` |
| `^` | XOR | 비트가 다르면 1 | `0b11001010 ^ 0b10101100 = 0b01100110` |
| `~` | NOT | 모든 비트 반전 | `~0b11001010 = 0b00110101` |
| `<<` | 좌측 시프트 | 비트를 왼쪽으로 이동, 0으로 채움 | `0b00001010 << 2 = 0b00101000` |
| `>>` | 우측 시프트 | 비트를 오른쪽으로 이동 | `0b00101000 >> 2 = 0b00001010` |

### 진리표

```
AND (&)    OR (|)     XOR (^)    NOT (~)
0 & 0 = 0  0 | 0 = 0  0 ^ 0 = 0  ~0 = 1
0 & 1 = 0  0 | 1 = 1  0 ^ 1 = 1  ~1 = 0
1 & 0 = 0  1 | 0 = 1  1 ^ 0 = 1
1 & 1 = 1  1 | 1 = 1  1 ^ 1 = 0
```

---

## 시프트 연산

### 좌측 시프트 (`<<`)

비트를 n 위치 왼쪽으로 이동하고 0으로 채움. 2^n을 곱하는 것과 동일:

```c
unsigned int x = 5;        // 0b00000101
x << 1;                    // 0b00001010 = 10  (× 2)
x << 3;                    // 0b00101000 = 40  (× 8)
```

### 우측 시프트 (`>>`)

**unsigned** 타입의 경우: 0으로 채움 (논리 시프트).
**signed** 타입의 경우: 구현 정의 — 보통 부호 비트로 채움 (산술 시프트).

```c
unsigned int u = 40;       // 0b00101000
u >> 2;                    // 0b00001010 = 10  (÷ 4)

int s = -8;                // 0b11111...11000 (2의 보수)
s >> 1;                    // 일반적으로 0b11111...11100 = -4 (산술 시프트)
```

### 시프트의 정의되지 않은 동작

- 음수 양만큼 시프트: `x << -1` — UB
- 비트 폭 이상 시프트: `x << 32` (32비트 int의 경우) — UB
- 음수의 좌측 시프트: `(-1) << 1` — C에서 UB (C++20에서 정의됨)
- 부호 비트로의 좌측 시프트: C에서 UB (C++14에서 정의됨)

```c
// 비트 조작에는 항상 unsigned 타입 사용:
unsigned int flags = 0;
flags |= (1u << 5);    // 'u' 접미사로 unsigned 보장
```

---

## 일반적인 비트 조작 패턴

### 비트 설정

```c
x |= (1u << n);       // n번째 비트를 1로 설정
```

### 비트 해제

```c
x &= ~(1u << n);      // n번째 비트를 0으로 설정
```

### 비트 토글

```c
x ^= (1u << n);       // n번째 비트 반전
```

### 비트 검사

```c
if (x & (1u << n))    // n번째 비트가 1이면 True
```

### 비트 추출 (필드)

```c
// x에서 [high:low] 비트 추출
unsigned int field = (x >> low) & ((1u << (high - low + 1)) - 1);

// 예: 0xAB (10101011)에서 [7:4] 비트 추출
unsigned int x = 0xAB;
unsigned int nibble = (x >> 4) & 0xF;  // 0xA = 10
```

### 필드 설정

```c
// [high:low] 비트를 value로 설정
x = (x & ~(mask << low)) | ((value & mask) << low);

// 예: [7:4] 비트를 0x5로 설정
unsigned int mask = 0xF;
x = (x & ~(mask << 4)) | ((0x5 & mask) << 4);
```

---

## 비트 트릭

### 2의 거듭제곱 검사

```c
bool is_power_of_2(unsigned int x) {
    return x != 0 && (x & (x - 1)) == 0;
}
// 2의 거듭제곱은 정확히 하나의 비트가 설정되어 있으므로 작동:
// 8 = 1000, 7 = 0111, 8 & 7 = 0000
```

### 설정된 비트 수 세기 (Population Count)

```c
// Brian Kernighan 알고리즘 — O(설정된 비트 수)
int popcount(unsigned int x) {
    int count = 0;
    while (x) {
        x &= (x - 1);   // 가장 낮은 설정 비트 제거
        count++;
    }
    return count;
}

// 내장 함수 (GCC/Clang):
__builtin_popcount(x);       // unsigned int
__builtin_popcountll(x);     // unsigned long long

// C++20:
#include <bit>
std::popcount(x);
```

### 가장 낮은 설정 비트 찾기

```c
int lowest_bit = x & (-x);
// -x는 2의 보수: 비트 반전 후 1 더하기
// 예: x = 0b10110100, -x = 0b01001100
//     x & -x = 0b00000100

// 내장 함수:
__builtin_ctz(x);     // 후행 0 비트 수 (가장 낮은 설정 비트 위치)
// C++20: std::countr_zero(x);
```

### 가장 높은 설정 비트 찾기

```c
// 내장 함수:
int pos = 31 - __builtin_clz(x);   // 선행 0 비트 수
// C++20: std::countl_zero(x), std::bit_width(x)

// log2의 바닥값:
int log2_floor = 31 - __builtin_clz(x);   // 32비트 unsigned의 경우
```

### 다음 2의 거듭제곱으로 올림

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

### 임시 변수 없이 교환

```c
a ^= b;
b ^= a;
a ^= b;
// XOR은 자기 역원이므로 작동: a ^ a = 0
// 실제로는 사용하지 말 것 — 최적화기가 tmp 교환을 더 잘 처리
```

### 분기 없는 절대값

```c
int abs_val(int x) {
    int mask = x >> 31;       // 음수면 모두 1, 양수면 모두 0
    return (x ^ mask) - mask;
}
```

---

## 비트 플래그

비트를 불리언 플래그로 사용 — 여러 불리언을 하나의 정수에 패킹:

```c
// 플래그를 2의 거듭제곱으로 정의
#define READ    (1u << 0)   // 0b001
#define WRITE   (1u << 1)   // 0b010
#define EXECUTE (1u << 2)   // 0b100

unsigned int permissions = 0;

// 플래그 설정
permissions |= READ | WRITE;      // 0b011

// 플래그 검사
if (permissions & READ) { /* 읽기 가능 */ }

// 플래그 해제
permissions &= ~WRITE;            // 0b001

// 플래그 토글
permissions ^= EXECUTE;           // 0b101
```

### 열거형 플래그 (C++)

```cpp
enum Permission : unsigned int {
    None    = 0,
    Read    = 1 << 0,
    Write   = 1 << 1,
    Execute = 1 << 2,
    All     = Read | Write | Execute
};

// 연산자 오버로딩으로 타입 안전:
Permission operator|(Permission a, Permission b) {
    return static_cast<Permission>(
        static_cast<unsigned>(a) | static_cast<unsigned>(b)
    );
}

Permission p = Read | Execute;
```

---

## 비트마스크와 비트 필드

### 비트마스크 연산

```c
// n개 비트의 마스크 생성
unsigned int mask_n_bits(int n) {
    return (1u << n) - 1;
}
// mask_n_bits(4) = 0b1111 = 0xF

// 비트 a부터 비트 b까지의 마스크 (포함)
unsigned int mask_range(int a, int b) {
    return ((1u << (b - a + 1)) - 1) << a;
}
// mask_range(2, 5) = 0b00111100

// 마스크 적용
unsigned int extract = (value & mask) >> shift;
```

### 구조체 비트 필드 vs 수동 비트 조작

```c
// 비트 필드 접근법 — 컴파일러가 레이아웃 관리
struct Flags {
    unsigned int read    : 1;
    unsigned int write   : 1;
    unsigned int execute : 1;
    unsigned int reserved: 5;
};

// 수동 접근법 — 레이아웃에 대한 완전한 제어
typedef uint8_t Flags;
#define READ_BIT    0
#define WRITE_BIT   1
#define EXECUTE_BIT 2
```

비트 필드: 더 읽기 쉽지만 레이아웃이 구현 정의 (비트 순서, 패딩).
수동: 이식 가능하고 명시적이지만 더 장황함.

---

## 엔디언

**바이트 순서** — 다중 바이트 값이 메모리에 저장되는 방식:

| 엔디언 | 첫 번째 바이트 | 시스템 |
|---|---|---|
| **리틀 엔디언** | 최하위 바이트 | x86, x86-64, ARM (기본) |
| **빅 엔디언** | 최상위 바이트 | 네트워크 바이트 순서, 일부 MIPS, PowerPC |

```c
uint32_t x = 0x12345678;

// 리틀 엔디언 메모리 레이아웃 (x86):
// 주소:  [0]  [1]  [2]  [3]
// 값:    0x78 0x56 0x34 0x12

// 빅 엔디언 메모리 레이아웃:
// 주소:  [0]  [1]  [2]  [3]
// 값:    0x12 0x34 0x56 0x78
```

### 바이트 스와핑

```c
#include <byteswap.h>    // Linux
uint32_t swapped = __builtin_bswap32(x);   // GCC/Clang
// C++23: std::byteswap(x);

// 네트워크 바이트 순서 변환 (POSIX):
#include <arpa/inet.h>
uint32_t net = htonl(host_val);    // 호스트에서 네트워크 (빅 엔디언)
uint32_t host = ntohl(net_val);    // 네트워크에서 호스트
uint16_t net16 = htons(host_val);
```

### 런타임 엔디언 확인

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

## 실용적 응용

### IP 주소 조작

```c
uint32_t ip = (192u << 24) | (168u << 16) | (1u << 8) | 100u;
// ip = 0xC0A80164

// 옥텟 추출:
uint8_t octet1 = (ip >> 24) & 0xFF;   // 192
uint8_t octet2 = (ip >> 16) & 0xFF;   // 168
uint8_t octet3 = (ip >> 8)  & 0xFF;   // 1
uint8_t octet4 = ip & 0xFF;           // 100
```

### RGB 색상 패킹

```c
// RGBA를 32비트 정수로 패킹
uint32_t rgba(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    return ((uint32_t)r << 24) | ((uint32_t)g << 16) |
           ((uint32_t)b << 8) | a;
}

// 언패킹
uint8_t red   = (color >> 24) & 0xFF;
uint8_t green = (color >> 16) & 0xFF;
uint8_t blue  = (color >> 8)  & 0xFF;
uint8_t alpha = color & 0xFF;
```

### 비트맵 / 비트 배열

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

### 정렬

```c
// x를 align의 다음 배수로 올림 (align은 2의 거듭제곱이어야 함)
uintptr_t align_up(uintptr_t x, size_t align) {
    return (x + align - 1) & ~(align - 1);
}

// 정렬되었는지 확인
int is_aligned(uintptr_t x, size_t align) {
    return (x & (align - 1)) == 0;
}
```

---

## 2의 보수 표현

대부분의 현대 시스템은 부호 있는 정수에 **2의 보수**를 사용한다:

```
8비트 정수의 경우:
 0 = 00000000
 1 = 00000001
127 = 01111111
-1  = 11111111  (모두 1)
-2  = 11111110
-128 = 10000000
```

속성:
- 부정: 모든 비트 반전 후 1 더하기 (`-x = ~x + 1`)
- 범위: -2^(n-1) ~ 2^(n-1) - 1
- MSB (최상위 비트)가 부호 비트
- 0의 표현이 하나 (1의 보수와 달리)

```c
int x = 5;    // 00000101
int y = ~x;   // 11111010 = -6
// ~x + 1 = -x: ~5 + 1 = -6 + 1 = -5 ✓
```

### 부호 있는 정수 오버플로우

부호 있는 정수 오버플로우는 C/C++에서 **정의되지 않은 동작**이다:

```c
int x = INT_MAX;
x + 1;           // UB — 컴파일러가 이것이 절대 일어나지 않는다고 가정하고 최적화

// unsigned 오버플로우는 정의됨 (래핑):
unsigned int u = UINT_MAX;
u + 1;           // 0 — 잘 정의된 래핑
```

컴파일러는 부호 있는 오버플로우가 절대 발생하지 않는다는 가정을 기반으로 최적화할 수 있다. 이는 범위 검사를 제거하고 겉보기에 올바른 코드를 깨뜨릴 수 있다.

---

## C++20 `<bit>` 헤더

```cpp
#include <bit>

std::rotl(x, n);          // 좌측 회전
std::rotr(x, n);          // 우측 회전
std::countl_zero(x);      // 선행 0 비트 수
std::countl_one(x);       // 선행 1 비트 수
std::countr_zero(x);      // 후행 0 비트 수
std::countr_one(x);       // 후행 1 비트 수
std::popcount(x);         // 설정된 비트 수
std::has_single_bit(x);   // 2의 거듭제곱인가?
std::bit_ceil(x);         // 다음 2의 거듭제곱으로 올림
std::bit_floor(x);        // 2의 거듭제곱으로 내림
std::bit_width(x);        // x를 표현하는 최소 비트 수
std::bit_cast<To>(from);  // 비트를 다른 타입으로 재해석 (안전)
```
