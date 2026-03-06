---
title: "HTTP and HTTPS"
description: "HTTP protocol — request/response model, methods, status codes, headers, HTTP/1.1 vs HTTP/2 vs HTTP/3, and HTTPS with TLS handshake."
date: "2026-03-06"
category: "CS/networking"
tags: ["networking", "HTTP", "HTTPS", "TLS", "SSL", "web"]
author: "Nemit"
featured: false
pinned: false
---

# HTTP and HTTPS

## What Is HTTP?

**HTTP (HyperText Transfer Protocol)** is a stateless, application-layer protocol for transferring data on the web. It defines how clients (browsers) request resources and how servers respond.

**Stateless**: each request is independent. The server retains no memory of previous requests. State (e.g., login sessions) is managed via cookies, tokens, or sessions.

---

## HTTP Request Format

```
GET /index.html HTTP/1.1          ← Request line: method, path, version
Host: www.example.com             ← Headers
User-Agent: Mozilla/5.0
Accept: text/html
Connection: keep-alive
                                  ← Blank line (marks end of headers)
                                  ← Body (empty for GET)
```

### HTTP Methods

| Method | Purpose | Body | Safe | Idempotent |
|---|---|---|---|---|
| GET | Retrieve resource | No | Yes | Yes |
| POST | Submit data / create | Yes | No | No |
| PUT | Replace resource | Yes | No | Yes |
| PATCH | Partial update | Yes | No | No |
| DELETE | Delete resource | Optional | No | Yes |
| HEAD | GET headers only | No | Yes | Yes |
| OPTIONS | Available methods | No | Yes | Yes |

**Safe**: doesn't modify server state.
**Idempotent**: repeated identical requests have the same effect as one.

---

## HTTP Response Format

```
HTTP/1.1 200 OK                   ← Status line: version, status code, reason
Content-Type: text/html           ← Response headers
Content-Length: 1234
Date: Thu, 06 Mar 2026 10:00:00 GMT

<!DOCTYPE html>                   ← Response body
<html>...</html>
```

### Status Codes

| Range | Category | Examples |
|---|---|---|
| 1xx | Informational | 100 Continue, 101 Switching Protocols |
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirection | 301 Moved Permanently, 302 Found, 304 Not Modified |
| 4xx | Client Error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| 5xx | Server Error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

---

## Key HTTP Headers

### Request Headers

| Header | Description |
|---|---|
| `Host` | Target server hostname (required in HTTP/1.1) |
| `User-Agent` | Client software identifier |
| `Accept` | MIME types the client can handle |
| `Authorization` | Credentials (e.g., `Bearer <token>`) |
| `Cookie` | Client cookies |
| `Content-Type` | Body format (e.g., `application/json`) |
| `Cache-Control` | Caching directives |

### Response Headers

| Header | Description |
|---|---|
| `Content-Type` | Body format |
| `Content-Length` | Body size in bytes |
| `Set-Cookie` | Instruct client to set a cookie |
| `Location` | Redirect target URL |
| `Cache-Control` | How long to cache the response |
| `Access-Control-Allow-Origin` | CORS policy |

---

## HTTP Versions

### HTTP/1.0

- One TCP connection per request
- No persistent connections by default
- High latency: connection overhead for every resource

### HTTP/1.1

- **Persistent connections** (`keep-alive`): reuse TCP connections
- **Pipelining**: send multiple requests without waiting for responses (rarely used in practice)
- **Chunked transfer encoding**: stream large responses
- `Host` header required (enables virtual hosting)
- Still suffers from **head-of-line blocking**: responses must be delivered in order

### HTTP/2

- **Binary protocol** (not text-based)
- **Multiplexing**: multiple requests/responses over a single TCP connection simultaneously (no HOL blocking at HTTP level)
- **Header compression** (HPACK): reduces overhead of repetitive headers
- **Server push**: server can push resources before the client requests them
- Still uses TCP → TCP-level HOL blocking remains

### HTTP/3

- Uses **QUIC** (over UDP) instead of TCP
- **Eliminates TCP HOL blocking**: each stream is independent
- **Faster connection setup**: 0-RTT or 1-RTT handshake
- Built-in encryption (TLS 1.3)
- Used by major services (Google, YouTube, Cloudflare)

---

## HTTPS — HTTP over TLS

**HTTPS** is HTTP with a **TLS (Transport Layer Security)** layer between HTTP and TCP. It provides:

1. **Encryption**: data in transit is unreadable to eavesdroppers
2. **Authentication**: certificate verifies you're talking to the real server
3. **Integrity**: data cannot be tampered with undetected

### TLS Handshake (Simplified — TLS 1.3)

```
Client                              Server
  │                                   │
  │──── ClientHello ────────────────►│  Client: TLS version, ciphers, random
  │                                   │
  │◄─── ServerHello + Certificate ──│  Server: chosen cipher, certificate
  │◄─── ServerFinished ─────────────│
  │                                   │
  │    (Client validates certificate) │
  │──── ClientFinished ─────────────►│
  │                                   │
  │     [Encrypted data exchange]     │
```

