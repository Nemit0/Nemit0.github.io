---
title: "C++ 참조 vs 포인터"
description: "C++에서 참조와 포인터의 상세 비교 — 의미론, 메모리 모델, 사용 사례, const 참조, rvalue 참조, 그리고 모범 사례."
date: "2026-03-04"
category: "programming/c"
tags: ["C++", "참조", "포인터", "rvalue 참조", "이동 의미론"]
author: "Nemit"
featured: false
pinned: false
---

# C++ 참조 vs 포인터

## 근본적인 차이

| 기능 | 포인터 | 참조 |
|---|---|---|
| **문법** | `int *p = &x;` | `int &r = x;` |
| **널 가능** | 예 (`nullptr`) | 아니오 — 반드시 객체에 바인딩 |
| **재바인딩** | 가능 (`p = &y;`) | 불가 — 수명 동안 바인딩 |
| **간접 참조** | 명시적 (`*p`, `p->m`) | 암시적 (객체처럼 사용) |
| **연산** | 가능 (`p + 1`, `p++`) | 불가 |
| **sizeof** | 포인터 크기 (64비트에서 8바이트) | 참조된 객체의 크기 |
| **주소** | `&p` = 포인터 변수의 주소 | `&r` = 참조된 객체의 주소 |
| **다중 레벨** | `int **pp;` | 참조의 참조 없음 |
| **배열** | `int *arr[10]` (포인터 배열) | `int &arr[10]`은 불법 |

```cpp
int x = 10;
int y = 20;

int *p = &x;    // p는 x를 가리킴
p = &y;          // p는 이제 y를 가리킴 — 재바인딩
*p = 30;         // y가 이제 30

int &r = x;      // r은 x다 (별칭)
// int &r2;      // 에러: 반드시 초기화해야 함
r = 50;          // x가 이제 50
// r을 y에 재바인딩할 수 없음
```

---

## 참조의 내부 동작

C++ 표준은 참조가 객체가 아니라 **별칭**이라고 한다. 그러나 컴파일러는 일반적으로 참조를 **const 포인터** (재설정할 수 없는 포인터)로 구현한다:

```cpp
int x = 42;
int &r = x;
r = 100;

// 컴파일러가 생성하는 것과 동등할 수 있음:
int x = 42;
int *const __r = &x;
*__r = 100;
```

함수 매개변수와 반환값에서 참조는 일반적으로 ABI 수준에서 포인터로 전달된다. 지역 변수에 대한 지역 참조의 경우 컴파일러가 간접 참조를 완전히 최적화할 수 있다.

---

## lvalue 참조

**lvalue 참조** (`T &`)는 lvalue — 지속적인 주소를 가진 명명된 객체에 바인딩된다:

```cpp
int x = 10;
int &ref = x;       // OK: x는 lvalue

// int &ref2 = 42;  // 에러: 42는 rvalue (임시)
```

### 참조로 전달

복사를 피하고 원본 수정을 허용한다:

```cpp
void swap(int &a, int &b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int x = 1, y = 2;
swap(x, y);    // x=2, y=1 — 포인터 필요 없음
```

포인터 버전과 비교:

```cpp
void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

swap(&x, &y);   // 호출자가 주소를 전달해야 함
```

참조가 더 깔끔하다: `*` 역참조 없음, 호출 시 `&` 없음, 널 검사 불필요.

### 참조로 반환

참조 반환은 복사를 피하고 호출자가 원본을 수정할 수 있게 한다:

```cpp
int& at(std::vector<int> &v, size_t i) {
    return v[i];
}

std::vector<int> v = {10, 20, 30};
at(v, 1) = 99;   // v는 이제 {10, 99, 30}
```

**절대 지역 변수에 대한 참조를 반환하지 말 것:**

```cpp
int& bad() {
    int x = 42;
    return x;      // 정의되지 않은 동작 — 함수 반환 시 x가 파괴됨
}
```

---

## const 참조

`const` 참조 (`const T &`)는 다음에 바인딩할 수 있다:
- lvalue
- rvalue (임시값)
- 다른 타입의 값 (암시적 변환 포함)

