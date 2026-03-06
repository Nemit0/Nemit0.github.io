---
title: "Routing Basics"
description: "Network routing fundamentals — how routers forward packets, routing tables, static vs dynamic routing, distance vector vs link state protocols (RIP, OSPF, BGP), metrics and administrative distance."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "routing", "BGP", "OSPF", "RIP", "router", "Layer 3"]
author: "Nemit"
featured: false
pinned: false
---

# Routing Basics

## What Is Routing?

**Routing** is the process of selecting a path for network traffic from source to destination across one or more networks (Layer 3). A **router** is a device that forwards packets between networks using **IP addresses**.

Routing answers: "Given this packet's destination IP, out which interface should I send it?"

---

## Routing Table

Every router maintains a **routing table** — a list of known networks and how to reach them.

```bash
# Linux routing table
ip route show

# Output:
default via 192.168.1.1 dev eth0
10.0.0.0/8 via 10.1.1.1 dev eth1
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100
```

### Routing Table Entry Fields

| Field | Description |
|---|---|
| **Destination** | Network address / CIDR |
| **Next hop** | IP of the next router to forward to |
| **Interface** | Outgoing interface |
| **Metric** | Cost of this path (lower = preferred) |
| **Administrative Distance** | Trustworthiness of the routing source |

### Longest Prefix Match

When multiple routes match a destination, the router uses the **most specific** (longest prefix):

```
Routes:
  10.0.0.0/8   via 10.1.1.1
  10.1.0.0/16  via 10.2.2.2
  10.1.2.0/24  via 10.3.3.3

Packet to 10.1.2.5:
  Matches /8 → possible
  Matches /16 → more specific
  Matches /24 → most specific → use 10.3.3.3
```

---

## Types of Routes

### Connected Routes

Automatically added when an interface is configured with an IP and is up.

```
192.168.1.0/24 dev eth0 (directly connected)
```

### Static Routes

Manually configured by the administrator. Simple and predictable but don't adapt to failures.

```bash
# Add static route
ip route add 10.0.0.0/8 via 192.168.1.1

# Default route (send everything unknown to this gateway)
ip route add default via 192.168.1.1
```

**Use cases**: small networks, specific policy routing, last-resort routes.

### Dynamic Routes

Learned from other routers via **routing protocols**. Automatically adapt when topology changes.

---

## Static vs Dynamic Routing

| Aspect | Static | Dynamic |
|---|---|---|
| Configuration | Manual | Automatic via protocol |
| Scalability | Poor (many routes) | Good |
| Convergence | Instant (no protocol needed) | Depends on protocol |
| Fault tolerance | Manual fix required | Auto-recalculates |
| Overhead | None | Protocol messages consume bandwidth |
| Use case | Small nets, specific routes | Large, complex networks |

---

## Routing Protocols

Routing protocols exchange topology information between routers to build routing tables automatically.

### Classification

**By scope**:
- **IGP (Interior Gateway Protocol)**: within a single organization's network (AS)
- **EGP (Exterior Gateway Protocol)**: between different organizations/ISPs

**By algorithm**:
- **Distance Vector**: each router knows distance to destinations; shares its table with neighbors
- **Link State**: each router knows the full topology; runs SPF algorithm

---

## Distance Vector: RIP

**RIP (Routing Information Protocol)** — simplest routing protocol.

- Metric: **hop count** (max 15; 16 = unreachable)
- Updates: broadcast full table every 30 seconds
- Convergence: slow (Bellman-Ford algorithm)
- Loop prevention: split horizon, route poisoning
- Versions: RIPv1 (classful), RIPv2 (CIDR support), RIPng (IPv6)

```
Router A knows:
  Network 10.0.0.0 — 1 hop
  Network 172.16.0.0 — 2 hops

Router A tells neighbors:
  "I can reach 10.0.0.0 in 1 hop"
  "I can reach 172.16.0.0 in 2 hops"
```

