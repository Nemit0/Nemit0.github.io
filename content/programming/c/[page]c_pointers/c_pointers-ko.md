---
title: "C 포인터 연산"
description: "포인터 연산의 완벽 가이드 — 포인터 산술의 작동 원리, 타입 인식 특성, 배열 및 메모리 레이아웃과의 관계."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "포인터", "포인터 연산", "메모리", "배열"]
author: "Nemit"
featured: false
pinned: false
---

# C 포인터 연산

## 포인터란?

**포인터**는 메모리 주소를 저장하는 변수다. 값이 저장된 메모리 위치를 "가리킨다."

```c
int x = 42;
int *p = &x;    // p는 x의 주소를 보유

printf("주소: %p\n", (void *)p);   // 예: 0x7ffd5e8a3c4c
printf("값:   %d\n", *p);          // 42 (역참조)
```

`&x` — **주소 연산자**: x의 주소를 반환한다.
`*p` — **역참조 연산자**: p가 가지고 있는 주소의 값을 읽는다.

### 포인터 크기

포인터의 크기는 가리키는 타입이 아니라 아키텍처에 따라 결정된다:

| 아키텍처 | 포인터 크기 |
|---|---|
| 32비트 | 4바이트 |
| 64비트 | 8바이트 |

```c
printf("sizeof(int *):    %zu\n", sizeof(int *));     // 8 (64비트)
printf("sizeof(char *):   %zu\n", sizeof(char *));    // 8
printf("sizeof(double *): %zu\n", sizeof(double *));  // 8
```

모든 포인터 타입은 같은 플랫폼에서 동일한 크기를 가진다 — 모두 메모리 주소를 담고 있기 때문이다.

---

## 포인터 연산 기초

C는 포인터에 대한 정수 덧셈과 뺄셈을 허용한다. 핵심: **포인터 연산은 타입을 인식한다**. 포인터에 1을 더하면 1바이트가 아니라 `sizeof(*pointer)` 바이트만큼 이동한다.

```c
int arr[] = {10, 20, 30, 40, 50};
int *p = arr;       // p는 arr[0]을 가리킴

printf("%d\n", *p);        // 10
printf("%d\n", *(p + 1));  // 20  (sizeof(int) = 4바이트 이동)
printf("%d\n", *(p + 2));  // 30  (8바이트 이동)
```

### 왜 타입을 인식하는가?

배열은 요소를 메모리에 연속적으로 저장하기 때문이다. `int`가 4바이트라면:

```
주소:   0x100  0x104  0x108  0x10C  0x110
값:     [10]   [20]   [30]   [40]   [50]
인덱스:  [0]    [1]    [2]    [3]    [4]
```

`p + 1`은 "원시 주소에 1을 더한다"는 의미가 아니다. "다음 요소로 이동한다"는 의미다. 컴파일러가 `sizeof(int)`를 곱한다:

```
p + n  →  (char *)p + n * sizeof(*p)
```

`char *`의 경우 1을 더하면 1바이트 이동한다. `double *`의 경우 1을 더하면 8바이트 이동한다.

---

## 합법적인 포인터 연산

### 포인터에 정수 덧셈

```c
int *p = arr;
int *q = p + 3;     // arr[3]을 가리킴
```

### 포인터에서 정수 뺄셈

```c
int *q = &arr[4];
int *r = q - 2;     // arr[2]를 가리킴
```

### 두 포인터의 뺄셈

두 포인터가 같은 배열을 가리킬 때, 뺄셈은 바이트가 아닌 **요소** 수를 반환한다:

```c
int *start = &arr[0];
int *end = &arr[4];
ptrdiff_t diff = end - start;   // 4 (요소 수, 16바이트가 아님)
```

결과 타입은 `ptrdiff_t` (`<stddef.h>`의 부호 있는 정수 타입)이다.

### 증감 연산

```c
int *p = arr;
p++;        // arr[1]을 가리킴
p++;        // arr[2]를 가리킴
p--;        // arr[1]로 돌아감
```

### 비교

같은 배열 내의 포인터는 `<`, `>`, `<=`, `>=`, `==`, `!=`로 비교할 수 있다:

```c
int *p = &arr[1];
int *q = &arr[3];
if (p < q) {
    printf("p가 q보다 앞에 있음\n");   // 참
}
```

### 불법 연산

