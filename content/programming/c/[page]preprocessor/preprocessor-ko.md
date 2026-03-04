---
title: "C/C++ 전처리기"
description: "C 전처리기의 작동 방식 — #define, #include, 매크로, 조건부 컴파일, 인클루드 가드, pragma, 전처리기 함정."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "전처리기", "매크로", "#define", "#include", "조건부 컴파일"]
author: "Nemit"
featured: false
pinned: false
---

# C/C++ 전처리기

## 전처리기란?

전처리기는 **컴파일 전에** 실행되는 **텍스트 변환** 단계다. C/C++ 구문이 아닌 소스 텍스트에 대해 동작한다 — 타입, 스코프, 표현식에 대한 이해가 없다.

### 컴파일 단계

```
소스 → 전처리기 → 컴파일러 → 어셈블러 → 링커 → 실행 파일
 .c     cpp        cc        as       ld      a.out
```

1. **전처리**: 매크로 확장, `#include`, `#define`, `#if` 등 처리
2. **컴파일**: C/C++ 코드 파싱, 어셈블리 생성
3. **어셈블리**: 오브젝트 코드 (.o) 생성
4. **링킹**: 오브젝트 파일을 결합하여 실행 파일 생성

전처리기 출력 확인:

```bash
gcc -E source.c           # 전처리된 코드를 stdout으로 출력
gcc -E -P source.c        # 동일하지만, 라인 마커 없이
cpp source.c              # 대안: 전처리기 직접 호출
```

---

## `#include` — 파일 포함

다른 파일의 내용을 현재 파일에 문자 그대로 붙여넣는다:

```c
#include <stdio.h>      // 시스템 인클루드 경로 검색
#include "myheader.h"   // 현재 디렉토리 먼저 검색, 그 다음 시스템 경로
```

### 검색 순서

- `<file>`: 시스템/컴파일러 인클루드 디렉토리만 검색 (`/usr/include` 등)
- `"file"`: 현재 디렉토리를 먼저 검색, 그 다음 시스템 경로로 폴백

```bash
# 커스텀 인클루드 경로 추가:
gcc -I/path/to/headers source.c
```

### 인클루드 가드

이중 포함을 방지한다 (재정의 에러 유발):

```c
// myheader.h
#ifndef MYHEADER_H
#define MYHEADER_H

struct Point {
    double x, y;
};

void process(struct Point p);

#endif // MYHEADER_H
```

작동 방식:
1. 첫 번째 `#include "myheader.h"`: `MYHEADER_H`가 정의되지 않음 → 정의하고 내용 포함
2. 두 번째 `#include "myheader.h"`: `MYHEADER_H`가 이미 정의됨 → `#endif`까지 건너뜀

### `#pragma once`

인클루드 가드의 비표준이지만 보편적으로 지원되는 대안:

```c
#pragma once

struct Point {
    double x, y;
};
```

장점: 더 간단, 이름 충돌 없음, 약간 더 빠름 (컴파일러가 파일 전체를 건너뛸 수 있음).
단점: 표준 C/C++이 아님, 심볼릭 링크와 네트워크 드라이브의 엣지 케이스.

---

## `#define` — 매크로

### 객체형 매크로 (상수)

```c
#define PI 3.14159265358979
#define MAX_SIZE 1024
#define VERSION "1.0.0"

double area = PI * r * r;
char buffer[MAX_SIZE];
```

전처리기는 **텍스트 대체**를 수행한다 — `PI`가 나타나는 모든 곳에서 `3.14159265358979`로 대체된다 (문자열과 주석 내부 제외).

### 함수형 매크로

```c
#define SQUARE(x) ((x) * (x))
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define ABS(x) ((x) < 0 ? -(x) : (x))

int y = SQUARE(5);     // 확장: ((5) * (5))
int m = MAX(a, b);     // 확장: ((a) > (b) ? (a) : (b))
```

### 왜 모든 괄호가 필요한가?

괄호 없이는 연산자 우선순위가 버그를 유발할 수 있다:

```c
#define SQUARE_BAD(x) x * x
#define SQUARE_GOOD(x) ((x) * (x))

SQUARE_BAD(3 + 1);     // 3 + 1 * 3 + 1 = 7  (틀림!)
SQUARE_GOOD(3 + 1);    // ((3 + 1) * (3 + 1)) = 16  (맞음)

// SQUARE_GOOD에도 문제가 있다:
SQUARE_GOOD(i++);      // ((i++) * (i++)) — i가 두 번 증가! UB!
```

**규칙**: 모든 매개변수와 전체 표현식에 항상 괄호를 사용한다. 그러나 매크로는 여전히 부작용을 처리할 수 없다 — 인라인 함수를 선호한다.

### 여러 줄 매크로

백슬래시 `\`를 사용하여 다음 줄로 계속:

```c
#define SWAP(a, b) do { \
    typeof(a) _tmp = (a); \
    (a) = (b); \
    (b) = _tmp; \
} while (0)
```

`do { ... } while (0)` 관용구는 매크로가 단일 문처럼 동작하게 한다:

```c
if (x > y)
    SWAP(x, y);    // 올바르게 작동 — 단일 do-while로 확장
else
    printf("ok");
```

`do-while(0)` 없이, 단순 `{ }` 블록 뒤에 `;`가 오면 `if-else`를 깨뜨린다.

### `#undef` — 매크로 정의 해제

```c
#define DEBUG 1
// ... DEBUG를 사용하는 코드 ...
#undef DEBUG
// DEBUG는 더 이상 정의되지 않음
```

---

## 문자열화와 토큰 붙이기

### `#` — 문자열화

매크로 인수를 문자열 리터럴로 변환한다:

```c
#define STRINGIFY(x) #x
#define TOSTRING(x) STRINGIFY(x)

STRINGIFY(hello);        // "hello"
STRINGIFY(3 + 4);        // "3 + 4"

#define VERSION 2
TOSTRING(VERSION);       // "2"  (이중 확장 필요)
STRINGIFY(VERSION);      // "VERSION"  (확장 없음 — #이 방지)
```

디버그 메시지에 유용:

```c
#define ASSERT(expr) \
    if (!(expr)) { \
        fprintf(stderr, "단언 실패: %s at %s:%d\n", \
                #expr, __FILE__, __LINE__); \
        abort(); \
    }

ASSERT(x > 0);
// x <= 0이면: "단언 실패: x > 0 at main.c:42"
```

### `##` — 토큰 붙이기

두 토큰을 하나로 연결한다:

```c
#define CONCAT(a, b) a##b

int CONCAT(my, Var) = 42;     // int myVar = 42;
CONCAT(print, f)("hello\n");  // printf("hello\n");
```

일반적 사용 — 고유한 변수 이름 생성:

```c
#define UNIQUE_NAME(prefix) CONCAT(prefix, __LINE__)

int UNIQUE_NAME(tmp) = 0;   // int tmp42 = 0;  (42번째 줄이면)
```

---

## 가변 인수 매크로 (C99)

```c
#define LOG(fmt, ...) fprintf(stderr, fmt, __VA_ARGS__)

LOG("x = %d\n", x);          // fprintf(stderr, "x = %d\n", x)
// LOG("hello\n");            // 에러: __VA_ARGS__가 비어있음, 후행 쉼표

// 빈 __VA_ARGS__를 처리하는 GNU 확장:
#define LOG(fmt, ...) fprintf(stderr, fmt, ##__VA_ARGS__)
LOG("hello\n");               // fprintf(stderr, "hello\n") — 쉼표 제거

// C++20 / C23: __VA_OPT__
#define LOG(fmt, ...) fprintf(stderr, fmt __VA_OPT__(,) __VA_ARGS__)
```

---

## 조건부 컴파일

### `#if`, `#elif`, `#else`, `#endif`

```c
#if LEVEL == 1
    // 레벨 1용 코드
#elif LEVEL == 2
    // 레벨 2용 코드
#else
    // 기본 코드
#endif
```

