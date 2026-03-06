---
title: "HTTP와 HTTPS"
description: "HTTP 프로토콜 — 요청/응답 모델, 메서드, 상태 코드, 헤더, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS 핸드셰이크를 포함한 HTTPS."
date: "2026-03-06"
category: "CS/networking"
tags: ["네트워킹", "HTTP", "HTTPS", "TLS", "SSL", "웹"]
author: "Nemit"
featured: false
pinned: false
---

# HTTP와 HTTPS

## HTTP란?

**HTTP(HyperText Transfer Protocol)**는 웹에서 데이터를 전송하기 위한 상태 비저장, 응용 계층 프로토콜이다. 클라이언트(브라우저)가 리소스를 요청하는 방법과 서버가 응답하는 방법을 정의한다.

**상태 비저장**: 각 요청은 독립적이다. 서버는 이전 요청을 기억하지 않는다. 상태(예: 로그인 세션)는 쿠키, 토큰, 세션을 통해 관리된다.

---

## HTTP 요청 형식

```
GET /index.html HTTP/1.1          ← 요청 줄: 메서드, 경로, 버전
Host: www.example.com             ← 헤더
User-Agent: Mozilla/5.0
Accept: text/html
Connection: keep-alive
                                  ← 빈 줄 (헤더 끝 표시)
                                  ← 본문 (GET은 비어 있음)
```

### HTTP 메서드

| 메서드 | 용도 | 본문 | 안전 | 멱등 |
|---|---|---|---|---|
| GET | 리소스 검색 | 없음 | 예 | 예 |
| POST | 데이터 제출 / 생성 | 있음 | 아니오 | 아니오 |
| PUT | 리소스 교체 | 있음 | 아니오 | 예 |
| PATCH | 부분 업데이트 | 있음 | 아니오 | 아니오 |
| DELETE | 삭제 | 선택 | 아니오 | 예 |
| HEAD | 헤더만 GET | 없음 | 예 | 예 |
| OPTIONS | 사용 가능한 메서드 | 없음 | 예 | 예 |

**안전**: 서버 상태를 수정하지 않음.
**멱등**: 동일한 요청을 반복해도 한 번과 같은 효과.

---

## HTTP 응답 형식

```
HTTP/1.1 200 OK                   ← 상태 줄: 버전, 상태 코드, 이유
Content-Type: text/html           ← 응답 헤더
Content-Length: 1234
Date: Thu, 06 Mar 2026 10:00:00 GMT

<!DOCTYPE html>                   ← 응답 본문
<html>...</html>
```

### 상태 코드

| 범위 | 분류 | 예시 |
|---|---|---|
| 1xx | 정보 | 100 Continue, 101 Switching Protocols |
| 2xx | 성공 | 200 OK, 201 Created, 204 No Content |
| 3xx | 리다이렉션 | 301 Moved Permanently, 302 Found, 304 Not Modified |
| 4xx | 클라이언트 오류 | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| 5xx | 서버 오류 | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

---

## 주요 HTTP 헤더

### 요청 헤더

| 헤더 | 설명 |
|---|---|
| `Host` | 대상 서버 호스트명 (HTTP/1.1에서 필수) |
| `User-Agent` | 클라이언트 소프트웨어 식별자 |
| `Accept` | 클라이언트가 처리할 수 있는 MIME 타입 |
| `Authorization` | 자격증명 (예: `Bearer <token>`) |
| `Cookie` | 클라이언트 쿠키 |
| `Content-Type` | 본문 형식 (예: `application/json`) |
| `Cache-Control` | 캐싱 지시어 |

### 응답 헤더

| 헤더 | 설명 |
|---|---|
| `Content-Type` | 본문 형식 |
| `Content-Length` | 본문 크기(바이트) |
| `Set-Cookie` | 클라이언트에게 쿠키 설정 지시 |
| `Location` | 리다이렉션 대상 URL |
| `Cache-Control` | 응답을 얼마나 캐시할지 |
| `Access-Control-Allow-Origin` | CORS 정책 |

---

## HTTP 버전

### HTTP/1.0

- 요청당 TCP 연결 하나
- 기본적으로 지속 연결 없음
- 높은 지연: 모든 리소스에 연결 오버헤드

### HTTP/1.1

