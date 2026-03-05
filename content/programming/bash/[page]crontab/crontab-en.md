---
title: "crontab — Scheduled Tasks"
description: "How cron works in Unix/Linux — crontab syntax, scheduling expressions, environment, common patterns, systemd timers comparison, and troubleshooting."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "crontab", "cron", "scheduling", "automation", "Linux"]
author: "Nemit"
featured: false
pinned: false
---

# crontab — Scheduled Tasks

## What Is cron?

**cron** is a Unix/Linux daemon that executes scheduled commands at specified times. Each user can have a **crontab** (cron table) — a file listing commands and their schedules.

```bash
crontab -e          # Edit your crontab
crontab -l          # List your crontab
crontab -r          # Remove your crontab
crontab -u alice -l # List another user's crontab (root only)
```

---

## Crontab Syntax

Each line in a crontab has the format:

```
┌───────── minute (0-59)
│ ┌─────── hour (0-23)
│ │ ┌───── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─ day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * * command to execute
```

### Field Values

| Field | Range | Special Values |
|---|---|---|
| Minute | 0-59 | |
| Hour | 0-23 | |
| Day of Month | 1-31 | |
| Month | 1-12 or jan-dec | |
| Day of Week | 0-7 or sun-sat | 0 and 7 both = Sunday |

### Special Characters

| Character | Meaning | Example |
|---|---|---|
| `*` | Any value | `* * * * *` = every minute |
| `,` | List of values | `1,15,30` = at 1, 15, and 30 |
| `-` | Range | `1-5` = 1 through 5 |
| `/` | Step | `*/5` = every 5 units |

---

## Examples

```bash
# Every minute
* * * * * /path/to/script.sh

# Every 5 minutes
*/5 * * * * /path/to/script.sh

# Every hour at minute 0
0 * * * * /path/to/script.sh

# Every day at 2:30 AM
30 2 * * * /path/to/script.sh

# Every Monday at 9:00 AM
0 9 * * 1 /path/to/script.sh

# Every weekday (Mon-Fri) at 8:00 AM
0 8 * * 1-5 /path/to/script.sh

# First day of every month at midnight
0 0 1 * * /path/to/script.sh

# Every 15 minutes during business hours (9-17) on weekdays
*/15 9-17 * * 1-5 /path/to/script.sh

# Twice a day at 6 AM and 6 PM
0 6,18 * * * /path/to/script.sh

# Every quarter (Jan, Apr, Jul, Oct) on the 1st at midnight
0 0 1 1,4,7,10 * /path/to/script.sh

# Every Sunday at 3:00 AM
0 3 * * 0 /path/to/script.sh
```

### Special Strings

Some cron implementations support shortcuts:

```bash
@reboot     /path/to/script.sh    # Run once at startup
@yearly     /path/to/script.sh    # 0 0 1 1 * (Jan 1 midnight)
@annually   /path/to/script.sh    # Same as @yearly
@monthly    /path/to/script.sh    # 0 0 1 * * (1st of month midnight)
@weekly     /path/to/script.sh    # 0 0 * * 0 (Sunday midnight)
@daily      /path/to/script.sh    # 0 0 * * * (midnight)
@midnight   /path/to/script.sh    # Same as @daily
@hourly     /path/to/script.sh    # 0 * * * * (every hour)
```

---

## Environment

Cron jobs run with a **minimal environment** — not your shell profile. Common issues:

```bash
# PATH is limited (typically just /usr/bin:/bin)
# Use full paths for commands:
* * * * * /usr/local/bin/python3 /home/user/script.py

# Or set PATH in crontab:
PATH=/usr/local/bin:/usr/bin:/bin
SHELL=/bin/bash
MAILTO=admin@example.com

* * * * * script.sh
```

### Crontab Environment Variables

```bash
SHELL=/bin/bash              # Shell to run commands (default: /bin/sh)
PATH=/usr/local/bin:/usr/bin # Search path for commands
MAILTO=user@example.com     # Email output to this address
MAILTO=""                   # Disable email notifications
HOME=/home/user             # Working directory
```

### Handling Output

