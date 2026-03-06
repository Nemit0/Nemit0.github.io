---
title: "Well-Known Port Numbers"
description: "Network port numbers — IANA port ranges, important well-known ports for common services (HTTP, SSH, DNS, FTP, mail), and how ports work with TCP/UDP."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "ports", "TCP", "UDP", "protocols", "services"]
author: "Nemit"
featured: false
pinned: false
---

# Well-Known Port Numbers

## What Are Port Numbers?

A **port number** is a 16-bit integer (0–65535) that identifies a specific process or service on a host. When combined with an IP address, it uniquely identifies a **socket** endpoint.

```
192.168.1.100 : 443
   IP address   Port
```

The port number tells the OS which application should receive incoming data. Multiple services can run on the same IP as long as they use different ports.

---

## IANA Port Ranges

The Internet Assigned Numbers Authority (IANA) divides ports into three ranges:

| Range | Name | Description |
|---|---|---|
| 0–1023 | **Well-known ports** | Assigned to standard services; require root/admin to bind |
| 1024–49151 | **Registered ports** | Registered by applications; no root required |
| 49152–65535 | **Dynamic/Ephemeral ports** | Assigned automatically to client sockets |

When your browser connects to a web server, the server listens on port 443 (well-known), and your browser gets a random ephemeral port like 54321 as the source.

---

## Well-Known Ports (0–1023)

### Web and Security

| Port | Protocol | Service |
|---|---|---|
| **80** | TCP | HTTP (web, plaintext) |
| **443** | TCP | HTTPS (web, TLS-encrypted) |
| **8080** | TCP | HTTP alternate (dev/proxy) |
| **8443** | TCP | HTTPS alternate |

### File Transfer

| Port | Protocol | Service |
|---|---|---|
| **20** | TCP | FTP data |
| **21** | TCP | FTP control |
| **22** | TCP | SSH, SFTP |
| **69** | UDP | TFTP (Trivial FTP, no auth) |

### Email

| Port | Protocol | Service |
|---|---|---|
| **25** | TCP | SMTP (send email, server-to-server) |
| **110** | TCP | POP3 (receive email, download) |
| **143** | TCP | IMAP (receive email, sync) |
| **465** | TCP | SMTPS (SMTP over TLS) |
| **587** | TCP | SMTP submission (client-to-server) |
| **993** | TCP | IMAPS (IMAP over TLS) |
| **995** | TCP | POP3S (POP3 over TLS) |

### Name and Directory Services

| Port | Protocol | Service |
|---|---|---|
| **53** | TCP/UDP | DNS |
| **389** | TCP | LDAP (directory services) |
| **636** | TCP | LDAPS (LDAP over TLS) |

### Network Services

| Port | Protocol | Service |
|---|---|---|
| **67** | UDP | DHCP server |
| **68** | UDP | DHCP client |
| **123** | UDP | NTP (time synchronization) |
| **161** | UDP | SNMP (queries) |
| **162** | UDP | SNMP trap (alerts) |
| **514** | UDP | Syslog |

### Remote Access

| Port | Protocol | Service |
|---|---|---|
| **22** | TCP | SSH |
| **23** | TCP | Telnet (plaintext, insecure) |
| **3389** | TCP | RDP (Windows Remote Desktop) |
| **5900** | TCP | VNC |

### Database Servers

| Port | Protocol | Service |
|---|---|---|
| **1433** | TCP | Microsoft SQL Server |
| **1521** | TCP | Oracle DB |
| **3306** | TCP | MySQL / MariaDB |
| **5432** | TCP | PostgreSQL |
| **6379** | TCP | Redis |
| **27017** | TCP | MongoDB |

### Other Notable Ports

| Port | Protocol | Service |
|---|---|---|
| **443** | TCP | HTTPS, also QUIC (UDP) |
| **500** | UDP | IKE (IPsec VPN) |
| **1194** | TCP/UDP | OpenVPN |
| **4500** | UDP | IPsec NAT traversal |
| **5061** | TCP | SIP (VoIP, TLS) |
| **5353** | UDP | mDNS (Bonjour/Avahi) |
| **8883** | TCP | MQTT over TLS (IoT) |
| **9200** | TCP | Elasticsearch |

---

## TCP vs UDP Common Services

Most services use TCP (reliability required), but some prefer UDP (latency):

**UDP services** (low-latency or broadcast-friendly):
- DNS (53) — simple query/response; retry at app layer
- DHCP (67/68) — broadcast-based
- SNMP (161/162) — monitoring
- NTP (123) — time sync (precision matters more than reliability)
- Syslog (514) — fire-and-forget logging
- TFTP (69) — simple file transfer
- DNS (53) also supports TCP for large responses and zone transfers

---

## Ephemeral Ports

When a client initiates a connection, the OS assigns a temporary **ephemeral port** from the dynamic range:

```bash
# Check ephemeral port range on Linux
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768   60999

# Active connections
ss -tn
# ESTAB  0  0  192.168.1.100:54321  10.0.0.2:443
#                       ↑ ephemeral          ↑ well-known
```

### Port Exhaustion

