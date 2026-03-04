---
title: "C에서 배열과 포인터"
description: "C에서 배열과 포인터의 관계 — 감쇠 규칙, 다차원 배열, 동적 배열, VLA, 그리고 흔한 오해."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "배열", "포인터", "메모리", "다차원 배열"]
author: "Nemit"
featured: false
pinned: false
---

# C에서 배열과 포인터

## 배열은 포인터가 아니다

흔한 오해: "C에서 배열과 포인터는 같은 것이다." **아니다.** 배열은 요소들의 연속된 블록이다. 포인터는 주소를 보유하는 변수다. **감쇠(decay)** 때문에 밀접하게 상호작용하지만, 근본적으로 다르다.

```c
int arr[5] = {10, 20, 30, 40, 50};
int *ptr = arr;   // arr이 &arr[0]으로 감쇠

// 다른 것임을 증명:
sizeof(arr);    // 20 (5 * sizeof(int))
sizeof(ptr);    // 8  (포인터의 크기)

// &arr의 타입은 int (*)[5] — 5개 int 배열에 대한 포인터
// &ptr의 타입은 int **     — int에 대한 포인터의 포인터
```

---

## 배열에서 포인터로의 감쇠

대부분의 표현식에서, 배열 이름은 첫 번째 요소에 대한 포인터로 암시적으로 변환(**감쇠**)된다:

```c
int arr[5];
int *p = arr;       // 감쇠: arr → &arr[0]
func(arr);          // 감쇠: 함수는 int *를 받음
arr + 2;            // 감쇠: &arr[0]에 대한 포인터 연산
```

### 감쇠가 일어나지 않는 경우

1. **`sizeof` 연산자**: 전체 배열 크기를 반환

```c
int arr[5];
sizeof(arr);        // 20 — 포인터가 아닌 배열의 크기
sizeof(arr[0]);     // 4  — 한 요소의 크기
int n = sizeof(arr) / sizeof(arr[0]);  // 5 — 요소 수
```

2. **주소 연산자 `&`**: 배열 타입에 대한 포인터를 생성

```c
int arr[5];
int *p = arr;       // 타입: int *       — int에 대한 포인터
int (*pa)[5] = &arr; // 타입: int (*)[5] — 5개 int 배열에 대한 포인터

// 둘 다 같은 주소를 가리키지만, 다른 타입:
printf("%p\n", (void *)p);    // 같은 주소
printf("%p\n", (void *)pa);   // 같은 주소
// 하지만:
p + 1;     // sizeof(int) = 4바이트 이동
pa + 1;    // sizeof(int[5]) = 20바이트 이동
```

3. **문자열 리터럴 초기화**: 문자열을 배열에 복사

```c
char str[] = "hello";   // 6개 char 배열 ('\0' 포함), 데이터 복사
char *ptr = "hello";    // 읽기 전용 메모리의 문자열 리터럴에 대한 포인터
```

4. **`_Alignof` / `alignof` 연산자** (C11)

---

## 첨자 연산자: `arr[i]` ≡ `*(arr + i)`

첨자 연산자는 포인터 연산으로 정의된다:

```
a[b]  ≡  *(a + b)
```

덧셈은 교환 법칙이 성립하므로:

```c
arr[3]  ≡  *(arr + 3)  ≡  *(3 + arr)  ≡  3[arr]
```

이것은 `arr`이 포인터로 감쇠되고, 포인터 + 정수가 잘 정의되어 있기 때문에 작동한다.

```c
int arr[5] = {10, 20, 30, 40, 50};
printf("%d\n", arr[2]);     // 30
printf("%d\n", *(arr + 2)); // 30
printf("%d\n", 2[arr]);     // 30 — 합법이지만 이렇게 쓰지 말 것
```

---

## 함수에 배열 전달

배열을 함수에 전달하면, **항상** 포인터로 감쇠된다. 함수는 배열의 크기에 대한 정보가 없다:

```c
// 이 세 선언은 동일하다:
void func(int arr[]);
void func(int arr[100]);    // 100은 무시됨
void func(int *arr);

// 크기를 별도로 전달해야 함:
void process(int *arr, int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
}

int data[] = {1, 2, 3, 4, 5};
process(data, 5);
```

