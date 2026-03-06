---
title: "트랜잭션과 ACID 속성"
description: "데이터베이스 트랜잭션 심층 분석 — ACID 보장(원자성, 일관성, 격리성, 지속성), 격리 수준, 동시성 문제(더티 리드, 팬텀 리드), 실무 트랜잭션 관리."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "트랜잭션", "ACID", "격리 수준", "동시성", "잠금", "데이터베이스"]
author: "Nemit"
featured: false
pinned: false
---

# 트랜잭션과 ACID 속성

**트랜잭션**은 하나의 논리적 작업 단위를 구성하는 SQL 연산들의 시퀀스입니다. **모든** 연산이 성공하거나(커밋) **아무것도** 적용되지 않습니다(롤백). 트랜잭션은 관계형 데이터베이스에서 데이터 무결성의 기초입니다.

---

## 트랜잭션이란?

```sql
-- 계좌 A에서 계좌 B로 $500 이체
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A';
UPDATE accounts SET balance = balance + 500 WHERE account_id = 'B';

COMMIT;
```

두 `UPDATE` 문 사이에 시스템이 충돌하면, 돈이 사라집니다 — A에서 출금되었지만 B에 입금되지 않았습니다. 트랜잭션은 이를 방지합니다: 어떤 부분이 실패하면 전체 트랜잭션이 롤백됩니다.

```sql
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A';
-- 여기서 시스템 충돌!
-- 복구 시: 첫 번째 UPDATE가 롤백됨
-- 계좌 A는 여전히 원래 잔액을 가짐

COMMIT;
```

---

## ACID 속성

모든 트랜잭션이 제공해야 하는 네 가지 보장:

### 원자성(Atomicity) — "전부 아니면 전무"

트랜잭션은 **분할 불가능한** 단위입니다. 내부의 모든 연산이 성공하거나, 하나도 실행되지 않습니다. 부분 실행은 없습니다.

```sql
BEGIN;
INSERT INTO orders (order_id, customer_id, total) VALUES (1, 100, 250.00);
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 'P1', 2);
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 'P2', 1);
-- 이 INSERT가 실패하면 (예: 외래 키 위반):
-- 세 INSERT 모두가 롤백됨
COMMIT;
```

**구현**: 데이터베이스는 **WAL(Write-Ahead Log)**을 사용합니다. 데이터를 수정하기 전에, 의도된 변경을 로그 파일에 기록합니다. 충돌 복구 시, 로그를 재생하거나 실행 취소하여 일관성을 복원합니다.

### 일관성(Consistency) — "유효한 상태에서 유효한 상태로"

트랜잭션은 데이터베이스를 하나의 **유효한 상태**에서 다른 유효한 상태로 전환합니다. 트랜잭션 완료 후 모든 제약 조건(기본 키, 외래 키, CHECK 제약, 트리거)이 만족되어야 합니다.

```sql
BEGIN;
-- CHECK 제약 위반: balance >= 0
UPDATE accounts SET balance = balance - 10000
WHERE account_id = 'A';  -- 계좌 A에는 $500만 있음

-- 데이터베이스가 이를 거부하고 롤백
-- 일관성 유지: 음수 잔액 없음
COMMIT;
```

일관성을 강제하는 것들:
- 기본 키 / 고유 제약
- 외래 키 제약
- CHECK 제약
- NOT NULL 제약
- 트리거와 저장 프로시저

### 격리성(Isolation) — "동시 트랜잭션이 간섭하지 않음"

여러 트랜잭션이 동시에 실행되더라도, 각각은 혼자 실행되는 것처럼 동작해야 합니다. 결과는 어떤 **직렬**(하나씩 차례로) 실행과 동등해야 합니다.

```
트랜잭션 1:                    트랜잭션 2:
BEGIN;                         BEGIN;
READ A의 잔액 → $1000         
                               READ A의 잔액 → $1000
UPDATE A: 잔액 = $500
                               UPDATE A: 잔액 = $200
COMMIT;                        COMMIT;
-- A의 잔액은? 격리 수준에 따라 다름!
```

적절한 격리 없이는, 동시 트랜잭션이 해로운 방식으로 간섭할 수 있습니다 (아래에서 상세히 다룸).