**Problems**: limited to 15 hops, slow convergence, wastes bandwidth on large networks.

---

## Link State: OSPF

**OSPF (Open Shortest Path First)** — most widely used IGP.

- Metric: **cost** (based on interface bandwidth by default; lower cost = faster link)
- Algorithm: **Dijkstra's SPF (Shortest Path First)**
- Topology: each router builds a complete **Link State Database (LSDB)**
- Updates: only sent when topology changes (event-driven), not periodic
- Convergence: fast
- Areas: hierarchical design (Area 0 = backbone)

```
OSPF Cost = Reference Bandwidth / Interface Bandwidth
Default reference: 100 Mbps
  FastEthernet (100 Mbps): cost = 1
  GigabitEthernet (1 Gbps): cost = 1 (same as FastEthernet unless adjusted)
  T1 (1.544 Mbps): cost = 64
```

**OSPF Adjacency States**: Down → Init → 2-Way → ExStart → Exchange → Loading → **Full**

### OSPF Areas

- **Area 0 (Backbone)**: all other areas must connect to Area 0
- **ABR (Area Border Router)**: connects multiple areas
- **ASBR (AS Boundary Router)**: redistributes external routes into OSPF

---

## BGP — Border Gateway Protocol

**BGP** is the routing protocol of the Internet — the only EGP in widespread use.

- Manages routing between **Autonomous Systems (AS)** — organizations with their own routing policy
- **Path vector** protocol (extension of distance vector; tracks full AS path)
- Metric: uses many **attributes** (AS-PATH, LOCAL_PREF, MED, etc.) to select best path
- TCP port **179** (reliable transport)
- Types: eBGP (between ASes), iBGP (within an AS)

### BGP Path Selection (simplified, in order)

