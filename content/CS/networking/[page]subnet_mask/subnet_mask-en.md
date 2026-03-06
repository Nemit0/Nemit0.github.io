---
title: "Subnet Mask and Subnetting"
description: "IP addressing and subnetting — subnet masks, CIDR notation, network vs host portions, calculating subnets, VLSM, and private IP ranges."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "subnet mask", "CIDR", "subnetting", "IP addressing", "IPv4"]
author: "Nemit"
featured: false
pinned: false
---

# Subnet Mask and Subnetting

## IPv4 Address Structure

An IPv4 address is 32 bits, written as four octets in dotted decimal:

```
192.168.1.100

11000000 . 10101000 . 00000001 . 01100100
   192        168        1          100
```

Every IPv4 address has two parts:
- **Network portion**: identifies the network
- **Host portion**: identifies the device within that network

The **subnet mask** defines where the network portion ends and the host portion begins.

---

## Subnet Mask

A subnet mask is also 32 bits. Network bits = 1, host bits = 0.

```
255.255.255.0  =  11111111.11111111.11111111.00000000
                  ─────────────────────────  ────────
                        Network portion       Host

IP:   192.168.1.100  →  Network: 192.168.1.0  /  Host: .100
Mask: 255.255.255.0
```

### AND Operation: Finding Network Address

```
IP:    192.168.1.100    11000000.10101000.00000001.01100100
Mask:  255.255.255.0    11111111.11111111.11111111.00000000
AND                     ────────────────────────────────────
Network: 192.168.1.0    11000000.10101000.00000001.00000000
```

---

## CIDR Notation

**CIDR (Classless Inter-Domain Routing)** uses a slash suffix to indicate the number of network bits:

```
192.168.1.100/24
              ↑
              24 network bits → subnet mask = 255.255.255.0
```

| CIDR | Subnet Mask | Hosts per Subnet | Use Case |
|---|---|---|---|
| /8 | 255.0.0.0 | 16,777,214 | Large organization |
| /16 | 255.255.0.0 | 65,534 | Medium organization |
| /24 | 255.255.255.0 | 254 | Small office/network |
| /25 | 255.255.255.128 | 126 | Half of /24 |
| /26 | 255.255.255.192 | 62 | Quarter of /24 |
| /27 | 255.255.255.224 | 30 | Small segment |
| /28 | 255.255.255.240 | 14 | Very small segment |
| /29 | 255.255.255.248 | 6 | Point-to-point links |
| /30 | 255.255.255.252 | 2 | Router links |
| /31 | — | 2 (no broadcast) | RFC 3021 P2P |
| /32 | 255.255.255.255 | 1 | Single host/loopback |

**Hosts per subnet** = 2^(32 − prefix) − 2 (subtract network and broadcast addresses).

---

## Key Addresses in a Subnet

For `192.168.1.0/24`:

| Address | Value | Description |
|---|---|---|
| Network address | 192.168.1.0 | First address; identifies the subnet |
| First usable | 192.168.1.1 | First host address |
| Last usable | 192.168.1.254 | Last host address |
| Broadcast | 192.168.1.255 | Last address; sent to all hosts in subnet |

You cannot assign the network address or broadcast address to a host.

---

## Subnetting Example

**Problem**: You have `192.168.10.0/24` and need 4 equal subnets.

**Solution**: Borrow 2 bits from the host portion (2² = 4 subnets):
- New prefix: /24 + 2 = **/26**
- Hosts per subnet: 2^(32-26) − 2 = 62 hosts

| Subnet | Network | First Host | Last Host | Broadcast |
|---|---|---|---|---|
| 1 | 192.168.10.0/26 | .1 | .62 | .63 |
| 2 | 192.168.10.64/26 | .65 | .126 | .127 |
| 3 | 192.168.10.128/26 | .129 | .190 | .191 |
| 4 | 192.168.10.192/26 | .193 | .254 | .255 |

---

## VLSM — Variable Length Subnet Masking

VLSM allows subnets of different sizes within the same address space. Efficient allocation when subnets have very different host counts.

**Example**: allocate 192.168.1.0/24 for:
- Department A: 100 hosts → /25 (126 hosts)
- Department B: 50 hosts → /26 (62 hosts)
- Department C: 25 hosts → /27 (30 hosts)
- Router links (×2): /30 (2 hosts each)

```
192.168.1.0/24:
├── 192.168.1.0/25    (Dept A: 126 hosts)
└── 192.168.1.128/26  (Dept B: 62 hosts)
    └── 192.168.1.192/27  (Dept C: 30 hosts)
        └── 192.168.1.224/30  (Router link 1)
            └── 192.168.1.228/30  (Router link 2)
```

---

## Private IP Ranges

RFC 1918 defines private addresses (not routable on the public Internet):

| Range | CIDR | Block Size |
|---|---|---|
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | 16,777,216 addresses |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | 1,048,576 addresses |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | 65,536 addresses |

Private addresses use **NAT (Network Address Translation)** to access the Internet.

### Special Addresses

