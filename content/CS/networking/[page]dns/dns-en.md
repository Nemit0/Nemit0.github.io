---
title: "DNS — How Domain Name Resolution Works"
description: "DNS fundamentals — hierarchy, resolution process, record types, caching, TTL, recursive vs iterative queries, and DNS security."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "DNS", "domain", "resolution", "name server"]
author: "Nemit"
featured: false
pinned: false
---

# DNS — Domain Name System

## What Is DNS?

**DNS (Domain Name System)** is the Internet's "phone book" — it translates human-readable domain names (like `www.example.com`) into IP addresses (like `93.184.216.34`) that computers use to communicate.

Without DNS, you'd need to memorize IP addresses for every website.

**Protocol**: Primarily UDP port 53. Falls back to TCP for large responses or zone transfers.

---

## DNS Hierarchy

DNS is a **distributed, hierarchical** system:

```
                        . (Root)
                       / \
             .com      .org      .net    .kr   ...
            /   \
       google.com  example.com
      /
 www.google.com
```

Each **label** separated by dots is a level in the hierarchy:

```
www . example . com .
 ↑       ↑       ↑  ↑
host  subdomain TLD Root (implicit)
```

### DNS Servers by Role

| Server | Role | Example |
|---|---|---|
| **Root Name Server** | Knows where all TLD servers are | 13 root server clusters (a–m.root-servers.net) |
| **TLD Name Server** | Knows authoritative servers for its TLD | .com, .org, .kr servers |
| **Authoritative Name Server** | Has the actual DNS records for a domain | Your hosting provider's DNS |
| **Recursive Resolver** | Does the lookup work on behalf of clients | Your ISP's or Google's 8.8.8.8 |

---

## DNS Resolution Process

When you type `www.example.com` in a browser:

```
Browser                Resolver              Root NS     .com NS   example.com NS
   │                      │                    │            │            │
   │── Query: ──────────►│                    │            │            │
   │  www.example.com     │                    │            │            │
   │                      │── Who handles ────►│            │            │
   │                      │   .com TLD?        │            │            │
   │                      │◄── .com NS addr ───│            │            │
   │                      │                                 │            │
   │                      │── Who handles ─────────────────►│            │
   │                      │   example.com?                  │            │
   │                      │◄── example.com NS addr ─────────│            │
   │                      │                                              │
   │                      │── What is ───────────────────────────────────►│
   │                      │   www.example.com?                           │
   │                      │◄── 93.184.216.34 ────────────────────────────│
   │                      │                                              │
   │◄── 93.184.216.34 ───│                    │            │            │
   │                      │ (caches result)    │            │            │
```

### Detailed Steps

1. **Browser cache**: check if the IP is already cached
2. **OS cache** (`/etc/hosts`, system DNS cache): check local cache
3. **Recursive resolver**: if not cached, the OS asks the configured DNS server (typically your router or ISP)
4. **Root server query**: resolver asks a root server: "Who handles `.com`?"
5. **TLD server query**: resolver asks the `.com` TLD server: "Who handles `example.com`?"
6. **Authoritative server query**: resolver asks `example.com`'s authoritative DNS: "What is `www.example.com`?"
7. **Answer returned**: IP address sent back to the resolver, which caches it and returns it to the client
8. **Client connects**: browser opens TCP connection to 93.184.216.34:443

---

## Recursive vs Iterative Queries

**Recursive query**: The resolver does all the work and returns the final answer. Client asks once.

**Iterative query**: Each server returns a referral (not the final answer). The resolver follows referrals.

In practice: clients → resolver is recursive. Resolver → other name servers is iterative.

---

## DNS Record Types

| Type | Name | Description | Example |
|---|---|---|---|
| **A** | Address | IPv4 address | `example.com → 93.184.216.34` |
| **AAAA** | IPv6 Address | IPv6 address | `example.com → 2606:2800::1` |
| **CNAME** | Canonical Name | Alias to another domain | `www.example.com → example.com` |
| **MX** | Mail Exchange | Mail server for domain | `example.com → mail.example.com` |
| **NS** | Name Server | Authoritative name servers | `example.com NS: ns1.example.com` |
| **TXT** | Text | Arbitrary text (SPF, DKIM, verification) | `"v=spf1 include:..."` |
| **PTR** | Pointer | Reverse DNS (IP → hostname) | `34.216.184.93.in-addr.arpa → example.com` |
| **SOA** | Start of Authority | Zone's authoritative info, serial, TTL | — |
| **SRV** | Service | Service location (host + port) | `_http._tcp.example.com → 10 0 80 web.example.com` |

---

## TTL — Time to Live

Each DNS record has a **TTL** (in seconds) specifying how long it can be cached:

```
www.example.com.  300  IN  A  93.184.216.34
                  ^^^
                  TTL = 300 seconds (5 minutes)
```

- **Low TTL** (e.g., 60s): changes propagate quickly, but more DNS traffic
- **High TTL** (e.g., 86400s = 1 day): less traffic, slower propagation
- Before a planned IP change: lower TTL in advance so old records expire quickly

---

## DNS Caching

DNS responses are cached at multiple levels:
1. Browser DNS cache
2. OS DNS cache
3. Recursive resolver cache

Caching reduces latency and DNS server load. Negative responses (NXDOMAIN) are also cached for a shorter duration.

---

## Common DNS Tools

```bash
# Standard lookup
nslookup example.com
dig example.com

# Specific record type
dig example.com MX
dig example.com AAAA

# Query specific server
dig @8.8.8.8 example.com

# Trace full resolution path
dig +trace example.com

# Reverse lookup (IP → domain)
dig -x 93.184.216.34
nslookup 93.184.216.34
```

