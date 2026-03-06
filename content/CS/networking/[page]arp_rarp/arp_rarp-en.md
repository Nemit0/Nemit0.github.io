---
title: "ARP and RARP"
description: "ARP (Address Resolution Protocol) and RARP — how IP addresses map to MAC addresses, ARP cache, ARP request/reply process, Gratuitous ARP, and ARP spoofing."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "ARP", "RARP", "MAC address", "IP address", "Layer 2"]
author: "Nemit"
featured: false
pinned: false
---

# ARP and RARP

## The Problem ARP Solves

When Host A wants to send a packet to Host B on the same network:
- A knows B's **IP address** (from DNS or configuration)
- A needs B's **MAC address** to construct the Ethernet frame
- How does A find B's MAC?

**ARP (Address Resolution Protocol)** answers this. It maps IP addresses to MAC addresses on a local network (Layer 3 → Layer 2).

---

## ARP Process

```
Host A (192.168.1.10)              Host B (192.168.1.20)
MAC: AA:BB:CC:11:22:33             MAC: AA:BB:CC:44:55:66

  │                                   │
  │── ARP Request (BROADCAST) ───────►│ (and all other hosts)
  │   "Who has 192.168.1.20?          │
  │    Tell 192.168.1.10"             │
  │                                   │
  │◄── ARP Reply (UNICAST) ──────────│
  │    "192.168.1.20 is at            │
  │     AA:BB:CC:44:55:66"            │
  │                                   │
  │  [A caches B's MAC in ARP table]  │
  │                                   │
  │── Ethernet frame to B ───────────►│
  │   dst MAC: AA:BB:CC:44:55:66      │
```

### ARP Request

- **Source MAC**: sender's MAC
- **Source IP**: sender's IP
- **Target MAC**: `FF:FF:FF:FF:FF:FF` (broadcast — "I don't know yet")
- **Target IP**: IP to resolve
- Sent as **Ethernet broadcast** — all hosts on the segment receive it

### ARP Reply

- **Source MAC**: responder's MAC (the answer!)
- **Source IP**: responder's IP
- **Target MAC**: requester's MAC (unicast back to them)
- **Target IP**: requester's IP

---

## ARP Cache

ARP replies are cached in the **ARP table** (also called ARP cache) to avoid repeated broadcasts:

```bash
# View ARP cache on Linux
arp -n
ip neigh show

# Example output:
192.168.1.1  dev eth0  lladdr aa:bb:cc:dd:ee:ff  REACHABLE
192.168.1.20 dev eth0  lladdr aa:bb:cc:44:55:66  REACHABLE
```

Cache entries expire after a timeout (typically 20–60 seconds). Dynamic entries are refreshed when used.

---

## ARP Packet Format

```
Hardware type:        Ethernet (1)
Protocol type:        IPv4 (0x0800)
Hardware addr length: 6 (MAC)
Protocol addr length: 4 (IPv4)
Operation:            1 = Request, 2 = Reply
Sender hardware addr: sender MAC
Sender protocol addr: sender IP
Target hardware addr: target MAC (all zeros in request)
Target protocol addr: target IP
```

ARP operates at **Layer 2/3 boundary**. It is not routable — ARP traffic stays within the local broadcast domain.

---

## Gratuitous ARP

A **Gratuitous ARP (GARP)** is an ARP request where the sender asks for its own IP address. It's used to:
1. **Announce an IP change**: notify neighbors of a new MAC
2. **Detect duplicates**: if anyone replies, there's an IP conflict
3. **Update ARP caches**: after failover (VRRP, HSRP) to point traffic to new MAC

```
Host A: "Who has 192.168.1.10?" (asking about itself)
       → no expected reply, but all neighbors update their caches
```

---

## Proxy ARP

A router answers ARP requests on behalf of hosts in another subnet. Allows hosts without a default gateway to reach remote networks.

**Modern usage**: mostly discouraged; proper routing is preferred.

---

## ARP Spoofing (ARP Poisoning)

An attacker sends fake ARP replies to poison ARP caches:

```
Attacker to Host A: "192.168.1.1 (gateway) is at ATTACKER_MAC"
Attacker to Gateway: "192.168.1.10 (Host A) is at ATTACKER_MAC"

Result:
A → Gateway traffic → goes through attacker (MITM)
Gateway → A traffic → goes through attacker
```

**Defenses**:
- **Dynamic ARP Inspection (DAI)**: switch validates ARP packets against DHCP snooping table
- **Static ARP entries**: manually set critical entries (not scalable)
- **Port security**: limit MACs per port
- **HTTPS/TLS**: even if traffic is intercepted, it's encrypted

---

## RARP — Reverse ARP

**RARP** is the reverse of ARP: maps a **MAC address to an IP address**. Used by diskless workstations that know their MAC but not their IP.

```
Client (knows MAC, not IP):
  ──── RARP Request (Broadcast) ────────► RARP Server
       "My MAC is AA:BB:CC:11:22:33.
        What is my IP?"
  ◄─── RARP Reply ─────────────────────
       "Your IP is 192.168.1.100"
```

RARP is **obsolete**. It was replaced by:
- **BOOTP** (Bootstrap Protocol)
- **DHCP** (Dynamic Host Configuration Protocol) — the modern standard

---

## IPv6: NDP Instead of ARP

IPv6 does not use ARP. Instead it uses **NDP (Neighbor Discovery Protocol)** which is part of ICMPv6:

| ARP | NDP (ICMPv6) |
|---|---|
| ARP Request | Neighbor Solicitation (NS) |
| ARP Reply | Neighbor Advertisement (NA) |
| Gratuitous ARP | Unsolicited NA |
| Broadcast | Multicast (more efficient) |

NDP also handles router discovery and stateless address autoconfiguration (SLAAC).

