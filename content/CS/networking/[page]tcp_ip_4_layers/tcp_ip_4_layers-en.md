---
title: "TCP/IP 4-Layer Model"
description: "The TCP/IP model — four layers (Network Access, Internet, Transport, Application), how they map to OSI, and real packet flow."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "TCP/IP", "protocols", "Internet", "layers"]
author: "Nemit"
featured: false
pinned: false
---

# TCP/IP 4-Layer Model

## Overview

The **TCP/IP model** (also called the **Internet model** or **DoD model**) is the practical framework that powers the modern Internet. Unlike the OSI model (a reference standard), TCP/IP describes how the Internet actually works.

It has **4 layers** that roughly collapse the 7 OSI layers:

```
OSI Model          TCP/IP Model
─────────          ────────────
7 Application ─┐
6 Presentation  ├─► Application
5 Session      ─┘
4 Transport    ────► Transport
3 Network      ────► Internet
2 Data Link    ─┐
1 Physical     ─┘──► Network Access
```

---

## The 4 Layers

### Layer 4 — Application

The topmost layer where user-facing protocols live. Applications interact with the network here.

**Protocols**: HTTP/HTTPS, FTP, SMTP/IMAP/POP3, DNS, SSH, DHCP, SNMP
**Data unit**: Message

### Layer 3 — Transport

Provides end-to-end communication between processes on different hosts. Identified by **port numbers**.

**Protocols**: TCP, UDP
**Data unit**: Segment (TCP) / Datagram (UDP)

| | TCP | UDP |
|---|---|---|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best-effort |
| Order | Ordered | Unordered |
| Speed | Slower | Faster |

### Layer 2 — Internet

Routes packets across networks from source to destination. Uses **IP addresses** for logical addressing.

**Protocols**: IP (IPv4/IPv6), ICMP, ARP, OSPF, BGP
**Data unit**: Packet
**Key device**: Router

### Layer 1 — Network Access (Link)

Handles transmission over a single network link. Combines OSI's Data Link and Physical layers.

**Protocols**: Ethernet, Wi-Fi (802.11), PPP
**Data unit**: Frame
**Key device**: Switch, NIC, cable

---

## Data Flow Through the Stack

```
HTTP GET request from browser to web server:

Application:  [ HTTP Request ]
Transport:    [ TCP Hdr | HTTP Request ]         ← port 80/443
Internet:     [ IP Hdr | TCP Hdr | HTTP ]        ← src/dst IP
Net Access:   [ MAC Hdr | IP Hdr | TCP | HTTP | FCS ]  ← src/dst MAC
              ─────────── physical transmission ──────────
```

At the server, the stack is read bottom-up:
1. NIC extracts the frame, checks the MAC
2. OS reads the packet, checks the IP
3. TCP layer reads the segment, finds port 80 → web server
4. Web server reads the HTTP request

---

## Key Protocols by Layer

### Application Layer Protocols

| Protocol | Port | Purpose |
|---|---|---|
| HTTP | 80 | Web (plaintext) |
| HTTPS | 443 | Web (encrypted) |
| FTP | 20, 21 | File transfer |
| SSH | 22 | Secure shell |
| SMTP | 25 | Send email |
| DNS | 53 | Domain → IP |
| DHCP | 67/68 | IP address assignment |
| SNMP | 161 | Network management |

### Transport Layer

**TCP** (Transmission Control Protocol):
- 3-way handshake (SYN, SYN-ACK, ACK)
- Flow control (sliding window)
- Congestion control
- Retransmission on loss