1. Highest LOCAL_PREF (prefer internal policy)
2. Shortest AS-PATH (fewest AS hops)
3. Lowest MED (prefer neighbor's preferred entry)
4. eBGP over iBGP
5. Lowest IGP metric to next hop
6. Lowest Router ID (tiebreaker)

```
AS 100 ──── eBGP ──── AS 200 ──── eBGP ──── AS 300
(ISP A)               (Customer)              (ISP B)
```

---

## Administrative Distance

When multiple routing sources know about the same network, the router trusts the source with the **lowest Administrative Distance (AD)**:

| Source | AD |
|---|---|
| Connected route | 0 |
| Static route | 1 |
| EIGRP summary | 5 |
| eBGP | 20 |
| OSPF | 110 |
| RIP | 120 |
| iBGP | 200 |
| Unknown | 255 (unusable) |

If OSPF and RIP both know route to 10.0.0.0/8, OSPF wins (110 < 120).

---

## Routing Metrics by Protocol

| Protocol | Metric |
|---|---|
| RIP | Hop count |
| OSPF | Cost (bandwidth-based) |
| EIGRP | Composite (bandwidth + delay + load + reliability) |
| BGP | Path attributes (not a simple metric) |
| Static | Manually assigned (default 0) |

---

## How a Router Forwards a Packet

```
1. Receive packet on interface
2. Check destination IP
3. Look up routing table (longest prefix match)
4. If match found:
     a. Decrement TTL (if TTL=0, drop + send ICMP Time Exceeded)
     b. Update destination MAC to next-hop MAC (ARP if needed)
     c. Forward out the appropriate interface
5. If no match and default route exists: forward to default gateway
6. If no match and no default: drop + send ICMP Destination Unreachable
```

---

## Worked Example: Longest Prefix Match in Detail

**Router R1's routing table**:

```
Destination       Next Hop       Interface   Metric  AD   Source
0.0.0.0/0         203.0.113.1    eth0        1       1    static (default)
10.0.0.0/8        10.1.0.1       eth1        10      110  OSPF
10.1.0.0/16       10.1.0.1       eth1        5       110  OSPF
10.1.2.0/24       10.2.0.1       eth2        2       110  OSPF
10.1.2.128/25     10.3.0.1       eth3        1       110  OSPF
192.168.1.0/24    —              eth0        0       0    connected
```

**Incoming packets and their forwarding decisions**:

| Packet Dst | Matches | Longest Match | Next Hop |
|---|---|---|---|
| `10.1.2.200` | /8, /16, /24, /25, default | **/25** (most bits match) | eth3 → 10.3.0.1 |
| `10.1.2.50` | /8, /16, /24, default | **/24** | eth2 → 10.2.0.1 |
| `10.1.5.1` | /8, /16, default | **/16** | eth1 → 10.1.0.1 |
| `10.5.0.1` | /8, default | **/8** | eth1 → 10.1.0.1 |
| `172.16.0.1` | default only | **/0** (default) | eth0 → 203.0.113.1 |
| `192.168.1.50` | connected | **/24 connected** | eth0 (direct) |

### Binary Prefix Matching for 10.1.2.200

```
Packet:         10  .  1  .  2  .  200
Binary:    00001010.00000001.00000010.11001000

Route /8:  00001010.xxxxxxxx.xxxxxxxx.xxxxxxxx  ← matches first 8 bits ✓
Route /16: 00001010.00000001.xxxxxxxx.xxxxxxxx  ← matches first 16 bits ✓
Route /24: 00001010.00000001.00000010.xxxxxxxx  ← matches first 24 bits ✓
Route /25: 00001010.00000001.00000010.1xxxxxxx  ← matches first 25 bits ✓
           (200 = 11001000, first bit = 1 → matches /25's 128 boundary)

Winner: /25 (25 > 24 > 16 > 8) → forward to eth3 → 10.3.0.1
```

---

## Worked Example: OSPF Cost Calculation

**Network topology**:

```
R1 ──── GigE (1 Gbps) ──── R2 ──── FastE (100 Mbps) ──── R3
 └────── T1 (1.544 Mbps) ──────────────────────────────── R3
```

**OSPF reference bandwidth**: 100 Mbps (default)

```
Cost formula: Reference Bandwidth / Interface Bandwidth

R1→R2 GigE:  100 Mbps / 1000 Mbps = 0.1 → rounded up to 1
R2→R3 FastE: 100 Mbps / 100 Mbps  = 1
R1→R3 T1:   100 Mbps / 1.544 Mbps = 64.77 → rounded to 64
```

**Path costs**:
```
Path R1→R2→R3: cost = 1 (GigE) + 1 (FastE) = 2
Path R1→R3 T1: cost = 64

OSPF picks R1→R2→R3 (cost 2 << cost 64). Correct behavior.
```

**Problem**: GigE and 100 Mbps FastEthernet both have cost=1 with default reference.

```
Fix: increase reference bandwidth to match modern networks
ip ospf auto-cost reference-bandwidth 10000  (10 Gbps)

GigE:   10000 / 1000  = 10
FastE:  10000 / 100   = 100
10GigE: 10000 / 10000 = 1

Now OSPF correctly prefers GigE over FastEthernet.
```

---

## Worked Example: Administrative Distance Tiebreaker

Router R1 learns about `192.168.50.0/24` from two sources simultaneously:

```
OSPF says:  192.168.50.0/24 via 10.0.0.2 (interface eth1), metric 30
RIP says:   192.168.50.0/24 via 10.0.1.5 (interface eth2), metric 3 hops
```

Even though RIP's hop count (3) is numerically lower than OSPF's cost (30), **AD decides**:

```
OSPF AD = 110
RIP  AD = 120

110 < 120  →  OSPF route wins, installed in routing table.
RIP route is kept in RIP's own database as a backup
(if OSPF route disappears, RIP route may be promoted).
```

Only routes from the **same protocol** compare metrics. Different protocols use AD first.
