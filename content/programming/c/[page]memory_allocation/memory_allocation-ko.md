---
title: "C/C++ 메모리 할당 (malloc/free, new/delete)"
description: "C와 C++의 동적 메모리 관리 — malloc, calloc, realloc, free, new, delete의 작동 원리, 메모리 레이아웃, 일반적인 함정, 스마트 포인터."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "메모리", "malloc", "free", "new", "delete", "힙", "스마트 포인터"]
author: "Nemit"
featured: false
pinned: false
---

# C/C++ 메모리 할당

## 메모리 영역

C/C++ 프로그램은 네 가지 주요 메모리 영역을 가진다:

| 영역 | 내용 | 수명 | 성장 |
|---|---|---|---|
| **텍스트 (코드)** | 기계어 명령 | 프로그램 수명 | 고정 |
| **데이터/BSS** | 전역/정적 변수 | 프로그램 수명 | 고정 |
| **스택** | 지역 변수, 함수 프레임 | 함수 스코프 (자동) | 아래로 성장 |
| **힙** | 동적 할당된 메모리 | 명시적 해제까지 | 위로 성장 |

```
높은 주소
┌──────────────┐
│    스택       │ ← 아래로 성장
│      ↓        │
│              │
│      ↑        │
│    힙         │ ← 위로 성장
├──────────────┤
│  BSS (미초기화)│
├──────────────┤
│  데이터 (초기화)│
├──────────────┤
│    텍스트      │
└──────────────┘
낮은 주소
```

---

## 스택 vs 힙

| | 스택 | 힙 |
|---|---|---|
| **할당** | 자동 (컴파일러 관리) | 수동 (`malloc`/`new`) |
| **해제** | 자동 (스코프 종료) | 수동 (`free`/`delete`) |
| **속도** | 매우 빠름 (스택 포인터 이동만) | 느림 (할당자 부기) |
| **크기** | 제한적 (기본 ~1-8 MB) | 가용 RAM에 의해 제한 |
| **단편화** | 없음 (LIFO 순서) | 가능 |
| **스레드 안전** | 각 스레드가 자체 스택 보유 | 공유 (동기화 필요) |
| **접근 패턴** | LIFO만 가능 | 임의 접근 |

```c
void example() {
    int x = 10;                    // 스택: 자동 수명
    int *p = malloc(sizeof(int));  // 힙: 수동 수명
    *p = 20;
    free(p);                       // 수동으로 해제해야 함
}   // x는 함수 반환 시 자동으로 해제됨
```

---

## C 메모리 할당: malloc, calloc, realloc, free

### `malloc(size_t size)`

`size` 바이트의 **초기화되지 않은** 메모리를 할당한다. 할당된 블록에 대한 `void *`를 반환하고, 실패 시 `NULL`을 반환한다.

```c
#include <stdlib.h>

int *arr = malloc(10 * sizeof(int));
if (arr == NULL) {
    perror("malloc 실패");
    exit(1);
}

// arr[0]부터 arr[9]까지 사용
// 경고: 내용이 초기화되지 않음 (쓰레기 값)

free(arr);
```

**항상 NULL을 확인한다.** 메모리가 소진되면 `malloc`은 실패할 수 있다.

**항상 `sizeof`를 사용한다**, 크기를 하드코딩하지 말 것:

```c
// 좋음:
int *p = malloc(n * sizeof(int));
int *p = malloc(n * sizeof(*p));    // 더 좋음: 타입에 무관

// 나쁨:
int *p = malloc(n * 4);    // int가 4바이트라고 가정
```

### `calloc(size_t count, size_t size)`

`size` 바이트 크기의 `count`개 요소에 대한 메모리를 할당한다. 메모리를 **0으로 초기화**한다.

```c
int *arr = calloc(10, sizeof(int));
// arr[0]부터 arr[9]까지 모두 0
```

`calloc`은 `count * size`에서 정수 오버플로우도 검사한다 — `malloc(count * size)`보다 안전하다.

### `realloc(void *ptr, size_t new_size)`

이전에 할당된 블록의 크기를 조정한다. 제자리에서 확장할 수 없으면 데이터를 새 위치로 이동할 수 있다.

