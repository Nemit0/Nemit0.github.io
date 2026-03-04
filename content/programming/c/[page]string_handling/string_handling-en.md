---
title: "String Handling in C and C++"
description: "How strings work in C and C++ — null-terminated C strings, string functions, buffer overflows, std::string, string_view, SSO, and encoding."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "C++", "strings", "string handling", "buffer overflow", "std::string"]
author: "Nemit"
featured: false
pinned: false
---

# String Handling in C and C++

## C Strings: Null-Terminated Character Arrays

C has no string type. A "string" is a `char` array terminated by a null byte (`'\0'`, value 0):

```c
char str[] = "hello";
// Equivalent to: char str[] = {'h', 'e', 'l', 'l', 'o', '\0'};
// sizeof(str) = 6 (includes null terminator)
// strlen(str) = 5 (excludes null terminator)
```

Memory layout:

```
Index:   [0]  [1]  [2]  [3]  [4]  [5]
Value:   'h'  'e'  'l'  'l'  'o'  '\0'
ASCII:    72  101  108  108  111    0
```

All string functions depend on the null terminator. A missing `'\0'` causes functions to read past the buffer until they find a zero byte — **buffer overread** (undefined behavior).

---

## String Literals

```c
char *ptr = "hello";     // Pointer to string literal — stored in read-only section
char arr[] = "hello";    // Array — copies literal onto the stack (mutable)

// ptr[0] = 'H';         // UB: modifying string literal
arr[0] = 'H';           // OK: modifying local array
```

Adjacent string literals are concatenated at compile time:

```c
char *msg = "Hello, "
            "world!";     // Same as "Hello, world!"
```

### Escape Sequences

| Escape | Meaning | Value |
|---|---|---|
| `\0` | Null terminator | 0 |
| `\n` | Newline | 10 |
| `\t` | Tab | 9 |
| `\\` | Backslash | 92 |
| `\"` | Double quote | 34 |
| `\xHH` | Hex byte | Variable |
| `\ooo` | Octal byte | Variable |

---

## Essential C String Functions (`<string.h>`)

### Length

```c
size_t strlen(const char *s);
// Returns number of chars before '\0'. O(n) — scans until null byte.

strlen("hello");    // 5
strlen("");         // 0
```

### Copy

```c
char *strcpy(char *dest, const char *src);
// Copies src to dest including '\0'. UNSAFE — no bounds checking.

char buf[10];
strcpy(buf, "hello");       // OK: 6 bytes into 10-byte buffer
// strcpy(buf, "very long string");  // BUFFER OVERFLOW

// Safe alternative:
char *strncpy(char *dest, const char *src, size_t n);
// Copies at most n bytes. WARNING: may NOT null-terminate if src >= n bytes.

strncpy(buf, "hello", sizeof(buf));
buf[sizeof(buf) - 1] = '\0';    // Always null-terminate manually

// Best alternative (POSIX / C23):
size_t strlcpy(char *dest, const char *src, size_t size);
// Always null-terminates. Returns strlen(src) — can detect truncation.
```

### Concatenate

```c
char *strcat(char *dest, const char *src);
// Appends src to end of dest. UNSAFE.

char buf[20] = "hello";
strcat(buf, ", world");    // buf = "hello, world"

// Safe alternative:
char *strncat(char *dest, const char *src, size_t n);
// Appends at most n chars, then adds '\0'.

// Best alternative (POSIX / C23):
size_t strlcat(char *dest, const char *src, size_t size);
```

### Compare

```c
int strcmp(const char *s1, const char *s2);
// Returns: <0 if s1 < s2, 0 if equal, >0 if s1 > s2
// Compares lexicographically (byte by byte, unsigned).

strcmp("abc", "abc");    // 0
strcmp("abc", "abd");    // < 0
strcmp("abd", "abc");    // > 0

int strncmp(const char *s1, const char *s2, size_t n);
// Compares at most n characters.
```

### Search

```c
char *strchr(const char *s, int c);
// Returns pointer to first occurrence of c, or NULL.

char *strrchr(const char *s, int c);
// Returns pointer to last occurrence of c, or NULL.

char *strstr(const char *haystack, const char *needle);
// Returns pointer to first occurrence of needle in haystack, or NULL.

char str[] = "hello world";
char *p = strchr(str, 'o');     // Points to "o world"
char *q = strstr(str, "world"); // Points to "world"
```

### Tokenize

```c
char *strtok(char *str, const char *delim);
// Splits string by delimiters. MODIFIES the original string.
// NOT thread-safe (uses internal state).

char str[] = "one,two,,three";
char *tok = strtok(str, ",");
while (tok) {
    printf("[%s]\n", tok);
    tok = strtok(NULL, ",");   // NULL continues from last position
}
// Output: [one] [two] [three]  (empty token is skipped)

// Thread-safe alternative:
char *strtok_r(char *str, const char *delim, char **saveptr);
```