By default, cron emails any stdout/stderr to the user. To manage output:

```bash
# Discard all output
* * * * * /path/to/script.sh > /dev/null 2>&1

# Log output to file
* * * * * /path/to/script.sh >> /var/log/myscript.log 2>&1

# Log with timestamp
* * * * * /path/to/script.sh 2>&1 | while read line; do echo "$(date): $line"; done >> /var/log/myscript.log
```

---

## System Crontab (`/etc/crontab`)

The system crontab has an extra field — the **user** to run as:

```
# /etc/crontab
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin

# minute hour dom month dow user command
*/15 * * * * root /usr/local/bin/backup.sh
0 3 * * * www-data /var/www/cleanup.sh
```

### Cron Directories

```bash
/etc/cron.d/          # Drop-in crontab files (system format)
/etc/cron.daily/      # Scripts run daily
/etc/cron.hourly/     # Scripts run hourly
/etc/cron.weekly/     # Scripts run weekly
/etc/cron.monthly/    # Scripts run monthly
```

Place executable scripts in these directories (no crontab syntax needed — just the script):

```bash
sudo cp backup.sh /etc/cron.daily/
sudo chmod +x /etc/cron.daily/backup.sh
```

---

## Day of Month + Day of Week

When both day of month and day of week are specified (not `*`), the job runs when **either** condition is met (OR, not AND):

```bash
# Runs on the 15th AND every Friday
0 0 15 * 5 /path/to/script.sh
# This runs on the 15th of every month AND every Friday
```

This is a common source of confusion. To run only when both match, use a wrapper:

```bash
# Run only on Friday the 13th
0 0 13 * * [ "$(date +\%u)" = "5" ] && /path/to/script.sh
```

---

## Practical Patterns

### Log Rotation

```bash
0 0 * * * find /var/log/myapp -name "*.log" -mtime +30 -delete
```

### Database Backup

```bash
0 2 * * * mysqldump -u root mydb | gzip > /backup/mydb_$(date +\%Y\%m\%d).sql.gz
```

Note: `%` has special meaning in crontab (newline). Escape with `\%`.

### Health Check

```bash
*/5 * * * * curl -sf http://localhost:8080/health || systemctl restart myapp
```

### Cleanup Temp Files

```bash
0 4 * * * find /tmp -type f -atime +7 -delete 2>/dev/null
```

### Certificate Renewal

```bash
0 3 * * 1 certbot renew --quiet && systemctl reload nginx
```

---

## Troubleshooting

### Check if cron is running

```bash
systemctl status cron         # systemd
service cron status           # SysVinit
ps aux | grep cron
```

### View cron logs

```bash
grep CRON /var/log/syslog           # Debian/Ubuntu
grep CRON /var/log/cron             # RHEL/CentOS
journalctl -u cron                  # systemd
```

### Common Issues

1. **Script not found**: Use absolute paths for everything
2. **Environment differs**: Set `PATH` in crontab or use full paths
3. **Permission denied**: Ensure script is executable (`chmod +x`)
4. **No output**: Add logging `>> /tmp/cron.log 2>&1`
5. **Percent signs**: Escape `%` as `\%` in crontab entries
6. **Editor issues**: Set `EDITOR=vim` before `crontab -e`

### Test a Cron Command

Run the command manually with cron's environment:

```bash
env -i SHELL=/bin/sh PATH=/usr/bin:/bin HOME=$HOME /path/to/script.sh
```

---

## systemd Timers (Modern Alternative)

systemd timers are the modern replacement for cron on systemd-based systems:

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Backup service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

```bash
sudo systemctl enable --now backup.timer
systemctl list-timers                      # List all timers
```

### cron vs systemd Timers

| Feature | cron | systemd Timer |
|---|---|---|
| Configuration | Single crontab file | Service + timer unit files |
| Logging | Syslog/mail | journalctl |
| Dependencies | None | Can depend on other units |
| Missed runs | Lost | `Persistent=true` catches up |
| Second precision | No (minute only) | Yes |
| Resource limits | No | Yes (CPU, memory, IO) |
| Random delay | No | `RandomizedDelaySec` |