```c
int *arr = malloc(5 * sizeof(int));
// ... arr[0..4] 채우기 ...

int *tmp = realloc(arr, 10 * sizeof(int));
if (tmp == NULL) {
    // realloc 실패 — arr은 여전히 유효
    free(arr);
    exit(1);
}
arr = tmp;
// arr[0..4] 보존됨, arr[5..9] 초기화되지 않음
```

**중요 패턴**: 절대 `arr = realloc(arr, ...)`로 하지 말 것. `realloc`이 실패하면 NULL을 반환하고 원래 포인터를 잃어버린다 — 메모리 누수.

특수 경우:
- `realloc(NULL, size)` ≡ `malloc(size)`
- `realloc(ptr, 0)` — 구현 정의 (해제하거나 최소 블록을 반환)

### `free(void *ptr)`

`malloc`/`calloc`/`realloc`으로 할당된 메모리를 해제한다. `free` 후 포인터는 **댕글링** 상태 — 사용하면 안 된다.

```c
free(arr);
arr = NULL;    // 좋은 관행: 실수로 재사용하는 것을 방지
```

규칙:
- `malloc`/`calloc`/`realloc`으로 할당된 것만 `free`
- 스택 메모리, 전역 변수, 문자열 리터럴은 `free`하지 말 것
- 같은 포인터를 두 번 `free`하지 말 것 (**이중 해제** — 정의되지 않은 동작, 잠재적 보안 취약점)
- `free(NULL)`은 안전 (아무것도 하지 않음)

---

## malloc 내부 동작

`malloc`은 모든 할당마다 OS를 직접 호출하지 않는다. OS에서 얻은 더 큰 영역 내에서 사용 가능한 메모리 블록을 추적하는 **프리 리스트**를 유지한다.

### 일반적인 구현

1. 첫 번째 `malloc` 호출: `brk()` 또는 `mmap()`을 통해 OS에서 큰 청크 요청
2. 요청에 따라 청크를 블록으로 분할
3. 각 블록은 크기와 메타데이터를 포함하는 **헤더**를 가짐
4. `free`되면 블록이 프리 리스트에 다시 추가됨
5. 인접한 빈 블록은 단편화를 줄이기 위해 **병합**(coalesce)됨

```
헤더가 있는 메모리 레이아웃:
┌────────┬──────────┬────────┬──────────┬────────┬──────────┐
│ 헤더    │ 사용 중   │ 헤더   │  빈 공간  │ 헤더    │ 사용 중   │
│ (크기)  │  블록     │ (크기) │  블록     │ (크기)  │  블록     │
└────────┴──────────┴────────┴──────────┴────────┴──────────┘
```

### 할당 전략

| 전략 | 설명 | 트레이드오프 |
|---|---|---|
| **First Fit** | 리스트 스캔, 맞는 첫 번째 블록 사용 | 빠르지만 시작 부분에 단편화 유발 |
| **Best Fit** | 맞는 가장 작은 블록 찾기 | 낭비 적지만 스캔 느림 |
| **Worst Fit** | 가장 큰 가용 블록 사용 | 큰 나머지 블록을 남김 |
| **분리된 프리 리스트** | 크기 클래스별 별도 리스트 | 일반적인 크기에 빠름 (glibc 사용) |

glibc의 `malloc` (ptmalloc2)은 다음을 사용한다:
- **Fast bins**: 작은 할당 (≤ 80바이트) — 단일 연결 LIFO 캐시
- **Small bins**: 중간 할당 — 이중 연결, FIFO
- **Large bins**: 큰 할당 — 크기순 정렬
- **mmap**: 매우 큰 할당 (≥ 128 KB 기본) — OS에서 직접 매핑

### 메모리 오버헤드

각 `malloc` 블록은 헤더를 가진다 (64비트에서 일반적으로 8-16바이트). 1바이트를 할당하면 실제로 ~24-32바이트를 사용한다. 많은 작은 할당에서는 오버헤드가 지배적일 수 있다.

---

## C++ 메모리 할당: new, delete

### `new`와 `delete`

C++은 타입 안전하고 생성자/소멸자를 호출하는 `new`와 `delete` 연산자를 도입한다:

```cpp
// 단일 객체
int *p = new int(42);       // 할당 + 42로 초기화
delete p;                    // 해제

// 배열
int *arr = new int[10];      // 10개 int 배열 할당
delete[] arr;                // 배열에는 반드시 delete[] 사용

// 생성자/소멸자 호출
std::string *s = new std::string("hello");
delete s;                    // ~string() 소멸자 호출 후 메모리 해제
```