| Range | Description |
|---|---|
| 127.0.0.0/8 | Loopback (127.0.0.1 = localhost) |
| 169.254.0.0/16 | Link-local (APIPA — when DHCP fails) |
| 0.0.0.0/0 | Default route (any network) |
| 255.255.255.255/32 | Limited broadcast |
| 224.0.0.0/4 | Multicast |

---

## Classful Addressing (Historical)

Before CIDR, addresses were divided into fixed classes:

| Class | Range | Default Mask | Hosts |
|---|---|---|---|
| A | 1–126.x.x.x | /8 | 16M |
| B | 128–191.x.x.x | /16 | 65K |
| C | 192–223.x.x.x | /24 | 254 |
| D | 224–239.x.x.x | — | Multicast |
| E | 240–255.x.x.x | — | Reserved |

Classful addressing was wasteful (a company needing 1000 hosts got a class B = 65K addresses). CIDR (1993) replaced it with flexible prefix lengths.

---

## Practical Subnetting Tips

**Subnet increment** = 256 − last octet of subnet mask:
- /26 → mask ends in 192 → increment = 256 − 192 = **64**
- Subnets: .0, .64, .128, .192

**Quick host count**: 2^(32 − prefix) − 2

**Is an IP in a subnet?**
```
IP:      192.168.1.100
Subnet:  192.168.1.64/26

Mask:    255.255.255.192
IP AND mask:    192.168.1.64    (= network address of /26 subnet starting at .64) ✓
```

---

## Worked Example: Subnetting a /22 for 6 Departments

**Given**: `10.0.0.0/22` (1022 usable hosts). Allocate subnets for 6 departments using VLSM.

### Step 1: Determine Requirements

| Department | Hosts Needed | Subnet Size |
|---|---|---|
| Engineering | 200 | /24 (254 hosts) |
| Sales | 100 | /25 (126 hosts) |
| Finance | 50 | /26 (62 hosts) |
| HR | 25 | /27 (30 hosts) |
| Management | 10 | /28 (14 hosts) |
| Server Links (×2) | 2 each | /30 (2 hosts) |

**VLSM rule**: allocate largest subnets first to avoid fragmentation.

### Step 2: Binary Layout of 10.0.0.0/22

The /22 block spans:
```
10.0.0.0  to  10.0.3.255   (4 × /24 = 1024 addresses)
```

### Step 3: Allocate Largest First

**Engineering → /24 (need 200 hosts)**
```
Subnet:    10.0.0.0/24
Range:     10.0.0.1  –  10.0.0.254
Broadcast: 10.0.0.255
Remaining: 10.0.1.0  –  10.0.3.255  (3 × /24 left)
```

**Sales → /25 (need 100 hosts)**
```
Subnet:    10.0.1.0/25
Range:     10.0.1.1  –  10.0.1.126
Broadcast: 10.0.1.127
Remaining: 10.0.1.128  –  10.0.3.255
```

**Finance → /26 (need 50 hosts)**
```
Subnet:    10.0.1.128/26
Range:     10.0.1.129  –  10.0.1.190
Broadcast: 10.0.1.191
Remaining: 10.0.1.192  –  10.0.3.255
```

**HR → /27 (need 25 hosts)**
```
Subnet:    10.0.1.192/27
Range:     10.0.1.193  –  10.0.1.222
Broadcast: 10.0.1.223
Remaining: 10.0.1.224  –  10.0.3.255
```

**Management → /28 (need 10 hosts)**
```
Subnet:    10.0.1.224/28
Range:     10.0.1.225  –  10.0.1.238
Broadcast: 10.0.1.239
Remaining: 10.0.1.240  –  10.0.3.255
```

**Router links × 2 → /30**
```
Link 1:    10.0.1.240/30   (10.0.1.241 – 10.0.1.242)
Link 2:    10.0.1.244/30   (10.0.1.245 – 10.0.1.246)
```

### Step 4: Summary

```
10.0.0.0/22  (total block)
├── 10.0.0.0/24     Engineering   (254 hosts)
├── 10.0.1.0/25     Sales         (126 hosts)
├── 10.0.1.128/26   Finance       (62 hosts)
├── 10.0.1.192/27   HR            (30 hosts)
├── 10.0.1.224/28   Management    (14 hosts)
├── 10.0.1.240/30   Router link 1 (2 hosts)
├── 10.0.1.244/30   Router link 2 (2 hosts)
└── 10.0.1.248/29   (unused — available for future)
    10.0.2.0/23     (unused — available for growth)
```

### Step 5: Verify — Is 10.0.1.150 in the Finance subnet?

```
Finance subnet: 10.0.1.128/26
Mask:           255.255.255.192  (11111111.11111111.11111111.11000000)

10.0.1.150 in binary:
  10.0.1.150 = 00001010.00000000.00000001.10010110

Apply mask:
  00001010.00000000.00000001.10000000
  = 10.0.1.128   ← network address of Finance subnet ✓

Range: 10.0.1.128 – 10.0.1.191
10.0.1.150 is within range → YES, it belongs to Finance.
```
