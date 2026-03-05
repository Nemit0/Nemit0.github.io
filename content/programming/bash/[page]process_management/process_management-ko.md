---
title: "프로세스 관리 (ps, kill, top)"
description: "Unix/Linux 프로세스 관리 — ps, top/htop으로 프로세스 확인, 시그널, kill, 작업 제어, nohup, 프로세스 모니터링."
date: "2026-03-05"
category: "programming/bash"
tags: ["bash", "Linux", "프로세스", "ps", "kill", "top", "시그널", "작업 제어"]
author: "Nemit"
featured: false
pinned: false
---

# 프로세스 관리 (ps, kill, top)

## 프로세스란?

**프로세스**는 실행 중인 프로그램의 인스턴스입니다. 각 프로세스는 다음을 가집니다:

- **PID** (Process ID): 고유한 정수 식별자
- **PPID** (Parent PID): 이 프로세스를 생성한 부모 프로세스의 ID
- **UID/GID**: 프로세스를 실행하는 사용자와 그룹
- **상태**: 실행 중, 대기 중, 정지, 좀비 등
- **우선순위/Nice 값**: 스케줄링 우선순위

```bash
echo $$          # 현재 쉘의 PID
echo $!          # 마지막 백그라운드 프로세스의 PID
echo $?          # 마지막 명령의 종료 상태
```

---

## ps — 프로세스 스냅샷

`ps`는 현재 프로세스의 스냅샷을 보여줍니다.

### 주요 사용법

```bash
ps                    # 현재 터미널의 프로세스
ps aux                # 모든 사용자의 모든 프로세스 (BSD 스타일)
ps -ef                # 모든 프로세스 (POSIX 스타일)
ps -u alice           # alice 소유 프로세스
ps -p 1234            # 특정 PID
ps --forest           # 프로세스 트리 표시
ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu | head   # 커스텀 포맷, CPU순 정렬
```

### ps aux 출력 컬럼

```
USER  PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
root    1  0.0  0.1 169376 13120 ?    Ss   Feb28   0:03 /sbin/init
alice 5432  2.1  1.5 987654 61234 pts/0 R+  10:30   0:05 python3 script.py
```

| 컬럼 | 의미 |
|---|---|
| `USER` | 프로세스 소유자 |
| `PID` | 프로세스 ID |
| `%CPU` | CPU 사용률 |
| `%MEM` | 메모리 사용률 |
| `VSZ` | 가상 메모리 크기 (KB) |
| `RSS` | 실제 물리 메모리 사용량 (KB) |
| `TTY` | 터미널 (? = 터미널 없음) |
| `STAT` | 프로세스 상태 |
| `TIME` | 누적 CPU 시간 |
| `COMMAND` | 실행 명령어 |

### 프로세스 상태 (STAT)

| 코드 | 상태 | 설명 |
|---|---|---|
| `R` | Running | CPU에서 실행 중 또는 실행 대기열에 있음 |
| `S` | Sleeping | 이벤트 대기 중 (인터럽트 가능) |
| `D` | Disk sleep | I/O 대기 중 (인터럽트 불가) |
| `T` | Stopped | 일시 정지됨 (예: Ctrl+Z) |
| `Z` | Zombie | 종료되었으나 부모가 wait하지 않음 |
| `I` | Idle | 대기 중인 커널 스레드 |

### 프로세스 검색

```bash
ps aux | grep nginx                  # 이름으로 검색
pgrep nginx                         # 패턴 매칭 PID 반환
pgrep -la nginx                     # PID와 전체 명령줄 표시
pidof nginx                         # 프로그램의 PID 반환
```

---

## top / htop — 실시간 모니터링

### top

```bash
top                                  # 대화형 프로세스 뷰어
top -d 2                             # 2초마다 갱신
top -p 1234,5678                     # 특정 PID 모니터링
top -u alice                         # alice의 프로세스만
top -bn1                             # 배치 모드, 1회 반복 (스크립트용)
```