### `new` vs `malloc`

| 기능 | `malloc` (C) | `new` (C++) |
|---|---|---|
| 반환값 | `void *` (C++에서 캐스트 필요) | 올바른 타입 (캐스트 불필요) |
| 초기화 | 초기화 안 됨 | 생성자 호출 |
| 실패 | `NULL` 반환 | `std::bad_alloc` 예외 |
| 크기 | 수동 `sizeof` | 컴파일러가 크기 계산 |
| 해제 | `free()` | `delete` / `delete[]` |
| 오버로딩 | 불가 | 가능 (클래스별 또는 전역) |

```cpp
// C++에서 malloc: 캐스트 필요, 생성자 호출 안 됨
MyClass *obj = (MyClass *)malloc(sizeof(MyClass));
// obj->member는 쓰레기 — 생성자가 호출되지 않음
free(obj);  // 소멸자 호출 안 됨 — MyClass가 리소스를 소유하면 누수

// C++에서 new: 타입 안전, 생성자 호출
MyClass *obj = new MyClass(args);
delete obj;  // 소멸자 호출 후 메모리 해제
```

### 배치(Placement) `new`

할당 없이 **특정 메모리 주소**에 객체를 생성한다:

```cpp
#include <new>

char buffer[sizeof(MyClass)];
MyClass *obj = new (buffer) MyClass(args);  // buffer에 생성

// 소멸자를 수동으로 호출해야 함 (delete 안 됨 — new에서 온 메모리가 아님)
obj->~MyClass();
```

메모리 풀, 커스텀 할당자, 임베디드 시스템에서 사용된다.

### `new` 실패 처리

```cpp
// 기본: std::bad_alloc 예외 발생
try {
    int *p = new int[1000000000000];
} catch (std::bad_alloc &e) {
    std::cerr << "할당 실패: " << e.what() << std::endl;
}

// nothrow 버전: 대신 nullptr 반환
int *p = new (std::nothrow) int[1000000000000];
if (p == nullptr) {
    // 실패 처리
}
```

---

## C++ 스마트 포인터 (RAII)

원시 `new`/`delete`는 오류가 발생하기 쉽다. 현대 C++은 **RAII**(Resource Acquisition Is Initialization)를 통해 자동으로 메모리를 관리하는 **스마트 포인터**를 사용한다:

### `std::unique_ptr` (독점 소유권)

```cpp
#include <memory>

auto p = std::make_unique<int>(42);
// p가 int를 소유. p가 스코프를 벗어나면 int가 삭제됨.

std::unique_ptr<int[]> arr = std::make_unique<int[]>(10);
// 배열 버전

// 복사 불가 — 소유권은 독점적
// std::unique_ptr<int> q = p;   // 에러: 삭제된 복사 생성자

// 이동은 가능
std::unique_ptr<int> q = std::move(p);  // p는 이제 nullptr
```

### `std::shared_ptr` (공유 소유권)

```cpp
auto p = std::make_shared<int>(42);
auto q = p;    // p와 q 모두 int를 소유. 참조 카운트 = 2.

// p와 q 모두 스코프를 벗어나면 int가 삭제됨.
printf("use_count: %ld\n", p.use_count());  // 2
```

`shared_ptr`는 **참조 카운팅**을 사용한다. 복사할 때마다 카운트가 증가하고, 소멸자가 호출될 때마다 감소한다. 카운트가 0에 도달하면 객체가 삭제된다.

**비용**: 제어 블록을 위한 추가 할당 (참조 카운트), 복사/소멸 시 원자적 증가/감소.

### `std::weak_ptr` (비소유 관찰자)

```cpp
std::shared_ptr<int> sp = std::make_shared<int>(42);
std::weak_ptr<int> wp = sp;   // 참조 카운트를 증가시키지 않음

if (auto locked = wp.lock()) {
    // locked는 shared_ptr — 객체가 아직 살아있음
    printf("%d\n", *locked);
} else {
    // 객체가 파괴됨
}
```

`shared_ptr`가 메모리를 절대 해제하지 못하게 하는 순환 참조를 깨뜨린다.

### 0/3/5의 규칙

**0의 규칙**: 클래스가 리소스를 직접 관리하지 않으면 (스마트 포인터, 표준 컨테이너 사용), 특별한 멤버 함수를 작성할 필요가 없다.