### 지속성(Durability) — "커밋됨 = 영구적"

트랜잭션이 커밋되면, 그 변경사항은 이후의 어떤 장애에도 **살아남습니다** — 정전, 충돌, 하드웨어 장애.

**구현**: `COMMIT`이 반환되기 전에 WAL이 디스크에 플러시됩니다. 커밋 직후 시스템이 충돌해도, 커밋된 변경사항은 로그에서 복구할 수 있습니다.

---

## 트랜잭션 제어

```sql
-- 트랜잭션 시작
BEGIN;                  -- PostgreSQL, MySQL
BEGIN TRANSACTION;      -- SQL Server
START TRANSACTION;      -- MySQL 대안

-- 커밋: 변경사항을 영구적으로
COMMIT;

-- 롤백: BEGIN 이후의 모든 변경사항 취소
ROLLBACK;
```

### 세이브포인트 — 부분 롤백

```sql
BEGIN;

INSERT INTO employees (emp_id, name) VALUES (1, 'Alice');
SAVEPOINT sp1;

INSERT INTO employees (emp_id, name) VALUES (2, 'Bob');
-- Bob에 문제가 생김
ROLLBACK TO sp1;
-- Bob의 INSERT가 취소되지만, Alice의 것은 유지됨

INSERT INTO employees (emp_id, name) VALUES (3, 'Charlie');
COMMIT;
-- 결과: Alice (1)과 Charlie (3)이 삽입됨. Bob (2)은 삽입되지 않음.
```

### 자동 커밋 모드

기본적으로 대부분의 데이터베이스는 **자동 커밋** 모드로 실행됩니다 — 각 문이 자체 트랜잭션입니다:

```sql
-- 각 문이 자동 커밋:
INSERT INTO logs (msg) VALUES ('event 1');  -- 즉시 커밋
INSERT INTO logs (msg) VALUES ('event 2');  -- 즉시 커밋
```

문들을 하나의 트랜잭션으로 묶으려면, `BEGIN ... COMMIT`을 명시적으로 사용하세요.

---

## 동시성 문제

여러 트랜잭션이 동시에 같은 데이터에 접근할 때 발생할 수 있는 문제들:

### 1. 더티 리드 (Dirty Read)

다른 트랜잭션이 작성했지만 **아직 커밋하지 않은** 데이터를 읽는 것.

```
T1: BEGIN;
T1: UPDATE accounts SET balance = 0 WHERE id = 'A';    -- 아직 미커밋
T2: SELECT balance FROM accounts WHERE id = 'A';         -- 0을 읽음 (더티!)
T1: ROLLBACK;                                             -- 업데이트 취소
-- T2는 실제로 존재하지 않은 값을 사용함
```

### 2. 반복 불가능 읽기 (Non-Repeatable Read)

트랜잭션 내에서 같은 행을 두 번 읽었는데 **다른 값**을 얻는 것. 다른 트랜잭션이 그 사이에 수정하고 커밋했기 때문.

```
T1: BEGIN;
T1: SELECT balance FROM accounts WHERE id = 'A';  -- $1000 읽음
T2: UPDATE accounts SET balance = 500 WHERE id = 'A';
T2: COMMIT;
T1: SELECT balance FROM accounts WHERE id = 'A';  -- $500 읽음 (다름!)
T1: COMMIT;
```

### 3. 팬텀 리드 (Phantom Read)

같은 쿼리를 두 번 실행했는데 **다른 행 집합**을 얻는 것. 다른 트랜잭션이 쿼리에 매칭하는 행을 삽입하거나 삭제했기 때문.

```
T1: BEGIN;
T1: SELECT COUNT(*) FROM employees WHERE dept_id = 10;  -- 5 반환
T2: INSERT INTO employees (name, dept_id) VALUES ('New', 10);
T2: COMMIT;
T1: SELECT COUNT(*) FROM employees WHERE dept_id = 10;  -- 6 반환 (팬텀!)
T1: COMMIT;
```

### 4. 갱신 분실 (Lost Update)

두 트랜잭션이 같은 값을 읽고, 둘 다 수정하며, 두 번째 쓰기가 첫 번째를 덮어씀.

