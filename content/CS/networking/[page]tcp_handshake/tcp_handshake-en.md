---
title: "TCP 3-Way and 4-Way Handshake"
description: "TCP connection lifecycle — 3-way handshake (SYN, SYN-ACK, ACK) for connection setup and 4-way handshake (FIN) for graceful teardown, with sequence numbers and state machine."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "TCP", "handshake", "connection", "SYN", "FIN"]
author: "Nemit"
featured: false
pinned: false
---

# TCP 3-Way and 4-Way Handshake

## Why TCP Needs a Handshake

TCP is a **connection-oriented** protocol. Before data can be exchanged, both sides must:
1. Agree to communicate
2. Synchronize **sequence numbers** (so each side can detect lost or out-of-order data)
3. Establish send/receive buffers

This setup is done with the **3-way handshake**. Tearing down the connection requires a **4-way handshake**.

---

## TCP Header Fields (Relevant)

| Field | Description |
|---|---|
| **SYN** | Synchronize — initiate connection |
| **ACK** | Acknowledgment — confirm received data |
| **FIN** | Finish — request connection close |
| **RST** | Reset — abort connection immediately |
| **Seq** | Sequence number — position in the byte stream |
| **Ack** | Acknowledgment number — next expected byte |

---

## 3-Way Handshake (Connection Setup)

```
Client                              Server
  │                                   │
  │──── SYN (Seq=x) ────────────────►│  Client: "Hello, let's connect. My seq = x"
  │                                   │
  │◄─── SYN-ACK (Seq=y, Ack=x+1) ───│  Server: "OK. My seq = y, I got your x"
  │                                   │
  │──── ACK (Ack=y+1) ─────────────►│  Client: "Got it. I acknowledge your y"
  │                                   │
  │         [Connection Established]  │
```

### Step-by-Step

**Step 1 — SYN (Client → Server)**
- Client sends a segment with `SYN=1`, and a randomly chosen **Initial Sequence Number (ISN)**: `Seq=x`
- Client enters `SYN_SENT` state
- Server must be in `LISTEN` state

**Step 2 — SYN-ACK (Server → Client)**
- Server replies with `SYN=1, ACK=1`
- Server's ISN: `Seq=y`
- Acknowledges client: `Ack=x+1` (next expected byte from client)
- Server enters `SYN_RECEIVED` state

**Step 3 — ACK (Client → Server)**
- Client sends `ACK=1`, `Ack=y+1` (next expected byte from server)
- Both sides enter `ESTABLISHED` state
- Data transfer can now begin

### Why 3 Steps?

Two steps would only allow the server to confirm it received the client's SYN. The third step (client ACKing the server's SYN) confirms the server-to-client path also works. Without it, the server can't be sure its SYN-ACK was received.

### Why Random ISNs?

Random ISNs prevent:
- **Old duplicate segments**: stale packets from a previous connection being mistaken for current data
- **TCP hijacking attacks**: guessing the sequence number to inject malicious data

---

## 4-Way Handshake (Connection Teardown)

TCP connections are **full-duplex** — each direction is independent. Closing requires each side to send its own FIN.

```
Client                              Server
  │                                   │
  │──── FIN (Seq=u) ────────────────►│  Client: "I'm done sending"
  │                                   │  Server enters CLOSE_WAIT
  │◄─── ACK (Ack=u+1) ──────────────│  Server: "Got your FIN"
  │                                   │  [Server may still send data]
  │                                   │
  │◄─── FIN (Seq=v) ────────────────│  Server: "I'm done sending too"
  │                                   │  Server enters LAST_ACK
  │──── ACK (Ack=v+1) ─────────────►│  Client: "Got your FIN"
  │                                   │
  │   [Client: TIME_WAIT → CLOSED]    │  [Server: CLOSED]
```

### Why 4 Steps (Not 3)?

When the client sends FIN, it means "I have no more data to send." But the server might still have data to send. So:
- The server first ACKs the client's FIN
- The server continues sending its remaining data
- Then the server sends its own FIN

This is why the server's ACK and FIN are separate (steps 2 and 3), not combined.

### TIME_WAIT State

After the client sends the final ACK, it enters **TIME_WAIT** for **2 × MSL** (Maximum Segment Lifetime, typically 60–120 seconds) before closing.

**Reasons**:
1. **Ensure the final ACK arrives**: if the server didn't receive the ACK, it will retransmit FIN. The client needs to be alive to ACK it again.
2. **Allow old packets to expire**: ensures stale duplicate packets from this connection can't interfere with a new connection on the same port.

---

## TCP State Machine

| State | Description |
|---|---|
| `LISTEN` | Server waiting for incoming connections |
| `SYN_SENT` | Client sent SYN, waiting for SYN-ACK |
| `SYN_RECEIVED` | Server received SYN, sent SYN-ACK |
| `ESTABLISHED` | Connection open, data transfer in progress |
| `FIN_WAIT_1` | Sent FIN, waiting for ACK |
| `FIN_WAIT_2` | Got ACK for FIN, waiting for server's FIN |
| `CLOSE_WAIT` | Received FIN, application still has data to send |
| `LAST_ACK` | Sent FIN, waiting for final ACK |
| `TIME_WAIT` | Waiting 2×MSL before final close |
| `CLOSED` | Connection fully closed |

---

## Half-Close

A TCP connection can be **half-closed**: one side has finished sending (FIN sent) but is still receiving. This is normal between steps 2 and 3 of the 4-way handshake.

