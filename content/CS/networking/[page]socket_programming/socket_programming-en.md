---
title: "Socket Programming Concepts"
description: "Network socket fundamentals — socket types, address structures, TCP client/server lifecycle, UDP sockets, non-blocking I/O, select/poll/epoll, and common socket options."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "socket", "TCP", "UDP", "network programming", "epoll"]
author: "Nemit"
featured: false
pinned: false
---

# Socket Programming Concepts

## What Is a Socket?

A **socket** is an endpoint for network communication. It represents one end of a two-way communication channel between two programs running anywhere on a network.

A socket is identified by:
- **IP address**: identifies the host
- **Port number**: identifies the process on the host
- **Protocol**: TCP or UDP

```
Client                          Server
IP: 10.0.0.1                    IP: 10.0.0.2
Port: 54321 (ephemeral)         Port: 8080 (well-known)

Socket: (10.0.0.1:54321, TCP)   Socket: (10.0.0.2:8080, TCP)
          └────────────────────────────────┘
                     Connection
```

---

## Socket Types

| Type | Constant | Protocol | Description |
|---|---|---|---|
| Stream | `SOCK_STREAM` | TCP | Reliable, ordered, connection-oriented |
| Datagram | `SOCK_DGRAM` | UDP | Unreliable, unordered, connectionless |
| Raw | `SOCK_RAW` | IP/ICMP | Direct IP packet access (requires root) |

---

## TCP Server Lifecycle

```python
import socket

# 1. Create socket
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 2. Set socket options (optional but recommended)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# 3. Bind to address and port
server.bind(('0.0.0.0', 8080))

# 4. Listen (backlog = max pending connections)
server.listen(5)

# 5. Accept connections (blocks until client connects)
while True:
    conn, addr = server.accept()    # Returns new socket + client address
    print(f"Connected by {addr}")

    # 6. Communicate
    data = conn.recv(1024)          # Receive up to 1024 bytes
    conn.sendall(b"Hello, World!")  # Send response

    # 7. Close connection
    conn.close()
```

### Key Functions: Server

| Function | Description |
|---|---|
| `socket()` | Create new socket |
| `bind(addr)` | Associate socket with local address/port |
| `listen(backlog)` | Mark socket as passive (server); queue up to `backlog` connections |
| `accept()` | Block until client connects; return new socket |
| `recv(bufsize)` | Receive data (blocks until data available) |
| `send(data)` | Send data (may not send all; check return value) |
| `sendall(data)` | Keep sending until all data is sent |
| `close()` | Close socket |

---

## TCP Client Lifecycle

```python
import socket

# 1. Create socket
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 2. Connect to server (performs 3-way handshake)
client.connect(('10.0.0.2', 8080))

# 3. Send data
client.sendall(b"Hello, Server!")

# 4. Receive response
data = client.recv(1024)
print(f"Received: {data}")

# 5. Close
client.close()
```

---

## UDP Socket Lifecycle

UDP has no connection — just send and receive:

```python
# UDP Server
server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
server.bind(('0.0.0.0', 9090))

while True:
    data, addr = server.recvfrom(1024)    # Returns data + sender address
    print(f"From {addr}: {data}")
    server.sendto(b"Got it!", addr)       # Reply to sender

# UDP Client
client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
client.sendto(b"Hello!", ('10.0.0.2', 9090))
data, server_addr = client.recvfrom(1024)
client.close()
```

---

## Socket Address Structures

### IPv4: `AF_INET`

```python
socket.AF_INET   # IPv4
addr = ('192.168.1.1', 8080)    # (host, port) tuple
```

### IPv6: `AF_INET6`

```python
socket.AF_INET6  # IPv6
addr = ('::1', 8080, 0, 0)     # (host, port, flowinfo, scopeid)
```

### Unix Domain Socket: `AF_UNIX`

```python
socket.AF_UNIX   # Local IPC (same machine)
addr = '/tmp/myapp.sock'
```

---

## Blocking vs Non-Blocking Sockets

**Blocking** (default): `recv()` blocks until data arrives; `accept()` blocks until a client connects.

**Non-blocking**: calls return immediately with `EAGAIN`/`EWOULDBLOCK` if no data.

```python
# Set non-blocking
sock.setblocking(False)

# Or set timeout
sock.settimeout(5.0)    # Raise socket.timeout after 5 seconds

try:
    data = sock.recv(1024)
except socket.timeout:
    print("No data received in 5 seconds")
except BlockingIOError:
    print("No data available right now")
```

---

## Multiplexing: select, poll, epoll

To handle many connections efficiently without one thread per connection:

### `select` (POSIX, all platforms)

```python
import select

readable, writable, exceptional = select.select(
    [server, conn1, conn2],    # Watch for readable
    [],                         # Watch for writable
    [],                         # Watch for errors
    timeout=1.0                 # Seconds (None = block forever)
)

for sock in readable:
    if sock is server:
        conn, addr = server.accept()
    else:
        data = sock.recv(1024)
```

**Limitation**: O(n) scan of all file descriptors; limited to ~1024 FDs.

### `poll` (Linux/Unix)

Similar to `select` but no FD limit. Still O(n).

### `epoll` (Linux only)

O(1) for event notification. Scales to thousands of connections.

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
            # Get conn from fd lookup dict
            data = connections[fd].recv(1024)
```

---

## Common Socket Options

```python
# Reuse address/port immediately after close (avoids TIME_WAIT issues)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)

# TCP keepalive (detect dead connections)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

# Disable Nagle's algorithm (reduce latency for small messages)
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

# Set send/receive buffer sizes
sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 65536)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 65536)

