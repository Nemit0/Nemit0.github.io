---
title: "Regular Expression Basics"
description: "Fundamentals of regular expressions — syntax, metacharacters, character classes, quantifiers, groups, anchors, lookahead/lookbehind, and practical usage in grep, sed, and awk."
date: "2026-03-05"
category: "programming/bash"
tags: ["regex", "regular expressions", "grep", "sed", "pattern matching"]
author: "Nemit"
featured: false
pinned: false
---

# Regular Expression Basics

## What Is a Regular Expression?

A **regular expression** (regex) is a pattern that describes a set of strings. It's used for searching, matching, and replacing text in tools like `grep`, `sed`, `awk`, and programming languages.

```bash
grep -E "^[0-9]{3}-[0-9]{4}$" phones.txt
#      └── regex pattern ──┘
# Matches: 123-4567, 999-0000
# Doesn't match: 12-345, abc-defg
```

---

## Regex Flavors

| Flavor | Tool / Flag | Key Differences |
|---|---|---|
| **BRE** (Basic) | `grep`, `sed` | `( ) { } + ? \|` must be escaped: `\( \) \{ \}` |
| **ERE** (Extended) | `grep -E`, `sed -E`, `awk` | `( ) { } + ? \|` are special without escaping |
| **PCRE** (Perl) | `grep -P`, Python, JavaScript | Lookahead, lookbehind, `\d \w \s` shorthand |

This article uses **ERE** syntax (Extended) unless noted.

---

## Literal Characters

Most characters match themselves literally:

```
Pattern: hello
Matches: "hello" in "say hello world"
```

Special (meta) characters that need escaping: `. * + ? [ ] ( ) { } ^ $ \ |`

To match a literal dot: `\.`
To match a literal asterisk: `\*`

---

## Metacharacters

### The Dot (`.`) — Any Character

Matches **any single character** except newline:

```
Pattern: h.t
Matches: hat, hot, hit, h@t, h t
Doesn't: ht, hoot
```

### Anchors — Position Matching

| Pattern | Matches |
|---|---|
| `^` | Start of line |
| `$` | End of line |
| `\b` | Word boundary (PCRE/ERE) |
| `\B` | Non-word boundary |

```bash
grep "^Error" log.txt        # Lines starting with "Error"
grep "done$" log.txt         # Lines ending with "done"
grep -E "\bcat\b" file.txt   # "cat" as whole word (not "catch")
```

---

## Character Classes (`[ ]`)

Match **one character** from a set:

```
[abc]       — a, b, or c
[a-z]       — Any lowercase letter
[A-Z]       — Any uppercase letter
[0-9]       — Any digit
[a-zA-Z]    — Any letter
[a-zA-Z0-9] — Any alphanumeric
[^abc]      — NOT a, b, or c (negation with ^)
[^0-9]      — NOT a digit
```

