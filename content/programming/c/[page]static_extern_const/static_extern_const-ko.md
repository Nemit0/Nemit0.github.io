---
title: "C/C++ static, extern, const 키워드"
description: "저장 클래스와 타입 한정자 — static, extern, const, volatile, register, constexpr, 그리고 링크, 수명, 최적화에 미치는 영향."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "static", "extern", "const", "저장 클래스", "링크"]
author: "Nemit"
featured: false
pinned: false
---

# C/C++ static, extern, const 키워드

## 저장 기간, 스코프, 링크

C/C++의 모든 변수는 세 가지 속성을 가진다:

| 속성 | 설명 | 옵션 |
|---|---|---|
| **저장 기간** | 변수가 얼마나 오래 존재하는가 | 자동, 정적, 동적, 스레드 |
| **스코프** | 이름이 어디서 보이는가 | 블록, 파일, 함수, 네임스페이스 |
| **링크** | 이름이 번역 단위 간 공유되는가 | 없음, 내부, 외부 |

**번역 단위**는 전처리 후의 소스 파일이다 (모든 `#include` 확장 후).

---

## `static`

`static` 키워드는 문맥에 따라 다른 의미를 가진다:

### 1. 정적 지역 변수

`static`이 있는 지역 변수는 **정적 저장 기간**을 가진다 — 함수 호출 간에 지속된다:

```c
void counter() {
    static int count = 0;   // 한 번만 초기화, 호출 간 지속
    count++;
    printf("Count: %d\n", count);
}

counter();   // Count: 1
counter();   // Count: 2
counter();   // Count: 3
```

속성:
- 한 번만 초기화 (프로그램 시작 또는 첫 호출 시, 언어에 따라)
- 함수 호출 간 값 유지
- 데이터/BSS 세그먼트에 저장 (스택 아님)
- C에서: `main()` 전에 초기화 (상수 표현식이어야 함)
- C++에서: 첫 호출 시 초기화 (C++11 이후 스레드 안전)

```cpp
// C++: 스레드 안전 초기화 (Meyers' 싱글턴)
Logger& get_logger() {
    static Logger instance;   // 첫 호출 시 생성, 스레드 안전
    return instance;
}
```

### 2. 정적 전역 변수 — 내부 링크

파일 스코프에서 `static`은 변수나 함수에 **내부 링크**를 부여한다 — 현재 번역 단위에서만 보임:

```c
// file1.c
static int counter = 0;         // file1.c에서만 보임
static void helper() { ... }    // file1.c에서만 보임

// file2.c
// file1.c의 counter나 helper()에 접근할 수 없음
// 자체 'static int counter'를 충돌 없이 정의할 수 있음
```

`static` 없이, 파일 스코프 변수와 함수는 기본적으로 **외부 링크**를 가진다 (`extern`을 통해 다른 파일에서 접근 가능).

### 3. 정적 클래스 멤버 (C++)

`static` 멤버는 인스턴스가 아닌 **클래스**에 속한다:

```cpp
class Widget {
    static int count;        // 선언 — 모든 인스턴스가 공유
public:
    Widget() { count++; }
    ~Widget() { count--; }
    static int getCount() { return count; }
};

int Widget::count = 0;       // 정의 — 정확히 하나의 .cpp에 있어야 함

Widget a, b, c;
Widget::getCount();          // 3
```

정적 멤버 함수:
- 객체 없이 호출 가능: `Widget::getCount()`
- 비정적 멤버에 접근할 수 없음 (`this` 포인터 없음)
- private 정적 멤버에 접근 가능

### C++17 인라인 정적 멤버

```cpp
class Widget {
    inline static int count = 0;   // 헤더에서 정의 — 별도 .cpp 불필요
};
```

---

## `extern`

`extern`은 변수나 함수가 **다른 곳** (다른 번역 단위)에 정의되어 있음을 선언한다:

### 변수 선언 vs 정의

