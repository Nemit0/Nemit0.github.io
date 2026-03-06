---
title: "VLAN — 가상 근거리 통신망"
description: "VLAN 기본 원리 — IEEE 802.1Q 태깅, 액세스 및 트렁크 포트, 네이티브 VLAN, VLAN 간 라우팅, 이점 및 구성 개요."
date: "2026-03-06"
category: "CS/networking"
tags: ["네트워킹", "VLAN", "802.1Q", "스위칭", "레이어 2", "트렁크"]
author: "Nemit"
featured: false
pinned: false
---

# VLAN — 가상 근거리 통신망

## VLAN이란?

**VLAN(Virtual LAN)**은 물리적으로 분리된 스위치 없이 단일 물리 네트워크를 **여러 개의 격리된 브로드캐스트 도메인**으로 논리적으로 나눈다.

같은 VLAN의 장치는 직접 통신할 수 있다 (레이어 2). 다른 VLAN의 장치는 라우터(레이어 3)를 통해야 한다.

```
물리적 스위치 (장치 1개)          논리적 뷰 (VLAN 3개)

┌────────────────────────┐     VLAN 10 (엔지니어링)
│  포트 1  → PC1         │     ─── PC1 ─── PC2
│  포트 2  → PC2         │
│  포트 3  → PC3         │     VLAN 20 (영업)
│  포트 4  → PC4         │     ─── PC3 ─── PC4
│  포트 5  → 서버         │
│  포트 6  → 프린터       │     VLAN 30 (관리)
│  포트 7  → 라우터       │     ─── 서버 ─── 프린터
└────────────────────────┘
```

---

## VLAN을 사용하는 이유

| 이점 | 설명 |
|---|---|
| **보안** | 부서가 격리됨; 재무가 엔지니어링 트래픽을 볼 수 없음 |
| **브로드캐스트 제어** | 브로드캐스트가 VLAN 내에 머뭄; 노이즈 감소 |
| **유연성** | 재배선 없이 사용자를 VLAN 간에 이동 |
| **비용** | 여러 물리적 스위치 대신 하나의 스위치 |
| **성능** | 더 작은 브로드캐스트 도메인 = 낭비되는 대역폭 감소 |
| **규정 준수** | 세그멘테이션 요구사항 충족 (PCI-DSS, HIPAA) |

---

## IEEE 802.1Q — VLAN 태깅

**802.1Q**는 VLAN 태깅 표준이다. 이더넷 프레임에 **4바이트 태그**를 삽입한다:

```
일반 이더넷 프레임:
[ 목적 MAC | 출발 MAC | EtherType | 페이로드 | FCS ]

802.1Q 태그된 프레임:
[ 목적 MAC | 출발 MAC | 0x8100 | 태그 | EtherType | 페이로드 | FCS ]
                       ↑             ↑
                    TPID 필드   VLAN 태그 (4바이트)
```

### 802.1Q 태그 구조 (4바이트)

```
┌─────────────────────────────────────────────┐
│ TPID (16비트) │ PCP (3비트) │ DEI │ VID  │
│   0x8100      │  우선순위   │ (1) │ (12) │
└─────────────────────────────────────────────┘
```

- **TPID**: 태그 프로토콜 ID = `0x8100` (802.1Q 프레임 식별)
- **PCP**: 우선순위 코드 포인트 (0–7, QoS에 사용)
- **DEI**: 드롭 적격 지시자
- **VID**: VLAN ID (0–4095; 0과 4095는 예약 → 4094개 사용 가능한 VLAN)

---

## 액세스 포트 vs 트렁크 포트

### 액세스 포트

- **하나의 VLAN**에만 트래픽 전달
- 프레임이 **태그 없음** (나갈 때 VLAN 태그 제거, 들어올 때 추가)
- **종단 장치**에 연결: PC, 프린터, 서버

```
PC ──── (태그 없음) ──── 액세스 포트 (VLAN 10) ──── 스위치
```

### 트렁크 포트

- **여러 VLAN**의 트래픽을 동시에 전달
- 프레임이 VLAN ID로 **태그됨**
- **다른 스위치, 라우터, 하이퍼바이저**에 연결

