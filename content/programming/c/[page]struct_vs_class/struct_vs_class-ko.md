---
title: "C와 C++에서 구조체 vs 클래스"
description: "C에서 구조체의 작동 방식, C++에서 클래스와의 차이점, 기본 접근 제어, 상속, 메모리 레이아웃, POD 타입, 그리고 각각의 사용 시점."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "구조체", "클래스", "OOP", "메모리 레이아웃", "POD"]
author: "Nemit"
featured: false
pinned: false
---

# C와 C++에서 구조체 vs 클래스

## C의 구조체

C에서 `struct`는 관련 데이터를 하나의 복합 타입으로 묶는 유일한 메커니즘이다. **메서드, 접근 제어, 상속이 없다**.

```c
struct Point {
    double x;
    double y;
};

// 'struct' 키워드를 사용해야 함 (typedef하지 않는 한)
struct Point p1 = {3.0, 4.0};
printf("(%f, %f)\n", p1.x, p1.y);
```

### Typedef 패턴

C 프로그래머들은 보통 `struct` 키워드 반복을 피하기 위해 typedef를 사용한다:

```c
typedef struct {
    double x;
    double y;
} Point;

Point p1 = {3.0, 4.0};   // 'struct' 키워드 불필요
```

자기 참조 구조체는 태그가 필요하다:

```c
typedef struct Node {
    int data;
    struct Node *next;   // 'Node'가 아닌 'struct Node'를 사용해야 함
} Node;
```

### C 구조체의 한계

- 멤버 함수 없음 (함수 포인터로 시뮬레이션)
- 접근 지정자 없음 (모든 것이 public)
- 생성자/소멸자 없음
- 상속 없음
- 연산자 오버로딩 없음

```c
// 함수 포인터로 "메서드" 시뮬레이션
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

## C++에서 구조체 vs 클래스

C++에서 `struct`와 `class`는 거의 **동일**하다. 유일한 차이점은 기본 접근 제어와 기본 상속이다:

| 기능 | `struct` | `class` |
|---|---|---|
| **기본 멤버 접근** | `public` | `private` |
| **기본 상속** | `public` | `private` |
| 그 외 모든 것 | 동일 | 동일 |

그것뿐이다. 둘 다 생성자, 소멸자, 메서드, 정적 멤버, 가상 함수, 템플릿, 연산자 오버로딩을 가질 수 있다.

```cpp
struct Point {
    double x, y;           // 기본적으로 public
    double magnitude() {   // 기본적으로 public
        return std::sqrt(x * x + y * y);
    }
};

class PointClass {
    double x, y;           // 기본적으로 private
public:
    PointClass(double x, double y) : x(x), y(y) {}
    double magnitude() {
        return std::sqrt(x * x + y * y);
    }
};
```

### 기본 상속

```cpp
struct Base {
    int value = 42;
};

struct DerivedStruct : Base {};       // public 상속 (struct 기본)
class DerivedClass : Base {};         // private 상속 (class 기본)

DerivedStruct ds;
ds.value;       // OK — public 상속, value 접근 가능

DerivedClass dc;
// dc.value;    // 에러 — private 상속, value 접근 불가
```

---

## 메모리 레이아웃

`struct`와 `class` 모두 동일한 메모리 레이아웃 규칙을 가진다. 멤버는 선언 순서대로 정렬 패딩과 함께 저장된다:

```cpp
struct Example {
    char a;      // 1바이트
    // 3바이트 패딩
    int b;       // 4바이트
    char c;      // 1바이트
    // 7바이트 패딩 (double을 위한 8 정렬)
    double d;    // 8바이트
};
// sizeof(Example) = 24

