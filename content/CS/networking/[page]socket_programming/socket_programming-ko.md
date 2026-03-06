---
title: "소켓 프로그래밍 개념"
description: "네트워크 소켓 기본 원리 — 소켓 유형, 주소 구조, TCP 클라이언트/서버 생명주기, UDP 소켓, 비블로킹 I/O, select/poll/epoll, 일반적인 소켓 옵션."
date: "2026-03-06"
category: "CS/networking"
tags: ["네트워킹", "소켓", "TCP", "UDP", "네트워크 프로그래밍", "epoll"]
author: "Nemit"
featured: false
pinned: false
---

# 소켓 프로그래밍 개념

## 소켓이란?

**소켓**은 네트워크 통신의 엔드포인트다. 네트워크의 어디에서나 실행 중인 두 프로그램 간의 양방향 통신 채널의 한쪽 끝을 나타낸다.

소켓은 다음으로 식별된다:
- **IP 주소**: 호스트 식별
- **포트 번호**: 호스트의 프로세스 식별
- **프로토콜**: TCP 또는 UDP

```
클라이언트                          서버
IP: 10.0.0.1                    IP: 10.0.0.2
포트: 54321 (임시)               포트: 8080 (잘 알려진)

소켓: (10.0.0.1:54321, TCP)   소켓: (10.0.0.2:8080, TCP)
          └────────────────────────────────┘
                     연결
```

---

## 소켓 유형

| 유형 | 상수 | 프로토콜 | 설명 |
|---|---|---|---|
| 스트림 | `SOCK_STREAM` | TCP | 신뢰적, 순서 보장, 연결 지향 |
| 데이터그램 | `SOCK_DGRAM` | UDP | 신뢰성 없음, 순서 없음, 비연결 |
| 로우 | `SOCK_RAW` | IP/ICMP | 직접 IP 패킷 접근 (루트 필요) |

---

## TCP 서버 생명주기

```python
import socket

# 1. 소켓 생성
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 2. 소켓 옵션 설정 (선택사항이지만 권장)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# 3. 주소와 포트에 바인딩
server.bind(('0.0.0.0', 8080))

# 4. 수신 대기 (backlog = 최대 대기 연결)
server.listen(5)

# 5. 연결 수락 (클라이언트가 연결될 때까지 블록)
while True:
    conn, addr = server.accept()    # 새 소켓 + 클라이언트 주소 반환
    print(f"연결됨: {addr}")

    # 6. 통신
    data = conn.recv(1024)          # 최대 1024바이트 수신
    conn.sendall(b"Hello, World!")  # 응답 전송

    # 7. 연결 종료
    conn.close()
```

### 핵심 함수: 서버

| 함수 | 설명 |
|---|---|
| `socket()` | 새 소켓 생성 |
| `bind(addr)` | 소켓을 로컬 주소/포트에 연결 |
| `listen(backlog)` | 소켓을 수동(서버)으로 표시; 최대 `backlog` 연결을 큐에 넣음 |
| `accept()` | 클라이언트가 연결될 때까지 블록; 새 소켓 반환 |
| `recv(bufsize)` | 데이터 수신 (데이터 가용 시까지 블록) |
| `send(data)` | 데이터 전송 (전부 전송 안 될 수 있음; 반환값 확인) |
| `sendall(data)` | 모든 데이터 전송까지 계속 전송 |
| `close()` | 소켓 닫기 |

---

## TCP 클라이언트 생명주기

```python
import socket

# 1. 소켓 생성
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 2. 서버에 연결 (3-way 핸드셰이크 수행)
client.connect(('10.0.0.2', 8080))

# 3. 데이터 전송
client.sendall(b"Hello, Server!")

# 4. 응답 수신
data = client.recv(1024)
print(f"수신: {data}")

# 5. 종료
client.close()
```

---

## UDP 소켓 생명주기

UDP는 연결이 없다 — 그냥 전송하고 수신한다:

```python
# UDP 서버
server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
server.bind(('0.0.0.0', 9090))

while True:
    data, addr = server.recvfrom(1024)    # 데이터 + 송신자 주소 반환
    print(f"{addr}로부터: {data}")
    server.sendto(b"받았어요!", addr)       # 송신자에게 응답

# UDP 클라이언트
client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
client.sendto(b"안녕!", ('10.0.0.2', 9090))
data, server_addr = client.recvfrom(1024)
client.close()
```

---

## 소켓 주소 구조

### IPv4: `AF_INET`

```python
socket.AF_INET   # IPv4
addr = ('192.168.1.1', 8080)    # (호스트, 포트) 튜플
```

### IPv6: `AF_INET6`

```python
socket.AF_INET6  # IPv6
addr = ('::1', 8080, 0, 0)     # (호스트, 포트, flowinfo, scopeid)
```

