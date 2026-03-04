---
title: "C와 C++의 문자열 처리"
description: "C와 C++에서 문자열이 작동하는 방식 — 널 종료 C 문자열, 문자열 함수, 버퍼 오버플로우, std::string, string_view, SSO, 인코딩."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "문자열", "문자열 처리", "버퍼 오버플로우", "std::string"]
author: "Nemit"
featured: false
pinned: false
---

# C와 C++의 문자열 처리

## C 문자열: 널 종료 문자 배열

C에는 문자열 타입이 없다. "문자열"은 널 바이트(`'\0'`, 값 0)로 종료되는 `char` 배열이다:

```c
char str[] = "hello";
// 동등: char str[] = {'h', 'e', 'l', 'l', 'o', '\0'};
// sizeof(str) = 6 (널 종료자 포함)
// strlen(str) = 5 (널 종료자 제외)
```

메모리 레이아웃:

```
인덱스:  [0]  [1]  [2]  [3]  [4]  [5]
값:      'h'  'e'  'l'  'l'  'o'  '\0'
ASCII:    72  101  108  108  111    0
```

모든 문자열 함수는 널 종료자에 의존한다. `'\0'`이 없으면 함수가 0 바이트를 찾을 때까지 버퍼를 넘어 읽는다 — **버퍼 오버리드** (정의되지 않은 동작).

---

## 문자열 리터럴

```c
char *ptr = "hello";     // 문자열 리터럴에 대한 포인터 — 읽기 전용 섹션에 저장
char arr[] = "hello";    // 배열 — 리터럴을 스택에 복사 (변경 가능)

// ptr[0] = 'H';         // UB: 문자열 리터럴 수정
arr[0] = 'H';           // OK: 지역 배열 수정
```

인접한 문자열 리터럴은 컴파일 시 연결된다:

```c
char *msg = "Hello, "
            "world!";     // "Hello, world!"와 동일
```

### 이스케이프 시퀀스

| 이스케이프 | 의미 | 값 |
|---|---|---|
| `\0` | 널 종료자 | 0 |
| `\n` | 줄바꿈 | 10 |
| `\t` | 탭 | 9 |
| `\\` | 백슬래시 | 92 |
| `\"` | 큰따옴표 | 34 |
| `\xHH` | 16진 바이트 | 가변 |
| `\ooo` | 8진 바이트 | 가변 |

---

## 필수 C 문자열 함수 (`<string.h>`)

### 길이

```c
size_t strlen(const char *s);
// '\0' 전까지의 문자 수를 반환. O(n) — 널 바이트까지 스캔.

strlen("hello");    // 5
strlen("");         // 0
```

### 복사

```c
char *strcpy(char *dest, const char *src);
// '\0'을 포함하여 src를 dest에 복사. 안전하지 않음 — 범위 검사 없음.

char buf[10];
strcpy(buf, "hello");       // OK: 10바이트 버퍼에 6바이트
// strcpy(buf, "very long string");  // 버퍼 오버플로우

// 안전한 대안:
char *strncpy(char *dest, const char *src, size_t n);
// 최대 n바이트를 복사. 경고: src >= n바이트이면 널 종료하지 않을 수 있음.

strncpy(buf, "hello", sizeof(buf));
buf[sizeof(buf) - 1] = '\0';    // 항상 수동으로 널 종료

// 최선의 대안 (POSIX / C23):
size_t strlcpy(char *dest, const char *src, size_t size);
// 항상 널 종료. strlen(src)를 반환 — 잘림 감지 가능.
```

### 연결

```c
char *strcat(char *dest, const char *src);
// dest 끝에 src를 추가. 안전하지 않음.

char buf[20] = "hello";
strcat(buf, ", world");    // buf = "hello, world"

// 안전한 대안:
char *strncat(char *dest, const char *src, size_t n);
// 최대 n개 문자를 추가한 후 '\0' 추가.

// 최선의 대안 (POSIX / C23):
size_t strlcat(char *dest, const char *src, size_t size);
```

### 비교