---

## DNS Security Issues

### DNS Spoofing / Cache Poisoning

An attacker poisons a resolver's cache with fake DNS responses, redirecting users to malicious IPs.

**Defense**: **DNSSEC** (DNS Security Extensions) — cryptographically signs DNS records so resolvers can verify authenticity.

### DNS Hijacking

ISP or attacker redirects DNS queries to their own server to censor, monitor, or redirect traffic.

**Defense**: Use encrypted DNS:
- **DNS over HTTPS (DoH)**: DNS queries via HTTPS to prevent interception
- **DNS over TLS (DoT)**: DNS queries encrypted with TLS

### DDoS Against DNS

Attackers flood DNS servers with queries, making domains unreachable.

**Defense**: Anycast routing (spread load across many servers), rate limiting, response rate limiting (RRL).

---

## hosts File

Before DNS, IP-hostname mappings were stored in `/etc/hosts` (Unix/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows). The OS checks this file before querying DNS:

```
127.0.0.1   localhost
::1         localhost
192.168.1.10  myserver.local
```

Still useful for: local development overrides, blocking domains.

---

## Worked Example: Full DNS Resolution Trace

**Query**: Browser resolves `mail.google.com` for the first time (no caches warm).

```
Step 1: Browser checks its own DNS cache
        → Not found. Asks the OS.

Step 2: OS checks /etc/hosts
        127.0.0.1  localhost
        → "mail.google.com" not listed. Asks the configured resolver (8.8.8.8).

Step 3: OS → Recursive Resolver (8.8.8.8)
        Query: "What is the A record for mail.google.com?"
        Resolver checks its cache → miss. Starts iterative resolution.

Step 4: Resolver → Root Name Server (e.g., a.root-servers.net, 198.41.0.4)
        Query:  "Who handles .com?"
        Answer: "Ask one of these .com TLD servers: a.gtld-servers.net (192.5.6.30), ..."
        [Resolver caches: .com NS = a.gtld-servers.net, TTL=172800s (2 days)]

Step 5: Resolver → .com TLD Server (a.gtld-servers.net, 192.5.6.30)
        Query:  "Who handles google.com?"
        Answer: "Ask: ns1.google.com (216.239.32.10), ns2.google.com, ns3, ns4"
        [Resolver caches: google.com NS = ns1.google.com, TTL=172800s]

Step 6: Resolver → Google's Authoritative NS (ns1.google.com, 216.239.32.10)
        Query:  "What is the A record for mail.google.com?"
        Answer: "mail.google.com A 142.250.80.37, TTL=300"
        [Resolver caches: mail.google.com A 142.250.80.37, TTL=300s]

Step 7: Resolver → OS → Browser
        Answer: 142.250.80.37

Step 8: Browser opens TCP connection to 142.250.80.37:443
```

**Total time**: typically 20–120ms for a cold lookup. Warm cache (step 2 hit): <1ms.

### Timing Breakdown

```
Root server query:        ~10ms  (anycast, geographically close)
.com TLD server query:    ~15ms
Google authoritative:     ~20ms
Resolver overhead:        ~5ms
                          ────────
Cold lookup total:        ~50ms

Cached (resolver hit):    ~1ms   (resolver answers from cache)
Cached (browser hit):     <0.1ms (no network query at all)
```

### What dig +trace Shows

```bash
$ dig +trace mail.google.com

# Output (simplified):
.                  518400 IN  NS  a.root-servers.net.
;; Received 239 bytes from 127.0.0.53 in 3 ms   ← local resolver

com.               172800 IN  NS  a.gtld-servers.net.
;; Received 828 bytes from 198.41.0.4 in 11 ms  ← root server

google.com.        172800 IN  NS  ns1.google.com.
;; Received 292 bytes from 192.5.6.30 in 14 ms  ← .com TLD

mail.google.com.   300    IN  A   142.250.80.37
;; Received 55 bytes from 216.239.32.10 in 21 ms ← Google auth NS
```

---

## Worked Example: DNS Record Interactions

**Domain**: `example.com` has these DNS records:

```
; Zone file for example.com
$TTL 3600
@    IN  SOA   ns1.example.com.  admin.example.com. (
               2026030601  ; serial (YYYYMMDDNN)
               3600        ; refresh
               900         ; retry
               604800      ; expire
               300 )       ; negative TTL

; Name servers
@    IN  NS    ns1.example.com.
@    IN  NS    ns2.example.com.

; A records (IPv4)
@    IN  A     93.184.216.34
www  IN  A     93.184.216.34

; CNAME (alias)
blog IN  CNAME www.example.com.      ; blog.example.com → www → 93.184.216.34

; Mail exchange
@    IN  MX  10 mail1.example.com.   ; priority 10
@    IN  MX  20 mail2.example.com.   ; priority 20 (backup)

; TXT records
@    IN  TXT  "v=spf1 include:_spf.google.com ~all"  ; SPF: who can send email
```

**Resolution chain for `blog.example.com`**:
```
Query: blog.example.com A record?
Step 1: blog.example.com CNAME → www.example.com
Step 2: www.example.com A → 93.184.216.34
Result: 93.184.216.34

Note: CNAME chain is followed automatically by the resolver.
      You cannot point MX or NS records at a CNAME — only at A/AAAA records.
```

**MX selection**: email servers try `mail1.example.com` first (priority 10). If unreachable, fall back to `mail2.example.com` (priority 20, backup).
