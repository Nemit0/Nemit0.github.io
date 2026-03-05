---
title: "Crontab (작업 스케줄링)"
description: "Unix/Linux 작업 스케줄링 — cron 문법, crontab 관리, 환경 설정, 시스템 crontab, systemd 타이머 비교."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "Linux", "crontab", "cron", "스케줄링", "자동화"]
author: "Nemit"
featured: false
pinned: false
---

# Crontab (작업 스케줄링)

## cron이란?

**cron**은 Unix/Linux에서 **반복적인 작업을 자동으로 실행**하는 시간 기반 작업 스케줄러입니다. **crontab**(cron table)은 사용자별 작업 스케줄을 정의하는 파일입니다.

---

## crontab 관리

```bash
crontab -e          # 현재 사용자의 crontab 편집
crontab -l          # 현재 사용자의 crontab 목록 표시
crontab -r          # 현재 사용자의 crontab 전체 삭제 (주의!)
crontab -u alice -e # alice 사용자의 crontab 편집 (root 권한 필요)
```

---

## cron 시간 표현식

```
┌───────────── 분 (0 - 59)
│ ┌───────────── 시 (0 - 23)
│ │ ┌───────────── 일 (1 - 31)
│ │ │ ┌───────────── 월 (1 - 12)
│ │ │ │ ┌───────────── 요일 (0 - 7, 0과 7은 일요일)
│ │ │ │ │
* * * * * command
```

### 특수 문자

| 문자 | 의미 | 예시 |
|---|---|---|
| `*` | 모든 값 | `* * * * *` = 매분 |
| `,` | 값 목록 | `1,15,30` = 1, 15, 30에 |
| `-` | 범위 | `1-5` = 1부터 5까지 |
| `/` | 간격 | `*/15` = 15마다 |

### 예시

```bash
# 매분 실행
* * * * * /path/to/script.sh

# 매시간 정각
0 * * * * /path/to/script.sh

# 매일 오전 2시
0 2 * * * /path/to/backup.sh

# 매일 오전 9시와 오후 6시
0 9,18 * * * /path/to/report.sh

# 평일(월~금) 오전 8시
0 8 * * 1-5 /path/to/morning.sh

# 15분마다
*/15 * * * * /path/to/check.sh

# 매월 1일 자정
0 0 1 * * /path/to/monthly.sh

# 매주 일요일 오전 3시
0 3 * * 0 /path/to/weekly.sh

# 1월~6월의 매일 정오
0 12 * * * 1-6 /path/to/halfyear.sh

# 30분마다 (평일에만)
*/30 * * * 1-5 /path/to/work_check.sh
```

### 특수 문자열 (비표준, 대부분의 cron 구현에서 지원)

```bash
@reboot     # 시스템 부팅 시 한 번 실행
@yearly     # 매년 (0 0 1 1 *)
@monthly    # 매월 (0 0 1 * *)
@weekly     # 매주 (0 0 * * 0)
@daily      # 매일 (0 0 * * *)
@hourly     # 매시간 (0 * * * *)
```

---

## cron 환경

cron 작업은 **제한된 환경**에서 실행됩니다. 일반 쉘 세션과 다릅니다.

### 주요 차이점

```bash
# cron의 기본 PATH는 매우 제한적
# /usr/bin:/bin 정도만 포함

# 해결 방법 1: 절대 경로 사용
* * * * * /usr/local/bin/python3 /home/user/script.py

# 해결 방법 2: crontab 상단에 환경 변수 설정
PATH=/usr/local/bin:/usr/bin:/bin
SHELL=/bin/bash
HOME=/home/user
MAILTO=user@example.com

# 해결 방법 3: 스크립트에서 환경 로드
* * * * * source /home/user/.bashrc && command
```

### 출력 처리

cron 작업의 출력은 기본적으로 **이메일**로 전송됩니다.

```bash
# 출력을 파일로 리다이렉트
* * * * * /path/to/script.sh > /var/log/myjob.log 2>&1

# 출력에 추가 (로그 누적)
* * * * * /path/to/script.sh >> /var/log/myjob.log 2>&1

# 출력 완전히 무시
* * * * * /path/to/script.sh > /dev/null 2>&1

# 이메일 수신자 변경
MAILTO=admin@example.com

# 이메일 비활성화
MAILTO=""
```

---

## 실용적인 crontab 예시