```c
int strcmp(const char *s1, const char *s2);
// 반환: s1 < s2이면 <0, 같으면 0, s1 > s2이면 >0
// 사전순 비교 (바이트별, unsigned).

strcmp("abc", "abc");    // 0
strcmp("abc", "abd");    // < 0
strcmp("abd", "abc");    // > 0

int strncmp(const char *s1, const char *s2, size_t n);
// 최대 n개 문자를 비교.
```

### 검색

```c
char *strchr(const char *s, int c);
// c의 첫 번째 출현에 대한 포인터, 또는 NULL.

char *strrchr(const char *s, int c);
// c의 마지막 출현에 대한 포인터, 또는 NULL.

char *strstr(const char *haystack, const char *needle);
// haystack에서 needle의 첫 번째 출현에 대한 포인터, 또는 NULL.

char str[] = "hello world";
char *p = strchr(str, 'o');     // "o world"를 가리킴
char *q = strstr(str, "world"); // "world"를 가리킴
```

### 토큰화

```c
char *strtok(char *str, const char *delim);
// 구분자로 문자열을 분리. 원본 문자열을 수정.
// 스레드 안전하지 않음 (내부 상태 사용).

char str[] = "one,two,,three";
char *tok = strtok(str, ",");
while (tok) {
    printf("[%s]\n", tok);
    tok = strtok(NULL, ",");   // NULL은 마지막 위치에서 계속
}
// 출력: [one] [two] [three]  (빈 토큰은 건너뜀)

// 스레드 안전 대안:
char *strtok_r(char *str, const char *delim, char **saveptr);
```

### 메모리 연산

원시 바이트 조작용 (문자열뿐 아니라 모든 데이터에 작동):

```c
void *memcpy(void *dest, const void *src, size_t n);
// n바이트를 복사. src와 dest가 겹치면 안 됨.

void *memmove(void *dest, const void *src, size_t n);
// n바이트를 복사. 겹치는 영역을 올바르게 처리.

int memcmp(const void *s1, const void *s2, size_t n);
// n바이트를 비교. 임의 메모리를 위한 strcmp.

void *memset(void *s, int c, size_t n);
// n바이트를 값 c로 설정 (unsigned char로 변환).

void *memchr(const void *s, int c, size_t n);
// n바이트에서 바이트 c의 첫 번째 출현을 찾음.
```

---

## 포맷 문자열: `sprintf`와 `snprintf`

```c
char buf[100];

// 안전하지 않음 — 범위 검사 없음
sprintf(buf, "이름: %s, 나이: %d", "Alice", 30);

// 안전함 — 출력을 n-1개 문자 + '\0'으로 제한
int ret = snprintf(buf, sizeof(buf), "이름: %s, 나이: %d", "Alice", 30);
// '\0'을 제외하고 작성되었을 문자 수를 반환
// ret >= sizeof(buf)이면, 출력이 잘림
```

### 포맷 문자열 취약점

절대 사용자 입력을 포맷 문자열로 전달하지 말 것:

```c
char *user_input = get_input();
printf(user_input);                 // 취약 — 사용자가 %x, %n으로 공격 가능
printf("%s", user_input);           // 안전 — 사용자 입력이 데이터로 처리됨
```

`%n` 포맷 지정자는 메모리에 **쓴다** — 고전적인 악용 벡터. `-Wformat-security` 컴파일러 플래그를 사용하라.

---

## 일반적인 문자열 버그

### 버퍼 오버플로우

```c
char buf[8];
strcpy(buf, "this is way too long");   // buf를 넘어 덮어씀
// 인접 스택 변수, 반환 주소 등을 손상
// 고전적 악용: 반환 주소를 덮어써 임의 코드 실행
```

예방: 항상 범위 제한 함수 사용 (`strncpy`, `snprintf`, `strlcpy`).

### Off-by-One 에러

```c
char buf[5];
strncpy(buf, "hello", 5);
// buf = {'h', 'e', 'l', 'l', 'o'} — 널 종료자 없음!
printf("%s", buf);   // '\0'을 찾아 버퍼를 넘어 읽음
```

### 누락된 널 종료자

```c
char buf[5];
buf[0] = 'h';
buf[1] = 'i';
// buf[2]부터 buf[4]는 초기화되지 않음
printf("%s", buf);   // 0 바이트를 찾을 때까지 쓰레기를 읽음
```

