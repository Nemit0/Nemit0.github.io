---
title: "DNS — 도메인 이름 해석의 원리"
description: "DNS 기본 원리 — 계층 구조, 해석 과정, 레코드 유형, 캐싱, TTL, 재귀 vs 반복 쿼리, DNS 보안."
date: "2026-03-06"
category: "CS/networking"
tags: ["네트워킹", "DNS", "도메인", "해석", "네임서버"]
author: "Nemit"
featured: false
pinned: false
---

# DNS — 도메인 이름 시스템

## DNS란?

**DNS(Domain Name System)**는 인터넷의 "전화번호부" — 사람이 읽을 수 있는 도메인 이름(예: `www.example.com`)을 컴퓨터가 통신에 사용하는 IP 주소(예: `93.184.216.34`)로 변환한다.

DNS가 없다면 모든 웹사이트의 IP 주소를 외워야 할 것이다.

**프로토콜**: 주로 UDP 포트 53. 큰 응답이나 존 전송에는 TCP를 사용한다.

---

## DNS 계층 구조

DNS는 **분산되고 계층적인** 시스템이다:

```
                        . (루트)
                       / \
             .com      .org      .net    .kr   ...
            /   \
       google.com  example.com
      /
 www.google.com
```

점으로 구분된 각 **레이블**은 계층의 한 수준이다:

```
www . example . com .
 ↑       ↑       ↑  ↑
호스트  서브도메인 TLD 루트 (암시적)
```

### 역할별 DNS 서버

| 서버 | 역할 | 예시 |
|---|---|---|
| **루트 네임서버** | 모든 TLD 서버의 위치를 앎 | 13개 루트 서버 클러스터 (a~m.root-servers.net) |
| **TLD 네임서버** | 자신의 TLD에 대한 권한 서버를 앎 | .com, .org, .kr 서버 |
| **권한 네임서버** | 도메인에 대한 실제 DNS 레코드를 보유 | 호스팅 업체의 DNS |
| **재귀 리졸버** | 클라이언트를 대신해 조회 수행 | ISP나 Google의 8.8.8.8 |

---

## DNS 해석 과정

브라우저에 `www.example.com`을 입력하면:

```
브라우저         리졸버              루트 NS    .com NS  example.com NS
   │                │                  │          │           │
   │── 쿼리: ──────►│                  │          │           │
   │  www.example.com│                  │          │           │
   │                │── .com 담당? ────►│          │           │
   │                │◄── .com NS 주소 ──│          │           │
   │                │                             │           │
   │                │── example.com 담당? ────────►│           │
   │                │◄── example.com NS 주소 ──────│           │
   │                │                                         │
   │                │── www.example.com? ─────────────────────►│
   │                │◄── 93.184.216.34 ────────────────────────│
   │                │                                         │
   │◄── 93.184.216.34 ──│
   │                │ (결과 캐시)
```

### 단계별 설명

1. **브라우저 캐시**: IP가 이미 캐시되어 있는지 확인
2. **OS 캐시** (`/etc/hosts`, 시스템 DNS 캐시): 로컬 캐시 확인
3. **재귀 리졸버**: 캐시에 없으면 OS가 설정된 DNS 서버(보통 라우터나 ISP)에 요청
4. **루트 서버 쿼리**: 리졸버가 루트 서버에 ".com 담당은?"이라고 질의
5. **TLD 서버 쿼리**: 리졸버가 .com TLD 서버에 "example.com 담당은?"이라고 질의
6. **권한 서버 쿼리**: 리졸버가 example.com의 권한 DNS에 "www.example.com은?"이라고 질의
7. **답변 반환**: IP 주소가 리졸버에 반환되고, 리졸버가 이를 캐시한 후 클라이언트에 반환
8. **클라이언트 연결**: 브라우저가 93.184.216.34:443에 TCP 연결 시작

---

## 재귀 vs 반복 쿼리

**재귀 쿼리**: 리졸버가 모든 작업을 하고 최종 답변을 반환한다. 클라이언트가 한 번만 질의한다.

**반복 쿼리**: 각 서버가 (최종 답변이 아닌) 참조를 반환한다. 리졸버가 참조를 따라간다.

