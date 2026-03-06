---
title: "SNMP — Simple Network Management Protocol"
description: "SNMP fundamentals — architecture (manager, agent, MIB), versions (v1/v2c/v3), PDU types, OIDs, community strings, and security."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "SNMP", "network management", "monitoring", "MIB"]
author: "Nemit"
featured: false
pinned: false
---

# SNMP — Simple Network Management Protocol

## What Is SNMP?

**SNMP (Simple Network Management Protocol)** is an application-layer protocol (UDP 161/162) for monitoring and managing network devices — routers, switches, servers, printers, UPSes, and more.

SNMP lets a central **management system** collect information from (and send commands to) many devices across a network, without needing to log into each device individually.

---

## Architecture

```
     Network Management System (NMS)
      ┌────────────────────────────┐
      │   SNMP Manager             │
      │   - Polls agents           │
      │   - Receives traps         │
      │   - Displays/alerts        │
      └────────────┬───────────────┘
                   │ SNMP (UDP 161/162)
        ┌──────────┴──────────┐
        │                     │
  ┌─────┴────┐         ┌──────┴────┐
  │  Router  │         │  Switch   │
  │  Agent   │         │  Agent    │
  │  + MIB   │         │  + MIB   │
  └──────────┘         └──────────┘
```

### Three Components

1. **SNMP Manager (NMS)**: central station that polls agents and receives traps. Examples: Nagios, Zabbix, PRTG, SolarWinds.

2. **SNMP Agent**: software running on the managed device. Responds to manager queries and sends unsolicited traps.

3. **MIB (Management Information Base)**: a hierarchical database of variables the agent can report. Each variable has an **OID**.

---

## MIB and OIDs

The MIB is a tree structure. Each node has an **OID (Object Identifier)** — a dotted number sequence:

```
1.3.6.1.2.1.1.1.0
│ │ │ │ │ │ │ │
│ │ │ │ │ │ │ └── instance (0 = scalar)
│ │ │ │ │ │ └──── sysDescr (1)
│ │ │ │ │ └────── system (1)
│ │ │ │ └──────── mib-2 (1)
│ │ │ └────────── mgmt (2)
│ │ └──────────── internet (1)
│ └────────────── dod (6)
└────────────────── iso (1)
```

**sysDescr** (`1.3.6.1.2.1.1.1.0`): textual description of the device.

### Common MIB Variables

| OID | Name | Description |
|---|---|---|
| `1.3.6.1.2.1.1.1.0` | sysDescr | Device description |
| `1.3.6.1.2.1.1.3.0` | sysUpTime | Time since last reboot |
| `1.3.6.1.2.1.1.5.0` | sysName | Device hostname |
| `1.3.6.1.2.1.2.1.0` | ifNumber | Number of interfaces |
| `1.3.6.1.2.1.2.2.1.10` | ifInOctets | Bytes received per interface |
| `1.3.6.1.2.1.2.2.1.16` | ifOutOctets | Bytes sent per interface |

---

## SNMP PDU Types

| PDU | Direction | Description |
|---|---|---|
| **GetRequest** | Manager → Agent | Request value of one or more OIDs |
| **GetNextRequest** | Manager → Agent | Get next OID in the MIB tree (for walking) |
| **GetBulkRequest** | Manager → Agent | Get multiple OIDs efficiently (v2c+) |
| **SetRequest** | Manager → Agent | Set the value of an OID (configure device) |
| **Response** | Agent → Manager | Reply to Get/Set |
| **Trap** | Agent → Manager | Unsolicited alert (event-driven) |
| **InformRequest** | Agent → Manager | Trap with acknowledgment (v2c+) |

---

## SNMP Versions

### SNMPv1

- Original version (RFC 1157)
- Community string as authentication (plaintext)
- Basic PDUs (Get, Set, Trap)
- 32-bit counters (overflow on high-speed links)
- No security: community string sent in cleartext

### SNMPv2c

- Community-based v2 (RFC 1901)
- Added GetBulk (efficient table retrieval)
- 64-bit counters (fix for high-speed links)
- Still uses plaintext community strings
- InformRequest (acknowledged traps)

### SNMPv3

- RFC 3411–3418 (full security model)
- **Authentication**: MD5 or SHA (message integrity, authenticity)
- **Encryption**: DES or AES (message privacy)
- **Access control**: per-user permissions with different views
- Three security levels:
  - `noAuthNoPriv`: no authentication, no encryption
  - `authNoPriv`: authenticated, not encrypted
  - `authPriv`: authenticated and encrypted

**SNMPv3 should be used in all production environments.** SNMPv1/v2c are insecure.

---

## Community Strings (v1/v2c)

A **community string** is like a password that groups managers and agents:

- `public`: default read-only community (monitor)
- `private`: default read-write community (configure)

These are sent in **plaintext** in every packet. Anyone sniffing the network can read them. Always change defaults.

---

## SNMP Traps vs Polling

| | Polling (Get) | Trap |
|---|---|---|
| Initiated by | Manager | Agent |
| Timing | Periodic | Event-driven (immediate) |
| Reliability | Agent always responds | UDP — no ACK in v1 |
| Overhead | High (constant polling) | Low (only on events) |
| Latency | Up to poll interval | Immediate |

Most deployments combine both: **polling** for metrics (bandwidth, CPU, memory), **traps** for alerts (link down, threshold exceeded, reboot).

---

## Common SNMP Commands

