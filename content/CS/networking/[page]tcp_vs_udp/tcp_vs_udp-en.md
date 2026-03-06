---
title: "TCP vs UDP"
description: "Comparing TCP and UDP — connection model, reliability, ordering, flow control, header structure, performance trade-offs, and when to use each."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "TCP", "UDP", "transport layer", "protocols"]
author: "Nemit"
featured: false
pinned: false
---

# TCP vs UDP

## Quick Comparison

| Feature | TCP | UDP |
|---|---|---|
| Connection | Connection-oriented (3-way handshake) | Connectionless |
| Reliability | Guaranteed delivery | Best-effort (no guarantee) |
| Ordering | Ordered (sequence numbers) | No ordering |
| Error checking | Checksums + retransmission | Checksums only |
| Flow control | Yes (sliding window) | No |
| Congestion control | Yes | No |
| Speed | Slower (overhead) | Faster (minimal overhead) |
| Header size | 20–60 bytes | 8 bytes |
| Use cases | File transfer, web, email | Streaming, DNS, gaming |

---

## TCP — Transmission Control Protocol

### Key Properties

**Connection-oriented**: A connection must be established (3-way handshake) before data transfer and closed gracefully (4-way handshake) after.

**Reliable delivery**: Every segment is acknowledged. If no ACK is received within a timeout, the segment is **retransmitted**.

**Ordered delivery**: Each byte has a sequence number. If segments arrive out of order, TCP reorders them before passing to the application.

**Flow control**: The receiver advertises a **receive window** (how many bytes it can accept). The sender must not exceed it.

**Congestion control**: TCP monitors network congestion and reduces its sending rate when congestion is detected (slow start, congestion avoidance, fast retransmit).

### TCP Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Acknowledgment Number                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Data |       |C|E|U|A|P|R|S|F|                               |
| Offset|  Res. |W|C|R|C|S|S|Y|I|        Window Size           |
|       |       |R|E|G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options                    |    Padding    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Minimum header: **20 bytes**. Maximum (with options): 60 bytes.

---

## UDP — User Datagram Protocol

### Key Properties

**Connectionless**: No handshake. Just send and hope it arrives.

**No reliability**: If a datagram is lost, UDP doesn't know and doesn't retransmit. The application handles loss (or ignores it).

**No ordering**: Datagrams may arrive in a different order than sent. UDP doesn't reorder them.

**Low latency**: No connection setup, no ACKs, no retransmission delays.

**Simple**: Applications can implement their own reliability if needed (e.g., QUIC, game engines).

### UDP Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Length             |            Checksum           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Just **8 bytes** — source port, destination port, length, checksum. That's it.

---

## When to Use Each

### Use TCP When:
- **Correctness matters more than speed**
- Every byte must arrive and arrive in order
- File downloads (HTTP/HTTPS)
- Email (SMTP, IMAP)
- Database queries
- SSH sessions
- Financial transactions

### Use UDP When:
- **Speed matters more than correctness**
- Occasional packet loss is tolerable
- **DNS queries**: single request-response, retransmit at app layer if needed
- **Video/audio streaming**: a dropped frame is better than stalling
- **Online games**: stale position data is useless; fresh data is preferred
- **VoIP**: similar to streaming
- **DHCP**: broadcast-based, no established connection possible
- **Multicast/broadcast**: TCP is unicast only

---

## Performance Trade-offs

### TCP Overhead Sources

1. **Connection setup**: 3-way handshake adds 1.5 RTTs before data
2. **ACK traffic**: every segment needs an acknowledgment
3. **Retransmission**: lost packets cause delays
4. **Head-of-line blocking**: if one packet is lost, all subsequent data waits until retransmission

### UDP Latency Advantage

```
TCP:  SYN ─► SYN-ACK ─► ACK ─► [Data] ─► ACK
      (1.5 RTT before data starts)

UDP:  [Data] ─────────────────────────────────
      (0 RTT overhead)
```

For a DNS query, this difference is significant: DNS over UDP takes ~1 RTT. DNS over TCP takes ~2.5 RTTs.

### QUIC — Best of Both Worlds

**QUIC** (used in HTTP/3) is a modern transport protocol that runs over UDP but implements reliability, ordering, and multiplexing at the application layer. It solves TCP's head-of-line blocking while retaining reliability.

```
HTTP/1.1: TCP
HTTP/2:   TCP (still has HOL blocking at TCP level)
HTTP/3:   QUIC (UDP-based, no HOL blocking)
```