### top 대화형 키

| 키 | 동작 |
|---|---|
| `q` | 종료 |
| `P` | CPU순 정렬 |
| `M` | 메모리순 정렬 |
| `T` | 시간순 정렬 |
| `k` | 프로세스 종료 (PID 입력) |
| `r` | 우선순위 변경 (renice) |
| `1` | 개별 CPU 표시 토글 |
| `c` | 전체 명령 경로 토글 |
| `H` | 스레드 표시 토글 |

### top 헤더

```
top - 10:30:00 up 5 days, 3:14,  2 users,  load average: 0.15, 0.10, 0.08
Tasks: 256 total,   1 running, 254 sleeping,   0 stopped,   1 zombie
%Cpu(s):  5.2 us,  1.3 sy,  0.0 ni, 93.2 id,  0.2 wa,  0.0 hi,  0.1 si
```

- **load average**: 1/5/15분 평균. CPU 수보다 크면 과부하
- **us**: 사용자 공간 CPU%, **sy**: 시스템(커널)%, **id**: 유휴%, **wa**: I/O 대기%

### htop

`htop`은 개선된 대화형 프로세스 뷰어입니다:

```bash
htop                                 # 설치되어 있으면 실행
sudo apt install htop                # Debian/Ubuntu 설치
```

top 대비 장점: 스크롤 가능, 마우스 지원, 트리 뷰, 쉬운 kill/nice, 색상 표시.

---

## 시그널

시그널은 프로세스에 보내는 **소프트웨어 인터럽트**입니다.

### 주요 시그널

| 시그널 | 번호 | 기본 동작 | 설명 |
|---|---|---|---|
| `SIGHUP` | 1 | 종료 | 터미널 끊김 |
| `SIGINT` | 2 | 종료 | 인터럽트 (Ctrl+C) |
| `SIGQUIT` | 3 | 종료 + 코어 덤프 | 종료 (Ctrl+\\) |
| `SIGKILL` | 9 | 종료 (잡을 수 없음) | 강제 종료 |
| `SIGTERM` | 15 | 종료 | 정상 종료 (기본값) |
| `SIGSTOP` | 19 | 정지 (잡을 수 없음) | 프로세스 일시 정지 |
| `SIGTSTP` | 20 | 정지 | 터미널 정지 (Ctrl+Z) |
| `SIGCONT` | 18 | 계속 | 정지된 프로세스 재개 |

**SIGKILL (9)**과 **SIGSTOP (19)**은 잡거나 차단하거나 무시할 수 **없습니다**.

### kill — 시그널 보내기

```bash
kill 1234                 # PID 1234에 SIGTERM (15) 보내기
kill -9 1234              # SIGKILL — 강제 종료
kill -TERM 1234           # 기본값과 동일 (SIGTERM)
kill -HUP 1234            # SIGHUP 보내기 (데몬 설정 리로드용)
kill -STOP 1234           # 프로세스 일시 정지
kill -CONT 1234           # 프로세스 재개

kill -l                   # 모든 시그널 목록
kill -0 1234              # 프로세스 존재 확인 (시그널 보내지 않음)
```

### killall과 pkill

```bash
# 이름으로 종료
killall nginx             # "nginx" 이름의 모든 프로세스에 SIGTERM
killall -9 nginx          # 강제 종료

# 패턴으로 종료
pkill nginx               # 패턴 매칭으로 종료
pkill -f "python script"  # 전체 명령줄에서 매칭
pkill -u alice python     # alice의 python 프로세스만 종료
```

### 올바른 프로세스 종료 순서

1. `kill PID` (SIGTERM) — 정상적인 종료 요청
2. 몇 초 대기
3. `kill -9 PID` (SIGKILL) — SIGTERM 실패 시에만 강제 종료

```bash
kill $PID
sleep 3
kill -0 $PID 2>/dev/null && kill -9 $PID
```

---

