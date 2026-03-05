---
title: "Pipes and Redirection"
description: "Unix I/O redirection and piping — stdin, stdout, stderr, file descriptors, pipes, here documents, process substitution, and practical patterns."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "pipes", "redirection", "stdin", "stdout", "stderr", "file descriptors"]
author: "Nemit"
featured: false
pinned: false
---

# Pipes and Redirection

## File Descriptors

Every Unix process has three standard file descriptors:

| FD | Name | Default | C Constant |
|---|---|---|---|
| 0 | stdin | Keyboard | `STDIN_FILENO` |
| 1 | stdout | Terminal | `STDOUT_FILENO` |
| 2 | stderr | Terminal | `STDERR_FILENO` |

File descriptors are just integers. Programs read from FD 0 and write to FD 1 (output) and FD 2 (errors). Redirection changes where these FDs point.

```
Keyboard → [stdin 0] → [Process] → [stdout 1] → Terminal
                                  → [stderr 2] → Terminal
```

---

## Output Redirection (`>`, `>>`)

### Redirect stdout to a file

```bash
echo "hello" > output.txt         # Write to file (overwrite)
echo "world" >> output.txt        # Append to file
ls /nonexistent > output.txt      # stdout to file, stderr still to terminal
```

`>` creates the file if it doesn't exist and **truncates** (empties) it if it does.
`>>` creates the file if it doesn't exist and **appends** to it.

### Redirect stderr

```bash
ls /nonexistent 2> errors.txt     # stderr to file
ls /nonexistent 2>> errors.txt    # Append stderr to file
```

### Redirect both stdout and stderr

```bash
command > output.txt 2>&1         # stdout to file, stderr to same file
command &> output.txt             # Shorthand (bash-specific)
command &>> output.txt            # Append both (bash-specific)

command > stdout.txt 2> stderr.txt  # Separate files
```

**Order matters** with `2>&1`:

```bash
# Correct: stdout goes to file, then stderr follows stdout to file
command > file.txt 2>&1

# Wrong: stderr goes to current stdout (terminal), THEN stdout goes to file
command 2>&1 > file.txt
```

### Discard output

```bash
command > /dev/null               # Discard stdout
command 2> /dev/null              # Discard stderr
command &> /dev/null              # Discard all output
command > /dev/null 2>&1          # Same (POSIX-compatible)
```

`/dev/null` is the "black hole" — writes are discarded, reads return EOF.

---

## Input Redirection (`<`)

```bash
sort < unsorted.txt               # Read stdin from file
wc -l < file.txt                  # Count lines from file

# Difference from argument:
wc -l file.txt                    # wc opens the file — prints "42 file.txt"
wc -l < file.txt                  # shell opens the file — prints "42" (no filename)
```

---

## Here Documents (`<<`)

Feed multi-line input to a command inline:

```bash
cat << EOF
Hello, $(whoami)!
Today is $(date).
This is line 3.
EOF
```

The delimiter (here `EOF`) can be any word. Content between delimiters is treated as stdin with **variable and command expansion**.

### Suppress Expansion

Use quotes around the delimiter to prevent expansion:

```bash
cat << 'EOF'
This $variable is NOT expanded.
$(this command) is NOT executed.
EOF
```

### Strip Leading Tabs (`<<-`)

```bash
if true; then
    cat <<- EOF
    This text has leading tabs stripped.
    Useful for indented scripts.
    EOF
fi
```

Only **tabs** are stripped, not spaces.

---

## Here Strings (`<<<`)

Feed a single string as stdin:

```bash
grep "pattern" <<< "search in this string"
read -r first last <<< "John Doe"
echo $first    # John
echo $last     # Doe

bc <<< "3.14 * 2"    # 6.28
```

---

## Pipes (`|`)

A pipe connects the **stdout** of one command to the **stdin** of the next:

```bash
ls -la | grep ".txt"              # List files, filter for .txt
cat log.txt | sort | uniq -c      # Sort and count unique lines
ps aux | grep nginx               # Find nginx processes
history | tail -20                 # Last 20 commands
```

### How Pipes Work Internally

The shell creates a **pipe** (an in-kernel buffer, typically 64KB on Linux) using the `pipe()` system call. The write end connects to the first command's stdout, and the read end connects to the second command's stdin.

```
cmd1 stdout → [pipe buffer] → stdin cmd2
```

Both commands run **concurrently** as separate processes. If the pipe buffer fills up, the writer blocks until the reader consumes data. If the buffer is empty, the reader blocks.

### Pipe stderr

By default, pipes only carry stdout. To also pipe stderr:

```bash
command 2>&1 | grep "error"       # Redirect stderr to stdout, then pipe
command |& grep "error"           # Shorthand (bash 4+)
```

### Pipe to Multiple Commands (`tee`)

`tee` reads from stdin and writes to both stdout AND a file:

```bash
ls -la | tee listing.txt          # Print to screen AND save to file
ls -la | tee listing.txt | wc -l  # Save to file AND continue piping
ls -la | tee -a listing.txt       # Append to file
ls -la | tee file1.txt file2.txt  # Multiple files
```