- **두 포인터 덧셈**: `p + q` — 의미 없음 (두 주소를 더한 것)
- **포인터 곱셈/나눗셈**: `p * 2`, `p / q` — 의미 없음
- **`void *`에 대한 포인터 연산**: `void *`는 타입 크기가 없음 — GCC는 확장으로 허용하지만 (`char *`로 취급) 표준에서는 정의되지 않음

---

## 포인터 연산과 배열

C에서 배열 이름은 대부분의 문맥에서 첫 번째 요소에 대한 포인터로 **감쇠(decay)**된다:

```c
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;           // arr이 &arr[0]으로 감쇠

// 다음은 동일하다:
arr[i]    ≡  *(arr + i)
&arr[i]   ≡  arr + i
p[i]      ≡  *(p + i)
```

**첨자 연산자** `[]`는 포인터 연산 + 역참조의 문법적 설탕이다.

더 이상한 점: 덧셈은 교환 법칙이 성립하므로 `arr[3]`은 `3[arr]`과 동일하다:

```c
printf("%d\n", 3[arr]);   // 40 — *(3 + arr) == *(arr + 3)이므로
```

실제 코드에서는 이렇게 작성하지 말 것.

### 배열 감쇠 예외

배열이 포인터로 감쇠되지 **않는** 경우:
- `sizeof(arr)` — 포인터가 아닌 전체 배열 크기를 반환
- `&arr` — `int *`가 아닌 **배열 타입** (`int (*)[5]`)에 대한 포인터를 반환
- 문자열 리터럴 초기화: `char str[] = "hello"`는 문자열을 복사

```c
int arr[5];
printf("sizeof(arr) = %zu\n", sizeof(arr));     // 20 (5 * 4바이트)
printf("sizeof(&arr[0]) = %zu\n", sizeof(&arr[0])); // 8 (포인터 크기)
```

---

## 포인터 연산을 이용한 반복

포인터 기반 반복은 클래식한 C 패턴이며, 인덱싱보다 효율적일 수 있다 (인덱스에 요소 크기를 곱하는 것을 피함):

```c
// 인덱스 기반 반복
for (int i = 0; i < n; i++) {
    process(arr[i]);
}

// 포인터 기반 반복
for (int *p = arr; p < arr + n; p++) {
    process(*p);
}

// 끝 포인터 사용 (STL 스타일)
int *begin = arr;
int *end = arr + n;    // 마지막 요소 다음
for (int *p = begin; p != end; p++) {
    process(*p);
}
```

"끝 다음(one past the end)" 포인터 (`arr + n`)는 생성하고 비교하는 것은 합법적이지만 역참조해서는 **안 된다**.

---

## 포인터의 포인터

**포인터의 포인터**는 포인터 변수의 주소를 저장한다:

```c
int x = 42;
int *p = &x;
int **pp = &p;

printf("%d\n", **pp);    // 42  (두 번 역참조)
```

일반적인 사용:
- **동적 2차원 배열**: `int **matrix` — 행에 대한 포인터의 배열
- **함수에서 포인터 수정**: `int *`가 가리키는 것을 변경하기 위해 `int **`를 전달

```c
void allocate(int **ptr, int size) {
    *ptr = malloc(size * sizeof(int));
}

int *arr = NULL;
allocate(&arr, 10);   // arr은 이제 할당된 메모리를 가리킴
```

- **main의 `argv`**: `char **argv` 또는 `char *argv[]` — 문자열 배열

---

## 함수 포인터

포인터는 함수를 가리킬 수 있다:

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

// 함수 포인터 선언
int (*op)(int, int);

op = add;
printf("%d\n", op(3, 4));   // 7

op = sub;
printf("%d\n", op(3, 4));   // -1
```

**함수 포인터 문법**: `반환타입 (*이름)(매개변수타입)`

함수 포인터는 다음을 가능하게 한다:
- **콜백**: 동작을 인수로 전달
- **디스패치 테이블**: 상태 머신을 위한 함수 포인터 배열
- **qsort 비교 함수**: `int (*compar)(const void *, const void *)`

```c
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    return (*(int *)a - *(int *)b);
}

int arr[] = {5, 2, 8, 1, 9};
qsort(arr, 5, sizeof(int), cmp);
// arr은 이제 {1, 2, 5, 8, 9}
```

### 가독성을 위한 Typedef

```c
typedef int (*BinaryOp)(int, int);

BinaryOp op = add;
printf("%d\n", op(10, 20));  // 30
```

---

## `void *` — 범용 포인터

`void *`는 어떤 데이터 타입의 주소도 담을 수 있다. C의 제네릭 프로그래밍 메커니즘이다:

```c
int x = 42;
double y = 3.14;

