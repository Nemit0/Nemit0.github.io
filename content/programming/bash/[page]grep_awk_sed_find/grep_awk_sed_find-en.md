---
title: "grep, awk, sed, and find"
description: "Essential text processing and file search tools in Unix/Linux — grep for pattern matching, awk for columnar data, sed for stream editing, and find for locating files."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "grep", "awk", "sed", "find", "text processing", "Linux"]
author: "Nemit"
featured: false
pinned: false
---

# grep, awk, sed, and find

## grep — Pattern Matching

`grep` searches files or standard input for lines matching a pattern and prints them.

```bash
grep "error" logfile.txt          # Lines containing "error"
grep -i "error" logfile.txt       # Case-insensitive
grep -n "error" logfile.txt       # Show line numbers
grep -c "error" logfile.txt       # Count matching lines
grep -v "error" logfile.txt       # Invert: lines NOT containing "error"
grep -r "TODO" ./src/             # Recursive search in directory
grep -l "main" *.c                # List filenames with matches only
grep -w "int" file.c              # Match whole word only
```

### Regular Expressions with grep

```bash
grep "^Start" file.txt            # Lines starting with "Start"
grep "end$" file.txt              # Lines ending with "end"
grep "colou?r" file.txt           # Basic regex (? needs -E or egrep)
grep -E "error|warning" file.txt  # Extended regex: OR
grep -E "[0-9]{3}" file.txt       # Three consecutive digits
grep -P "\d+\.\d+" file.txt       # Perl regex (GNU grep)
```

### grep Options Summary

| Flag | Purpose |
|---|---|
| `-i` | Case insensitive |
| `-n` | Show line numbers |
| `-c` | Count matches |
| `-v` | Invert match |
| `-r` / `-R` | Recursive |
| `-l` | Filenames only |
| `-L` | Filenames without matches |
| `-w` | Whole word |
| `-x` | Whole line |
| `-E` | Extended regex (ERE) |
| `-P` | Perl-compatible regex (PCRE) |
| `-o` | Print only the matched part |
| `-A N` | Print N lines after match |
| `-B N` | Print N lines before match |
| `-C N` | Print N lines around match (context) |
| `--color` | Highlight matches |

### Context Lines

```bash
grep -A 3 "ERROR" log.txt        # 3 lines after each match
grep -B 2 "ERROR" log.txt        # 2 lines before each match
grep -C 5 "ERROR" log.txt        # 5 lines before and after
```

### Multiple Patterns

```bash
grep -e "error" -e "warning" log.txt          # Match either
grep -f patterns.txt log.txt                   # Patterns from file
grep -E "(error|warning|critical)" log.txt     # Extended regex OR
```

---

## awk — Columnar Data Processing

`awk` is a pattern-action language for processing structured text. It automatically splits each line into fields.

### Basic Syntax

```bash
awk 'pattern { action }' file
```

If no pattern, the action runs on every line. If no action, matching lines are printed.

### Fields and Built-in Variables

`awk` splits each line by whitespace (default) into fields `$1`, `$2`, ..., `$NF`:

```bash
# /etc/passwd has colon-separated fields
awk -F: '{ print $1, $3 }' /etc/passwd
# Output: root 0, daemon 1, ...

# Print specific columns from space-separated data
echo "Alice 90 85 92" | awk '{ print $1, ($2+$3+$4)/3 }'
# Output: Alice 89

# Print last field
awk '{ print $NF }' file.txt
```

| Variable | Meaning |
|---|---|
| `$0` | Entire line |
| `$1`, `$2`, ... | Fields |
| `NF` | Number of fields in current line |
| `NR` | Current line number (across all files) |
| `FNR` | Line number in current file |
| `FS` | Field separator (default: whitespace) |
| `OFS` | Output field separator (default: space) |
| `RS` | Record separator (default: newline) |
| `ORS` | Output record separator |
| `FILENAME` | Current filename |

### Patterns and Conditions

```bash
awk '$3 > 80 { print $1, $3 }' grades.txt    # If 3rd field > 80
awk '/error/ { print NR, $0 }' log.txt        # Lines matching regex
awk 'NR >= 10 && NR <= 20' file.txt           # Lines 10-20
awk 'NF > 0' file.txt                         # Non-empty lines
```

### BEGIN and END Blocks

```bash
awk 'BEGIN { sum=0 } { sum += $2 } END { print "Total:", sum }' data.txt
# BEGIN runs before processing, END runs after all lines

awk 'BEGIN { FS=":"; OFS="\t" } { print $1, $3 }' /etc/passwd
# Set separators in BEGIN block
```

### Practical Examples