### Pipeline Exit Status

By default, a pipeline's exit status is the exit status of the **last** command:

```bash
false | true
echo $?    # 0 (true succeeded, false's failure is ignored)
```

Use `set -o pipefail` to use the last **non-zero** exit status:

```bash
set -o pipefail
false | true
echo $?    # 1 (false failed)
```

Individual exit statuses are in `PIPESTATUS` array:

```bash
false | true | false
echo "${PIPESTATUS[@]}"    # 1 0 1
```

---

## Process Substitution (`<()`, `>()`)

Treats a command's output as a file. Useful when a command requires a filename, not stdin.

### Input Process Substitution `<()`

```bash
diff <(sort file1.txt) <(sort file2.txt)
# diff requires two filenames — process substitution provides them

comm <(sort list1.txt) <(sort list2.txt)
# comm also requires sorted file arguments

paste <(cut -f1 data.txt) <(cut -f3 data.txt)
```

`<(cmd)` creates a named pipe (FIFO) or `/dev/fd/N` entry and replaces itself with that path.

### Output Process Substitution `>()`

```bash
command | tee >(grep "error" > errors.txt) >(grep "warning" > warnings.txt)
# Send output to two different filters simultaneously
```

---

## File Descriptor Manipulation

### Open Additional FDs

```bash
exec 3> output.txt          # Open FD 3 for writing
echo "hello" >&3            # Write to FD 3
exec 3>&-                   # Close FD 3

exec 4< input.txt           # Open FD 4 for reading
read -r line <&4            # Read from FD 4
exec 4<&-                   # Close FD 4

exec 5<> file.txt           # Open FD 5 for read/write
```

### Swap stdout and stderr

```bash
command 3>&1 1>&2 2>&3 3>&-
# 3=stdout, stdout=stderr, stderr=3(old stdout), close 3
```

### Redirect Within a Block

```bash
{
    echo "This goes to the file"
    echo "This too"
    ls -la
} > output.txt 2>&1

# Subshell redirection
(
    cd /tmp
    ls
) > listing.txt
```

---

## Named Pipes (FIFOs)

A named pipe is a special file that acts as a pipe between processes:

```bash
mkfifo my_pipe

# Terminal 1:
echo "hello" > my_pipe      # Blocks until someone reads

# Terminal 2:
cat < my_pipe               # Reads "hello", both unblock
```

Named pipes persist on the filesystem. Data flows in one direction. Useful for inter-process communication.

---

## Common Patterns

### Log Processing

```bash
# Tail a log and filter
tail -f app.log | grep --line-buffered "ERROR"

# Split stdout and stderr to different files
./script.sh > stdout.log 2> stderr.log

# Capture both to file while showing on screen
./script.sh 2>&1 | tee full.log
```

### Conditional Piping

```bash
# Run command only if previous succeeds
make && make test           # AND: run test only if make succeeds
make || echo "Build failed" # OR: echo only if make fails

# Chain with pipes
grep "pattern" file.txt | sort | head -10 || echo "No matches found"
```

### Reading Output into Variables

```bash
# Command substitution
result=$(ls -la | wc -l)

# Read into variable
read -r count <<< "$(wc -l < file.txt)"

# Read line by line from a pipe
while IFS= read -r line; do
    echo "Processing: $line"
done < <(find . -name "*.txt")
# Note: use process substitution, not pipe, to avoid subshell
```

### Avoiding the Subshell Pipe Trap

Pipes create subshells, so variables set inside a pipe loop are lost:

```bash
# WRONG: count stays 0 (pipe creates subshell)
count=0
cat file.txt | while read -r line; do
    count=$((count + 1))
done
echo $count    # 0!

# CORRECT: use redirection instead of pipe
count=0
while read -r line; do
    count=$((count + 1))
done < file.txt
echo $count    # Correct count

# CORRECT: use process substitution
count=0
while read -r line; do
    count=$((count + 1))
done < <(some_command)
echo $count    # Correct count
```

---

## Redirection Summary Table

| Syntax | Meaning |
|---|---|
| `cmd > file` | stdout to file (overwrite) |
| `cmd >> file` | stdout to file (append) |
| `cmd 2> file` | stderr to file |
| `cmd 2>> file` | stderr to file (append) |
| `cmd > file 2>&1` | stdout and stderr to file |
| `cmd &> file` | stdout and stderr to file (bash) |
| `cmd < file` | stdin from file |
| `cmd << DELIM` | Here document |
| `cmd <<< "string"` | Here string |
| `cmd1 \| cmd2` | Pipe stdout |
| `cmd1 \|& cmd2` | Pipe stdout and stderr (bash 4+) |
| `cmd > /dev/null` | Discard output |
| `cmd 2>&1` | stderr to stdout |
| `cmd 1>&2` | stdout to stderr |
| `exec N> file` | Open FD N for writing |
| `exec N< file` | Open FD N for reading |
| `cmd <(cmd2)` | Process substitution (input) |
| `cmd >(cmd2)` | Process substitution (output) |
