---
title: "OSI 7-Layer Model"
description: "The OSI reference model — seven layers, each layer's role and protocols, encapsulation, and how layers interact."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "OSI", "protocols", "layers", "encapsulation"]
author: "Nemit"
featured: false
pinned: false
---

# OSI 7-Layer Model

## What Is the OSI Model?

The **Open Systems Interconnection (OSI)** model is a conceptual framework that standardizes how different network systems communicate. Developed by ISO in 1984, it divides network communication into **7 layers**, each with a specific role.

The OSI model is used as a **reference** for understanding and troubleshooting networks. Real-world protocols (TCP/IP) don't map perfectly to it, but OSI provides a universal vocabulary.

---

## The 7 Layers

```
Sender                              Receiver
  │                                   │
  7  Application    ─────────────►   Application   7
  6  Presentation   ─────────────►   Presentation  6
  5  Session        ─────────────►   Session       5
  4  Transport      ─────────────►   Transport     4
  3  Network        ─────────────►   Network       3
  2  Data Link      ─────────────►   Data Link     2
  1  Physical       ═════════════►   Physical      1
                    (actual cable)
```

Data travels **down** through layers on the sender's side and **up** through layers on the receiver's side.

---

## Layer-by-Layer Description

### Layer 7 — Application

**What it does**: Interface between the network and the user application. Defines the protocols that applications use to communicate.

**PDU**: Data
**Protocols**: HTTP, HTTPS, FTP, SMTP, DNS, SSH, TELNET
**Devices**: —

Examples: browser requesting a web page, email client sending mail.

### Layer 6 — Presentation

**What it does**: Translates data between the application and the network. Handles encoding, compression, and encryption/decryption.

**PDU**: Data
**Protocols**: SSL/TLS (partly), JPEG, MPEG, ASCII, Unicode
**Devices**: —

Examples: encrypting HTTPS traffic, compressing a file before sending.

### Layer 5 — Session

**What it does**: Establishes, manages, and terminates sessions (logical connections) between applications.

**PDU**: Data
**Protocols**: NetBIOS, PPTP, RPC, NFS
**Devices**: —

Examples: maintaining a login session, resuming a file transfer.

### Layer 4 — Transport

**What it does**: End-to-end communication between processes. Provides reliable delivery (TCP) or fast, best-effort delivery (UDP). Handles segmentation and reassembly.

**PDU**: Segment (TCP) / Datagram (UDP)
**Protocols**: TCP, UDP
**Devices**: Firewall, load balancer
**Key concepts**: Port numbers, flow control, error recovery, multiplexing

### Layer 3 — Network

**What it does**: Logical addressing and routing — determines the best path for data to travel from source to destination across different networks.

**PDU**: Packet
**Protocols**: IP (IPv4/IPv6), ICMP, OSPF, BGP, RIP
**Devices**: Router
**Key concepts**: IP addresses, routing tables, TTL

### Layer 2 — Data Link

**What it does**: Node-to-node communication on the same network segment. Handles physical addressing (MAC), framing, and error detection.

**PDU**: Frame
**Protocols**: Ethernet, Wi-Fi (802.11), ARP, PPP
**Devices**: Switch, bridge
**Key concepts**: MAC addresses, CSMA/CD, VLANs

### Layer 1 — Physical

**What it does**: Transmits raw bits over a physical medium. Defines electrical/optical/wireless specifications.

**PDU**: Bit
**Protocols**: USB, Bluetooth, DSL, SONET
**Devices**: Hub, repeater, cables, fiber optics
**Key concepts**: Bandwidth, signal, encoding

---

## Encapsulation and Decapsulation

As data moves **down** the stack, each layer adds its own **header** (and sometimes trailer). This is **encapsulation**:

```
Application:   [ Data                           ]
Transport:     [ TCP Header | Data              ]  → Segment
Network:       [ IP Header | TCP Hdr | Data    ]  → Packet
Data Link:     [ MAC Hdr | IP Hdr | TCP | Data | FCS ]  → Frame
Physical:      bits ──────────────────────────────────
```

At the receiver, each layer **strips** its header and passes the payload up — **decapsulation**.

---

## Layer Summary Table

| Layer | Name | PDU | Address | Key Protocols | Device |
|---|---|---|---|---|---|
| 7 | Application | Data | — | HTTP, FTP, SMTP, DNS | — |
| 6 | Presentation | Data | — | TLS, JPEG | — |
| 5 | Session | Data | — | NetBIOS, RPC | — |
| 4 | Transport | Segment/Datagram | Port | TCP, UDP | Firewall |
| 3 | Network | Packet | IP address | IP, ICMP, OSPF | Router |
| 2 | Data Link | Frame | MAC address | Ethernet, ARP | Switch |
| 1 | Physical | Bit | — | — | Hub, cable |