### 읽기 전용 문자열 수정

```c
char *s = "hello";
s[0] = 'H';          // 정의되지 않은 동작 — 문자열 리터럴은 읽기 전용
```

---

## 문자열 변환 함수

```c
#include <stdlib.h>

// 문자열을 숫자로:
int atoi(const char *s);           // "123" → 123 (에러 검사 없음)
long strtol(const char *s, char **endptr, int base);  // 더 나음: 에러 검사 있음

long val = strtol("  42abc", &end, 10);
// val = 42, *end = "abc"

double strtod(const char *s, char **endptr);
// "3.14" → 3.14

// 숫자를 문자열로:
snprintf(buf, sizeof(buf), "%d", 42);     // int를 문자열로
snprintf(buf, sizeof(buf), "%.2f", 3.14); // double을 문자열로
```

항상 `atoi`/`atof` 대신 `strtol`/`strtod`를 선호:
- `atoi`는 에러 시 0을 반환 — `atoi("0")`과 구분 불가
- `strtol`은 `errno`를 설정하고 검증을 위한 끝 포인터를 제공

---

## C++ `std::string`

C++은 `std::string`을 제공한다 — 동적, 안전, RAII 관리 문자열:

```cpp
#include <string>

std::string s = "hello";
s += ", world";              // 자동 크기 조정
s.append("!");               // 추가
std::cout << s.size();       // 13 (널 제외 길이)
std::cout << s[0];           // 'h' (범위 검사 없음)
std::cout << s.at(0);       // 'h' (범위 검사 — 범위 초과 시 예외)
```

### 주요 연산

```cpp
std::string s = "Hello, World!";

// 부분 문자열
s.substr(7, 5);          // "World"

// 찾기
s.find("World");          // 7 (위치)
s.find("xyz");            // std::string::npos

// 교체
s.replace(7, 5, "C++");  // "Hello, C++!"

// 삽입/삭제
s.insert(5, " there");   // "Hello there, C++!"
s.erase(5, 6);           // "Hello, C++!"

// 비교
s == "Hello, C++!";      // true
s < "Zzzz";              // true (사전순)

// C 문자열 상호 운용
const char *cstr = s.c_str();   // 널 종료 C 문자열
const char *data = s.data();    // C++11 이후 c_str()과 동일
```

### 메모리 모델

`std::string`은 내부적으로 힙 할당 버퍼를 관리한다:

```cpp
struct string_internals {  // 간략화
    char *data;
    size_t size;       // 현재 길이
    size_t capacity;   // 할당된 용량
};
```

- `size()` — 현재 문자 수
- `capacity()` — 할당된 버퍼 크기 (size보다 클 수 있음)
- `reserve(n)` — 용량 사전 할당 (재할당 방지)
- `shrink_to_fit()` — 용량을 size에 맞추는 요청

```cpp
std::string s;
s.reserve(1000);         // 1000개 문자에 대해 사전 할당
for (int i = 0; i < 1000; i++)
    s += 'x';            // 재할당 없음 — 이미 예약됨
```

### 작은 문자열 최적화 (SSO)

대부분의 `std::string` 구현은 짧은 문자열을 **객체 자체 내부에** 저장하여 힙 할당을 피한다:

```cpp
// 일반적인 SSO 임계값: 15-22바이트 (구현에 따라 다름)
std::string short_str = "hello";      // 인라인 저장 — 힙 할당 없음
std::string long_str = "this is a much longer string";  // 힙 할당
```

SSO 레이아웃 (간략화):

```
짧은 문자열 (인라인):          긴 문자열 (힙):
┌─────────────────────┐         ┌──────────────────────┐
│ size: 5             │         │ data: ptr → [힙]     │
│ inline: "hello\0.." │         │ size: 28             │
│ (버퍼 ~22까지)       │         │ capacity: 32         │
└─────────────────────┘         └──────────────────────┘
```

SSO 때문에 짧은 문자열의 이동은 복사와 같은 비용이다.

---

## C++17 `std::string_view`

문자열에 대한 **비소유** 뷰 (포인터 + 길이). 제로 카피, 문자열을 수정할 수 없다:

```cpp
#include <string_view>

void process(std::string_view sv) {
    // sv는 데이터를 소유하지 않음 — 단지 뷰
    std::cout << sv.size() << "\n";
    std::cout << sv.substr(0, 5) << "\n";   // string_view도 반환
}

std::string s = "hello, world";
process(s);                // 복사 없음 — s의 버퍼를 봄
process("hello");          // 복사 없음 — 문자열 리터럴을 직접 봄
process(s.c_str());        // 복사 없음
```

### `string_view` vs `const string &` 사용 시점

| | `const std::string &` | `std::string_view` |
|---|---|---|
| `std::string` 수용 | 예 | 예 |
| `const char *` 수용 | 예 (하지만 임시 생성) | 예 (복사 없음) |
| 부분 문자열 수용 | 아니오 (새 string 생성 필요) | 예 |
| 널 종료 보장 | 예 | 아니오 |
| 소스보다 오래 살 수 있음 | 예 (데이터 소유) | 아니오 — **댕글링 위험** |

```cpp
// 위험: string_view는 댕글링될 수 있음
std::string_view bad() {
    std::string s = "hello";
    return s;   // s가 파괴됨 — 반환된 뷰는 댕글링
}
```

---

## 문자 분류 (`<ctype.h>` / `<cctype>`)

```c
#include <ctype.h>

isalpha('A');    // True — 알파벳
isdigit('5');    // True — 10진 숫자
isalnum('x');    // True — 영숫자
isspace(' ');    // True — 공백
isupper('A');    // True — 대문자
islower('a');    // True — 소문자
isprint('!');    // True — 출력 가능

toupper('a');    // 'A'
tolower('Z');    // 'z'
```

이 함수들은 `int`를 받는다 (`char`가 아님). 음수 `char` 값의 정의되지 않은 동작을 피하기 위해 `unsigned char`를 전달:

```c
char c = get_char();
if (isalpha((unsigned char)c)) { ... }
```

---

## 유니코드와 와이드 문자

### 와이드 문자 (`wchar_t`)

```c
#include <wchar.h>

wchar_t *ws = L"한글 테스트";
wprintf(L"%ls\n", ws);
wcslen(ws);          // 와이드 문자 수
```

`wchar_t` 크기는 플랫폼에 따라 다르다: Linux에서 4바이트 (UTF-32), Windows에서 2바이트 (UTF-16).

### 멀티바이트 문자열 (UTF-8)

UTF-8은 문자당 1-4바이트를 사용하며 ASCII와 하위 호환된다:

| 바이트 범위 | 코드 포인트 | 바이트 수 |
|---|---|---|
| U+0000–U+007F | ASCII | 1바이트 |
| U+0080–U+07FF | 라틴, 그리스, 키릴 등 | 2바이트 |
| U+0800–U+FFFF | CJK, 한국어 등 | 3바이트 |
| U+10000–U+10FFFF | 이모지, 희귀 문자 | 4바이트 |

```c
// UTF-8 문자열 — 각 한국어 문자는 3바이트
char *utf8 = "한글";        // 6바이트 + '\0'
strlen(utf8);               // 6 (바이트, 문자 수가 아님)
```

C11에서 UTF-8, UTF-16, UTF-32 문자열 리터럴이 도입되었다:

```c
char     *u8  = u8"hello";   // UTF-8
char16_t *u16 = u"hello";    // UTF-16
char32_t *u32 = U"hello";    // UTF-32
```

### C++20 `char8_t`와 `std::u8string`

```cpp
char8_t c = u8'A';
std::u8string s = u8"hello";
// 타입 수준에서 UTF-8 인코딩을 강제
```

---

## 원시 문자열 리터럴 (C++11)

이스케이프 문자 문제를 원시 문자열로 해결:

```cpp
// 일반 문자열 — 이스케이프 필요
std::string regex = "\\d+\\.\\d+";
std::string path = "C:\\Users\\name\\file.txt";

// 원시 문자열 — 이스케이프 불필요
std::string regex = R"(\d+\.\d+)";
std::string path = R"(C:\Users\name\file.txt)";

// )"를 포함하는 문자열을 위한 커스텀 구분자
std::string json = R"json({"key": "value"})json";
```