### 배열 포인터 매개변수로 크기 보존

배열에 대한 포인터를 전달하여 크기를 보존할 수 있다:

```c
void func(int (*arr)[5]) {
    // (*arr)[i]로 요소에 접근
    for (int i = 0; i < 5; i++) {
        printf("%d ", (*arr)[i]);
    }
}

int data[5] = {1, 2, 3, 4, 5};
func(&data);       // OK
// int bad[3] = {1, 2, 3};
// func(&bad);     // 경고: 호환되지 않는 포인터 타입
```

### C99 가변 길이 배열 매개변수

```c
void process(int n, int arr[n]) {   // n이 arr보다 먼저 와야 함
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
}
```

`static` 한정자 (C99) — 배열이 최소 n개의 요소를 가진다고 보장:

```c
void process(int arr[static 5]) {
    // 5개 미만의 요소로 호출하면 컴파일러가 경고할 수 있음
    // 컴파일러 최적화 가능 (포인터가 비null, 최소 5개 요소)
}
```

---

## 다차원 배열

### 스택 할당 2차원 배열

2차원 배열은 연속된 메모리 블록이다 — "배열의 배열":

```c
int matrix[3][4] = {
    {1,  2,  3,  4},
    {5,  6,  7,  8},
    {9, 10, 11, 12}
};
```

메모리 레이아웃은 **행 우선(row-major)** (행이 연속으로 저장):

```
주소:  [0][0] [0][1] [0][2] [0][3] [1][0] [1][1] [1][2] [1][3] [2][0] ...
값:       1      2      3      4      5      6      7      8      9   ...
오프셋:   0      4      8     12     16     20     24     28     32   ...
```

접근: `matrix[i][j]` ≡ `*(*(matrix + i) + j)` ≡ `*((int *)matrix + i * 4 + j)`

### 2차원 배열의 포인터 감쇠

```c
int matrix[3][4];

// matrix는 int (*)[4]로 감쇠 — 4개 int 배열에 대한 포인터
int (*row_ptr)[4] = matrix;

// row_ptr[i]는 i번째 행 (4개 int의 배열)
// row_ptr[i][j]는 요소 [i][j]에 접근
```

### 함수에 2차원 배열 전달

첫 번째를 제외한 모든 차원을 지정해야 한다:

```c
void print_matrix(int mat[][4], int rows) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < 4; j++)
            printf("%d ", mat[i][j]);
}

// 또는 동등하게:
void print_matrix(int (*mat)[4], int rows);
```

### 동적 2차원 배열

**방법 1: 포인터 배열** (행이 다른 길이를 가질 수 있음)

```c
int **matrix = malloc(rows * sizeof(int *));
for (int i = 0; i < rows; i++)
    matrix[i] = malloc(cols * sizeof(int));

// 접근: matrix[i][j]
// 메모리: 행 간 연속적이지 않음

// 해제:
for (int i = 0; i < rows; i++)
    free(matrix[i]);
free(matrix);
```

**방법 2: 단일 연속 블록** (더 나은 캐시 성능)

```c
int *matrix = malloc(rows * cols * sizeof(int));

// 접근: matrix[i * cols + j]

free(matrix);
```

**방법 3: 연속 블록 + 행 포인터** (양쪽의 장점)

```c
int **matrix = malloc(rows * sizeof(int *));
matrix[0] = malloc(rows * cols * sizeof(int));
for (int i = 1; i < rows; i++)
    matrix[i] = matrix[0] + i * cols;

// 접근: matrix[i][j]  — 이중 첨자 사용
// 메모리: 연속적      — 좋은 캐시 성능

free(matrix[0]);
free(matrix);
```

---

## 가변 길이 배열 (VLA) — C99

VLA는 런타임에 결정되는 크기의 스택 할당 배열을 허용한다:

```c
void func(int n) {
    int arr[n];          // 런타임에 크기 결정
    for (int i = 0; i < n; i++)
        arr[i] = i * i;
}
```

### VLA 특성

- **스택**에 할당 (`malloc` 없음, `free` 없음)
- 생성 후 크기 고정 (크기 변경 불가)
- 초기화자를 가질 수 없음
- `sizeof`가 **런타임**에 평가됨 (컴파일 타임이 아님)
- 스코프는 둘러싸는 블록