If a host opens many outgoing connections to the same destination, it can exhaust its ephemeral ports. Solutions:
- Reduce TIME_WAIT (`SO_REUSEADDR`, `SO_LINGER`)
- Expand the ephemeral range
- Use connection pooling

---

## Checking Open Ports

```bash
# List listening ports (Linux)
ss -tlnp          # TCP
ss -ulnp          # UDP
netstat -tlnp     # Older tool

# Example output:
# tcp  LISTEN  0  128  0.0.0.0:22    0.0.0.0:*  users:(("sshd",pid=1234))
# tcp  LISTEN  0  128  0.0.0.0:443   0.0.0.0:*  users:(("nginx",pid=5678))

# Scan ports on remote host (requires permission)
nmap -p 22,80,443 192.168.1.1
nmap -sU -p 53,161 192.168.1.1   # UDP scan

# Check if specific port is open
nc -zv 192.168.1.1 22             # TCP
nc -zuv 192.168.1.1 53            # UDP
```

---

## Security Considerations

- **Close unused ports**: every open port is a potential attack surface
- **Firewall rules**: allow only needed ports from needed sources
- **Change defaults**: avoid running SSH on port 22 (change to high port to reduce noise)
- **Port scanning detection**: unusual port scans often precede attacks
- **Encrypted alternatives**: prefer HTTPS(443) over HTTP(80), IMAPS(993) over IMAP(143), SSH(22) over Telnet(23)

---

## Worked Example: Typing a URL — Ports in Action

**Scenario**: You type `https://mail.google.com` in your browser. Here's every port involved:

```
Step 1: DNS Resolution (UDP port 53)
─────────────────────────────────────
Browser → OS → Local resolver (8.8.8.8:53)
  Query:  A record for mail.google.com?
  Answer: 142.250.80.37
Protocol: UDP, Dst port 53, Src port 52631 (ephemeral)

Step 2: TCP + TLS Connection (TCP port 443)
─────────────────────────────────────────────
Browser → 142.250.80.37:443
  TCP SYN from 192.168.1.100:54321 → 142.250.80.37:443
  TCP SYN-ACK
  TCP ACK
  TLS ClientHello → ServerHello → Certificate → Finished
  [Encrypted HTTP/2 or HTTP/3 begins]

Step 3: HTTP Request inside TLS (port 443)
──────────────────────────────────────────
GET /mail/u/0/ HTTP/2
Host: mail.google.com
[All data encrypted on port 443]
```

**Ports involved for one HTTPS page load**:
| Action | Protocol | Port | Direction |
|---|---|---|---|
| DNS lookup | UDP | 53 | Client → DNS server |
| HTTPS connection | TCP | 443 | Client → Web server |
| (Client ephemeral port) | TCP | ~54321 | Source port, chosen by OS |

---

## Worked Example: Email Send Path — Multiple Ports

**Scenario**: Alice (`alice@company.com`) sends email to `bob@gmail.com`.

```
Step 1: Alice's email client → company's SMTP submission server
  Port: 587 (SMTP submission, authenticated, TLS via STARTTLS)
  Auth: username/password
  From: alice@company.com  To: bob@gmail.com
  Message: "Hello Bob!"

Step 2: Company's SMTP server → Gmail's SMTP server (server-to-server)
  DNS MX lookup: gmail.com MX? → aspmx.l.google.com (port 53)
  Port: 25 (SMTP server-to-server, usually with STARTTLS)
  No authentication — just relay between trusted servers

Step 3: Bob's Gmail client fetches the email
  Option A: IMAP (port 993 — IMAPS)
    → Sync, leaves mail on server, supports multiple devices
  Option B: POP3 (port 995 — POP3S)
    → Downloads mail, typically deletes from server

Port summary for a complete email journey:
  587  → client submits to outgoing server
  25   → server-to-server relay
  53   → DNS MX lookup during relay
  993  → recipient fetches via IMAP (or 995 for POP3)
```

---

## Worked Example: Identifying Services from a Port Scan

```bash
$ nmap -sV 192.168.1.100

PORT     STATE  SERVICE    VERSION
22/tcp   open   ssh        OpenSSH 8.9
25/tcp   open   smtp       Postfix SMTP
80/tcp   open   http       nginx 1.24
443/tcp  open   https      nginx 1.24
3306/tcp open   mysql      MySQL 8.0.32
8080/tcp open   http-proxy Squid proxy 5.7
```

**Reading the scan**:
- Port 22: SSH server — valid for remote admin
- Port 25: SMTP open — this server sends/receives email directly
- Port 80 + 443: web server (nginx) — HTTP + HTTPS
- Port 3306: MySQL exposed! **Security risk** — should not be open to network; bind to 127.0.0.1 only
- Port 8080: proxy service running

**Hardening actions**:
```bash
# Restrict MySQL to localhost only
# In /etc/mysql/mysql.conf.d/mysqld.cnf:
bind-address = 127.0.0.1

# Or firewall it:
ufw deny 3306
ufw allow from 10.0.0.0/8 to any port 3306  # Allow only from internal network

# Verify listening addresses after change:
ss -tlnp | grep 3306
# tcp  LISTEN  0  80  127.0.0.1:3306  0.0.0.0:*  users:(("mysqld",pid=1234))
# ↑ Now only localhost — external connections blocked
```