```python
# Example: HTTP response continues after client closes upload
import socket

s = socket.socket()
s.connect(('server', 80))
s.send(b'GET / HTTP/1.0\r\n\r\n')
s.shutdown(socket.SHUT_WR)   # Send FIN — no more sending
data = s.recv(4096)           # Still reading server response
s.close()
```

---

## SYN Flood Attack

A **SYN flood** is a DoS attack that exploits the 3-way handshake:
1. Attacker sends many SYNs with fake source IPs
2. Server allocates resources and sends SYN-ACKs
3. ACKs never come — server's connection queue fills up
4. Legitimate connections are refused

**Mitigation**: SYN cookies — server encodes state in the ISN instead of allocating memory until the ACK arrives.

---

## RST — Abrupt Close

Instead of a graceful 4-way teardown, a **RST (Reset)** segment abruptly terminates the connection. Common causes:
- Application crashes
- Port not listening
- Firewall or security policy
- Half-open connection detected

```
Client ──── SYN ────────► Server (port closed)
Client ◄─── RST ──────── Server ("No one listening here")
```

---

## Worked Example: Full Connection Lifecycle with Concrete Sequence Numbers

**Setup**: Client ISN = 1000, Server ISN = 5000. Client sends "Hello" (5 bytes), Server replies "World!" (6 bytes).

### Phase 1: 3-Way Handshake

```
Client                                   Server
State: CLOSED                            State: LISTEN
  │                                         │
  │  SYN                                    │
  │  Seq=1000, Ack=0, Flags=SYN             │
  │ ──────────────────────────────────────► │  Server: LISTEN → SYN_RECEIVED
  │                                         │
  │                      SYN-ACK            │
  │                      Seq=5000, Ack=1001 │  (Ack = client ISN + 1)
  │ ◄────────────────────────────────────── │
  │  Client: SYN_SENT → ESTABLISHED         │
  │                                         │
  │  ACK                                    │
  │  Seq=1001, Ack=5001, Flags=ACK          │  (Ack = server ISN + 1)
  │ ──────────────────────────────────────► │  Server: SYN_RECEIVED → ESTABLISHED
  │                                         │
  │          [Connection Established]        │
```

**After handshake**:
- Client's next Seq = 1001
- Server's next Seq = 5001
- Both have confirmed the other is ready

### Phase 2: Data Exchange

```
Client                                   Server
  │  DATA: "Hello"                          │
  │  Seq=1001, Ack=5001, Len=5              │  5 bytes of data
  │ ──────────────────────────────────────► │
  │                                         │
  │                      ACK                │
  │                      Seq=5001, Ack=1006 │  (1001 + 5 = 1006, next expected)
  │ ◄────────────────────────────────────── │
  │                                         │
  │                      DATA: "World!"     │
  │                      Seq=5001, Ack=1006, Len=6
  │ ◄────────────────────────────────────── │
  │                                         │
  │  ACK                                    │
  │  Seq=1006, Ack=5007                     │  (5001 + 6 = 5007)
  │ ──────────────────────────────────────► │
```

**Sequence number rule**: `Ack = Seq_received + Len` (= the next byte I expect from you)

### Phase 3: 4-Way Teardown

Client initiates close (it's done sending):

```
Client                                   Server
State: ESTABLISHED                       State: ESTABLISHED
  │  FIN                                    │
  │  Seq=1006, Flags=FIN                    │
  │ ──────────────────────────────────────► │  Server: ESTABLISHED → CLOSE_WAIT
  │  Client: FIN_WAIT_1                     │
  │                                         │
  │                      ACK               │
  │                      Seq=5007, Ack=1007 │  (1006 + 1, FIN consumes 1 seq byte)
  │ ◄────────────────────────────────────── │
  │  Client: FIN_WAIT_1 → FIN_WAIT_2        │
  │                                         │
  │                  [Server finishes work]  │
  │                                         │
  │                      FIN               │
  │                      Seq=5007, Flags=FIN│
  │ ◄────────────────────────────────────── │  Server: CLOSE_WAIT → LAST_ACK
  │                                         │
  │  ACK                                    │
  │  Seq=1007, Ack=5008                     │  (5007 + 1)
  │ ──────────────────────────────────────► │  Server: LAST_ACK → CLOSED
  │  Client: TIME_WAIT (120 seconds)        │
  │  ...2×MSL passes...                     │
  │  Client: CLOSED                         │
```

### TIME_WAIT in Practice

A server under heavy load may accumulate thousands of TIME_WAIT sockets. To check:

```bash
ss -tan | grep TIME-WAIT | wc -l
# e.g., 3412

# See TIME_WAIT duration on Linux
cat /proc/sys/net/ipv4/tcp_fin_timeout
# 60 (seconds)
```

To reduce TIME_WAIT accumulation (for servers accepting many short connections):
```bash
# Allow reuse of TIME_WAIT sockets for new connections (safe for servers)
sysctl net.ipv4.tcp_tw_reuse=1
```

### Retransmission: What Happens if a Segment is Lost

If the ACK for "Hello" never arrives at the client:

```
Client sends:    Seq=1001, Len=5   → lost in network
Client waits...  timeout (RTO, typically 200ms–3s initially, doubles each time)
Client retrans:  Seq=1001, Len=5   → arrives at server
Server ACKs:     Ack=1006
```

TCP's **RTO (Retransmission Timeout)** doubles on each failure (exponential backoff): 200ms → 400ms → 800ms → ... up to ~2 minutes, then connection is abandoned.