---

## Mnemonic

**Top to bottom (7→1)**: **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing
**Bottom to top (1→7)**: **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way

---

## OSI vs TCP/IP Model

| OSI | TCP/IP |
|---|---|
| 7 Application | Application |
| 6 Presentation | Application |
| 5 Session | Application |
| 4 Transport | Transport |
| 3 Network | Internet |
| 2 Data Link | Network Access |
| 1 Physical | Network Access |

TCP/IP collapses the top three OSI layers into one Application layer, and the bottom two into one Network Access layer.

---

## Troubleshooting with OSI

Working bottom-up:
1. **Physical**: Is the cable plugged in? Is the link light on?
2. **Data Link**: Is the switch port up? ARP resolving?
3. **Network**: Can you ping? Is the route correct?
4. **Transport**: Is the port open? Firewall blocking?
5. **Application**: Is the service running? Correct credentials?

---

## Worked Example: HTTP Request Across All 7 Layers

**Scenario**: Your browser fetches `http://example.com/index.html` from a server at 93.184.216.34.

### Layer 7 — Application
The browser generates an HTTP GET request:
```
GET /index.html HTTP/1.1
Host: example.com
```
This is raw **application data** — no transport or network information yet.

### Layer 6 — Presentation
For plain HTTP, no transformation happens here.
With HTTPS, TLS encrypts the payload here. The HTTP data becomes ciphertext; the layer adds a TLS record header (`Content Type: 23, Version: TLS 1.3, Length: ...`).

### Layer 5 — Session
The session layer tracks that this HTTP connection belongs to the current browser tab/session. For HTTP/1.1 keep-alive, multiple requests share one session without re-establishing each time.

### Layer 4 — Transport (TCP Segment)
TCP wraps the HTTP data in a **segment**:
```
Src Port:  54321  (ephemeral, assigned by OS)
Dst Port:  80     (HTTP well-known port)
Seq:       1001   (next byte in stream)
Ack:       5001   (confirming server data received)
Flags:     ACK
Data:      [HTTP GET /index.html ...]
```
TCP guarantees this arrives in order, retransmitting if lost.

### Layer 3 — Network (IP Packet)
The OS wraps the TCP segment in an **IP packet**:
```
Src IP:  192.168.1.100   (your machine)
Dst IP:  93.184.216.34   (example.com)
TTL:     64
Proto:   6 (TCP)
Payload: [TCP segment]
```
The router uses the destination IP to forward the packet toward example.com.

### Layer 2 — Data Link (Ethernet Frame)
The NIC wraps the packet in an **Ethernet frame** using MAC addresses:
```
Dst MAC:  AA:BB:CC:DD:EE:FF   (default gateway's MAC, found via ARP)
Src MAC:  11:22:33:44:55:66   (your NIC's MAC)
EtherType: 0x0800             (IPv4)
Payload:  [IP packet]
FCS:      [4-byte CRC]
```
Note: the destination MAC is the **gateway's MAC**, not example.com's — the frame only travels to the next hop.

### Layer 1 — Physical
The frame is converted to electrical signals (or light pulses in fiber, or radio waves in Wi-Fi) and transmitted over the wire.

### At the Server: Decapsulation (Bottom-Up)

```
Physical  → NIC receives bits, assembles frame
Data Link → checks dst MAC (matches server's NIC) → strips Ethernet header
Network   → checks dst IP (93.184.216.34 = me) → strips IP header
Transport → checks dst port (80) → passes payload to web server process
Session   → routes to correct HTTP session
Presentation → (decrypts if TLS)
Application  → web server reads "GET /index.html HTTP/1.1" → serves file
```

### Full Encapsulation Summary

```
[HTTP data                                              ] ← Layer 7
[TLS record | HTTP data                                ] ← Layer 6 (HTTPS)
[TCP Hdr: 54321→443 | TLS | HTTP data             ]    ← Layer 4
[IP Hdr: 192.168.1.100→93.184.216.34 | TCP | ...  ]    ← Layer 3
[Eth: MAC_A→MAC_GW | IP | TCP | data | FCS         ]    ← Layer 2
[01001101 00101100 ... bits ...]                         ← Layer 1
```