## 작업 제어

### 백그라운드와 포그라운드

```bash
sleep 100 &               # 백그라운드에서 시작 (& 사용)
[1] 12345                  # 작업 번호와 PID

jobs                       # 백그라운드 작업 목록
fg %1                      # 작업 1을 포그라운드로 전환
bg %1                      # 정지된 작업을 백그라운드에서 재개

# Ctrl+Z                   # 포그라운드 프로세스 일시 정지
# 그 후: bg로 백그라운드 계속 실행, 또는 fg로 포그라운드 재개
```

### 작업 식별자

| 문법 | 의미 |
|---|---|
| `%1` | 작업 번호 1 |
| `%+` 또는 `%%` | 현재(가장 최근) 작업 |
| `%-` | 이전 작업 |
| `%string` | 명령이 string으로 시작하는 작업 |
| `%?string` | 명령에 string이 포함된 작업 |

### disown — 쉘에서 분리

```bash
long_running_command &     # 백그라운드에서 시작
disown %1                  # 쉘의 작업 테이블에서 제거
# 터미널을 닫아도 프로세스가 계속 실행됨
```

---

## nohup — 터미널 종료 후에도 실행

```bash
nohup long_command &                    # SIGHUP 무시, 출력은 nohup.out에
nohup long_command > output.log 2>&1 &  # 사용자 지정 출력 파일
```

`nohup`은 터미널이 닫힐 때 보내지는 SIGHUP을 무시합니다.

### nohup 대안

```bash
# screen — 터미널 멀티플렉서
screen -S mysession            # 세션 생성
# Ctrl+A, D로 분리
screen -r mysession            # 다시 연결

# tmux — 현대적 터미널 멀티플렉서
tmux new -s mysession
# Ctrl+B, D로 분리
tmux attach -t mysession

# systemd 서비스 (데몬용)
sudo systemctl start myservice
```

---

## 프로세스 우선순위 (nice, renice)

Linux 스케줄링 우선순위 범위: -20(가장 높음) ~ 19(가장 낮음). 기본값은 0.

```bash
nice -n 10 command            # 낮은 우선순위로 시작 (nice = 10)
nice -n -5 command            # 높은 우선순위 (음수는 root 필요)

renice 15 -p 1234             # 실행 중인 프로세스의 우선순위 변경
renice -5 -p 1234             # 높은 우선순위 (root 전용)
renice 10 -u alice            # alice의 모든 프로세스 변경
```

---

## 프로세스 정보 확인

```bash
# /proc 파일시스템
cat /proc/1234/status          # 프로세스 상태 상세 정보
cat /proc/1234/cmdline         # 전체 명령줄
ls -la /proc/1234/fd/          # 열린 파일 디스크립터

# 기타 도구
lsof -p 1234                   # 프로세스가 열고 있는 파일
lsof -i :80                    # 포트 80을 사용하는 프로세스
strace -p 1234                 # 시스템 콜 추적 (디버깅)

# 프로세스 트리
pstree                         # 모든 프로세스를 트리로 표시
pstree -p                      # PID 포함
```

---

## 프로세스 모니터링

### watch

```bash
watch -n 2 "ps aux | grep nginx"      # 2초마다 실행
watch -d "df -h"                        # 변경 사항 강조
```

### wait와 timeout

```bash
wait $PID                    # 특정 백그라운드 프로세스 완료 대기
wait                         # 모든 백그라운드 프로세스 대기

timeout 30 long_command       # 30초 후 종료 (SIGTERM)
timeout -k 5 30 long_command  # 30초 후 SIGTERM, 5초 더 지나면 SIGKILL
```

### 시스템 리소스 확인

```bash
free -h                       # 메모리 사용량
df -h                         # 디스크 공간
uptime                        # 시스템 가동 시간과 부하 평균
vmstat 1 5                    # 가상 메모리 통계 (1초 간격, 5회)
iostat 1 5                    # I/O 통계
```