### 유닉스 도메인 소켓: `AF_UNIX`

```python
socket.AF_UNIX   # 로컬 IPC (같은 머신)
addr = '/tmp/myapp.sock'
```

---

## 블로킹 vs 비블로킹 소켓

**블로킹** (기본): 데이터가 도착할 때까지 `recv()`가 블록됨; 클라이언트가 연결될 때까지 `accept()`가 블록됨.

**비블로킹**: 데이터가 없으면 `EAGAIN`/`EWOULDBLOCK`과 함께 즉시 반환됨.

```python
# 비블로킹 설정
sock.setblocking(False)

# 또는 타임아웃 설정
sock.settimeout(5.0)    # 5초 후 socket.timeout 발생

try:
    data = sock.recv(1024)
except socket.timeout:
    print("5초 동안 데이터 없음")
except BlockingIOError:
    print("지금 당장 데이터 없음")
```

---

## 다중화: select, poll, epoll

스레드당 하나의 연결 없이 많은 연결을 효율적으로 처리하기 위해:

### `select` (POSIX, 모든 플랫폼)

```python
import select

readable, writable, exceptional = select.select(
    [server, conn1, conn2],    # 읽기 가능 감시
    [],                         # 쓰기 가능 감시
    [],                         # 오류 감시
    timeout=1.0                 # 초 (None = 영원히 블록)
)

for sock in readable:
    if sock is server:
        conn, addr = server.accept()
    else:
        data = sock.recv(1024)
```

**한계**: 모든 파일 디스크립터의 O(n) 스캔; ~1024 FD 제한.

### `poll` (Linux/Unix)

`select`와 유사하지만 FD 제한 없음. 여전히 O(n).

### `epoll` (Linux 전용)

이벤트 알림에 O(1). 수천 개의 연결로 확장.

```python
import select

epoll = select.epoll()
epoll.register(server.fileno(), select.EPOLLIN)

while True:
    events = epoll.poll(timeout=1)
    for fd, event in events:
        if fd == server.fileno():
            conn, addr = server.accept()
            epoll.register(conn.fileno(), select.EPOLLIN)
        elif event & select.EPOLLIN:
            # fd 조회 딕셔너리에서 conn 가져오기
            data = connections[fd].recv(1024)
```

---

## 일반적인 소켓 옵션

```python
# 닫은 후 즉시 주소/포트 재사용 (TIME_WAIT 문제 방지)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)

# TCP keepalive (죽은 연결 감지)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

# Nagle 알고리즘 비활성화 (소형 메시지의 지연 감소)
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

# 송수신 버퍼 크기 설정
sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 65536)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 65536)

# 현재 버퍼 크기 가져오기
sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
```

---

## 연결 상태와 오류

| 상태 | 설명 |
|---|---|
| `ECONNREFUSED` | 해당 포트에서 서버가 수신 대기 중이지 않음 |
| `ETIMEDOUT` | 연결 시간 초과 (방화벽 드롭, 호스트 도달 불가) |
| `ECONNRESET` | 서버가 RST 전송 (충돌 또는 중단) |
| `EPIPE` | 닫힌 연결에 쓰기 |
| `EADDRINUSE` | 주소/포트가 이미 사용 중 (SO_REUSEADDR 사용) |

---

## 실습 예제: TCP 에코 서버 — 완전한 시스템 콜 추적

**시나리오**: 에코 서버가 "Hello"를 받고 되돌려 보낸다. OS 수준에서의 완전한 상호작용.

### 서버 측 (포트 9000에서 수신 대기)

```python
import socket

# syscall: socket(AF_INET, SOCK_STREAM, 0) → fd=3
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# syscall: setsockopt(3, SOL_SOCKET, SO_REUSEADDR, 1)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# syscall: bind(3, {AF_INET, "0.0.0.0", 9000})
server.bind(('0.0.0.0', 9000))

# syscall: listen(3, backlog=5)
# OS: SYN 큐(불완전 연결)와 수락 큐(완료된 연결) 생성
server.listen(5)

# syscall: accept(3, &client_addr) → 3-way 핸드셰이크 완료까지 블록
#   OS가 백그라운드에서 핸드셰이크 수행
#   연결을 위한 새 fd=4 반환; fd=3은 계속 수신 대기
conn, addr = server.accept()
print(f"연결됨: {addr}")   # 예: ('127.0.0.1', 54321)

# syscall: recv(4, buffer, 1024, 0) → 데이터가 올 때까지 블록
data = conn.recv(1024)
print(f"수신: {data}")    # b'Hello'

# syscall: send(4, data, len(data), 0)
conn.sendall(data)            # b'Hello' 다시 전송

# syscall: close(4) → 클라이언트에게 FIN 전송
conn.close()
server.close()
```