```cpp
int x = 10;
const int &r1 = x;       // OK: lvalue
const int &r2 = 42;      // OK: rvalue — 수명 연장
const int &r3 = x + 1;   // OK: 임시값 — 수명 연장

// r1 = 20;  // 에러: const 참조를 통해 수정 불가
```

### 수명 연장

`const` 참조가 임시값에 바인딩되면, 임시값의 수명이 참조의 수명과 일치하도록 **연장**된다:

```cpp
const std::string &s = std::string("hello");
// 임시 문자열이 's'가 스코프 내에 있는 동안 살아있음
std::cout << s << "\n";   // 안전
```

함수 호출을 통해서는 작동하지 **않는다**:

```cpp
const std::string& identity(const std::string &s) { return s; }
const std::string &bad = identity(std::string("hello"));
// 임시값이 전체 표현식 끝에서 파괴됨 — bad는 댕글링
```

### const 참조로 전달

복사 없이 큰 객체를 전달하는 가장 일반적인 방법:

```cpp
void print(const std::string &s) {
    std::cout << s << "\n";
    // s를 읽을 수 있지만 수정할 수 없음
}

print("hello");                // const char*에서 string으로 암시적 변환
print(std::string("world"));   // rvalue가 const ref에 바인딩
std::string msg = "foo";
print(msg);                    // lvalue가 const ref에 바인딩
```

**경험법칙**: 복사 비용이 적은 타입 (`int`, `double`, `char`, 작은 구조체)은 값으로 전달, 그 외 모든 것은 `const &`로 전달.

---

## rvalue 참조 (C++11)

**rvalue 참조** (`T &&`)는 rvalue — 곧 파괴될 임시값에 바인딩된다. 이는 **이동 의미론**을 가능하게 한다.

```cpp
int &&rr = 42;           // OK: rvalue에 바인딩
std::string &&sr = std::string("temp");  // OK

int x = 10;
// int &&rr2 = x;        // 에러: x는 lvalue
int &&rr2 = std::move(x); // OK: std::move가 lvalue를 rvalue로 캐스트
```

### 이동 의미론

이동 의미론은 복사 대신 곧 파괴될 객체에서 리소스를 훔칠 수 있게 한다:

```cpp
class Buffer {
    int *data_;
    size_t size_;
public:
    // 복사 생성자 — 비쌈 (할당 + 복사)
    Buffer(const Buffer &other) : size_(other.size_) {
        data_ = new int[size_];
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // 이동 생성자 — 저렴 (포인터 훔치기)
    Buffer(Buffer &&other) noexcept
        : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;   // 소스를 유효한 상태로 남김
        other.size_ = 0;
    }

    // 이동 대입
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
Buffer b = std::move(a);   // 이동: b가 a의 데이터를 훔침. a는 이제 비어있음.
```

### `std::move`

`std::move`는 실제로 아무것도 이동하지 않는다 — `T &&`로의 캐스트일 뿐이다. 실제 이동은 rvalue 참조가 이동 생성자나 이동 대입에 사용될 때 발생한다:

```cpp
template <typename T>
constexpr std::remove_reference_t<T>&& move(T&& t) noexcept {
    return static_cast<std::remove_reference_t<T>&&>(t);
}
```

`std::move` 후 소스 객체는 **유효하지만 불특정 상태**에 있다. 재할당하거나 파괴할 수 있지만, 값을 읽어서는 안 된다.

---

## 전달 참조 (유니버설 참조)

템플릿 문맥에서 `T &&`는 rvalue 참조가 아니라 **전달 참조**다:

```cpp
template <typename T>
void wrapper(T &&arg) {
    // arg는 전달된 것에 따라 lvalue ref 또는 rvalue ref일 수 있음
    inner(std::forward<T>(arg));   // 완벽한 전달
}

int x = 10;
wrapper(x);     // T = int&,  arg는 int& (lvalue 참조)
wrapper(42);    // T = int,   arg는 int&& (rvalue 참조)
```

### 참조 축소 규칙

참조가 템플릿이나 typedef를 통해 결합될 때:

| 조합 | 결과 |
|---|---|
| `T& &` | `T&` |
| `T& &&` | `T&` |
| `T&& &` | `T&` |
| `T&& &&` | `T&&` |