---

## Sockets

Both TCP and UDP are accessed through the **socket API**:

```python
# TCP (stream socket)
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  # TCP
server.bind(('0.0.0.0', 8080))
server.listen()
conn, addr = server.accept()    # Blocks until 3-way handshake complete

# UDP (datagram socket)
server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)   # UDP
server.bind(('0.0.0.0', 8080))
data, addr = server.recvfrom(1024)  # No connection; just receive
```

---

## Port Numbers

Both TCP and UDP use **16-bit port numbers** (0–65535) to identify which application a packet is for.

| Range | Category | Examples |
|---|---|---|
| 0–1023 | Well-known ports | HTTP(80), HTTPS(443), SSH(22) |
| 1024–49151 | Registered ports | PostgreSQL(5432), MySQL(3306) |
| 49152–65535 | Dynamic/ephemeral | Client source ports |

---

## Worked Example: DNS Query — UDP vs TCP

### DNS over UDP (Normal Case)

A DNS resolver looks up `example.com` using UDP:

```
Client                        DNS Resolver (8.8.8.8)
  │                                │
  │  UDP: Src=50222, Dst=53        │  ← 1 packet, ~60 bytes
  │  Query: A record for           │
  │         example.com?           │
  │ ─────────────────────────────► │
  │                                │
  │  UDP: Src=53, Dst=50222        │  ← 1 packet, ~90 bytes
  │  Answer: 93.184.216.34         │
  │ ◄───────────────────────────── │

Total: 1 RTT, ~150 bytes, no connection overhead
```

### DNS over TCP (Large Response — Zone Transfer or DNSSEC)

When response exceeds 512 bytes (original UDP limit) or 4096 bytes (EDNS0 limit):

```
Client                        DNS Resolver
  │  SYN                           │  ← TCP handshake: 1 RTT
  │ ──────────────────────────────►│
  │       SYN-ACK                  │
  │ ◄──────────────────────────────│
  │  ACK                           │
  │ ──────────────────────────────►│
  │                                │
  │  DNS Query (TCP)               │  ← data: 1 RTT
  │ ──────────────────────────────►│
  │       DNS Answer (large)       │
  │ ◄──────────────────────────────│
  │  ACK                           │
  │ ──────────────────────────────►│
  │                                │
  │  FIN / FIN-ACK / ACK           │  ← teardown
  │                                │

Total: 2.5 RTTs, more overhead — but handles large payloads reliably
```

**Why UDP is preferred for DNS**: a query-response fits in 1 packet. If it fails, the client retries after ~5 seconds. The latency gain from avoiding the handshake is significant for millions of lookups per second.

---

## Worked Example: Video Streaming — UDP Tolerance

A live video stream sends frames at 30 fps over UDP. Network drops 3% of packets:

```
Frame:   1    2    3    4   [lost]  6    7    8   [lost]  10
         │    │    │    │           │    │    │           │
Viewer:  ✓    ✓    ✓    ✓   ✗→skip  ✓    ✓    ✓   ✗→skip  ✓
```

**With TCP**: frame 5 loss causes TCP to stall until frame 5 is retransmitted. The viewer sees a freeze. Then frames 5–9 arrive in a burst (buffer bloat / jitter).

**With UDP**: frames 1–4 play, frame 5 is simply dropped (a brief glitch), frames 6–10 play normally. No freeze, no buffering delay.

→ For real-time media, **a dropped frame is always better than a delayed frame**.

---

## Worked Example: Comparing Header Overhead

A 1-byte ping message:

```
UDP:
[ Src Port (2) | Dst Port (2) | Length (2) | Checksum (2) | Data (1) ]
Total: 9 bytes   →  8 bytes overhead = 888% overhead

TCP:
[ Src Port (2) | Dst Port (2) | Seq (4) | Ack (4) | Offset+Flags (4) |
  Window (2) | Checksum (2) | Urgent (2) | Data (1) ]
Total: 21 bytes  → 20 bytes overhead = 2000% overhead
```

For a 1 MB file transfer:

```
UDP overhead: 8 bytes per datagram (negligible)
TCP overhead: 20 bytes + ACKs ≈ 20–40 bytes per segment, but
              TCP's reliability and flow control allow much larger
              window sizes → throughput advantage for bulk data
```

The header size difference matters most for **small, frequent messages** (DNS, IoT sensors, game position updates). For bulk data, TCP's reliability features outweigh the extra header bytes.