실제로는: 클라이언트 → 리졸버는 재귀. 리졸버 → 다른 네임서버는 반복.

---

## DNS 레코드 유형

| 유형 | 이름 | 설명 | 예시 |
|---|---|---|---|
| **A** | 주소 | IPv4 주소 | `example.com → 93.184.216.34` |
| **AAAA** | IPv6 주소 | IPv6 주소 | `example.com → 2606:2800::1` |
| **CNAME** | 정식 이름 | 다른 도메인으로의 별칭 | `www.example.com → example.com` |
| **MX** | 메일 교환기 | 도메인의 메일 서버 | `example.com → mail.example.com` |
| **NS** | 네임서버 | 권한 네임서버 | `example.com NS: ns1.example.com` |
| **TXT** | 텍스트 | 임의 텍스트 (SPF, DKIM, 검증) | `"v=spf1 include:..."` |
| **PTR** | 포인터 | 역방향 DNS (IP → 호스트명) | `34.216.184.93.in-addr.arpa → example.com` |
| **SOA** | 권한 시작 | 존의 권한 정보, 시리얼, TTL | — |
| **SRV** | 서비스 | 서비스 위치 (호스트 + 포트) | `_http._tcp.example.com → 10 0 80 web.example.com` |

---

## TTL — 생존 시간

각 DNS 레코드에는 캐시할 수 있는 기간(초)을 지정하는 **TTL**이 있다:

```
www.example.com.  300  IN  A  93.184.216.34
                  ^^^
                  TTL = 300초 (5분)
```

- **낮은 TTL** (예: 60초): 변경이 빠르게 전파되지만 DNS 트래픽 증가
- **높은 TTL** (예: 86400초 = 1일): 트래픽 감소, 전파 느림
- IP 변경을 계획할 때: 미리 TTL을 낮춰서 이전 레코드가 빠르게 만료되도록 한다

---

## DNS 캐싱

DNS 응답은 여러 수준에서 캐시된다:
1. 브라우저 DNS 캐시
2. OS DNS 캐시
3. 재귀 리졸버 캐시

캐싱은 지연을 줄이고 DNS 서버 부하를 감소시킨다. 부정적인 응답(NXDOMAIN)도 더 짧은 기간 동안 캐시된다.

---

## 일반적인 DNS 도구

```bash
# 표준 조회
nslookup example.com
dig example.com

# 특정 레코드 유형
dig example.com MX
dig example.com AAAA

# 특정 서버에 질의
dig @8.8.8.8 example.com

# 전체 해석 경로 추적
dig +trace example.com

# 역방향 조회 (IP → 도메인)
dig -x 93.184.216.34
nslookup 93.184.216.34
```

---

## DNS 보안 문제

### DNS 스푸핑 / 캐시 포이즈닝

공격자가 리졸버의 캐시에 가짜 DNS 응답을 주입해 사용자를 악성 IP로 리다이렉트한다.

**방어**: **DNSSEC** — DNS 레코드에 암호화 서명을 해서 리졸버가 진위를 검증할 수 있게 한다.

### DNS 하이재킹

ISP나 공격자가 DNS 쿼리를 자신의 서버로 리다이렉트해서 트래픽을 검열, 모니터링, 또는 리다이렉트한다.

**방어**: 암호화된 DNS 사용:
- **DNS over HTTPS (DoH)**: HTTPS를 통한 DNS 쿼리로 가로채기 방지
- **DNS over TLS (DoT)**: TLS로 암호화된 DNS 쿼리

### DNS DDoS

공격자가 DNS 서버에 쿼리를 퍼부어 도메인에 접근할 수 없게 만든다.

**방어**: 애니캐스트 라우팅(많은 서버에 부하 분산), 속도 제한, 응답 속도 제한(RRL).

---

## hosts 파일

DNS 이전에는 IP-호스트명 매핑이 `/etc/hosts`(Unix/Linux) 또는 `C:\Windows\System32\drivers\etc\hosts`(Windows)에 저장됐다. OS가 DNS에 쿼리하기 전에 이 파일을 확인한다:

```
127.0.0.1   localhost
::1         localhost
192.168.1.10  myserver.local
```

여전히 유용한 경우: 로컬 개발 오버라이드, 도메인 차단.

---