### VLA 위험

- **스택 오버플로우**: 크기 검사 없음 — 큰 `n`이면 스택 오버플로우 가능
- **C11에서 선택적**: 컴파일러가 지원하지 않을 수 있음 (`__STDC_NO_VLA__`)
- **C++에 없음**: C++은 VLA를 채택하지 않음 (`std::vector` 사용)
- **alloca()**: 유사한 위험 — 런타임 크기로 스택에 할당

```c
// 위험:
void bad(size_t n) {
    int arr[n];   // n = 10000000이면, 스택 오버플로우
}

// 더 안전한 대안:
void good(size_t n) {
    int *arr = malloc(n * sizeof(int));
    if (!arr) return;
    // ... arr 사용 ...
    free(arr);
}
```

---

## 포인터 배열 vs 배열 포인터

비슷해 보이지만 매우 다르다:

```c
int *arr_of_ptrs[5];      // int에 대한 포인터 5개의 배열
int (*ptr_to_arr)[5];     // 5개 int 배열에 대한 포인터
```

선언 읽기: **오른쪽-왼쪽 규칙** 또는 **시계 방향/나선 규칙** 사용:

```
int *arr[5]:
  arr          — 은
  [5]          — 5개의 배열
  *            — 포인터들의
  int          — int에 대한

int (*ptr)[5]:
  ptr          — 은
  *            — 포인터
  [5]          — 5개의 배열에 대한
  int          — int
```

### 문자열 배열 (포인터 배열)

```c
const char *months[] = {
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
};
// months[0]은 "January"에 대한 포인터 (문자열 리터럴)
// 각 문자열은 다른 길이일 수 있음
```

### 비교

```c
int arr[3][4];         // 3×4 행렬, 48바이트 연속
int *ptrs[3];          // 3개 포인터, 행이 메모리 어디에나 있을 수 있음

int (*p)[4] = arr;     // p는 첫 번째 행을 가리킴
p++;                   // p는 이제 두 번째 행을 가리킴 (16바이트 이동)

int **pp = ptrs;       // pp는 첫 번째 포인터를 가리킴
pp++;                  // pp는 이제 두 번째 포인터를 가리킴 (8바이트 이동)
```

---

## 복합 리터럴 (C99)

익명 배열과 구조체를 인라인으로 생성:

```c
// 배열 리터럴을 함수에 전달
process((int[]){1, 2, 3, 4, 5}, 5);

// 익명 배열에 대한 포인터
int *p = (int[]){10, 20, 30};
p[1] = 99;   // OK — 복합 리터럴은 수정 가능 (문자열 리터럴과 달리)

// 파일 스코프: 정적 저장 기간
// 블록 스코프: 자동 저장 기간 (지역 변수와 동일)
```

---

## `char` 배열 vs `char *`

```c
char arr[] = "hello";    // 스택의 6개 char 배열, 변경 가능
char *ptr = "hello";     // .rodata의 문자열 리터럴에 대한 포인터, 변경 불가

arr[0] = 'H';           // OK — 스택 배열 수정
// ptr[0] = 'H';        // 정의되지 않은 동작 — 문자열 리터럴 수정

sizeof(arr);             // 6 (배열 크기, '\0' 포함)
sizeof(ptr);             // 8 (포인터 크기)

strlen(arr);             // 5 (문자열 길이, '\0' 제외)
strlen(ptr);             // 5
```

문자열 리터럴은 **정적 저장 기간**을 가지며 읽기 전용 메모리에 저장될 수 있다. 동일한 여러 문자열 리터럴이 같은 주소를 공유할 수 있다 (구현 정의).

---

## 지명 초기화자 (C99)

배열의 특정 요소를 초기화:

```c
int arr[10] = {
    [0] = 1,
    [5] = 50,
    [9] = 99
};
// arr = {1, 0, 0, 0, 0, 50, 0, 0, 0, 99}

// 범위 초기화자 (GCC 확장):
int arr[10] = {[3 ... 7] = 42};
// arr = {0, 0, 0, 42, 42, 42, 42, 42, 0, 0}
```

구조체의 경우:

```c
struct Point p = {.y = 4.0, .x = 3.0};   // 순서 상관없음
```