---

## Worked Example: ARP Resolution Step by Step

**Scenario**: Host A (`192.168.1.10`, MAC `AA:BB:CC:11:22:33`) wants to send data to Host B (`192.168.1.20`) on the same subnet. A's ARP cache is empty.

### Step 1: Check ARP Cache — Miss

```bash
# Host A checks its ARP table
arp -n
# Address          HWtype  HWaddress  Flags   Iface
# 192.168.1.1      ether   ...        C       eth0
# 192.168.1.20 → NOT FOUND
```

### Step 2: Broadcast ARP Request

Host A sends a broadcast Ethernet frame to the entire LAN:

```
Ethernet frame:
  Dst MAC:  FF:FF:FF:FF:FF:FF  ← broadcast (all hosts receive)
  Src MAC:  AA:BB:CC:11:22:33
  EtherType: 0x0806            ← ARP

ARP payload:
  Operation:          1 (Request)
  Sender MAC:         AA:BB:CC:11:22:33
  Sender IP:          192.168.1.10
  Target MAC:         00:00:00:00:00:00  ← unknown
  Target IP:          192.168.1.20       ← who has this?
```

Every host on the segment (192.168.1.x) receives this. All hosts check: "Is 192.168.1.20 my IP?"

### Step 3: Host B Replies (Unicast)

Only Host B (`192.168.1.20`, MAC `AA:BB:CC:44:55:66`) replies:

```
Ethernet frame:
  Dst MAC:  AA:BB:CC:11:22:33  ← unicast to requester
  Src MAC:  AA:BB:CC:44:55:66
  EtherType: 0x0806

ARP payload:
  Operation:          2 (Reply)
  Sender MAC:         AA:BB:CC:44:55:66  ← here's my MAC
  Sender IP:          192.168.1.20
  Target MAC:         AA:BB:CC:11:22:33  ← you
  Target IP:          192.168.1.10
```

### Step 4: A Updates Cache and Sends Data

```bash
# Host A's ARP table after reply:
# 192.168.1.20    ether   AA:BB:CC:44:55:66   C   eth0
#                                             TTL: ~20-60s
```

Host A can now send the IP packet to Host B using its MAC:

```
Ethernet frame to B:
  Dst MAC:  AA:BB:CC:44:55:66
  Src MAC:  AA:BB:CC:11:22:33
  EtherType: 0x0800  ← IPv4

IP payload:
  Src: 192.168.1.10
  Dst: 192.168.1.20
  [TCP/UDP/ICMP data]
```

### ARP for Off-Subnet Destination

What if A wants to reach `8.8.8.8` (Google DNS) — off-subnet?
```
A does NOT ARP for 8.8.8.8 (different subnet → not on local LAN)
Instead:
  A ARPs for its default gateway: 192.168.1.1
  Gets gateway MAC: DD:EE:FF:00:11:22
  Sends frame: Dst MAC=DD:EE:FF:00:11:22, IP Dst=8.8.8.8
  Router handles the rest
```

---

## Worked Example: ARP Spoofing Attack

**Network**: 192.168.1.0/24

| Host | IP | MAC |
|---|---|---|
| Victim | 192.168.1.10 | `AA:BB:CC:11:22:33` |
| Gateway | 192.168.1.1 | `DD:EE:FF:00:11:22` |
| Attacker | 192.168.1.99 | `EE:EE:EE:EE:EE:EE` |

### Attack: Attacker Sends Fake ARP Replies

```
Attacker → Victim (unsolicited ARP reply):
  "192.168.1.1 (gateway) is at EE:EE:EE:EE:EE:EE"
  → Victim's ARP cache: 192.168.1.1 = EE:EE:EE:EE:EE:EE  (poisoned!)

Attacker → Gateway (unsolicited ARP reply):
  "192.168.1.10 (victim) is at EE:EE:EE:EE:EE:EE"
  → Gateway's ARP cache: 192.168.1.10 = EE:EE:EE:EE:EE:EE  (poisoned!)
```

### Result: Man-in-the-Middle

```
Before attack:
Victim ──────────────────────────────────► Gateway ──► Internet

After attack:
Victim ──► Attacker ──► Gateway ──► Internet
                    ◄──────────────────────
(Attacker forwards traffic to avoid detection, reads/modifies everything)
```

The attacker enables IP forwarding so victims notice no disruption:
```bash
echo 1 > /proc/sys/net/ipv4/ip_forward
```

### Detection

```bash
# On victim: check if gateway IP has an unexpected MAC
arp -n | grep 192.168.1.1
# 192.168.1.1   ether   ee:ee:ee:ee:ee:ee  C  eth0   ← should be dd:ee:ff:00:11:22!

# Compare MAC with known-good value:
# If MAC changed unexpectedly → ARP poisoning in progress
```

### Gratuitous ARP for VRRP Failover

VRRP (Virtual Router Redundancy Protocol) uses Gratuitous ARP to announce failover:

```
Active router (R1) fails.
Backup router (R2) takes over VIP (192.168.1.254):

R2 sends Gratuitous ARP:
  "Who has 192.168.1.254? Tell 192.168.1.254"
  (asking about itself — no reply expected)

All hosts in the LAN receive this and update:
  ARP cache: 192.168.1.254 (VIP) = R2's MAC

Result: Within 1 GARP packet, all hosts redirect gateway traffic to R2.
Failover time: < 1 second (vs waiting for ARP cache to expire: 20-60s)
```

---

## Summary

| Protocol | Function | Direction |
|---|---|---|
| ARP | IP → MAC | Forward |
| RARP | MAC → IP | Reverse (obsolete) |
| DHCP | Assigns IP, gateway, DNS | Server → Client |
| NDP (IPv6) | IP → MAC + more | Forward (IPv6) |