lvalue 참조가 항상 이긴다 — 양쪽 모두 rvalue 참조일 때만 결과가 rvalue 참조다.

### `std::forward` (완벽한 전달)

`std::forward<T>(arg)`는 원래 인수의 값 카테고리를 보존한다:

```cpp
template <typename T>
void factory(T &&arg) {
    // forward 없이: arg는 항상 lvalue (이름이 있으므로)
    // forward 사용: 호출자가 lvalue를 전달했는지 rvalue를 전달했는지 보존
    auto obj = MyClass(std::forward<T>(arg));
}
```

이는 제네릭 코드에서 불필요한 복사를 피하는 데 중요하다 (예: `std::make_unique`, `emplace_back`).

---

## 멤버 포인터

C++에는 멤버에 대한 포인터가 있다 — 참조에는 없는 기능:

```cpp
struct S {
    int x;
    int y;
    void print() { std::cout << x << ", " << y << "\n"; }
};

// 데이터 멤버 포인터
int S::*pm = &S::x;
S s{10, 20};
std::cout << s.*pm << "\n";    // 10 (멤버 포인터를 통해 x 접근)
pm = &S::y;
std::cout << s.*pm << "\n";    // 20

// 멤버 함수 포인터
void (S::*pmf)() = &S::print;
(s.*pmf)();                     // s.print() 호출

// 객체 포인터를 통해
S *sp = &s;
std::cout << sp->*pm << "\n";
(sp->*pmf)();
```

---

## 스마트 포인터: 참조 같은 의미론에 포인터의 유연성

스마트 포인터는 포인터의 유연성 (널 가능, 재바인딩, 힙 할당)과 자동 리소스 관리를 결합한다:

```cpp
// unique_ptr: 독점 소유권
auto up = std::make_unique<Widget>();
up->doWork();         // 화살표 연산자, 원시 포인터처럼
Widget &ref = *up;    // 역참조하여 참조 획득

// shared_ptr: 공유 소유권
auto sp = std::make_shared<Widget>();
auto sp2 = sp;        // 참조 카운트 증가
```

| 기능 | 원시 포인터 | 스마트 포인터 | 참조 |
|---|---|---|---|
| 널 가능 | 예 | 예 | 아니오 |
| 재바인딩 | 예 | 예 | 아니오 |
| 리소스 소유 | 아니오 | 예 | 아니오 |
| 자동 정리 | 아니오 | 예 | 해당 없음 |
| 컨테이너 저장 | 예 | 예 | 아니오 (`std::reference_wrapper` 사용) |

---

## `std::reference_wrapper`

참조는 컨테이너에 저장할 수 없으므로, `std::reference_wrapper`가 복사 가능하고 대입 가능한 래퍼를 제공한다:

```cpp
#include <functional>

int a = 1, b = 2, c = 3;
std::vector<std::reference_wrapper<int>> refs = {a, b, c};

for (int &val : refs) {
    val *= 10;
}
// a=10, b=20, c=30
```

`std::bind`와 `std::thread`에서 참조를 전달할 때도 사용된다:

```cpp
void increment(int &x) { x++; }

int val = 0;
std::thread t(increment, std::ref(val));
t.join();
// val = 1
```

---

## 각각의 사용 시점

| 상황 | 사용 |
|---|---|
| 항상 기존 객체를 참조, 절대 null이 아님 | 참조 |
| null일 수 있거나 재설정 필요 | 포인터 |
| 함수 매개변수 (읽기 전용, 큰 객체) | `const T &` |
| 함수 매개변수 (원본 수정) | `T &` |
| 함수 매개변수 (싱크 — 이동할 것) | `T` (값) 또는 `T &&` |
| 선택적 값 (현대 C++) | `std::optional<T>` |
| 소유권이 있는 힙 할당 | `std::unique_ptr<T>` |
| 공유 소유권 | `std::shared_ptr<T>` |
| 완벽한 전달이 필요한 제네릭 코드 | `T &&` (전달 참조) |
| 포인터 연산 필요 | 원시 포인터 |
| C API 상호 운용 | 원시 포인터 |
| 다형적 타입 (기본 클래스 통해) | 기본 클래스에 대한 포인터 또는 참조 |