```c
// file1.c — 정의 (저장공간 할당)
int global_counter = 0;

// file2.c — 선언 (저장공간 없음, file1.c의 정의 참조)
extern int global_counter;

void increment() {
    global_counter++;    // file1.c와 같은 변수 사용
}
```

규칙:
- `extern int x;` — 선언 (저장공간 할당 안 됨)
- `int x;` (파일 스코프) — 잠정적 정의 (다른 정의가 없으면 정의가 됨)
- `int x = 5;` — 초기화자가 있는 정의
- `extern int x = 5;` — 정의 (`extern`에도 불구하고 초기화자가 정의로 만듦)
- 모든 번역 단위에서 **정확히 하나의 정의**가 있어야 한다 (One Definition Rule)

### 함수에서의 `extern`

함수는 기본적으로 `extern`이다 — 키워드는 선택적:

```c
// 다음은 동등하다:
void func();
extern void func();
```

### `extern "C"` (C++)

C 상호운용성을 위해 C++ 이름 맹글링을 비활성화한다:

```cpp
// C에서 사용 가능한 C++ 헤더
#ifdef __cplusplus
extern "C" {
#endif

void c_function(int x);
int c_variable;

#ifdef __cplusplus
}
#endif
```

C++ 이름 맹글링은 함수 서명을 인코딩한다 (오버로딩을 위해). `extern "C"`는 C 스타일 이름을 사용하여 C 코드가 링크할 수 있게 한다.

---

## `const`

초기화 후 값을 수정할 수 없음을 선언한다.

### `const` 변수

```c
const int MAX = 100;
// MAX = 200;        // 에러: const 수정 불가

const int *p;        // const int에 대한 포인터 — *p 수정 불가
int *const q = &x;   // const 포인터 — q 자체 수정 불가
const int *const r = &x;  // 둘 다 const
```

### C vs C++에서의 `const`

| 기능 | C | C++ |
|---|---|---|
| 링크 | 외부 (일반 변수처럼) | **내부** (`static`처럼) |
| 컴파일 타임 상수 | 아니오 (읽기 전용일 뿐) | 예 (상수 표현식으로 초기화된 경우) |
| 배열 크기 | `const int`를 배열 크기로 사용 불가 | 가능 (컴파일 타임 상수로 취급) |
| 필수 초기화 | 아니오 (`extern const int x;` 가능) | 예 (반드시 초기화) |

```c
// C:
const int N = 10;
int arr[N];          // C에서 에러 (N은 컴파일 타임 상수가 아님)
                     // 대신 #define N 10 사용

// C++:
const int N = 10;
int arr[N];          // C++에서 OK (N은 컴파일 타임 상수)
```

### 포인터와 `const` (오른쪽에서 왼쪽으로 읽기)

```c
      int *p;              // int에 대한 포인터
const int *p;              // const int에 대한 포인터 (*p 수정 불가)
      int *const p;        // int에 대한 const 포인터 (p 수정 불가)
const int *const p;        // const int에 대한 const 포인터
```

### const 정확성

const 정확성은 데이터가 수정되지 않아야 할 곳에 일관되게 `const`를 사용하는 것이다. 컴파일 타임에 버그를 잡고 최적화를 가능하게 한다.

```cpp
class Matrix {
    std::vector<double> data_;
    size_t rows_, cols_;
public:
    // const 메서드 — 객체를 수정하지 않겠다는 약속
    double at(size_t r, size_t c) const {
        return data_[r * cols_ + c];
    }

    // 비const 메서드 — 수정 가능
    double& at(size_t r, size_t c) {
        return data_[r * cols_ + c];
    }
};

void print(const Matrix &m) {
    m.at(0, 0);     // const 버전 호출
    // m.at(0, 0) = 5; // 에러: const 참조
}
```

### `mutable` (C++)

`const` 컨텍스트에서도 멤버를 수정할 수 있게 한다:

```cpp
class Cache {
    mutable std::unordered_map<int, int> cache_;
    mutable std::mutex mtx_;

public:
    int compute(int x) const {   // const 메서드
        std::lock_guard<std::mutex> lock(mtx_);  // OK: mtx_는 mutable
        auto it = cache_.find(x);
        if (it != cache_.end()) return it->second;
        int result = expensive(x);
        cache_[x] = result;      // OK: cache_는 mutable
        return result;
    }
};
```

---

## `constexpr` (C++11)

값이나 함수가 컴파일 타임에 평가될 **수 있음**을 선언한다:

```cpp
constexpr int square(int x) { return x * x; }

constexpr int N = square(5);     // 컴파일 타임에 계산: 25
int arr[N];                       // OK: N은 컴파일 타임 상수

// 런타임에도 사용 가능:
int x;
std::cin >> x;
int y = square(x);               // 런타임에 계산
```

### `constexpr` vs `const`

| | `const` | `constexpr` |
|---|---|---|
| 컴파일 타임이어야? | 아니오 (C); 보통 예 (C++) | 예 (constexpr 컨텍스트에서) |
| 런타임 값 가능? | 예 | 예 (constexpr 컨텍스트가 아닐 때) |
| 함수? | 아니오 | 예 (C++11+) |
| 복잡한 로직? | 해당 없음 | 예 (C++14: 루프, 변수; C++20: 동적 할당) |

```cpp
const int a = 10;          // 컴파일 타임 (아마도)
const int b = rand();      // 런타임 — 여전히 const (초기화 후 수정 불가)

constexpr int c = 10;      // 보장된 컴파일 타임
// constexpr int d = rand(); // 에러: rand()는 constexpr이 아님
```

### `consteval` (C++20)과 `constinit` (C++20)

```cpp
consteval int must_compile_time(int x) { return x * x; }
// 반드시 컴파일 타임에 평가되어야 함 — 런타임에 호출하면 에러

constinit int global = square(5);
// 컴파일 타임에 초기화되어야 하지만, 런타임에 수정 가능
// "정적 초기화 순서 문제"를 방지
```

---

## `volatile`

변수의 값이 **프로그램 제어 밖에서** 변경될 수 있음을 컴파일러에 알린다 — 읽기/쓰기 최적화를 방지:

```c
volatile int *hardware_reg = (volatile int *)0x40001000;

// volatile 없이: 컴파일러가 값을 레지스터에 캐시할 수 있음
// volatile 있으면: 모든 읽기/쓰기가 실제 메모리 주소로 감
while (*hardware_reg & 0x01) {
    // 컴파일러가 반드시 매 반복마다 *hardware_reg를 다시 읽어야 함
}
```

사용 사례:
- 메모리 매핑된 하드웨어 레지스터
- 시그널 핸들러 (`sig_atomic_t`와 함께)
- `setjmp`/`longjmp` 변수

유용하지 **않은** 경우:
- 스레드 동기화 (대신 원자적 연산이나 뮤텍스 사용)
- 연산을 원자적으로 만들기 (volatile ≠ atomic)

```c
// 틀림 — volatile은 이것을 스레드 안전하게 만들지 않음:
volatile int shared_counter = 0;
shared_counter++;  // 여전히 읽기-수정-쓰기 — 원자적이 아님

// 맞음 — 원자적 연산 사용:
#include <stdatomic.h>
atomic_int shared_counter = 0;
atomic_fetch_add(&shared_counter, 1);  // 원자적 증가
```

---

## `register` (폐기됨)

변수를 CPU 레지스터에 저장하라는 제안. 컴파일러는 이 힌트를 무시한다 — 레지스터 할당을 인간보다 더 잘한다.

```c
register int i;          // 힌트: i를 레지스터에 유지
// &i;                   // C에서 에러: register 변수의 주소를 가질 수 없음
                         // C++에서 OK (키워드가 사실상 무시됨)
```

