---
title: "VLAN — Virtual Local Area Network"
description: "VLAN fundamentals — IEEE 802.1Q tagging, access and trunk ports, native VLAN, inter-VLAN routing, benefits, and configuration overview."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "VLAN", "802.1Q", "switching", "Layer 2", "trunk"]
author: "Nemit"
featured: false
pinned: false
---

# VLAN — Virtual Local Area Network

## What Is a VLAN?

A **VLAN (Virtual LAN)** logically divides a single physical network into **multiple isolated broadcast domains**, without requiring separate physical switches.

Devices in the same VLAN can communicate directly (Layer 2). Devices in different VLANs must go through a router (Layer 3).

```
Physical switch (1 device)          Logical view (3 VLANs)

┌────────────────────────┐     VLAN 10 (Engineering)
│  Port 1  → PC1         │     ─── PC1 ─── PC2
│  Port 2  → PC2         │
│  Port 3  → PC3         │     VLAN 20 (Sales)
│  Port 4  → PC4         │     ─── PC3 ─── PC4
│  Port 5  → Server      │
│  Port 6  → Printer     │     VLAN 30 (Management)
│  Port 7  → Router      │     ─── Server ─── Printer
└────────────────────────┘
```

---

## Why Use VLANs?

| Benefit | Explanation |
|---|---|
| **Security** | Departments isolated; Finance can't see Engineering's traffic |
| **Broadcast control** | Broadcasts stay within a VLAN; reduces noise |
| **Flexibility** | Move users between VLANs without rewiring |
| **Cost** | One switch instead of many physical switches |
| **Performance** | Smaller broadcast domains = less wasted bandwidth |
| **Compliance** | Satisfy segmentation requirements (PCI-DSS, HIPAA) |

---

## IEEE 802.1Q — VLAN Tagging

**802.1Q** is the standard for VLAN tagging. It inserts a **4-byte tag** into the Ethernet frame:

```
Normal Ethernet Frame:
[ Dst MAC | Src MAC | EtherType | Payload | FCS ]

802.1Q Tagged Frame:
[ Dst MAC | Src MAC | 0x8100 | Tag | EtherType | Payload | FCS ]
                      ↑            ↑
                   TPID field   VLAN tag (4 bytes)
```

### 802.1Q Tag Structure (4 bytes)

```
┌─────────────────────────────────────────────┐
│ TPID (16 bits) │ PCP (3 bits) │ DEI │ VID  │
│   0x8100       │  Priority    │ (1) │ (12) │
└─────────────────────────────────────────────┘
```

- **TPID**: Tag Protocol ID = `0x8100` (identifies 802.1Q frame)
- **PCP**: Priority Code Point (0–7, used for QoS)
- **DEI**: Drop Eligible Indicator
- **VID**: VLAN ID (0–4095; 0 and 4095 reserved → 4094 usable VLANs)

---

## Access Ports vs Trunk Ports

### Access Port

- Carries traffic for **one VLAN only**
- Frames are **untagged** (VLAN tag stripped when leaving, added when entering)
- Connected to **end devices**: PCs, printers, servers

```
PC ──── (untagged) ──── Access Port (VLAN 10) ──── Switch
```

### Trunk Port

- Carries traffic for **multiple VLANs** simultaneously
- Frames are **tagged** with VLAN IDs
- Connected to **other switches, routers, or hypervisors**

```
Switch1 ──── (tagged: VLAN 10, 20, 30) ──── Trunk ──── Switch2
```

---

## Native VLAN

The **native VLAN** on a trunk port carries **untagged** frames. If an untagged frame arrives on a trunk port, it belongs to the native VLAN.

- Default native VLAN is usually VLAN 1
- Both ends of a trunk must agree on native VLAN
- **Security risk**: if native VLANs mismatch, frames may "hop" between VLANs (double-tagging attack)
- Best practice: change native VLAN to an unused VLAN

---

## Inter-VLAN Routing

Hosts in different VLANs cannot communicate without a router. Three approaches:

### 1. Router on a Stick (ROAS)

One physical link between switch and router, with trunk sub-interfaces:

```
           Router
          /  (sub-interfaces)
         /   192.168.10.1 (VLAN 10)
        /    192.168.20.1 (VLAN 20)
       /     192.168.30.1 (VLAN 30)
Switch (trunk port)
```

```
# Cisco router config example
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0

interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
```

### 2. Layer 3 Switch (SVI)

A Layer 3 switch routes between VLANs internally via **SVIs (Switched Virtual Interfaces)**. Faster than ROAS (no external router hop).

```
# Cisco L3 switch config
vlan 10
vlan 20

interface vlan 10
 ip address 192.168.10.1 255.255.255.0

interface vlan 20
 ip address 192.168.20.1 255.255.255.0

ip routing    ! Enable routing
```

### 3. Separate Router Interfaces

One physical interface per VLAN. Simple but doesn't scale.

---

## VLAN Configuration Example (Cisco)

```bash
# Create VLANs
Switch(config)# vlan 10
Switch(config-vlan)# name Engineering

Switch(config)# vlan 20
Switch(config-vlan)# name Sales

# Configure access port (VLAN 10)
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10

# Configure trunk port
Switch(config)# interface GigabitEthernet0/24
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20,30
Switch(config-if)# switchport trunk native vlan 99
```

---

## Voice VLANs

IP phones need special handling: voice and data on the same port. The access port carries data traffic (VLAN 10) and voice traffic (VLAN 99) simultaneously:

```
PC ──── IP Phone ──── Access Port
        │ VLAN 10 (data, untagged)
        │ VLAN 99 (voice, tagged)
```

---

## VLAN Types

| Type | Description |
|---|---|
| **Data VLAN** | Carries user-generated data traffic |
| **Voice VLAN** | Carries VoIP traffic (QoS-prioritized) |
| **Management VLAN** | For switch/router management (SSH, SNMP) |
| **Native VLAN** | Untagged traffic on trunk ports |
| **Black hole VLAN** | Unused VLAN for disabling unused ports |

---

## Security Considerations

- **VLAN hopping**: double-tagging or switch spoofing attacks to cross VLANs
- **Mitigation**: disable DTP (dynamic trunking), use dedicated native VLAN, use port security
- **Unused ports**: assign to a black hole VLAN and administratively shut down
- **Management VLAN**: keep separate from user VLANs; restrict access

---

## Worked Example: Frame Tagging Through a Trunk

**Scenario**: PC1 (on VLAN 10, port Gi0/1) sends data to PC3 (on VLAN 10, port Gi0/3) through a trunk link.

```
Switch1                          Switch2
Gi0/1 (access, VLAN 10)         Gi0/1 (access, VLAN 10) → PC3
Gi0/24 (trunk, VLAN 10,20,30)   Gi0/24 (trunk, VLAN 10,20,30)
```

### Step 1: PC1 Sends an Untagged Frame

PC1 sends a normal Ethernet frame (no VLAN tag — it's just a regular PC):
```
Ethernet Frame from PC1:
  Dst MAC:  PC3_MAC
  Src MAC:  PC1_MAC
  EtherType: 0x0800 (IPv4)
  Payload:  [IP packet]
  FCS:      [checksum]
```

### Step 2: Switch1 Receives on Access Port (Gi0/1, VLAN 10)

The access port **tags** the frame with VLAN ID 10:
```
Tagged Frame inside Switch1:
  Dst MAC:  PC3_MAC
  Src MAC:  PC1_MAC
  TPID:     0x8100          ← indicates 802.1Q tag follows
  PCP:      000             ← priority 0 (best effort)
  DEI:      0
  VID:      10              ← VLAN 10
  EtherType: 0x0800
  Payload:  [IP packet]
  FCS:      [recalculated]
```

Switch1 checks its MAC table: PC3_MAC is on VLAN 10 via Gi0/24 (trunk port).

### Step 3: Frame Leaves Switch1 via Trunk (Gi0/24)

The trunk carries the **tagged frame** — the 802.1Q tag stays on:
```
On the wire between switches:
  [Dst MAC | Src MAC | 0x8100 | Tag(VID=10) | 0x0800 | IP Packet | FCS]
```

VLAN 20 and VLAN 30 traffic also travels this same cable simultaneously, each with their own VID in the tag.

### Step 4: Switch2 Receives Tagged Frame on Trunk (Gi0/24)

Switch2 reads VID=10, looks up MAC table for VLAN 10: PC3_MAC is on access port Gi0/1.

### Step 5: Switch2 Strips Tag, Forwards to PC3

Switch2 **removes** the 802.1Q tag before sending out the access port:
```
Frame sent to PC3 (untagged — PC3 is just a regular PC):
  Dst MAC:  PC3_MAC
  Src MAC:  PC1_MAC
  EtherType: 0x0800 (IPv4 — 0x8100 tag is gone)
  Payload:  [IP packet]
  FCS:      [recalculated]
```

PC3 receives a perfectly normal Ethernet frame with no VLAN tag — it never knows VLANs exist.

### VLAN Isolation Check

What if PC1 (VLAN 10) tries to reach PC4 (VLAN 20)?

```
PC1 sends frame → Switch1 tags with VID=10
Switch1 checks MAC table: PC4_MAC is on VLAN 20, not VLAN 10
→ Switch1 DISCARDS the frame (different VLAN = different broadcast domain)

To reach VLAN 20, traffic must go through a router (or L3 switch).
```

---

## Worked Example: Double-Tagging VLAN Hopping Attack

**Setup**: Attacker is on native VLAN 1 (port Gi0/10). Target is on VLAN 20. Native VLAN on trunk is also VLAN 1.

### Attack Mechanism

Attacker crafts a frame with **two 802.1Q tags**:

```
Attacker's malicious frame:
  [ Dst MAC | Src MAC | 0x8100 | Outer Tag VID=1 | 0x8100 | Inner Tag VID=20 | Payload | FCS ]
```

**Hop 1 — Switch A** (attacker's switch):
- Receives frame on access port (VLAN 1)
- Trunk port: strips **outer tag** (VID=1 = native VLAN, so it's removed naturally)
- Forwards frame with only the **inner tag** (VID=20) to next switch

**Hop 2 — Switch B**:
- Receives a frame tagged VID=20
- Forwards to VLAN 20 segment
- **Attacker's frame is now on VLAN 20** — VLAN hop succeeded!

### Mitigation

```bash
# 1. Change native VLAN to an unused VLAN (e.g., 999)
switchport trunk native vlan 999

# 2. Never use VLAN 1 as native VLAN
# 3. Tag native VLAN traffic explicitly
switchport trunk native vlan tag  (Cisco IOS)

# 4. Assign attacker-facing ports to a dedicated VLAN, not native VLAN
# 5. Disable unused ports and assign to black hole VLAN (e.g., VLAN 999)
switchport access vlan 999
shutdown
```