```bash
# 매일 새벽 3시에 데이터베이스 백업
0 3 * * * /home/user/scripts/db_backup.sh >> /var/log/backup.log 2>&1

# 5분마다 서버 상태 확인
*/5 * * * * /home/user/scripts/health_check.sh

# 매주 월요일 오전 9시에 보고서 생성
0 9 * * 1 /home/user/scripts/weekly_report.sh

# 매시간 임시 파일 정리
0 * * * * find /tmp -mtime +1 -delete

# 부팅 시 서비스 시작
@reboot /home/user/scripts/start_service.sh

# 매일 자정에 로그 로테이션
0 0 * * * /usr/sbin/logrotate /etc/logrotate.conf

# 매달 1일에 디스크 사용량 보고
0 8 1 * * df -h | mail -s "디스크 사용량 보고" admin@example.com
```

---

## 중복 실행 방지

같은 작업이 동시에 여러 번 실행되는 것을 방지합니다.

### flock 사용

```bash
# flock으로 잠금 파일 사용
* * * * * flock -n /tmp/myjob.lock /path/to/script.sh

# -n: 잠금 실패 시 즉시 종료 (대기하지 않음)
# -w 60: 최대 60초 대기
* * * * * flock -w 60 /tmp/myjob.lock /path/to/script.sh
```

### PID 파일 사용

```bash
#!/bin/bash
PIDFILE="/tmp/myjob.pid"

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "이미 실행 중"
    exit 1
fi

echo $$ > "$PIDFILE"
trap 'rm -f "$PIDFILE"' EXIT

# 실제 작업 수행
```

---

## cron 디버깅

```bash
# cron 로그 확인
grep CRON /var/log/syslog          # Debian/Ubuntu
grep cron /var/log/cron            # CentOS/RHEL
journalctl -u cron                 # systemd 시스템

# cron 서비스 상태 확인
systemctl status cron              # 또는 crond

# 환경 변수 확인용 작업
* * * * * env > /tmp/cron_env.txt

# 스크립트 수동 테스트 (cron과 유사한 환경)
env -i SHELL=/bin/bash PATH=/usr/bin:/bin HOME=$HOME /path/to/script.sh
```

### 일반적인 문제와 해결

| 문제 | 원인 | 해결 |
|---|---|---|
| 작업이 실행 안 됨 | PATH 문제 | 절대 경로 사용 |
| 권한 오류 | 스크립트 실행 권한 없음 | `chmod +x script.sh` |
| 출력이 없음 | 리다이렉트 안 됨 | `>> log 2>&1` 추가 |
| 환경 변수 없음 | cron은 제한된 환경 | crontab에서 설정 |
| 시간대 문제 | 시스템 시간대 확인 | `timedatectl` 확인 |

---

## systemd 타이머 (대안)

최신 Linux에서는 **systemd 타이머**가 cron의 대안입니다.

### cron vs systemd 타이머

| 특성 | cron | systemd 타이머 |
|---|---|---|
| 설정 방식 | 한 줄 문법 | 서비스 + 타이머 유닛 파일 |
| 로깅 | syslog/이메일 | journalctl 통합 |
| 의존성 | 없음 | 다른 서비스에 의존 가능 |
| 정밀도 | 분 단위 | 초/밀리초 단위 |
| 부팅 후 실행 | @reboot | OnBootSec |
| 누락 작업 처리 | 미지원 | Persistent=true로 보상 실행 |
| 관리 | crontab 명령 | systemctl 명령 |

### systemd 타이머 예시

서비스 유닛 (`/etc/systemd/system/backup.service`):

```ini
[Unit]
Description=일일 백업

[Service]
Type=oneshot
ExecStart=/home/user/scripts/backup.sh
```

타이머 유닛 (`/etc/systemd/system/backup.timer`):

```ini
[Unit]
Description=매일 백업 실행

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
# 활성화 및 시작
sudo systemctl enable backup.timer
sudo systemctl start backup.timer

# 상태 확인
systemctl list-timers
systemctl status backup.timer
```

---

## at — 일회성 작업 스케줄링

`at`은 **한 번만 실행**되는 작업을 예약합니다.

```bash
# 특정 시간에 실행
at 14:30
> /path/to/script.sh
> Ctrl+D

# 상대적 시간
at now + 30 minutes
at now + 2 hours
at midnight
at noon tomorrow

# 예약된 작업 목록
atq

# 예약된 작업 삭제
atrm 작업번호
```