- **지속 연결** (`keep-alive`): TCP 연결 재사용
- **파이프라이닝**: 응답 대기 없이 여러 요청 전송 (실제로는 거의 사용 안 됨)
- **청크 전송 인코딩**: 큰 응답을 스트리밍
- `Host` 헤더 필수 (가상 호스팅 가능)
- 여전히 **헤드 오브 라인 블로킹** 문제 있음

### HTTP/2

- **바이너리 프로토콜** (텍스트 기반 아님)
- **다중화**: 단일 TCP 연결에서 여러 요청/응답 동시 처리 (HTTP 수준 HOL 블로킹 없음)
- **헤더 압축** (HPACK): 반복 헤더의 오버헤드 감소
- **서버 푸시**: 클라이언트 요청 전에 서버가 리소스를 푸시
- TCP 사용 → TCP 수준 HOL 블로킹은 여전히 존재

### HTTP/3

- TCP 대신 **QUIC**(UDP 기반) 사용
- **TCP HOL 블로킹 제거**: 각 스트림이 독립적
- **더 빠른 연결 설정**: 0-RTT 또는 1-RTT 핸드셰이크
- 내장 암호화 (TLS 1.3)
- 주요 서비스에서 사용 (Google, YouTube, Cloudflare)

---

## HTTPS — TLS를 통한 HTTP

**HTTPS**는 HTTP와 TCP 사이에 **TLS(전송 계층 보안)** 레이어가 있는 HTTP다. 다음을 제공한다:

1. **암호화**: 전송 중 데이터를 도청자가 읽을 수 없음
2. **인증**: 인증서가 실제 서버와 통신 중임을 검증
3. **무결성**: 데이터를 감지되지 않게 변조할 수 없음

### TLS 핸드셰이크 (간략화 — TLS 1.3)

```
클라이언트                            서버
  │                                   │
  │──── ClientHello ────────────────►│  TLS 버전, 암호, 랜덤
  │                                   │
  │◄─── ServerHello + 인증서 ────────│  선택된 암호, 인증서
  │◄─── ServerFinished ─────────────│
  │                                   │
  │    (클라이언트가 인증서 검증)       │
  │──── ClientFinished ─────────────►│
  │                                   │
  │     [암호화된 데이터 교환]         │
```

TLS 1.3은 **1 RTT**만 필요 (TLS 1.2의 2 RTT 대비). 세션 재개 시: **0 RTT**.

### TLS 인증서

인증서에는 다음이 포함된다:
- 서버의 **공개 키**
- 유효한 **도메인 이름**
- 발급자 (인증 기관 — CA)
- 유효 기간
- CA의 디지털 서명

클라이언트가 신뢰하는 CA 목록에 대해 인증서를 검증한다. 유효하면 클라이언트가 공개 키를 사용해 대칭 암호화를 위한 공유 비밀 키를 설정한다.

---

## HTTP vs HTTPS

| 측면 | HTTP | HTTPS |
|---|---|---|
| 프로토콜 | HTTP만 | HTTP + TLS |
| 포트 | 80 | 443 |
| 암호화 | 없음 | TLS/SSL |
| 인증 | 없음 | 인증서 |
| SEO | 불이익 | 선호됨 |
| 필요성 | 레거시만 | 모든 현대 사이트 |

---

## 쿠키와 세션

HTTP가 상태 비저장이므로 웹 애플리케이션은 다음을 사용한다:

**쿠키**: 브라우저에 저장된 소형 키-값 쌍.
```
Set-Cookie: session_id=abc123; Path=/; HttpOnly; Secure; SameSite=Strict
```

속성:
- `HttpOnly`: JavaScript로 접근 불가 (XSS 방지)
- `Secure`: HTTPS를 통해서만 전송
- `SameSite`: 교차 사이트 전송 제어 (CSRF 방지)

**세션**: 서버가 세션 ID에 매핑된 상태를 저장. 쿠키는 ID만 보관.

---

## CORS — 교차 출처 리소스 공유

브라우저는 기본적으로 다른 출처(도메인, 프로토콜, 포트)로의 요청을 차단한다. CORS를 통해 서버가 허용할 출처를 지정한다:

```
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Authorization, Content-Type
```

사전 요청(Preflight): 단순하지 않은 요청(POST, PUT, DELETE, 커스텀 헤더)의 경우 브라우저가 먼저 `OPTIONS` 요청으로 권한을 확인한다.