### 클라이언트 측

```python
import socket

# syscall: socket(AF_INET, SOCK_STREAM, 0) → fd=5
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# syscall: connect(5, {AF_INET, "127.0.0.1", 9000})
#   OS: 임시 포트 선택 (예: 54321)
#   SYN → SYN-ACK → ACK
client.connect(('127.0.0.1', 9000))

# syscall: send(5, "Hello", 5, 0)
client.sendall(b'Hello')

# syscall: recv(5, buffer, 1024, 0) → 에코가 올 때까지 블록
data = client.recv(1024)      # b'Hello'
print(f"에코: {data}")

# syscall: close(5) → 4-way 종료 시작
client.close()
```

### 상태 머신 타임라인

```
시간    클라이언트 상태      서버 상태       이벤트
  0초   CLOSED              LISTEN          서버 시작
  1초   SYN_SENT            SYN_RECEIVED    클라이언트: connect() → SYN 전송
  1초   ESTABLISHED         ESTABLISHED     핸드셰이크 완료
  2초   ESTABLISHED         ESTABLISHED     클라이언트: send("Hello")
  2초   ESTABLISHED         ESTABLISHED     서버: recv() → "Hello"; send("Hello")
  2초   ESTABLISHED         ESTABLISHED     클라이언트: recv() → "Hello"
  3초   FIN_WAIT_1          CLOSE_WAIT      클라이언트: close() → FIN 전송
  3초   FIN_WAIT_2          LAST_ACK        서버: close() → FIN 전송
  3초   TIME_WAIT           CLOSED          클라이언트: ACK 전송
  3초+  CLOSED              CLOSED          TIME_WAIT 만료
```

---

## 실습 예제: 10,000개 연결을 위한 epoll 기반 서버

`select`의 문제점: ~1024 FD 제한과 O(n) 스캔.
연결당 스레드의 문제점: 10K 스레드 = 10K × ~8MB 스택 = ~80GB RAM.

**해결책**: epoll과 에지 트리거 이벤트 — O(1) 알림, 수백만 개의 연결 처리.

```python
import socket, select

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('0.0.0.0', 9000))
server.listen(1000)
server.setblocking(False)   # epoll을 위한 비블로킹

epoll = select.epoll()
# EPOLLIN: 읽기 가능할 때 알림
# EPOLLET: 에지 트리거 (상태 변화 시만 알림, 레벨이 아님)
epoll.register(server.fileno(), select.EPOLLIN)

connections = {}   # fd → 소켓

while True:
    # epoll.poll()이 최소 하나의 이벤트가 생길 때까지 블록
    events = epoll.poll(timeout=30)  # 30초 타임아웃

    for fd, event in events:
        if fd == server.fileno():
            # 새 연결
            conn, addr = server.accept()
            conn.setblocking(False)
            epoll.register(conn.fileno(), select.EPOLLIN)
            connections[conn.fileno()] = conn

        elif event & select.EPOLLIN:
            # 기존 연결에 데이터 있음
            conn = connections[fd]
            data = conn.recv(4096)
            if data:
                conn.sendall(data)   # 에코 되돌려 보내기
            else:
                # 클라이언트가 연결 종료 (recv가 b'' 반환)
                epoll.unregister(fd)
                connections[fd].close()
                del connections[fd]
```

**에지 트리거(EPOLLET)가 필요한 이유?**
- 레벨 트리거: 데이터가 있는 한 epoll이 반복 발생
- 에지 트리거: 새 데이터가 도착할 때만 발생 → 매번 사용 가능한 모든 데이터를 읽어야 함
- 에지 트리거가 고처리량 서버에 더 효율적 (Nginx가 사용)

**처리량 비교** (단일 스레드):

| 방법 | 최대 연결 | 이벤트당 오버헤드 |
|---|---|---|
| `select` | ~1024 | O(n) 스캔 |
| `poll` | 제한 없음 (하지만 여전히 O(n)) | O(n) 스캔 |
| `epoll` | 수백만 | O(1) |

---

## 요약: TCP vs UDP 소켓

| 단계 | TCP | UDP |
|---|---|---|
| 생성 | `SOCK_STREAM` | `SOCK_DGRAM` |
| 서버 바인딩 | 필요 | 필요 |
| 서버 수신 대기 | 필요 | 불필요 |
| 서버 수락 | 필요 (블록) | 불필요 |
| 클라이언트 연결 | 필요 | 불필요 |
| 전송 | `send()`/`sendall()` | `sendto()` |
| 수신 | `recv()` | `recvfrom()` |
| 주소 정보 | `accept()`에서 | `recvfrom()`에서 |