```
T1: SELECT balance FROM accounts WHERE id = 'A';  -- $1000 읽음
T2: SELECT balance FROM accounts WHERE id = 'A';  -- $1000 읽음
T1: UPDATE accounts SET balance = 1000 - 200 WHERE id = 'A';  -- $800 설정
T2: UPDATE accounts SET balance = 1000 - 300 WHERE id = 'A';  -- $700 설정
-- T1의 업데이트가 유실됨! $500 (1000 - 200 - 300)이어야 함
```

---

## 격리 수준

SQL은 네 가지 격리 수준을 정의하며, 각각 서로 다른 문제 집합을 방지합니다:

| 격리 수준 | 더티 리드 | 반복 불가능 읽기 | 팬텀 리드 |
|---|---|---|---|
| **READ UNCOMMITTED** | 가능 | 가능 | 가능 |
| **READ COMMITTED** | 방지 | 가능 | 가능 |
| **REPEATABLE READ** | 방지 | 방지 | 가능 |
| **SERIALIZABLE** | 방지 | 방지 | 방지 |

### 격리 수준 설정

```sql
-- PostgreSQL
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
-- ... 쿼리 ...
COMMIT;

-- MySQL
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
-- ... 쿼리 ...
COMMIT;

-- 전역/세션 수준 설정
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### READ UNCOMMITTED

가장 낮은 격리. 트랜잭션이 다른 트랜잭션의 미커밋 변경을 볼 수 있음. 실무에서 거의 사용하지 않음.

### READ COMMITTED (PostgreSQL, Oracle, SQL Server 기본값)

트랜잭션 내 각 쿼리는 **해당 쿼리 시작 전에 커밋된** 데이터만 봅니다. 같은 트랜잭션 내의 다른 쿼리는 다른 커밋 상태를 볼 수 있습니다.

### REPEATABLE READ (MySQL/InnoDB 기본값)

트랜잭션은 트랜잭션 시작 시점의 데이터베이스 **스냅샷**을 봅니다. 트랜잭션 내의 모든 읽기가 동시 커밋과 관계없이 같은 데이터를 반환합니다.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT balance FROM accounts WHERE id = 'A';  -- $1000 읽음
-- 다른 트랜잭션이 A를 $500으로 변경하고 커밋
SELECT balance FROM accounts WHERE id = 'A';  -- 여전히 $1000 읽음 (스냅샷)
COMMIT;
```

MySQL/InnoDB에서는 `REPEATABLE READ`가 **갭 락**을 사용하여 팬텀 리드도 방지합니다.

### SERIALIZABLE

가장 높은 격리. 트랜잭션이 **하나씩 차례로** 직렬 실행되는 것처럼 동작합니다. 동시성 이상이 발생할 수 없지만, 가장 높은 성능 비용이 있습니다.

**구현 방식 차이**:
- PostgreSQL: **SSI(Serializable Snapshot Isolation)** 사용 — 낙관적, 커밋 시점에 충돌 감지
- MySQL: **잠금** 사용 — 비관적, 범위를 잠가 충돌 방지
- SQL Server: 두 방식 모두 지원

---

## 격리 수준 트레이드오프

```
READ UNCOMMITTED ←→ SERIALIZABLE
                ↑                  ↑
    더 많은 동시성        더 적은 동시성
    더 적은 일관성        더 많은 일관성
    더 빠름              더 느림
    더 많은 이상 현상      이상 현상 없음
```

| 사용 사례 | 권장 수준 |
|---|---|
| 금융 거래 | SERIALIZABLE 또는 REPEATABLE READ |
| 일반 웹 앱 | READ COMMITTED |
| 읽기 전용 분석 | READ COMMITTED 또는 READ UNCOMMITTED |
| 재고 관리 | REPEATABLE READ 또는 SERIALIZABLE |

---

## 잠금 메커니즘

### 공유 잠금 (읽기 잠금)

여러 트랜잭션이 동시에 같은 리소스에 대한 공유 잠금을 보유할 수 있음. `SELECT`에 사용.

### 배타적 잠금 (쓰기 잠금)

하나의 트랜잭션만 배타적 잠금을 보유할 수 있음. 다른 트랜잭션은 대기해야 함. `INSERT`, `UPDATE`, `DELETE`에 사용.

### 명시적 잠금

