---
title: "Process Management (ps, kill, top)"
description: "Unix/Linux process management — viewing processes with ps and top, signals, kill, job control, background processes, nohup, and process monitoring."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "Linux", "processes", "ps", "kill", "top", "signals", "job control"]
author: "Nemit"
featured: false
pinned: false
---

# Process Management (ps, kill, top)

## What Is a Process?

A **process** is a running instance of a program. Each process has:

- **PID** (Process ID): unique integer identifier
- **PPID** (Parent PID): the process that spawned it
- **UID/GID**: user and group running the process
- **State**: running, sleeping, stopped, zombie, etc.
- **Priority/Nice value**: scheduling priority

```bash
echo $$          # Current shell's PID
echo $!          # PID of last background process
echo $?          # Exit status of last command
```

---

## ps — Process Snapshot

`ps` shows a snapshot of current processes.

### Common Usage

```bash
ps                    # Processes in current terminal
ps aux                # All processes, all users (BSD style)
ps -ef                # All processes (POSIX/System V style)
ps -u alice           # Processes owned by alice
ps -p 1234            # Specific PID
ps --forest           # Show process tree
ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu | head   # Custom format, sorted
```

### BSD vs POSIX Style

| BSD (`ps aux`) | POSIX (`ps -ef`) | Meaning |
|---|---|---|
| `a` | `-e` | All processes |
| `u` | | User-oriented format |
| `x` | | Include processes without terminal |
| | `-f` | Full format |

### ps aux Output Columns

```
USER  PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
root    1  0.0  0.1 169376 13120 ?    Ss   Feb28   0:03 /sbin/init
alice 5432  2.1  1.5 987654 61234 pts/0 R+  10:30   0:05 python3 script.py
```

| Column | Meaning |
|---|---|
| `USER` | Process owner |
| `PID` | Process ID |
| `%CPU` | CPU usage percentage |
| `%MEM` | Memory usage percentage |
| `VSZ` | Virtual memory size (KB) |
| `RSS` | Resident set size — actual RAM used (KB) |
| `TTY` | Terminal (? = no terminal) |
| `STAT` | Process state |
| `START` | Start time |
| `TIME` | Cumulative CPU time |
| `COMMAND` | Command with arguments |

### Process States (STAT)

| Code | State | Meaning |
|---|---|---|
| `R` | Running | On CPU or in run queue |
| `S` | Sleeping | Waiting for an event (interruptible) |
| `D` | Disk sleep | Waiting for I/O (uninterruptible) |
| `T` | Stopped | Suspended (e.g., Ctrl+Z) |
| `Z` | Zombie | Terminated but not waited by parent |
| `I` | Idle | Kernel thread waiting |

Additional characters:
- `s` — session leader
- `+` — foreground process group
- `l` — multi-threaded
- `<` — high priority (negative nice)
- `N` — low priority (positive nice)

### Finding Processes

```bash
ps aux | grep nginx                  # Search by name
ps -C nginx                         # By exact command name
pgrep nginx                         # Get PIDs matching pattern
pgrep -la nginx                     # PIDs with full command line
pidof nginx                         # Get PID of a program
```

---

## top / htop — Real-Time Monitoring

### top

```bash
top                                  # Interactive process viewer
top -d 2                             # Update every 2 seconds
top -p 1234,5678                     # Monitor specific PIDs
top -u alice                         # Only alice's processes
top -bn1                             # Batch mode, 1 iteration (for scripting)
```

top Interactive Keys:

| Key | Action |
|---|---|
| `q` | Quit |
| `P` | Sort by CPU |
| `M` | Sort by memory |
| `T` | Sort by time |
| `k` | Kill a process (prompts for PID) |
| `r` | Renice (change priority) |
| `f` | Select display fields |
| `1` | Toggle individual CPUs |
| `c` | Toggle full command path |
| `H` | Toggle threads |

### top Header

```
top - 10:30:00 up 5 days, 3:14,  2 users,  load average: 0.15, 0.10, 0.08
Tasks: 256 total,   1 running, 254 sleeping,   0 stopped,   1 zombie
%Cpu(s):  5.2 us,  1.3 sy,  0.0 ni, 93.2 id,  0.2 wa,  0.0 hi,  0.1 si
MiB Mem:  16384.0 total,   8192.0 free,   4096.0 used,   4096.0 buff/cache
MiB Swap:  8192.0 total,   8192.0 free,      0.0 used.  12000.0 avail Mem
```

- **load average**: 1/5/15 minute averages. Values > number of CPUs indicate overload
- **us**: user space CPU%, **sy**: system (kernel)%, **id**: idle%, **wa**: I/O wait%

### htop

`htop` is an improved interactive process viewer:

```bash
htop                                 # If installed
sudo apt install htop                # Debian/Ubuntu
```

Features over top: scrollable, mouse support, tree view, easier kill/nice, color-coded.

---

## Signals

Signals are software interrupts sent to processes. Each signal has a number and a name.

### Common Signals

| Signal | Number | Default Action | Meaning |
|---|---|---|---|
| `SIGHUP` | 1 | Terminate | Hangup (terminal closed) |
| `SIGINT` | 2 | Terminate | Interrupt (Ctrl+C) |
| `SIGQUIT` | 3 | Terminate + core dump | Quit (Ctrl+\\) |
| `SIGKILL` | 9 | Terminate (uncatchable) | Force kill |
| `SIGTERM` | 15 | Terminate | Graceful termination (default) |
| `SIGSTOP` | 19 | Stop (uncatchable) | Pause process |
| `SIGTSTP` | 20 | Stop | Terminal stop (Ctrl+Z) |
| `SIGCONT` | 18 | Continue | Resume stopped process |
| `SIGUSR1` | 10 | Terminate | User-defined signal 1 |
| `SIGUSR2` | 12 | Terminate | User-defined signal 2 |
| `SIGCHLD` | 17 | Ignore | Child process status changed |
| `SIGPIPE` | 13 | Terminate | Broken pipe |
| `SIGALRM` | 14 | Terminate | Alarm timer expired |
| `SIGSEGV` | 11 | Terminate + core dump | Segmentation fault |