// 최소 패딩을 위해 재배치:
struct Compact {
    double d;    // 8바이트
    int b;       // 4바이트
    char a;      // 1바이트
    char c;      // 1바이트
    // 2바이트 패딩
};
// sizeof(Compact) = 16
```

### 빈 기본 클래스 최적화 (EBCO)

빈 struct/class는 보통 `sizeof` = 1이지만 (고유한 주소를 보장하기 위해), 기본 클래스로서는 0바이트를 차지할 수 있다:

```cpp
struct Empty {};
struct Derived : Empty {
    int x;
};

static_assert(sizeof(Empty) == 1);
static_assert(sizeof(Derived) == sizeof(int));  // EBCO 적용
```

### 가상 함수와 vtable

가상 함수를 추가하면 **vtable 포인터**가 추가된다 (64비트에서 일반적으로 8바이트):

```cpp
struct NoVirtual {
    int x;
};
// sizeof = 4

struct WithVirtual {
    int x;
    virtual void foo() {}
};
// sizeof = 16 (8바이트 vptr + 4바이트 x + 4바이트 패딩)
```

vtable은 함수 포인터의 테이블이다. 가상 함수가 있는 각 클래스는 하나의 vtable을 가지며 (모든 인스턴스가 공유), 각 객체는 자신 클래스의 vtable에 대한 포인터를 저장한다.

```
객체 레이아웃:           vtable:
┌──────────┐          ┌──────────────┐
│ vptr ────────────→  │ &foo()       │
├──────────┤          │ &bar()       │
│ x        │          │ &typeinfo    │
└──────────┘          └──────────────┘
```

---

## POD 타입 (Plain Old Data)

**POD 타입**은 C의 메모리 모델과 호환되는 struct/class다 — `memcpy`, `memset`을 안전하게 수행할 수 있고, 언어 경계를 넘어 사용할 수 있다.

### C++11 정의 (분해)

POD = **trivial** + **standard-layout**

**Trivial**의 의미:
- 기본 생성자/소멸자 (컴파일러 생성 또는 `= default`)
- trivially copyable (사용자 정의 복사/이동 연산 없음)
- 가상 함수나 가상 기본 클래스 없음

**Standard-layout**의 의미:
- 모든 비정적 멤버가 동일한 접근 지정자를 가짐
- 가상 함수나 가상 기본 클래스 없음
- 계층 구조에서 둘 이상의 클래스에 비정적 멤버가 없음
- 첫 번째 비정적 멤버가 기본 클래스 타입이 아님

```cpp
// POD — trivial이고 standard-layout
struct POD {
    int x;
    double y;
    char name[32];
};

// POD가 아님 — 생성자와 private 멤버가 있음
class NotPOD {
    int x;
public:
    NotPOD(int x) : x(x) {}
    virtual void foo();
};
```

### C++20: POD 폐기

C++20은 POD 개념을 폐기했다. `std::is_trivial`과 `std::is_standard_layout`을 별도로 사용한다:

```cpp
#include <type_traits>

static_assert(std::is_trivial_v<POD>);
static_assert(std::is_standard_layout_v<POD>);
```

---

## 집합 초기화

**집합(aggregate)**은 사용자 선언 생성자가 없고, private/protected 비정적 멤버가 없으며, 가상 함수와 가상 기본 클래스가 없는 배열 또는 클래스다.

집합은 중괄호 초기화를 지원한다:

```cpp
struct Point {
    double x;
    double y;
};

Point p1 = {3.0, 4.0};        // C 스타일
Point p2{3.0, 4.0};           // C++11 균일 초기화
auto p3 = Point{.x = 3.0, .y = 4.0};  // C++20 지명 초기화자
```

생성자를 추가하면 집합 상태가 제거된다:

```cpp
struct NotAggregate {
    double x, y;
    NotAggregate(double x, double y) : x(x), y(y) {}
};