`register`는 C++11에서 폐기되고 C++17에서 제거되었다. 사용하지 말 것.

---

## 저장 클래스 요약

| 키워드 | 스코프 | 저장 기간 | 링크 | 비고 |
|---|---|---|---|---|
| (없음, 지역) | 블록 | 자동 | 없음 | 지역 변수 기본값 |
| `static` (지역) | 블록 | 정적 | 없음 | 호출 간 지속 |
| `static` (전역) | 파일 | 정적 | 내부 | 다른 TU에서 숨겨짐 |
| `extern` | 파일 | 정적 | 외부 | 다른 곳에 정의됨 |
| `register` | 블록 | 자동 | 없음 | 폐기된 힌트 |
| `thread_local` | 블록/파일 | 스레드 | 내부/외부 | 스레드별 변수 |
| `inline` (C++17 변수) | 파일 | 정적 | 외부 | 다중 정의 OK |

---

## `thread_local` (C++11) / `_Thread_local` (C11)

각 스레드가 변수의 자체 복사본을 가진다:

```cpp
thread_local int tls_counter = 0;

void thread_func() {
    tls_counter++;    // 각 스레드가 자체 카운터를 가짐
    printf("Thread counter: %d\n", tls_counter);
}

// 스레드 1: tls_counter = 1
// 스레드 2: tls_counter = 1
// (독립적인 복사본)
```

사용 사례: 스레드별 캐시, 에러 코드 (`errno`는 일반적으로 스레드 로컬), 스레드 로컬 할당자.

---

## 링크 규칙 요약

### C 링크

| 선언 | 링크 |
|---|---|
| `int x;` (파일 스코프) | 외부 |
| `static int x;` (파일 스코프) | 내부 |
| `extern int x;` | 외부 |
| `void func();` | 외부 |
| `static void func();` | 내부 |
| `int x;` (블록 스코프) | 없음 |

### C++ 차이점

| 선언 | C 링크 | C++ 링크 |
|---|---|---|
| `const int x = 5;` (파일 스코프) | 외부 | **내부** |
| `inline` 함수 | 해당 없음 (C99: 복잡한 규칙) | 외부 |
| 익명 네임스페이스 멤버 | 해당 없음 | **내부** |

```cpp
// C++: 익명 네임스페이스 = static의 더 나은 대안
namespace {
    int internal_var = 42;       // 내부 링크
    void internal_func() { }    // 내부 링크
}
// C++에서 파일 스코프의 'static'보다 선호됨
```

---

## One Definition Rule (ODR)

- 모든 번역 단위에서 각 변수/함수의 **하나의 정의** (외부 링크의 경우)
- 내부 링크 엔티티는 번역 단위당 **하나의 정의**
- 예외: `inline` 함수/변수, 템플릿, `constexpr` 함수는 여러 동일한 정의 가능 (TU당 하나)

```cpp
// header.h — 잘못됨 (여러 .cpp에서 포함되면 다중 정의)
int global = 42;

// header.h — 올바른 옵션:
extern int global;                    // 선언만 (하나의 .cpp에서 정의)
inline int global = 42;              // C++17: 인라인 변수
constexpr int global = 42;           // constexpr는 내부 링크를 암시
static int global = 42;              // 내부 링크 (TU당 별도 복사)
```

### 정적 초기화 순서 문제

```cpp
// file1.cpp
int a = 10;

// file2.cpp
extern int a;
int b = a + 1;   // 위험: a가 아직 초기화되지 않았을 수 있음
```

번역 단위 간 전역 변수의 초기화 순서는 **불특정**이다. **Construct On First Use** 관용구로 수정:

```cpp
int& get_a() {
    static int a = 10;    // 첫 호출 시 초기화 보장
    return a;
}

int b = get_a() + 1;     // 안전
```

또는 C++20 `constinit` 사용:

```cpp
constinit int a = 10;    // 컴파일 타임 초기화 보장
```