```bash
# Sum a column
awk '{ sum += $1 } END { print sum }' numbers.txt

# Count lines matching a pattern
awk '/error/ { count++ } END { print count }' log.txt

# Print unique values in a column
awk '!seen[$1]++ { print $1 }' file.txt

# Swap two columns
awk '{ print $2, $1 }' file.txt

# Format output
awk '{ printf "%-20s %5d\n", $1, $2 }' data.txt

# Process CSV
awk -F, '{ print $1, $3 }' data.csv

# Calculate average
awk '{ sum += $1; n++ } END { print sum/n }' numbers.txt

# Join lines with comma
awk '{ printf "%s%s", sep, $0; sep="," } END { print "" }' file.txt
```

### awk Scripting Features

```bash
# Variables and arithmetic
awk '{ total = $2 * $3; print $1, total }' orders.txt

# If-else
awk '{ if ($3 >= 90) grade="A"; else if ($3 >= 80) grade="B"; else grade="C"; print $1, grade }' grades.txt

# Arrays (associative)
awk '{ count[$1]++ } END { for (key in count) print key, count[key] }' access.log

# String functions
awk '{ print length($0), toupper($1) }' file.txt
awk '{ gsub(/old/, "new"); print }' file.txt          # Global substitution
awk '{ print substr($0, 1, 10) }' file.txt            # Substring
awk 'match($0, /[0-9]+/) { print substr($0, RSTART, RLENGTH) }' file.txt
```

---

## sed — Stream Editor

`sed` performs text transformations on a stream (file or pipe). It processes text line by line.

### Substitution (Most Common Use)

```bash
sed 's/old/new/' file.txt           # Replace first occurrence per line
sed 's/old/new/g' file.txt          # Replace ALL occurrences per line
sed 's/old/new/gi' file.txt         # Case-insensitive + global
sed 's/old/new/3' file.txt          # Replace 3rd occurrence per line

# In-place editing
sed -i 's/old/new/g' file.txt       # Modify file directly (GNU sed)
sed -i.bak 's/old/new/g' file.txt   # Create backup before modifying
```

### Addressing — Which Lines to Process

```bash
sed '3s/old/new/' file.txt          # Only on line 3
sed '1,5s/old/new/' file.txt        # Lines 1 through 5
sed '/pattern/s/old/new/' file.txt  # Lines matching pattern
sed '1,/end/s/old/new/' file.txt    # Line 1 through first line matching "end"
sed '$s/old/new/' file.txt          # Last line only
```

### Deletion

```bash
sed '3d' file.txt                   # Delete line 3
sed '1,5d' file.txt                 # Delete lines 1-5
sed '/^$/d' file.txt                # Delete empty lines
sed '/^#/d' file.txt                # Delete comment lines
sed '/pattern/d' file.txt           # Delete lines matching pattern
```

### Insertion and Appending

```bash
sed '3i\New line before line 3' file.txt     # Insert before line 3
sed '3a\New line after line 3' file.txt      # Append after line 3
sed '1i\Header' file.txt                     # Add header to file
sed '$a\Footer' file.txt                     # Add footer
```

### Printing

```bash
sed -n '5p' file.txt               # Print only line 5
sed -n '10,20p' file.txt           # Print lines 10-20
sed -n '/pattern/p' file.txt       # Print matching lines (like grep)
sed -n '/start/,/end/p' file.txt   # Print range between patterns
```

### Multiple Commands

```bash
sed -e 's/foo/bar/g' -e 's/baz/qux/g' file.txt    # Multiple substitutions
sed '{ s/foo/bar/g; s/baz/qux/g; }' file.txt       # Semicolon separated
```

### Practical Examples

```bash
# Remove trailing whitespace
sed 's/[[:space:]]*$//' file.txt

# Add line numbers
sed = file.txt | sed 'N; s/\n/\t/'

# Convert DOS line endings to Unix
sed 's/\r$//' file.txt

# Extract text between tags
sed -n 's/.*<title>\(.*\)<\/title>.*/\1/p' page.html

# Replace on specific lines
sed '/^DEBUG/s/enabled/disabled/' config.txt

# Comment out lines matching pattern
sed '/pattern/s/^/# /' file.txt
```

### sed Regex Features

```bash
# Capture groups (use \( \) in basic, ( ) with -E)
sed 's/\(.*\):\(.*\)/\2:\1/' file.txt          # Swap around colon
sed -E 's/([A-Z]+)_([A-Z]+)/\2_\1/' file.txt   # Extended regex

# Character classes
sed 's/[0-9]/#/g' file.txt                     # Replace digits with #
sed 's/[[:upper:]]/\L&/g' file.txt              # Lowercase all (GNU)
```

---

## find — Locating Files

`find` walks a directory tree and evaluates expressions to locate files.

### Basic Syntax

```bash
find [path] [expression]
```

### Search by Name

```bash
find . -name "*.txt"                # Files ending in .txt (case-sensitive)
find . -iname "*.txt"               # Case-insensitive
find /home -name "*.log"            # Search from /home
find . -name "test*" -type f        # Files only (not directories)
find . -name "src" -type d          # Directories only
```