### Memory Operations

For raw byte manipulation (works with any data, not just strings):

```c
void *memcpy(void *dest, const void *src, size_t n);
// Copies n bytes. src and dest must NOT overlap.

void *memmove(void *dest, const void *src, size_t n);
// Copies n bytes. Handles overlapping regions correctly.

int memcmp(const void *s1, const void *s2, size_t n);
// Compares n bytes. Like strcmp but for arbitrary memory.

void *memset(void *s, int c, size_t n);
// Sets n bytes to value c (converted to unsigned char).

void *memchr(const void *s, int c, size_t n);
// Finds first occurrence of byte c in n bytes.
```

---

## Format Strings: `sprintf` and `snprintf`

```c
char buf[100];

// UNSAFE — no bounds checking
sprintf(buf, "Name: %s, Age: %d", "Alice", 30);

// SAFE — limits output to n-1 characters + '\0'
int ret = snprintf(buf, sizeof(buf), "Name: %s, Age: %d", "Alice", 30);
// Returns number of characters that WOULD have been written (excluding '\0')
// If ret >= sizeof(buf), output was truncated
```

### Format String Vulnerabilities

Never pass user input as a format string:

```c
char *user_input = get_input();
printf(user_input);                 // VULNERABLE — user can use %x, %n to attack
printf("%s", user_input);           // SAFE — user input treated as data
```

The `%n` format specifier **writes** to memory — a classic exploitation vector. Use `-Wformat-security` compiler flag.

---

## Common String Bugs

### Buffer Overflow

```c
char buf[8];
strcpy(buf, "this is way too long");   // Overwrites past buf
// Corrupts adjacent stack variables, return address, etc.
// Classic exploit: overwrite return address to execute arbitrary code
```

Prevention: always use bounded functions (`strncpy`, `snprintf`, `strlcpy`).

### Off-by-One Error

```c
char buf[5];
strncpy(buf, "hello", 5);
// buf = {'h', 'e', 'l', 'l', 'o'} — NO null terminator!
printf("%s", buf);   // Reads past buffer looking for '\0'
```

### Missing Null Terminator

```c
char buf[5];
buf[0] = 'h';
buf[1] = 'i';
// buf[2] through buf[4] are uninitialized
printf("%s", buf);   // Reads garbage until it finds a 0 byte
```

### Read-Only String Modification

```c
char *s = "hello";
s[0] = 'H';          // Undefined behavior — string literal is read-only
```

---

## String Conversion Functions

```c
#include <stdlib.h>

// String to number:
int atoi(const char *s);           // "123" → 123 (no error checking)
long strtol(const char *s, char **endptr, int base);  // Better: has error checking

long val = strtol("  42abc", &end, 10);
// val = 42, *end = "abc"

double strtod(const char *s, char **endptr);
// "3.14" → 3.14

// Number to string:
snprintf(buf, sizeof(buf), "%d", 42);     // int to string
snprintf(buf, sizeof(buf), "%.2f", 3.14); // double to string
```

Always prefer `strtol`/`strtod` over `atoi`/`atof`:
- `atoi` returns 0 on error — indistinguishable from `atoi("0")`
- `strtol` sets `errno` and provides the end pointer for validation

---

## C++ `std::string`

C++ provides `std::string` — a dynamic, safe, RAII-managed string:

```cpp
#include <string>

std::string s = "hello";
s += ", world";              // Automatic resize
s.append("!");               // Append
std::cout << s.size();       // 13 (length excluding null)
std::cout << s[0];           // 'h' (no bounds check)
std::cout << s.at(0);       // 'h' (bounds checked — throws on out-of-range)
```

### Key Operations

```cpp
std::string s = "Hello, World!";

// Substring
s.substr(7, 5);          // "World"

// Find
s.find("World");          // 7 (position)
s.find("xyz");            // std::string::npos

// Replace
s.replace(7, 5, "C++");  // "Hello, C++!"

// Insert/Erase
s.insert(5, " there");   // "Hello there, C++!"
s.erase(5, 6);           // "Hello, C++!"

// Compare
s == "Hello, C++!";      // true
s < "Zzzz";              // true (lexicographic)
s.compare("Hello");      // != 0

// C string interop
const char *cstr = s.c_str();   // Null-terminated C string
const char *data = s.data();    // Same as c_str() since C++11
```

### Memory Model

`std::string` internally manages a heap-allocated buffer:

```cpp
struct string_internals {  // Simplified
    char *data;
    size_t size;       // Current length
    size_t capacity;   // Allocated capacity
};
```

- `size()` — current number of characters
- `capacity()` — allocated buffer size (may be larger than size)
- `reserve(n)` — pre-allocate capacity (avoids reallocations)
- `shrink_to_fit()` — request to reduce capacity to match size