### `#ifdef` / `#ifndef`

```c
#ifdef DEBUG
    printf("디버그: x = %d\n", x);
#endif

#ifndef NDEBUG
    assert(x > 0);
#endif
```

`#ifdef X`는 `#if defined(X)`와 동등하다.

### `defined()` 연산자

복잡한 조건에 `#if`와 함께 사용할 수 있다:

```c
#if defined(LINUX) && !defined(ANDROID)
    // Linux 전용 코드, Android 제외
#endif

#if defined(__cplusplus)
    // C++ 코드
#else
    // C 코드
#endif
```

### 플랫폼 감지

```c
// 운영체제
#if defined(_WIN32)
    // Windows (32 및 64비트)
#elif defined(__linux__)
    // Linux
#elif defined(__APPLE__)
    #include <TargetConditionals.h>
    #if TARGET_OS_MAC
        // macOS
    #endif
#elif defined(__FreeBSD__)
    // FreeBSD
#endif

// 컴파일러
#if defined(__GNUC__)
    // GCC 또는 Clang (Clang은 호환성을 위해 __GNUC__를 정의)
#endif
#if defined(__clang__)
    // Clang 전용
#endif
#if defined(_MSC_VER)
    // MSVC
#endif

// 아키텍처
#if defined(__x86_64__) || defined(_M_X64)
    // 64비트 x86
#elif defined(__aarch64__) || defined(_M_ARM64)
    // 64비트 ARM
#endif
```

### C/C++ 버전 감지

```c
// C 표준 버전
#if __STDC_VERSION__ >= 201112L
    // C11 이상
#endif

// C++ 표준 버전
#if __cplusplus >= 201703L
    // C++17 이상
#endif
#if __cplusplus >= 202002L
    // C++20 이상
#endif
```

---

## 미리 정의된 매크로

| 매크로 | 설명 | 예시 값 |
|---|---|---|
| `__FILE__` | 현재 파일명 | `"main.c"` |
| `__LINE__` | 현재 줄 번호 | `42` |
| `__func__` | 현재 함수명 (C99) | `"main"` |
| `__DATE__` | 컴파일 날짜 | `"Mar  4 2026"` |
| `__TIME__` | 컴파일 시간 | `"14:30:00"` |
| `__STDC__` | 표준 C 컴파일러이면 1 | `1` |
| `__STDC_VERSION__` | C 표준 버전 | `201710L` (C17) |
| `__cplusplus` | C++ 표준 버전 | `202002L` (C++20) |
| `__COUNTER__` | 증가하는 카운터 (비표준) | `0`, `1`, `2`, ... |

```c
printf("에러 at %s:%d in %s\n", __FILE__, __LINE__, __func__);
```

---

## `#pragma` — 컴파일러 지시어

`#pragma`는 컴파일러 특정 지시를 제공한다:

```c
// 구조체 패킹 — 패딩 제거
#pragma pack(push, 1)
struct Packed {
    char a;     // 1바이트
    int b;      // 4바이트 (이전에 패딩 없음)
    char c;     // 1바이트
};
#pragma pack(pop)
// sizeof(Packed) = 12 대신 6

// 경고 제어
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"
int unused;
#pragma GCC diagnostic pop
```

### `_Pragma` 연산자 (C99)

`#pragma`의 문자열 기반 대안 — 매크로에서 사용 가능:

```c
#define NO_WARN_START _Pragma("GCC diagnostic push") \
                      _Pragma("GCC diagnostic ignored \"-Wall\"")
#define NO_WARN_END   _Pragma("GCC diagnostic pop")

NO_WARN_START
// 경고가 억제된 코드
NO_WARN_END
```

---

## `#error`와 `#warning`

```c
#if !defined(__STDC_VERSION__) || __STDC_VERSION__ < 201112L
    #error "이 코드는 C11 이상이 필요합니다"
#endif

#ifdef DEPRECATED_API
    #warning "deprecated API 사용 중 — v2로 마이그레이션하세요"
#endif
```