```
스위치1 ──── (태그됨: VLAN 10, 20, 30) ──── 트렁크 ──── 스위치2
```

---

## 네이티브 VLAN

트렁크 포트의 **네이티브 VLAN**은 **태그 없는** 프레임을 전달한다. 태그 없는 프레임이 트렁크 포트에 도착하면 네이티브 VLAN에 속한다.

- 기본 네이티브 VLAN은 보통 VLAN 1
- 트렁크의 양쪽 끝이 네이티브 VLAN에 동의해야 한다
- **보안 위험**: 네이티브 VLAN이 일치하지 않으면 프레임이 VLAN 간을 "도약"할 수 있다 (이중 태깅 공격)
- 모범 사례: 네이티브 VLAN을 사용하지 않는 VLAN으로 변경

---

## VLAN 간 라우팅

다른 VLAN의 호스트는 라우터 없이 통신할 수 없다. 세 가지 방법:

### 1. 라우터 온 어 스틱 (ROAS)

스위치와 라우터 사이의 물리적 링크 하나에 트렁크 서브인터페이스:

```
           라우터
          /  (서브인터페이스)
         /   192.168.10.1 (VLAN 10)
        /    192.168.20.1 (VLAN 20)
       /     192.168.30.1 (VLAN 30)
스위치 (트렁크 포트)
```

```
# Cisco 라우터 구성 예시
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0

interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
```

### 2. 레이어 3 스위치 (SVI)

레이어 3 스위치가 **SVI(스위치드 가상 인터페이스)**를 통해 VLAN 간을 내부적으로 라우팅한다. ROAS보다 빠름(외부 라우터 홉 없음).

```
# Cisco L3 스위치 구성
vlan 10
vlan 20

interface vlan 10
 ip address 192.168.10.1 255.255.255.0

interface vlan 20
 ip address 192.168.20.1 255.255.255.0

ip routing    ! 라우팅 활성화
```

### 3. 별도 라우터 인터페이스

VLAN당 물리적 인터페이스 하나. 단순하지만 확장성이 없다.

---

## VLAN 구성 예시 (Cisco)

```bash
# VLAN 생성
Switch(config)# vlan 10
Switch(config-vlan)# name Engineering

Switch(config)# vlan 20
Switch(config-vlan)# name Sales

# 액세스 포트 구성 (VLAN 10)
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10

# 트렁크 포트 구성
Switch(config)# interface GigabitEthernet0/24
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20,30
Switch(config-if)# switchport trunk native vlan 99
```

---

## 보안 고려사항

- **VLAN 호핑**: VLAN을 넘나드는 이중 태깅 또는 스위치 스푸핑 공격
- **완화책**: DTP(동적 트렁킹) 비활성화, 전용 네이티브 VLAN 사용, 포트 보안
- **미사용 포트**: 블랙홀 VLAN에 할당하고 관리적으로 종료
- **관리 VLAN**: 사용자 VLAN과 분리 유지; 접근 제한

---

## 실습 예제: 트렁크를 통한 프레임 태깅

**시나리오**: PC1(VLAN 10의 포트 Gi0/1)이 트렁크 링크를 통해 PC3(VLAN 10의 포트 Gi0/3)에 데이터를 보낸다.

```
스위치1                          스위치2
Gi0/1 (액세스, VLAN 10)         Gi0/1 (액세스, VLAN 10) → PC3
Gi0/24 (트렁크, VLAN 10,20,30)  Gi0/24 (트렁크, VLAN 10,20,30)
```

### 1단계: PC1이 태그 없는 프레임 전송

PC1이 일반 이더넷 프레임을 전송한다 (VLAN 태그 없음 — 그냥 일반 PC):
```
PC1의 이더넷 프레임:
  목적 MAC:  PC3_MAC
  출발 MAC:  PC1_MAC
  EtherType: 0x0800 (IPv4)
  페이로드:  [IP 패킷]
  FCS:       [체크섬]
```

### 2단계: 스위치1이 액세스 포트에서 수신 (Gi0/1, VLAN 10)