# Get current buffer size
sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
```

---

## Connection States and Errors

| State | Description |
|---|---|
| `ECONNREFUSED` | No server listening on that port |
| `ETIMEDOUT` | Connection timed out (firewall dropped, host unreachable) |
| `ECONNRESET` | Server sent RST (crashed or aborted) |
| `EPIPE` | Writing to a closed connection |
| `EADDRINUSE` | Address/port already in use (use SO_REUSEADDR) |

---

## Summary: TCP vs UDP Sockets

| Step | TCP | UDP |
|---|---|---|
| Create | `SOCK_STREAM` | `SOCK_DGRAM` |
| Server bind | Required | Required |
| Server listen | Required | Not needed |
| Server accept | Required (blocks) | Not needed |
| Client connect | Required | Not needed |
| Send | `send()`/`sendall()` | `sendto()` |
| Receive | `recv()` | `recvfrom()` |
| Address info | From `accept()` | From `recvfrom()` |

---

## Worked Example: TCP Echo Server — Full System Call Trace

**Scenario**: An echo server receives "Hello" and sends it back. Here's the complete interaction at the OS level.

### Server Side (listening on port 9000)

```python
import socket

# syscall: socket(AF_INET, SOCK_STREAM, 0) → fd=3
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# syscall: setsockopt(3, SOL_SOCKET, SO_REUSEADDR, 1)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# syscall: bind(3, {AF_INET, "0.0.0.0", 9000})
server.bind(('0.0.0.0', 9000))

# syscall: listen(3, backlog=5)
# OS: creates SYN queue (incomplete connections) and accept queue (completed)
server.listen(5)

print("Server listening on port 9000")
# Server blocks here waiting for accept()...

# syscall: accept(3, &client_addr) → blocks until 3-way handshake completes
#   OS performs handshake in background (SYN-ACK, ACK)
#   Returns new fd=4 for the connection; fd=3 still listening
conn, addr = server.accept()
print(f"Connected: {addr}")   # e.g., ('127.0.0.1', 54321)

# syscall: recv(4, buffer, 1024, 0) → blocks until data arrives
data = conn.recv(1024)
print(f"Received: {data}")    # b'Hello'

# syscall: send(4, data, len(data), 0) → returns bytes sent
conn.sendall(data)            # sends b'Hello' back

# syscall: close(4) → sends FIN to client
conn.close()
# syscall: close(3)
server.close()
```

### Client Side

```python
import socket

# syscall: socket(AF_INET, SOCK_STREAM, 0) → fd=5
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# syscall: connect(5, {AF_INET, "127.0.0.1", 9000})
#   OS: picks ephemeral port (e.g., 54321)
#   Sends SYN → receives SYN-ACK → sends ACK
#   Returns when ESTABLISHED
client.connect(('127.0.0.1', 9000))

# syscall: send(5, "Hello", 5, 0)
client.sendall(b'Hello')

# syscall: recv(5, buffer, 1024, 0) → blocks until echo arrives
data = client.recv(1024)      # b'Hello'
print(f"Echo: {data}")

# syscall: close(5) → 4-way teardown begins
client.close()
```

### State Machine Timeline

```
Time    Client State       Server State      Event
  0s    CLOSED             LISTEN            Server starts
  1s    SYN_SENT           SYN_RECEIVED      Client: connect() → SYN sent
  1s    ESTABLISHED        ESTABLISHED       Handshake complete
  2s    ESTABLISHED        ESTABLISHED       Client: send("Hello")
  2s    ESTABLISHED        ESTABLISHED       Server: recv() → "Hello"; send("Hello")
  2s    ESTABLISHED        ESTABLISHED       Client: recv() → "Hello"
  3s    FIN_WAIT_1         CLOSE_WAIT        Client: close() → FIN sent
  3s    FIN_WAIT_2         LAST_ACK          Server: close() → FIN sent
  3s    TIME_WAIT          CLOSED            Client: ACK sent
  3s+   CLOSED             CLOSED            TIME_WAIT expires
```

---

## Worked Example: epoll-based Server for 10,000 Connections

The problem with `select`: limited to ~1024 fds and O(n) scanning.
The problem with one-thread-per-connection: 10K threads = 10K × ~8MB stack = ~80 GB RAM.

**Solution**: epoll with edge-triggered events — O(1) notification, handles millions of connections.

```python
import socket, select

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('0.0.0.0', 9000))
server.listen(1000)
server.setblocking(False)   # Non-blocking for epoll

epoll = select.epoll()
# EPOLLIN: notify when readable
# EPOLLET: edge-triggered (only notify on state change, not level)
epoll.register(server.fileno(), select.EPOLLIN)

connections = {}   # fd → socket

while True:
    # epoll.poll() blocks until at least one event; returns list of (fd, event)
    events = epoll.poll(timeout=30)  # 30s timeout

    for fd, event in events:
        if fd == server.fileno():
            # New connection
            conn, addr = server.accept()
            conn.setblocking(False)
            epoll.register(conn.fileno(), select.EPOLLIN)
            connections[conn.fileno()] = conn
            print(f"New connection from {addr}")

        elif event & select.EPOLLIN:
            # Existing connection has data
            conn = connections[fd]
            data = conn.recv(4096)
            if data:
                conn.sendall(data)   # Echo back
            else:
                # Client closed connection (recv returned b'')
                epoll.unregister(fd)
                connections[fd].close()
                del connections[fd]
```

**Why edge-triggered (EPOLLET)?**
- Level-triggered: epoll fires repeatedly as long as data is available
- Edge-triggered: fires only when new data arrives → must read all available data each time
- Edge-triggered is more efficient for high-throughput servers (Nginx uses it)

**Throughput comparison** (single thread):

| Method | Max Connections | Overhead per event |
|---|---|---|
| `select` | ~1024 | O(n) scan |
| `poll` | Unlimited (but still O(n)) | O(n) scan |
| `epoll` | Millions | O(1) |