TLS 1.3 requires only **1 RTT** (vs TLS 1.2's 2 RTT). With session resumption: **0 RTT**.

### TLS Certificate

A certificate contains:
- The server's **public key**
- The **domain name** it's valid for
- Issuer (Certificate Authority — CA)
- Validity period
- Digital signature by the CA

The client verifies the certificate against its trusted CA list. If valid, the client uses the public key to establish a shared secret key for symmetric encryption.

### Why Not Just HTTP?

Without HTTPS:
- Passwords, tokens, cookies sent in plaintext
- Anyone on the same network can read traffic (especially on public Wi-Fi)
- Man-in-the-middle attacks can modify responses
- No proof you're talking to the real server

---

## HTTP vs HTTPS

| Aspect | HTTP | HTTPS |
|---|---|---|
| Protocol | HTTP only | HTTP + TLS |
| Port | 80 | 443 |
| Encryption | None | TLS/SSL |
| Authentication | None | Certificate |
| SEO | Penalized | Preferred |
| Required for | Legacy only | All modern sites |

---

## Cookies and Sessions

Since HTTP is stateless, web applications use:

**Cookies**: small key-value pairs stored in the browser.
```
Set-Cookie: session_id=abc123; Path=/; HttpOnly; Secure; SameSite=Strict
```

Attributes:
- `HttpOnly`: not accessible via JavaScript (XSS protection)
- `Secure`: only sent over HTTPS
- `SameSite`: controls cross-site sending (CSRF protection)

**Sessions**: server stores state mapped to a session ID. The cookie only holds the ID.

---

## CORS — Cross-Origin Resource Sharing

Browsers block requests to different origins (domain, protocol, port) by default. CORS allows servers to specify which origins are allowed:

```
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Authorization, Content-Type
```

Preflight: for non-simple requests (POST, PUT, DELETE, custom headers), the browser first sends an `OPTIONS` request to check permissions.

---

## Worked Example: Complete HTTP/1.1 Conversation

**Scenario**: Browser fetches `https://api.example.com/users/42` with a JSON API.

### 1. TCP + TLS Handshake (before any HTTP)

```
[TCP 3-way handshake: ~1 RTT]
[TLS 1.3 handshake: ~1 RTT]

Total setup cost before first byte of HTTP: ~2 RTTs
(HTTP/3 + QUIC reduces this to ~0-1 RTT with 0-RTT resumption)
```

### 2. HTTP Request (Client → Server)

```
GET /users/42 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

No body (GET request). The blank line after headers signals end of request.

### 3. HTTP Response (Server → Client)

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 89
Cache-Control: private, max-age=0
Date: Thu, 06 Mar 2026 10:00:00 GMT
X-Request-Id: a3b9f2e1

{"id":42,"name":"Alice Kim","email":"alice@example.com","role":"admin","active":true}
```

### 4. Status Code Decision Tree

```
Browser receives response:
  ┌─ 2xx? → Success → render/use the data
  ├─ 301/302? → Redirect → issue new request to Location header
  ├─ 304? → Not Modified → use cached version (no body sent)
  ├─ 401? → Unauthorized → prompt login / refresh token
  ├─ 403? → Forbidden → show "access denied"
  ├─ 404? → Not Found → show error page
  ├─ 429? → Too Many Requests → back off and retry after Retry-After seconds
  └─ 5xx? → Server Error → show error, don't cache
```

---

## Worked Example: TLS 1.3 Handshake with Timing

**Goal**: establish encrypted channel for `https://example.com`

```
Time    Client                              Server
  0ms   ClientHello ─────────────────────►
        - TLS version: 1.3
        - Supported ciphers: AES_128_GCM, ChaCha20
        - Client random: [32 bytes]
        - Key share: x25519 public key

 30ms                  ◄── ServerHello ───
                           - Chosen cipher: TLS_AES_128_GCM_SHA256
                           - Server random: [32 bytes]
                           - Key share: x25519 public key
                       ◄── Certificate ───
                           - Server public key + domain
                           - CA signature
                       ◄── CertificateVerify ───
                           - Proof server holds private key
                       ◄── Finished ───────
                           - HMAC of handshake transcript

 30ms   [Client derives shared secret using key exchange]
        [Client verifies certificate against trusted CAs]
        Finished ────────────────────────►
        (HMAC confirms client received same handshake)

 60ms   [Encrypted HTTP traffic begins]
        GET /index.html ─────────────────►  (encrypted)
        ◄── 200 OK + body ────────────────  (encrypted)
```

**TLS 1.3 vs TLS 1.2**:

| | TLS 1.2 | TLS 1.3 |
|---|---|---|
| Handshake RTTs | 2 RTT | 1 RTT |
| 0-RTT resumption | No | Yes (with session ticket) |
| Key exchange | RSA or DHE | Only ECDHE / x25519 (perfect forward secrecy always) |
| Cipher suites | Many (including weak ones) | 5 strong suites only |

---

## Worked Example: CORS Preflight

**Scenario**: Frontend at `https://app.example.com` calls API at `https://api.otherdomain.com`.

The browser detects a **cross-origin** POST with a custom `Authorization` header → sends preflight:

### Step 1: OPTIONS Preflight

```
OPTIONS /data HTTP/1.1
Host: api.otherdomain.com
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type
```

### Step 2: Server Preflight Response

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

`Max-Age: 86400` → browser caches this permission for 24 hours; no preflight needed again.

### Step 3: Actual Request

```
POST /data HTTP/1.1
Host: api.otherdomain.com
Origin: https://app.example.com
Authorization: Bearer token123
Content-Type: application/json

{"query": "..."}
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
Content-Type: application/json

{"result": "..."}
```

If the server had returned `Access-Control-Allow-Origin: *` instead of the specific origin, the browser would block the response from reading the `Authorization` header (credentialed requests require exact origin, not wildcard).