액세스 포트가 VLAN ID 10으로 프레임을 **태그**한다:
```
스위치1 내부의 태그된 프레임:
  목적 MAC:  PC3_MAC
  출발 MAC:  PC1_MAC
  TPID:      0x8100          ← 802.1Q 태그 표시
  PCP:       000             ← 우선순위 0
  DEI:       0
  VID:       10              ← VLAN 10
  EtherType: 0x0800
  페이로드:  [IP 패킷]
  FCS:       [재계산됨]
```

스위치1이 MAC 테이블을 확인: PC3_MAC은 VLAN 10에서 Gi0/24(트렁크 포트)에 있다.

### 3단계: 스위치1에서 트렁크로 프레임 출력 (Gi0/24)

트렁크가 **태그된 프레임**을 전달 — 802.1Q 태그가 유지됨:
```
스위치 간 와이어:
  [목적 MAC | 출발 MAC | 0x8100 | 태그(VID=10) | 0x0800 | IP 패킷 | FCS]
```

VLAN 20과 VLAN 30 트래픽도 동일한 케이블을 통해 이동하되, 각자의 태그가 있다.

### 4단계: 스위치2가 트렁크에서 태그된 프레임 수신 (Gi0/24)

스위치2가 VID=10을 읽고, VLAN 10의 MAC 테이블을 조회: PC3_MAC은 액세스 포트 Gi0/1에 있다.

### 5단계: 스위치2가 태그를 제거하고 PC3에 전달

스위치2가 액세스 포트에서 나가기 전에 802.1Q 태그를 **제거**한다:
```
PC3에게 전달되는 프레임 (태그 없음 — PC3는 그냥 일반 PC):
  목적 MAC:  PC3_MAC
  출발 MAC:  PC1_MAC
  EtherType: 0x0800 (IPv4 — 0x8100 태그가 사라짐)
  페이로드:  [IP 패킷]
  FCS:       [재계산됨]
```

PC3는 VLAN 태그가 없는 완전히 정상적인 이더넷 프레임을 수신한다 — VLAN이 존재하는지 전혀 모른다.

### VLAN 격리 확인

PC1(VLAN 10)이 PC4(VLAN 20)에 접근하려 하면?

```
PC1이 프레임 전송 → 스위치1이 VID=10으로 태그
스위치1이 MAC 테이블 확인: PC4_MAC은 VLAN 20에 있음, VLAN 10이 아님
→ 스위치1이 프레임을 폐기 (다른 VLAN = 다른 브로드캐스트 도메인)

VLAN 20에 접근하려면 트래픽이 라우터(또는 L3 스위치)를 통해야 한다.
```

---

## 실습 예제: 이중 태깅 VLAN 호핑 공격

**설정**: 공격자가 네이티브 VLAN 1(포트 Gi0/10)에 있다. 목표는 VLAN 20에 있다. 트렁크의 네이티브 VLAN도 VLAN 1이다.

### 공격 메커니즘

공격자가 **두 개의 802.1Q 태그**가 있는 프레임을 제작한다:

```
공격자의 악성 프레임:
  [ 목적 MAC | 출발 MAC | 0x8100 | 외부 태그 VID=1 | 0x8100 | 내부 태그 VID=20 | 페이로드 | FCS ]
```

**홉 1 — 스위치 A** (공격자의 스위치):
- 액세스 포트(VLAN 1)에서 프레임 수신
- 트렁크 포트: **외부 태그** 제거 (VID=1 = 네이티브 VLAN, 자연스럽게 제거됨)
- **내부 태그**만 있는 프레임(VID=20)을 다음 스위치로 전달

**홉 2 — 스위치 B**:
- VID=20으로 태그된 프레임 수신
- VLAN 20 세그먼트로 전달
- **공격자의 프레임이 이제 VLAN 20에 있다** — VLAN 호핑 성공!

### 완화

```bash
# 1. 네이티브 VLAN을 사용하지 않는 VLAN으로 변경 (예: 999)
switchport trunk native vlan 999

# 2. 절대 VLAN 1을 네이티브 VLAN으로 사용하지 말 것
# 3. 네이티브 VLAN 트래픽을 명시적으로 태그
switchport trunk native vlan tag  (Cisco IOS)

# 4. 미사용 포트를 전용 VLAN에 할당하고 종료
switchport access vlan 999
shutdown
```