---

## 실습 예제: 완전한 HTTP/1.1 대화

**시나리오**: 브라우저가 JSON API로 `https://api.example.com/users/42`를 가져온다.

### 1. TCP + TLS 핸드셰이크 (HTTP 전에)

```
[TCP 3-way 핸드셰이크: ~1 RTT]
[TLS 1.3 핸드셰이크: ~1 RTT]

HTTP 첫 번째 바이트 전 총 설정 비용: ~2 RTT
(HTTP/3 + QUIC는 0-RTT 재개로 이를 ~0-1 RTT로 줄임)
```

### 2. HTTP 요청 (클라이언트 → 서버)

```
GET /users/42 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

본문 없음 (GET 요청). 헤더 뒤의 빈 줄이 요청 끝을 알린다.

### 3. HTTP 응답 (서버 → 클라이언트)

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 89
Cache-Control: private, max-age=0
Date: Thu, 06 Mar 2026 10:00:00 GMT
X-Request-Id: a3b9f2e1

{"id":42,"name":"Alice Kim","email":"alice@example.com","role":"admin","active":true}
```

### 4. 상태 코드 결정 트리

```
브라우저가 응답 수신:
  ┌─ 2xx? → 성공 → 데이터 렌더링/사용
  ├─ 301/302? → 리다이렉트 → Location 헤더로 새 요청
  ├─ 304? → 변경 없음 → 캐시 버전 사용 (본문 없음)
  ├─ 401? → 미인가 → 로그인 프롬프트 / 토큰 갱신
  ├─ 403? → 금지 → "접근 거부" 표시
  ├─ 404? → 찾을 수 없음 → 오류 페이지 표시
  ├─ 429? → 너무 많은 요청 → Retry-After 초 후 재시도
  └─ 5xx? → 서버 오류 → 오류 표시, 캐시 안 함
```

---

## 실습 예제: TLS 1.3 핸드셰이크 타이밍

**목표**: `https://example.com`을 위한 암호화 채널 설정

```
시간    클라이언트                              서버
  0ms   ClientHello ─────────────────────►
        - TLS 버전: 1.3
        - 지원 암호: AES_128_GCM, ChaCha20
        - 클라이언트 랜덤: [32바이트]
        - 키 공유: x25519 공개 키

 30ms                  ◄── ServerHello ───
                           - 선택된 암호: TLS_AES_128_GCM_SHA256
                           - 서버 랜덤: [32바이트]
                           - 키 공유: x25519 공개 키
                       ◄── Certificate ───
                           - 서버 공개 키 + 도메인
                           - CA 서명
                       ◄── Finished ───────

 30ms   [클라이언트가 키 교환으로 공유 비밀 유도]
        [클라이언트가 신뢰하는 CA에 대해 인증서 검증]
        Finished ────────────────────────►

 60ms   [암호화된 HTTP 트래픽 시작]
```

| | TLS 1.2 | TLS 1.3 |
|---|---|---|
| 핸드셰이크 RTT | 2 RTT | 1 RTT |
| 0-RTT 재개 | 없음 | 있음 (세션 티켓으로) |
| 키 교환 | RSA 또는 DHE | ECDHE/x25519만 (항상 완전 순방향 비밀성) |
| 암호 스위트 | 많음 (약한 것 포함) | 강력한 5개만 |

---

## 실습 예제: CORS 사전 요청

**시나리오**: `https://app.example.com`의 프론트엔드가 `https://api.otherdomain.com`의 API를 호출한다.

브라우저가 `Authorization` 헤더를 가진 **교차 출처** POST를 감지 → 사전 요청 전송:

### 1단계: OPTIONS 사전 요청

```
OPTIONS /data HTTP/1.1
Host: api.otherdomain.com
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type
```

### 2단계: 서버 사전 요청 응답

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

`Max-Age: 86400` → 브라우저가 이 권한을 24시간 캐시; 다시 사전 요청 불필요.

### 3단계: 실제 요청

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

{"result": "..."}
```

서버가 `Access-Control-Allow-Origin: *`를 반환했다면 브라우저가 `Authorization` 헤더 읽기를 차단한다 (자격증명이 있는 요청은 와일드카드가 아닌 정확한 출처 필요).