**UDP** (User Datagram Protocol):
- No connection setup
- No acknowledgment
- Header is only 8 bytes (vs TCP's 20+)

### Internet Layer

**IPv4**: 32-bit addresses (e.g., 192.168.1.1)
**IPv6**: 128-bit addresses (e.g., 2001:db8::1)
**ICMP**: Error messages and diagnostics (`ping`, `traceroute`)

### Network Access Layer

**Ethernet**: Dominant wired LAN protocol. Uses MAC addresses (48-bit).
**Wi-Fi (802.11)**: Wireless LAN. Also uses MAC addresses.

---

## Addressing at Each Layer

| Layer | Address Type | Example | Scope |
|---|---|---|---|
| Application | URL/hostname | `example.com` | Global |
| Transport | Port number | 443 | Per-host |
| Internet | IP address | 192.168.1.1 | Logical (global) |
| Network Access | MAC address | AA:BB:CC:DD:EE:FF | Local link |

**IP addresses** are permanent for routing across networks.
**MAC addresses** are used only within a local network segment — they change at each hop (router replaces source/dest MAC).

---

## Encapsulation Across a Router

```
Host A ──── Switch ──── Router ──── Switch ──── Host B

                      Router rewrites MACs at each hop:
Host A → Router:  [ MAC_A | IP_A | ... | MAC_Router ]
Router → Host B:  [ MAC_Router | IP_A | ... | MAC_B  ]
                  IP addresses stay the same end-to-end!
```

- **IP addresses** (Layer 3): unchanged across the entire path
- **MAC addresses** (Layer 2): change at every router hop

---

## TCP/IP vs OSI: Why Both?

| Purpose | Model |
|---|---|
| Practical implementation | TCP/IP |
| Learning, troubleshooting, vendor-neutral discussion | OSI |
| Protocol design reference | OSI |
| Real-world protocol stacks | TCP/IP |

The OSI model is the "what should happen in theory" and TCP/IP is the "what actually happens on the Internet."

---

## Worked Example: Packet Walk Across Two Routers

**Scenario**: Host A (`10.0.1.2`) sends an HTTP GET to Server B (`10.0.3.5`) through two routers.

```
Host A          Router R1           Router R2          Server B
10.0.1.2        10.0.1.1 / 10.0.2.1  10.0.2.2 / 10.0.3.1  10.0.3.5
MAC: A1          MAC: R1a / R1b        MAC: R2a / R2b         MAC: B1
```

### Hop 1: Host A → Router R1

**Application layer**: HTTP GET request created.

**Transport layer** adds TCP header:
```
Src Port: 50123   Dst Port: 80
Seq: 1            Ack: 0     Flags: SYN
```

**Internet layer** adds IP header:
```
Src IP: 10.0.1.2    Dst IP: 10.0.3.5
TTL: 64             Protocol: TCP
```
The IP header stays the same for the entire journey (end-to-end addressing).

**Network Access layer** adds Ethernet frame for the first hop:
```
Src MAC: A1    Dst MAC: R1a    (R1's interface on the 10.0.1.0 network)
```
Host A uses ARP to find R1a's MAC if not cached.

### Hop 2: Router R1 → Router R2

R1 receives the frame, strips the Ethernet header, reads the IP header:
- Destination `10.0.3.5` → matches route: "forward to 10.0.2.2 via R1b interface"
- **Decrements TTL**: 64 → 63
- Builds a **new Ethernet frame** for the next hop:

```
Src MAC: R1b   Dst MAC: R2a    (R2's interface on the 10.0.2.0 network)
IP Src: 10.0.1.2  IP Dst: 10.0.3.5  (IP unchanged!)
TTL: 63
```

### Hop 3: Router R2 → Server B

R2 strips the frame, reads IP header:
- Destination `10.0.3.5` → directly connected on 10.0.3.0
- Decrements TTL: 63 → 62
- Builds a new Ethernet frame:

```
Src MAC: R2b   Dst MAC: B1     (Server B's MAC, found via ARP)
IP Src: 10.0.1.2  IP Dst: 10.0.3.5   (still unchanged!)
TTL: 62
```

### Key Insight: What Changes vs What Stays

| Field | Changes? | Why |
|---|---|---|
| IP Src / IP Dst | **No** — same end-to-end | Routing uses IP; IP is the permanent address |
| TTL | **Yes** — decremented at each router | Prevents infinite loops |
| MAC Src / MAC Dst | **Yes** — replaced at each hop | MAC addresses are link-local only |
| TCP Seq/Ack | **No** — unchanged | End-to-end, not touched by routers |

### Packet State at Each Point

```
                  Eth Hdr         IP Hdr           TCP
Host A → R1:   [A1→R1a]  [10.0.1.2→10.0.3.5, TTL=64]  [...]
R1 → R2:       [R1b→R2a] [10.0.1.2→10.0.3.5, TTL=63]  [...]
R2 → Server B: [R2b→B1]  [10.0.1.2→10.0.3.5, TTL=62]  [...]
```

This is why we say: **IP addresses are logical (end-to-end)**, **MAC addresses are physical (link-local)**.