### Search by Type

| Type | Meaning |
|---|---|
| `-type f` | Regular file |
| `-type d` | Directory |
| `-type l` | Symbolic link |
| `-type b` | Block device |
| `-type c` | Character device |
| `-type p` | Named pipe (FIFO) |
| `-type s` | Socket |

### Search by Size

```bash
find . -size +100M                  # Larger than 100 MB
find . -size -1k                    # Smaller than 1 KB
find . -size 0                      # Empty files
find . -empty                       # Empty files and directories
```

Size suffixes: `c` (bytes), `k` (KB), `M` (MB), `G` (GB)

### Search by Time

```bash
find . -mtime -7                    # Modified within last 7 days
find . -mtime +30                   # Modified more than 30 days ago
find . -mmin -60                    # Modified within last 60 minutes
find . -newer reference.txt         # Newer than reference file
find . -atime -1                    # Accessed within last day
```

| Flag | Meaning |
|---|---|
| `-mtime` | Modification time (days) |
| `-atime` | Access time (days) |
| `-ctime` | Change time (inode, days) |
| `-mmin` | Modification time (minutes) |
| `-amin` | Access time (minutes) |

### Search by Permissions

```bash
find . -perm 644                    # Exact permissions
find . -perm -u+x                   # User has execute
find . -perm /o+w                   # Other has write (any match)
find . -perm -755                   # At least 755
```

### Search by Owner

```bash
find . -user alice                  # Owned by alice
find . -group developers           # Group is developers
find . -uid 1000                    # User ID 1000
find . -nouser                      # No matching user (orphaned)
```

### Combining Conditions

```bash
find . -name "*.log" -size +1M                        # AND (default)
find . -name "*.jpg" -o -name "*.png"                 # OR
find . \( -name "*.c" -o -name "*.h" \) -mtime -7    # Grouped OR with AND
find . -not -name "*.tmp"                              # NOT
find . ! -name "*.tmp"                                 # NOT (alternative)
```

### Actions

```bash
# Execute command on each file
find . -name "*.tmp" -exec rm {} \;                    # Delete each
find . -name "*.txt" -exec grep -l "TODO" {} \;        # grep each file
find . -name "*.c" -exec wc -l {} +                    # wc on all at once

# The difference:
# {} \;  — runs command once per file
# {} +   — runs command with many files at once (faster, like xargs)

# Print with format
find . -name "*.sh" -printf "%p %s bytes\n"            # Path and size

# Delete directly
find . -name "*.tmp" -delete                           # Fast deletion

# Prompt before action
find . -name "*.bak" -exec rm -i {} \;                 # Interactive delete
```

### xargs — Build Commands from Input

```bash
find . -name "*.txt" | xargs grep "pattern"            # grep all found files
find . -name "*.txt" -print0 | xargs -0 grep "pattern" # Handle spaces in names
find . -name "*.log" -print0 | xargs -0 rm             # Delete with space safety

# Parallel execution
find . -name "*.jpg" -print0 | xargs -0 -P 4 -I {} convert {} {}.png
# -P 4: run 4 processes in parallel
# -I {}: replace {} with input
```

### Practical find Examples

```bash
# Find and delete files older than 30 days
find /tmp -type f -mtime +30 -delete

# Find large files
find / -type f -size +500M -exec ls -lh {} + 2>/dev/null

# Find broken symlinks
find . -type l ! -exec test -e {} \; -print

# Find duplicate names
find . -type f -name "*.py" | awk -F/ '{ print $NF }' | sort | uniq -d

# Find recently modified files
find . -type f -mmin -30 -ls

# Find files with specific permissions
find . -type f -perm -o+w              # World-writable files
find . -type f -perm -4000             # SUID files

# Find and change permissions
find . -type f -name "*.sh" -exec chmod +x {} +

# Count files by extension
find . -type f | awk -F. '{ print $NF }' | sort | uniq -c | sort -rn
```

---

## Combining Tools

The real power comes from combining these tools with pipes:

```bash
# Find all TODO comments in source code
grep -rn "TODO" --include="*.py" ./src/

# Find largest directories
find . -type f -exec du -b {} + | sort -rn | head -20

# Extract unique error types from logs
grep "ERROR" app.log | awk '{ print $4 }' | sort | uniq -c | sort -rn

# Replace in all matching files
find . -name "*.txt" -exec sed -i 's/old/new/g' {} +

# Count lines of code by file type
find . -name "*.py" -exec wc -l {} + | tail -1

# Process CSV: extract column, filter, count
awk -F, '{ print $3 }' data.csv | grep -v "^$" | sort | uniq -c | sort -rn

# Monitor log file in real time for errors
tail -f app.log | grep --line-buffered "ERROR" | awk '{ print strftime("%H:%M:%S"), $0 }'
```