```cpp
std::string s;
s.reserve(1000);         // Pre-allocate for 1000 chars
for (int i = 0; i < 1000; i++)
    s += 'x';            // No reallocations — already reserved
```

### Small String Optimization (SSO)

Most `std::string` implementations store short strings **inside the object** itself, avoiding heap allocation:

```cpp
// Typical SSO threshold: 15-22 bytes (implementation-dependent)
std::string short_str = "hello";      // Stored inline — no heap allocation
std::string long_str = "this is a much longer string";  // Heap allocated
```

SSO layout (simplified):

```
Short string (inline):          Long string (heap):
┌─────────────────────┐         ┌──────────────────────┐
│ size: 5             │         │ data: ptr → [heap]   │
│ inline: "hello\0.." │         │ size: 28             │
│ (buffer up to ~22)  │         │ capacity: 32         │
└─────────────────────┘         └──────────────────────┘
```

Because of SSO, moving a short string is the same cost as copying it.

---

## C++17 `std::string_view`

A **non-owning** view into a string (a pointer + length). Zero-copy, cannot modify the string:

```cpp
#include <string_view>

void process(std::string_view sv) {
    // sv does NOT own the data — just a view
    std::cout << sv.size() << "\n";
    std::cout << sv.substr(0, 5) << "\n";   // Also returns a string_view
}

std::string s = "hello, world";
process(s);                // No copy — views into s's buffer
process("hello");          // No copy — views the string literal directly
process(s.c_str());        // No copy
```

### When to Use `string_view` vs `const string &`

| | `const std::string &` | `std::string_view` |
|---|---|---|
| Accepts `std::string` | Yes | Yes |
| Accepts `const char *` | Yes (but creates temporary) | Yes (no copy) |
| Accepts substring | No (must create new string) | Yes |
| Null-terminated guarantee | Yes | No |
| Can outlive the source | Yes (owns data) | No — **dangling risk** |

```cpp
// DANGER: string_view can dangle
std::string_view bad() {
    std::string s = "hello";
    return s;   // s destroyed — returned view is dangling
}
```

---

## Character Classification (`<ctype.h>` / `<cctype>`)

```c
#include <ctype.h>

isalpha('A');    // True — alphabetic
isdigit('5');    // True — decimal digit
isalnum('x');    // True — alphanumeric
isspace(' ');    // True — whitespace
isupper('A');    // True — uppercase
islower('a');    // True — lowercase
isprint('!');    // True — printable

toupper('a');    // 'A'
tolower('Z');    // 'z'
```

These functions take `int` (not `char`). Pass `unsigned char` to avoid undefined behavior with negative `char` values:

```c
char c = get_char();
if (isalpha((unsigned char)c)) { ... }
```

---

## Unicode and Wide Characters

### Wide Characters (`wchar_t`)

```c
#include <wchar.h>

wchar_t *ws = L"한글 테스트";
wprintf(L"%ls\n", ws);
wcslen(ws);          // Number of wide characters
```

`wchar_t` size is platform-dependent: 4 bytes on Linux (UTF-32), 2 bytes on Windows (UTF-16).

### Multibyte Strings (UTF-8)

UTF-8 uses 1-4 bytes per character and is backward-compatible with ASCII:

| Byte Range | Code Points | Byte Count |
|---|---|---|
| U+0000–U+007F | ASCII | 1 byte |
| U+0080–U+07FF | Latin, Greek, Cyrillic, etc. | 2 bytes |
| U+0800–U+FFFF | CJK, Korean, etc. | 3 bytes |
| U+10000–U+10FFFF | Emoji, rare scripts | 4 bytes |

```c
// UTF-8 string — each Korean char is 3 bytes
char *utf8 = "한글";        // 6 bytes + '\0'
strlen(utf8);               // 6 (bytes, NOT characters)
```

C11 introduced UTF-8, UTF-16, and UTF-32 string literals:

```c
char     *u8  = u8"hello";   // UTF-8
char16_t *u16 = u"hello";    // UTF-16
char32_t *u32 = U"hello";    // UTF-32
```

### C++20 `char8_t` and `std::u8string`

```cpp
char8_t c = u8'A';
std::u8string s = u8"hello";
// Enforces UTF-8 encoding at the type level
```

---

## Raw String Literals (C++11)

Avoid escape character issues with raw strings:

```cpp
// Regular string — must escape
std::string regex = "\\d+\\.\\d+";
std::string path = "C:\\Users\\name\\file.txt";

// Raw string — no escaping needed
std::string regex = R"(\d+\.\d+)";
std::string path = R"(C:\Users\name\file.txt)";

// Custom delimiter for strings containing )"
std::string json = R"json({"key": "value"})json";
```