void *generic = &x;
printf("%d\n", *(int *)generic);     // 역참조 전 캐스트 필수

generic = &y;
printf("%f\n", *(double *)generic);
```

`void *`를 사용하는 것들:
- `malloc()` — `void *`를 반환
- `memcpy()`, `memset()` — 원시 바이트 단위로 동작
- `qsort()`, `bsearch()` — 범용 알고리즘

캐스트 없이는 `void *`를 역참조하거나 연산할 수 없다 (표준 C에서).

---

## 널 포인터

**널 포인터**는 아무것도 가리키지 않는다. 역참조하면 정의되지 않은 동작이다 (보통 세그폴트로 크래시):

```c
int *p = NULL;   // 또는: int *p = 0;
// *p = 42;      // 정의되지 않은 동작 — 세그폴트

if (p != NULL) {
    *p = 42;     // 안전
}
```

`NULL`은 C에서 `((void *)0)`으로 정의된다. C++11 이후에는 `nullptr`을 사용한다.

역참조 전 항상 널을 확인해야 한다, 특히:
- `malloc()` 반환값 (실패 시 NULL 반환)
- 선택적일 수 있는 함수 매개변수
- 연결 리스트 순회 (리스트의 끝)

---

## 일반적인 포인터 함정

### 댕글링 포인터

해제된 메모리나 스코프를 벗어난 메모리를 참조하는 포인터:

```c
int *p;
{
    int x = 42;
    p = &x;
}   // x가 스코프를 벗어남
// p는 이제 댕글링 — *p는 정의되지 않은 동작

// 또한:
int *q = malloc(sizeof(int));
*q = 10;
free(q);
// q는 이제 댕글링 — *q는 정의되지 않은 동작
q = NULL;   // 좋은 관행: free 후 NULL로 설정
```

### 버퍼 오버플로우

포인터 연산을 통해 배열 끝을 넘어 쓰기:

```c
int arr[5];
int *p = arr;
for (int i = 0; i <= 5; i++) {   // 버그: i < 5여야 함
    p[i] = i;                     // p[5]가 배열을 넘어 씀 — UB
}
```

### 초기화되지 않은 포인터

```c
int *p;        // 쓰레기 주소를 가리킴
*p = 42;       // 정의되지 않은 동작 — 임의 메모리에 쓰기
```

### 타입 불일치

```c
float f = 3.14;
int *p = (int *)&f;    // 기술적으로 정의되지 않은 동작 (엄격한 앨리어싱)
printf("%d\n", *p);     // 쓰레기 출력 (IEEE 754 비트를 int로 해석)
```

### 메모리 누수

```c
int *p = malloc(100 * sizeof(int));
p = malloc(200 * sizeof(int));   // 첫 번째 할당이 누수됨 — 해제할 방법 없음
```

---

## `restrict` 키워드 (C99)

`restrict` 한정자는 포인터가 가리키는 메모리에 접근하는 **유일한** 방법임을 컴파일러에 알려준다. 이로 인해 공격적인 최적화가 가능해진다:

```c
void add_arrays(int *restrict a, int *restrict b, int *restrict c, int n) {
    for (int i = 0; i < n; i++)
        c[i] = a[i] + b[i];
}
```

`restrict` 없이는 컴파일러가 `a`, `b`, `c`가 겹칠 수(alias) 있다고 가정하고 각 저장 후 값을 다시 로드해야 한다. `restrict`가 있으면 SIMD 명령어로 루프를 벡터화할 수 있다.

`memcpy()`는 `restrict`를 사용한다 (겹침 불허). `memmove()`는 사용하지 않는다 (겹침을 올바르게 처리하지만 느림).

---

## 포인터 연산과 `const`

포인터와 함께 사용하는 `const`는 위치에 따라 두 가지 의미를 갖는다:

```c
const int *p;       // const int에 대한 포인터: *p 수정 불가, p 변경 가능
int *const q;       // int에 대한 const 포인터: *q 수정 가능, q 변경 불가
const int *const r; // const int에 대한 const 포인터: 둘 다 수정 불가
```

오른쪽에서 왼쪽으로 읽기: `const int *p` — "p는 const인 int에 대한 포인터."

```c
int x = 10, y = 20;
const int *p = &x;
// *p = 30;      // 에러: p를 통해 수정 불가
p = &y;          // OK: p가 가리키는 것을 변경 가능

int *const q = &x;
*q = 30;         // OK: 값 수정 가능
// q = &y;       // 에러: q 자체를 변경 불가
```