// NotAggregate na = {3.0, 4.0};  // 에러: 집합이 아님
NotAggregate na(3.0, 4.0);        // 생성자를 사용해야 함
```

---

## 비트 필드

C와 C++ 모두 정수를 더 적은 비트로 패킹하는 비트 필드를 지원한다:

```cpp
struct Flags {
    unsigned int readable  : 1;
    unsigned int writable  : 1;
    unsigned int executable: 1;
    unsigned int reserved  : 5;
};
// sizeof(Flags) = 4 (하나의 unsigned int)

Flags f = {1, 1, 0, 0};
f.readable = 1;
f.writable = 0;
```

비트 필드는 주소를 가질 수 없다 — 비트 필드 멤버에 대한 포인터를 가질 수 없다.

비트 필드 레이아웃은 **구현 정의**다: 저장 단위 내 순서와 비트 필드 사이의 패딩은 컴파일러와 플랫폼에 따라 다르다.

---

## 중첩 및 익명 구조체/공용체

### 중첩 구조체

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

### 익명 공용체 (C11 / C++)

익명 공용체의 멤버는 둘러싸는 구조체를 통해 직접 접근된다:

```c
struct Variant {
    int type;
    union {
        int i;
        float f;
        char s[20];
    };  // 익명 공용체
};

struct Variant v;
v.type = 0;
v.i = 42;      // 직접 접근 — 공용체 멤버 이름 없음
```

### 익명 구조체 (C11 / C++에서는 비표준)

```c
struct Vector3 {
    union {
        struct { float x, y, z; };     // 익명 구조체
        float data[3];
    };
};

struct Vector3 v = {1.0f, 2.0f, 3.0f};
v.x = 5.0f;        // 이름 있는 멤버로 접근
v.data[0] = 5.0f;  // 같은 메모리 위치
```

---

## 유연한 배열 멤버 (C99)

C99는 구조체의 마지막 멤버가 불완전 배열인 것을 허용한다 — **유연한 배열 멤버**:

```c
struct Buffer {
    size_t length;
    char data[];    // 유연한 배열 멤버 — 반드시 마지막이어야 함
};

// 구조체 + data를 위한 공간 할당
struct Buffer *buf = malloc(sizeof(struct Buffer) + 100);
buf->length = 100;
memcpy(buf->data, "hello", 6);

// sizeof(struct Buffer)는 data[]를 포함하지 않음
printf("%zu\n", sizeof(struct Buffer));  // 'length' + 패딩만 포함
```

이전의 "구조체 해킹" (`char data[1]`)에 대한 표준 대체이다.

C++은 공식적으로 유연한 배열 멤버를 지원하지 않지만, 대부분의 컴파일러가 확장으로 허용한다.

---

## struct vs class 사용 시점

관례 (언어에 의해 강제되지 않음):

| `struct` 사용 시 | `class` 사용 시 |
|---|---|
| 수동적 데이터 집합 (POD 유사) | 불변성을 가진 능동적 객체 |
| 모든 멤버가 public | 멤버에 접근 제어가 필요 |
| 메서드가 없거나 최소한 | 캡슐화가 있는 풍부한 인터페이스 |
| C 상호 운용성 필요 | 복잡한 상속 계층 |
| 작은 값 타입 | 리소스 관리 타입 (RAII) |

Google C++ 스타일 가이드와 C++ 핵심 가이드라인의 권장:
- **struct**: 데이터를 운반하는 수동적 객체; 모든 필드 public
- **class**: 불변성, private 데이터, 의미 있는 인터페이스를 가진 객체

```cpp
// struct — 단순 데이터 운반자
struct Color {
    uint8_t r, g, b, a;
};

// class — 인터페이스에 의해 유지되는 불변성
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

## C/C++ 상호 운용성

C에서 C++ struct/class를 사용하려면 `extern "C"`로 감싼다:

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

C 호환 타입의 규칙:
- 가상 함수 없음
- non-trivial 생성자/소멸자 없음
- C++ 전용 기능 없음 (참조, 템플릿, 네임스페이스)
- 함수 선언에 `extern "C"` 사용
- 인터페이스에서 C 데이터 타입만 사용