Inside `[ ]`, most metacharacters lose their special meaning. Exceptions:
- `]` — closes the class (put it first to match literally: `[]abc]`)
- `^` — negation (only at start)
- `-` — range (put it first or last to match literally: `[-abc]`)
- `\` — escape

### POSIX Character Classes

```
[:alpha:]   — Letters            [[:alpha:]]
[:digit:]   — Digits             [[:digit:]]
[:alnum:]   — Alphanumeric       [[:alnum:]]
[:space:]   — Whitespace         [[:space:]]
[:upper:]   — Uppercase          [[:upper:]]
[:lower:]   — Lowercase          [[:lower:]]
[:punct:]   — Punctuation        [[:punct:]]
[:print:]   — Printable          [[:print:]]
[:blank:]   — Space and tab      [[:blank:]]
```

Note the **double brackets**: `[[:digit:]]` not `[:digit:]`.

### PCRE Shorthand Classes

| Shorthand | Equivalent | Meaning |
|---|---|---|
| `\d` | `[0-9]` | Digit |
| `\D` | `[^0-9]` | Non-digit |
| `\w` | `[a-zA-Z0-9_]` | Word character |
| `\W` | `[^a-zA-Z0-9_]` | Non-word |
| `\s` | `[ \t\n\r\f\v]` | Whitespace |
| `\S` | `[^ \t\n\r\f\v]` | Non-whitespace |

These work in `grep -P`, Python, JavaScript, etc. — NOT in basic/extended `grep` or `sed`.

---

## Quantifiers — How Many

| Quantifier | Meaning | Example |
|---|---|---|
| `*` | 0 or more | `ab*c` matches ac, abc, abbc |
| `+` | 1 or more | `ab+c` matches abc, abbc (not ac) |
| `?` | 0 or 1 (optional) | `colou?r` matches color, colour |
| `{n}` | Exactly n | `a{3}` matches aaa |
| `{n,}` | n or more | `a{2,}` matches aa, aaa, aaaa... |
| `{n,m}` | Between n and m | `a{2,4}` matches aa, aaa, aaaa |

### Greedy vs Lazy

By default, quantifiers are **greedy** — they match as much as possible:

```
Pattern: ".*"
Input:   He said "hello" and "goodbye"
Greedy:  "hello" and "goodbye"     (matches everything between first " and last ")
```

Add `?` for **lazy** (non-greedy) — match as little as possible:

```
Pattern: ".*?"
Input:   He said "hello" and "goodbye"
Lazy:    "hello"                    (stops at first closing ")
```

Lazy quantifiers: `*?`, `+?`, `??`, `{n,m}?`

(Lazy quantifiers work in PCRE; BRE/ERE don't support them.)

---

## Alternation (`|`) — OR

```bash
grep -E "cat|dog" file.txt        # Lines containing "cat" OR "dog"
grep -E "error|warning|critical" log.txt
```

`|` has low precedence. Use grouping for clarity:

```
gray|grey       → "gray" or "grey"
gr(a|e)y        → Same, but more precise
```

---

## Groups

### Capturing Groups `( )`

Group parts of a pattern and capture the match for backreferences:

```bash
# Match repeated words
grep -E "\b(\w+)\s+\1\b" file.txt     # "the the", "is is"

# sed backreferences
echo "2026-03-05" | sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3\/\2\/\1/'
# Output: 05/03/2026
```

`\1`, `\2`, etc. refer to the text captured by the 1st, 2nd group.

### Non-Capturing Groups `(?: )` (PCRE)

Group without capturing (for performance or clarity):

```
(?:error|warning): (.*)
# Groups error|warning together but doesn't capture it
# Only captures the message after ": "
```

---

## Lookahead and Lookbehind (PCRE)

Match a position without consuming characters:

| Pattern | Name | Meaning |
|---|---|---|
| `(?=...)` | Positive lookahead | Followed by ... |
| `(?!...)` | Negative lookahead | NOT followed by ... |
| `(?<=...)` | Positive lookbehind | Preceded by ... |
| `(?<!...)` | Negative lookbehind | NOT preceded by ... |

```bash
# Positive lookahead: digits followed by "px"
grep -P "\d+(?=px)" file.txt
# In "12px 3em 45px" → matches "12" and "45"

# Negative lookahead: "foo" not followed by "bar"
grep -P "foo(?!bar)" file.txt
# Matches "foobaz", "foo ", not "foobar"

# Positive lookbehind: digits preceded by "$"
grep -P "(?<=\$)\d+" file.txt
# In "$100 200 $50" → matches "100" and "50"
```

---

## Common Patterns

### Email (simplified)

```
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
```

### IPv4 Address

```
\b([0-9]{1,3}\.){3}[0-9]{1,3}\b
```

### URL

```
https?://[^\s/$.?#].[^\s]*
```

### Date (YYYY-MM-DD)

```
[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])
```

### Phone Number (US)

```
(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}
```

### Password Validation (min 8 chars, upper, lower, digit)

```
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$
```

This uses lookaheads to assert requirements without consuming characters.

---

## Regex in Different Tools

### grep

```bash
grep "pattern" file                # BRE
grep -E "pattern" file             # ERE (extended)
grep -P "pattern" file             # PCRE (Perl-compatible, GNU only)
grep -F "literal" file             # Fixed string (no regex)
```

### sed

```bash
sed 's/pattern/replacement/' file           # BRE
sed -E 's/pattern/replacement/' file        # ERE
sed 's/\(group\)/\1/' file                  # BRE backreference
sed -E 's/(group)/\1/' file                 # ERE backreference
```

### awk

```bash
awk '/pattern/ { print }' file              # ERE by default
awk '$0 ~ /^[0-9]+$/ { print }' file       # Match operator
awk '$3 !~ /error/ { print }' file          # Negated match
```

### Python

```python
import re

re.search(r'\d+', 'abc123')           # First match
re.findall(r'\d+', 'a1b2c3')          # All matches: ['1', '2', '3']
re.sub(r'\d+', 'N', 'a1b2')           # Replace: 'aNbN'
re.split(r'[,;]', 'a,b;c')            # Split: ['a', 'b', 'c']

# Compile for reuse
pat = re.compile(r'^(\w+):\s+(.*)')
m = pat.match('name: John Doe')
m.group(1)    # 'name'
m.group(2)    # 'John Doe'
```

---

## Performance Tips

- **Anchors**: Use `^` and `$` when possible — the engine can skip non-matching positions
- **Character classes over alternation**: `[aeiou]` is faster than `a|e|i|o|u`
- **Avoid catastrophic backtracking**: Patterns like `(a+)+` can take exponential time
- **Be specific**: `[0-9]{3}` is better than `\d+` if you know the exact length
- **Fixed strings**: Use `grep -F` or `fgrep` for literal string matching (no regex overhead)

### Catastrophic Backtracking

```
Pattern: (a+)+b
Input:   aaaaaaaaaaaaaaaaac

The engine tries all possible ways to split the a's between the groups,
leading to 2^n attempts. With 20 a's, this can hang for minutes.
```

Fix: Use possessive quantifiers (`a++`, PCRE) or atomic groups (`(?>a+)`), or restructure the pattern.

---

## Quick Reference

```
.          Any character (except newline)
^          Start of line
$          End of line
*          0 or more
+          1 or more
?          0 or 1 (optional)
{n}        Exactly n
{n,m}      Between n and m
[abc]      Character class
[^abc]     Negated class
(...)      Capturing group
\1         Backreference to group 1
|          Alternation (OR)
\b         Word boundary
\d         Digit (PCRE)
\w         Word character (PCRE)
\s         Whitespace (PCRE)
(?=...)    Positive lookahead (PCRE)
(?!...)    Negative lookahead (PCRE)
(?<=...)   Positive lookbehind (PCRE)
(?<!...)   Negative lookbehind (PCRE)
```