**SIGKILL (9)** and **SIGSTOP (19)** cannot be caught, blocked, or ignored.

### kill — Send Signals

```bash
kill 1234                 # Send SIGTERM (15) to PID 1234
kill -9 1234              # Send SIGKILL — force kill
kill -TERM 1234           # Same as default (SIGTERM)
kill -HUP 1234            # Send SIGHUP (reload config for many daemons)
kill -STOP 1234           # Pause process
kill -CONT 1234           # Resume process

kill -l                   # List all signals
kill -0 1234              # Check if process exists (no signal sent)
```

### killall — Kill by Name

```bash
killall nginx             # SIGTERM to all processes named "nginx"
killall -9 nginx          # SIGKILL to all nginx processes
killall -u alice          # Kill all of alice's processes
killall -i nginx          # Interactive (confirm each)
```

### pkill — Kill by Pattern

```bash
pkill nginx               # Kill processes matching "nginx"
pkill -f "python script"  # Match full command line
pkill -u alice python     # Kill alice's python processes
pkill -STOP -u alice      # Pause all of alice's processes
```

### Proper Process Termination Order

1. `kill PID` (SIGTERM) — ask nicely, let it clean up
2. Wait a few seconds
3. `kill -9 PID` (SIGKILL) — force kill (only if SIGTERM failed)

```bash
kill $PID
sleep 3
kill -0 $PID 2>/dev/null && kill -9 $PID
```

---

## Job Control

### Background and Foreground

```bash
sleep 100 &               # Start in background (& at end)
[1] 12345                  # Job number and PID

jobs                       # List background jobs
fg %1                      # Bring job 1 to foreground
bg %1                      # Resume stopped job in background

# Ctrl+Z                   # Suspend (stop) foreground process
# Then: bg to continue in background, or fg to resume in foreground
```

### Job Identifiers

| Syntax | Meaning |
|---|---|
| `%1` | Job number 1 |
| `%+` or `%%` | Current (most recent) job |
| `%-` | Previous job |
| `%string` | Job whose command starts with string |
| `%?string` | Job whose command contains string |

### Disown — Detach from Shell

```bash
long_running_command &     # Start in background
disown %1                  # Remove from shell's job table
# Process continues even after terminal closes
```

---

## nohup — Survive Terminal Close

```bash
nohup long_command &                    # Ignore SIGHUP, output to nohup.out
nohup long_command > output.log 2>&1 &  # Custom output file
```

`nohup` prevents SIGHUP from killing the process when the terminal closes. Output goes to `nohup.out` by default.

### Alternatives to nohup

```bash
# screen — terminal multiplexer
screen -S mysession            # Create named session
# ... run commands ...
# Ctrl+A, D to detach
screen -r mysession            # Reattach

# tmux — modern terminal multiplexer
tmux new -s mysession
# ... run commands ...
# Ctrl+B, D to detach
tmux attach -t mysession

# systemd service (for daemons)
sudo systemctl start myservice
```

---

## Process Priority (nice, renice)

Linux scheduling priorities range from -20 (highest) to 19 (lowest). Default is 0.

```bash
nice -n 10 command            # Start with lower priority (nice = 10)
nice -n -5 command            # Higher priority (needs root for negative)

renice 15 -p 1234             # Change running process priority
renice -5 -p 1234             # Higher priority (root only)
renice 10 -u alice            # Change all of alice's processes
```

### ionice — I/O Priority

```bash
ionice -c 3 command           # Idle I/O class (only when disk is idle)
ionice -c 2 -n 7 command      # Best-effort, lowest priority
ionice -c 1 command           # Real-time I/O (root only)
```

---

## Process Information

```bash
# /proc filesystem
cat /proc/1234/status          # Process status details
cat /proc/1234/cmdline         # Full command line
cat /proc/1234/environ         # Environment variables
ls -la /proc/1234/fd/          # Open file descriptors
cat /proc/1234/maps            # Memory mappings

# Other tools
lsof -p 1234                   # Open files by process
lsof -i :80                    # Processes using port 80
strace -p 1234                 # System call trace (debugging)
ltrace -p 1234                 # Library call trace

# Process tree
pstree                         # Show all processes as tree
pstree -p                      # Include PIDs
pstree alice                   # Tree for specific user
```

---

## Process Monitoring Scripts

### Watch a Command

```bash
watch -n 2 "ps aux | grep nginx"      # Run every 2 seconds
watch -d "df -h"                        # Highlight changes
```

### Wait for Process

```bash
wait $PID                    # Wait for specific background process
wait                         # Wait for all background processes
wait -n                      # Wait for any one background process (bash 4.3+)
```

### Timeout

```bash
timeout 30 long_command       # Kill after 30 seconds (SIGTERM)
timeout -k 5 30 long_command  # SIGTERM after 30s, SIGKILL after 5 more seconds
```

### System Resource Usage

```bash
free -h                       # Memory usage
df -h                         # Disk space
uptime                        # System uptime and load average
vmstat 1 5                    # Virtual memory stats (1 sec interval, 5 times)
iostat 1 5                    # I/O statistics
mpstat -P ALL 1               # Per-CPU statistics
sar -u 1 5                    # System activity report
```