```sql
-- PostgreSQL: 특정 행 잠금
SELECT * FROM accounts WHERE id = 'A' FOR UPDATE;
-- 커밋/롤백할 때까지 다른 트랜잭션이 이 행을 수정할 수 없음

-- 공유 모드 잠금 (다른 읽기 허용, 쓰기 차단)
SELECT * FROM accounts WHERE id = 'A' FOR SHARE;
```

### 데드락

```
T1: 행 A 잠금, 행 B 잠금하려 함
T2: 행 B 잠금, 행 A 잠금하려 함
→ 데드락: 둘 다 영원히 대기
```

데이터베이스는 데드락을 감지하고 한 트랜잭션(희생자)을 중단합니다:

```sql
-- PostgreSQL 자동 감지:
-- ERROR: deadlock detected
-- DETAIL: Process 123 waits for ShareLock on transaction 456

-- 중단된 트랜잭션은 애플리케이션에서 재시도해야 함
```

**방지 전략**:
- 항상 같은 순서로 리소스를 잠금
- 트랜잭션을 짧게 유지
- 적절한 격리 수준 사용

---

## 낙관적 vs 비관적 동시성

### 비관적 (잠금)

충돌이 **자주 발생한다고** 가정. 수정 전에 데이터를 잠금.

```sql
BEGIN;
SELECT balance FROM accounts WHERE id = 'A' FOR UPDATE;  -- 행 잠금
-- 비즈니스 로직 처리
UPDATE accounts SET balance = balance - 100 WHERE id = 'A';
COMMIT;
```

### 낙관적 (버전 관리)

충돌이 **드물다고** 가정. 데이터를 읽고, 작업하고, 커밋 시점에 충돌을 확인.

```sql
-- 버전 번호와 함께 읽기
SELECT balance, version FROM accounts WHERE id = 'A';
-- → balance=1000, version=5

-- 애플리케이션 코드에서 비즈니스 로직 처리

-- 버전이 변경되지 않은 경우에만 업데이트
UPDATE accounts
SET balance = 900, version = version + 1
WHERE id = 'A' AND version = 5;
-- 영향받은 행이 0이면 → 충돌 감지, 재시도
```

| 접근법 | 적합한 경우 | 단점 |
|---|---|---|
| 비관적 | 높은 경쟁 | 잠금이 동시성 감소 |
| 낙관적 | 낮은 경쟁 | 충돌 시 재시도 |

---

## 모범 사례

1. **트랜잭션을 짧게 유지** — 긴 트랜잭션은 잠금을 보유하고 다른 트랜잭션을 차단
2. **트랜잭션 내에서 사용자와 상호작용하지 않기** — `BEGIN` 후 입력을 기다리고 `COMMIT`하지 마세요
3. **데드락 처리** — 애플리케이션에서 재시도 로직 구현
4. **적절한 격리 수준 사용** — READ COMMITTED로 충분하면 SERIALIZABLE을 기본으로 하지 마세요
5. **불필요한 잠금 피하기** — 정말 배타적 접근이 필요할 때만 `FOR UPDATE` 사용
6. **배치 연산 선호** — 1000개의 별도 트랜잭션보다 1000행에 대한 하나의 UPDATE가 나음

---

## 빠른 참조

```sql
BEGIN;                            -- 트랜잭션 시작
SAVEPOINT sp1;                    -- 세이브포인트 생성
ROLLBACK TO sp1;                  -- 부분 롤백
COMMIT;                           -- 영구 반영
ROLLBACK;                         -- 모든 것 취소

SET TRANSACTION ISOLATION LEVEL   -- 격리 수준 설정
    READ UNCOMMITTED |
    READ COMMITTED |
    REPEATABLE READ |
    SERIALIZABLE;

SELECT ... FOR UPDATE;            -- 배타적 행 잠금
SELECT ... FOR SHARE;             -- 공유 행 잠금
```

| ACID 속성 | 보장 | 메커니즘 |
|---|---|---|
| **원자성** | 전부 아니면 전무 | WAL + 롤백 |
| **일관성** | 유효한 상태 전환 | 제약 + 트리거 |
| **격리성** | 간섭 없음 | 잠금 + MVCC |
| **지속성** | 커밋됨 = 영구적 | WAL + 디스크 플러시 |