## 실습 예제: 완전한 DNS 해석 추적

**쿼리**: 브라우저가 처음으로 `mail.google.com`을 해석한다 (캐시 없음).

```
1단계: 브라우저가 자체 DNS 캐시 확인
       → 찾을 수 없음. OS에 요청.

2단계: OS가 /etc/hosts 확인
       127.0.0.1  localhost
       → "mail.google.com" 목록 없음. 설정된 리졸버(8.8.8.8)에 요청.

3단계: OS → 재귀 리졸버 (8.8.8.8)
       쿼리: "mail.google.com의 A 레코드는?"
       리졸버가 캐시 확인 → 미스. 반복 해석 시작.

4단계: 리졸버 → 루트 네임서버 (a.root-servers.net, 198.41.0.4)
       쿼리:  ".com 담당은?"
       답변: ".com TLD 서버 중 하나에 질의: a.gtld-servers.net (192.5.6.30), ..."
       [리졸버 캐시: .com NS = a.gtld-servers.net, TTL=172800초 (2일)]

5단계: 리졸버 → .com TLD 서버 (a.gtld-servers.net, 192.5.6.30)
       쿼리:  "google.com 담당은?"
       답변: "질의: ns1.google.com (216.239.32.10), ns2.google.com, ns3, ns4"
       [리졸버 캐시: google.com NS = ns1.google.com, TTL=172800초]

6단계: 리졸버 → Google 권한 NS (ns1.google.com, 216.239.32.10)
       쿼리:  "mail.google.com의 A 레코드는?"
       답변: "mail.google.com A 142.250.80.37, TTL=300"
       [리졸버 캐시: mail.google.com A 142.250.80.37, TTL=300초]

7단계: 리졸버 → OS → 브라우저
       답변: 142.250.80.37

8단계: 브라우저가 142.250.80.37:443에 TCP 연결 시작
```

**총 시간**: 콜드 조회 보통 20~120ms. 웜 캐시(2단계 적중): <1ms.

### 타이밍 분석

```
루트 서버 쿼리:        ~10ms  (애니캐스트, 지리적으로 가까움)
.com TLD 서버 쿼리:    ~15ms
Google 권한 서버:      ~20ms
리졸버 오버헤드:       ~5ms
                       ────────
콜드 조회 합계:        ~50ms

캐시된 (리졸버 적중):  ~1ms   (리졸버가 캐시에서 답변)
캐시된 (브라우저 적중): <0.1ms (네트워크 쿼리 전혀 없음)
```

---

## 실습 예제: DNS 레코드 상호작용

**도메인**: `example.com`의 DNS 레코드:

```
; example.com 존 파일
$TTL 3600
@    IN  SOA   ns1.example.com.  admin.example.com. (
               2026030601  ; 시리얼 (YYYYMMDDNN)
               3600        ; 갱신
               900         ; 재시도
               604800      ; 만료
               300 )       ; 부정적 TTL

; 네임서버
@    IN  NS    ns1.example.com.
@    IN  NS    ns2.example.com.

; A 레코드 (IPv4)
@    IN  A     93.184.216.34
www  IN  A     93.184.216.34

; CNAME (별칭)
blog IN  CNAME www.example.com.      ; blog.example.com → www → 93.184.216.34

; 메일 교환기
@    IN  MX  10 mail1.example.com.   ; 우선순위 10
@    IN  MX  20 mail2.example.com.   ; 우선순위 20 (백업)

; TXT 레코드
@    IN  TXT  "v=spf1 include:_spf.google.com ~all"  ; SPF: 이메일 발신 가능자
```

**`blog.example.com` 해석 체인**:
```
쿼리: blog.example.com A 레코드?
1단계: blog.example.com CNAME → www.example.com
2단계: www.example.com A → 93.184.216.34
결과: 93.184.216.34

참고: CNAME 체인은 리졸버가 자동으로 따라간다.
      MX나 NS 레코드는 CNAME을 가리킬 수 없다 — A/AAAA 레코드만 가능하다.
```

**MX 선택**: 이메일 서버가 먼저 `mail1.example.com`(우선순위 10)을 시도한다. 접근 불가면 `mail2.example.com`(우선순위 20, 백업)으로 대체한다.