**3의 규칙** (C++03): 소멸자, 복사 생성자, 복사 대입 연산자 중 하나를 정의하면, 아마 세 개 모두 필요하다.

**5의 규칙** (C++11): 이동 생성자와 이동 대입 연산자를 셋에 추가한다.

```cpp
// 0의 규칙 — 선호됨
class Modern {
    std::unique_ptr<int[]> data;
    std::string name;
    // 소멸자, 복사/이동 생성자, 대입 연산자 불필요
    // 컴파일러가 올바른 것을 자동으로 생성
};
```

---

## 일반적인 메모리 버그

### 메모리 누수

할당된 메모리가 절대 해제되지 않음:

```c
void leak() {
    int *p = malloc(1000);
    // ... p 사용 ...
    return;    // p가 절대 해제되지 않음 — 1000바이트 누수
}
```

탐지 도구: **Valgrind** (`valgrind --leak-check=full ./program`), **AddressSanitizer** (`-fsanitize=address`).

### Use After Free

해제 후 메모리에 접근:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
printf("%d\n", *p);   // 정의되지 않은 동작 — 42를 출력할 수도, 크래시할 수도 있음
```

### 이중 해제

같은 메모리를 두 번 해제:

```c
free(p);
free(p);   // 정의되지 않은 동작 — 힙 손상, 잠재적 악용
```

### 버퍼 오버플로우

할당된 범위를 넘어 쓰기:

```c
int *p = malloc(5 * sizeof(int));
p[5] = 99;    // 범위 초과 — 힙 메타데이터나 인접 데이터를 덮어씀
```

### 스택 오버플로우

스택 크기 제한 초과 (깊은 재귀, 큰 지역 배열):

```c
void recurse() { recurse(); }           // 무한 재귀 — 스택 오버플로우
void big() { int arr[10000000]; }       // 40 MB 지역 배열 — 오버플로우 가능
```

---

## 디버깅 도구

| 도구 | 탐지 | 사용법 |
|---|---|---|
| **Valgrind (memcheck)** | 누수, use-after-free, 초기화 안 된 읽기, 잘못된 읽기/쓰기 | `valgrind --leak-check=full ./prog` |
| **AddressSanitizer (ASan)** | 버퍼 오버플로우, use-after-free, 이중 해제, 누수 | `gcc -fsanitize=address -g` |
| **MemorySanitizer (MSan)** | 초기화되지 않은 메모리 읽기 | `clang -fsanitize=memory` |
| **UndefinedBehaviorSanitizer** | 널 역참조, 부호 있는 오버플로우 등 UB | `gcc -fsanitize=undefined` |

```bash
# AddressSanitizer로 컴파일
gcc -fsanitize=address -g -o program program.c
./program
# 소스 위치와 스택 트레이스로 에러 보고

# Valgrind (재컴파일 불필요, 하지만 느림)
valgrind --leak-check=full --show-leak-kinds=all ./program
```

---

## 메모리 정렬

현대 CPU는 데이터가 자연 경계에 **정렬**되었을 때 가장 효율적으로 메모리에 접근한다:

- `char`: 1바이트 정렬 (모든 주소)
- `short`: 2바이트 정렬 (2로 나누어지는 주소)
- `int`: 4바이트 정렬
- `double`: 8바이트 정렬
- 포인터: 4 또는 8바이트 정렬

구조체는 정렬을 유지하기 위해 컴파일러가 패딩을 추가한다:

```c
struct Padded {
    char a;     // 1바이트
    // 3바이트 패딩
    int b;      // 4바이트 (4바이트 정렬 필요)
    char c;     // 1바이트
    // 3바이트 패딩 (구조체 크기는 가장 큰 멤버 정렬의 배수여야 함)
};
// sizeof(struct Padded) = 12, 6이 아님

struct Packed {
    int b;      // 4바이트
    char a;     // 1바이트
    char c;     // 1바이트
    // 2바이트 패딩
};
// sizeof(struct Packed) = 8 — 재배치로 더 나은 레이아웃
```

`malloc`은 모든 표준 타입에 정렬된 메모리를 반환한다 (대부분의 64비트 시스템에서 최소 16바이트 정렬). 더 엄격한 정렬이 필요하면 (SIMD, 페이지 경계) `aligned_alloc()` (C11) 또는 `posix_memalign()`을 사용한다.