`#error`는 주어진 메시지와 함께 컴파일을 중지한다. `#warning` (비표준이지만 널리 지원됨)은 경고를 발생시킨다.

---

## 매크로 함정

### 이중 평가

```c
#define MAX(a, b) ((a) > (b) ? (a) : (b))

int x = MAX(expensive_func(), other_func());
// expensive_func()가 두 번 호출될 수 있음
```

수정: GCC의 문 표현식이나 인라인 함수 사용:

```c
// GCC 확장: 문 표현식
#define MAX(a, b) ({ \
    typeof(a) _a = (a); \
    typeof(b) _b = (b); \
    _a > _b ? _a : _b; \
})

// 더 나은 방법: 인라인 함수 (C99/C++)
static inline int max_int(int a, int b) {
    return a > b ? a : b;
}
```

### 이름 충돌

매크로는 스코프가 없다 — 전역 네임스페이스를 오염시킨다:

```c
#define begin 0
#define end 100
// 깨뜨림: std::vector<int> v; v.begin(); v.end();
```

관례: 매크로 이름은 `ALL_CAPS`를 사용하여 일반 식별자와 구분한다.

### 디버깅 어려움

매크로는 컴파일 전에 확장되므로, 에러 메시지가 매크로가 아닌 확장된 코드를 참조한다.

---

## 매크로에 대한 C++ 대안

현대 C++은 대부분의 매크로 사용에 대해 타입 안전하고 스코프가 있는 대안을 제공한다:

| 매크로 사용 | C++ 대안 |
|---|---|
| 상수 (`#define PI 3.14`) | `constexpr double pi = 3.14;` |
| 함수 매크로 (`#define MAX(a,b)`) | `template <typename T> T max(T a, T b)` |
| 타입 제네릭 함수 | 템플릿 / `auto` |
| 조건부 코드 블록 | `if constexpr` (C++17) |
| 인클루드 가드 | 모듈 (C++20) |
| 문자열화 | 소스 위치 (C++20) |

```cpp
// constexpr는 상수에 대한 #define을 대체
constexpr double PI = 3.14159265358979;
constexpr int MAX_SIZE = 1024;

// 템플릿은 함수 매크로를 대체
template <typename T>
constexpr T square(T x) { return x * x; }

// if constexpr는 컴파일 타임 분기에 대한 #ifdef를 대체
template <typename T>
void process(T val) {
    if constexpr (std::is_integral_v<T>) {
        // 정수 전용 코드
    } else {
        // 다른 타입
    }
}

// C++20 source_location은 __FILE__/__LINE__을 대체
#include <source_location>
void log(std::string_view msg,
         std::source_location loc = std::source_location::current()) {
    std::cout << loc.file_name() << ":" << loc.line() << " " << msg << "\n";
}
```

### C++20 모듈

모듈은 `#include`를 완전히 대체한다 — 전처리기 텍스트 포함 없음, 인클루드 가드 불필요:

```cpp
// math.cppm (모듈 인터페이스)
export module math;

export constexpr double pi = 3.14159265358979;
export double square(double x) { return x * x; }

// main.cpp
import math;   // 헤더 가드 없음, 매크로 누출 없음, 빠른 컴파일

double area = pi * square(r);
```

---

## `X-매크로` — 고급 패턴

병렬 데이터 구조를 유지하기 위한 기법:

```c
// 데이터를 한 번만 정의:
#define COLORS \
    X(RED,   0xFF0000) \
    X(GREEN, 0x00FF00) \
    X(BLUE,  0x0000FF)

// 열거형 생성:
enum Color {
    #define X(name, value) COLOR_##name,
    COLORS
    #undef X
    COLOR_COUNT
};

// 문자열 배열 생성:
const char *color_names[] = {
    #define X(name, value) #name,
    COLORS
    #undef X
};

// 값 배열 생성:
unsigned int color_values[] = {
    #define X(name, value) value,
    COLORS
    #undef X
};
```

이렇게 하면 열거형, 문자열, 값이 항상 동기화된다.