```bash
# Install net-snmp tools
apt install snmp

# Get a single OID (system description)
snmpget -v2c -c public 192.168.1.1 1.3.6.1.2.1.1.1.0

# Walk the entire MIB
snmpwalk -v2c -c public 192.168.1.1

# Walk interfaces subtree
snmpwalk -v2c -c public 192.168.1.1 1.3.6.1.2.1.2.2

# Get interface traffic counters
snmpget -v2c -c public 192.168.1.1 1.3.6.1.2.1.2.2.1.10.1  # ifInOctets.1
snmpget -v2c -c public 192.168.1.1 1.3.6.1.2.1.2.2.1.16.1  # ifOutOctets.1

# SNMPv3
snmpget -v3 -l authPriv -u admin -a SHA -A authpass -x AES -X privpass 192.168.1.1 sysDescr.0
```

---

## SNMP in Practice

**What gets monitored with SNMP**:
- Interface bandwidth utilization
- CPU and memory usage
- System uptime
- Error rates (CRC errors, collisions)
- Temperature sensors
- UPS battery status
- BGP peer states
- OSPF adjacencies

**Tools that use SNMP**:
- **Cacti**: RRD-based graphing via SNMP polling
- **Nagios / Icinga**: alerts on SNMP thresholds
- **Zabbix**: combines SNMP polling with traps
- **PRTG**: GUI-based network monitoring

---

## Worked Example: Monitoring Interface Bandwidth with SNMP

**Goal**: Calculate bandwidth utilization on interface 1 of a router at `192.168.1.1`.

SNMP counters are **cumulative bytes** since the device rebooted. To calculate throughput, you take two samples and compute the delta.

### Step 1: First Poll (t=0s)

```bash
snmpget -v2c -c public 192.168.1.1 \
  1.3.6.1.2.1.2.2.1.10.1 \   # ifInOctets.1  (bytes received)
  1.3.6.1.2.1.2.2.1.16.1     # ifOutOctets.1 (bytes sent)

# Results:
# ifInOctets.1  = 1,234,567,890
# ifOutOctets.1 = 987,654,321
```

### Step 2: Second Poll (t=60s)

```bash
snmpget -v2c -c public 192.168.1.1 \
  1.3.6.1.2.1.2.2.1.10.1 \
  1.3.6.1.2.1.2.2.1.16.1

# Results:
# ifInOctets.1  = 1,249,567,890   (+15,000,000 bytes in 60s)
# ifOutOctets.1 = 990,654,321     (+3,000,000 bytes in 60s)
```

### Step 3: Calculate Throughput

```
Inbound throughput  = (1,249,567,890 - 1,234,567,890) / 60 seconds
                    = 15,000,000 / 60
                    = 250,000 bytes/s
                    = 250,000 × 8 bits/s
                    = 2,000,000 bps = 2 Mbps

Outbound throughput = (990,654,321 - 987,654,321) / 60
                    = 3,000,000 / 60
                    = 50,000 bytes/s = 400 Kbps
```

### Step 4: Check Interface Speed

```bash
snmpget -v2c -c public 192.168.1.1 1.3.6.1.2.1.2.2.1.5.1
# ifSpeed.1 = 1000000000  (1 Gbps interface)

Utilization (in)  = 2,000,000 / 1,000,000,000 × 100 = 0.2%
Utilization (out) = 400,000 / 1,000,000,000 × 100 = 0.04%
```

### Counter Wrap (32-bit Overflow)

32-bit counters max out at 4,294,967,295 (≈4 GB). On a 100 Mbps link, they wrap every:
```
4,294,967,295 bytes / (100,000,000 / 8 bytes/s) = 343 seconds ≈ 5.7 minutes
```
This is why SNMPv2c introduced **64-bit counters** (`ifHCInOctets`, `ifHCOutOctets` — OID `1.3.6.1.2.1.31.1.1.1.6/10`) for high-speed interfaces.

---

## Worked Example: SNMP Walk to Discover All Interfaces

```bash
snmpwalk -v2c -c public 192.168.1.1 1.3.6.1.2.1.2.2.1.2
# Walks ifDescr for all interfaces

# Output:
# IF-MIB::ifDescr.1 = STRING: "GigabitEthernet0/0"
# IF-MIB::ifDescr.2 = STRING: "GigabitEthernet0/1"
# IF-MIB::ifDescr.3 = STRING: "Loopback0"
# IF-MIB::ifDescr.4 = STRING: "Tunnel0"
```

Then get operational status for each:
```bash
snmpwalk -v2c -c public 192.168.1.1 1.3.6.1.2.1.2.2.1.8
# ifOperStatus: 1=up, 2=down, 3=testing

# IF-MIB::ifOperStatus.1 = INTEGER: up(1)
# IF-MIB::ifOperStatus.2 = INTEGER: down(2)   ← port down → alert!
# IF-MIB::ifOperStatus.3 = INTEGER: up(1)
```

This is how monitoring tools detect link-down events before the trap arrives (or if traps are misconfigured).

---

## Worked Example: SNMP Trap for Link Down

When interface 2 goes down, the agent sends an unsolicited trap to the NMS:

```
SNMPv2c Trap PDU:
  Source:         192.168.1.1 (UDP port 162 destination)
  Community:      public
  Enterprise OID: 1.3.6.1.6.3.1.1.5.3  (linkDown)
  Variable bindings:
    sysUpTime.0    = 43200 (12 hours since last boot, in hundredths of seconds)
    snmpTrapOID.0  = 1.3.6.1.6.3.1.1.5.3  (linkDown)
    ifIndex.2      = 2       (which interface)
    ifDescr.2      = "GigabitEthernet0/1"
    ifAdminStatus.2 = 1      (admin: up — it wasn't shut down by admin)
    ifOperStatus.2  = 2      (oper: down — physical problem)
```

NMS receives this and triggers an alert:
```
ALERT: 192.168.1.1 (Router-Core-1) — GigabitEthernet0/1 link down
       Admin status: UP (not administratively disabled)
       Uptime: 12h 0m
       Action required: check physical cable/SFP
```
