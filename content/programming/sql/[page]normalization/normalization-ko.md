---
title: "데이터베이스 정규화: 1NF, 2NF, 3NF, BCNF"
description: "데이터베이스 정규화 심층 가이드 — 정규화의 필요성, 함수적 종속성, 1NF부터 BCNF까지의 정규형, 반정규화 트레이드오프, 각 단계의 실용적 예제."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "정규화", "1NF", "2NF", "3NF", "BCNF", "데이터베이스 설계", "함수적 종속성"]
author: "Nemit"
featured: false
pinned: false
---

# 데이터베이스 정규화: 1NF, 2NF, 3NF, BCNF

**정규화**는 중복을 줄이고 이상 현상(삽입, 갱신, 삭제 이상)을 방지하기 위해 관계형 데이터베이스를 구조화하는 과정입니다. 테이블을 더 작고 잘 구조화된 테이블로 분해하고 외래 키로 연결합니다.

---

## 왜 정규화하는가?

비정규화된 테이블을 살펴봅시다:

**orders_raw**

| order_id | customer_name | customer_email | product | price | qty |
|---|---|---|---|---|---|
| 1 | Alice | alice@mail.com | Laptop | 1200 | 1 |
| 2 | Alice | alice@mail.com | Mouse | 25 | 2 |
| 3 | Bob | bob@mail.com | Laptop | 1200 | 1 |
| 4 | Alice | alice_new@mail.com | Keyboard | 75 | 1 |

### 문제점 (이상 현상)

**갱신 이상**: Alice의 이메일이 여러 행에 나타납니다. 이메일이 바뀌면 모든 행을 업데이트해야 하며 — 4번 행은 이미 일관성 없이 업데이트되었습니다.

**삽입 이상**: 주문 없이 새 고객을 추가할 수 없습니다. 고객 정보를 독립적으로 저장할 곳이 없습니다.

**삭제 이상**: Bob의 유일한 주문(3번 행)을 삭제하면, Bob에 대한 모든 정보를 잃습니다.

**데이터 중복**: `customer_name`과 `customer_email`이 해당 고객의 모든 주문에 반복됩니다. `product`와 `price`는 해당 상품이 주문될 때마다 반복됩니다.

정규화는 각 "사실"에 정확히 하나의 위치를 부여하여 이러한 문제를 제거합니다.

---

## 사전 지식: 함수적 종속성

**함수적 종속성**(FD)은 컬럼 간의 관계를 설명합니다: 컬럼 A가 컬럼 B를 결정하면, **A → B** ("A가 B를 함수적으로 결정한다")라고 씁니다.

`A → B`가 주어지면: A의 값이 같은 임의의 두 행에서, B의 값도 같아야 합니다.

위 테이블의 예시:
- `order_id → customer_name, customer_email, product, price, qty` (order_id가 모든 것을 유일하게 결정)
- `customer_name → customer_email` (각 고객은 하나의 이메일을 가짐)
- `product → price` (각 상품은 하나의 가격을 가짐)

**후보 키**: 다른 모든 컬럼을 유일하게 결정하는 최소한의 컬럼 집합. 여기서 `order_id`가 후보 키(이자 기본 키)입니다.

---

## 제1정규형 (1NF)

**규칙**: 모든 컬럼은 **원자적**(분할 불가능) 값을 가져야 합니다. 반복 그룹이나 배열 없음.

### 위반

| student_id | name | courses |
|---|---|---|
| 1 | Alice | Math, Physics, CS |
| 2 | Bob | Chemistry, Biology |

`courses`가 여러 값을 포함 — 원자적이지 않음.

### 수정: 1NF

**옵션 A** — 행 분리:

| student_id | name | course |
|---|---|---|
| 1 | Alice | Math |
| 1 | Alice | Physics |
| 1 | Alice | CS |
| 2 | Bob | Chemistry |
| 2 | Bob | Biology |

**옵션 B** — 별도 테이블:

**students**

| student_id | name |
|---|---|
| 1 | Alice |
| 2 | Bob |

**student_courses**

| student_id | course |
|---|---|
| 1 | Math |
| 1 | Physics |
| 1 | CS |
| 2 | Chemistry |
| 2 | Biology |

옵션 B가 일반적으로 선호됩니다 — `name`의 중복을 피합니다.

### 1NF 체크리스트

- [ ] 각 컬럼이 원자적 값을 가짐 (리스트, 집합, 중첩 테이블 없음)
- [ ] 각 행이 고유 (기본 키 존재)
- [ ] 컬럼 순서가 중요하지 않음
- [ ] 컬럼의 모든 항목이 같은 데이터 타입

---

## 제2정규형 (2NF)

**규칙**: 1NF이면서, 모든 비키 컬럼이 기본 키 **전체**에 종속되어야 합니다 — 일부에만 종속되면 안 됩니다 (**부분 종속성** 없음).

2NF는 기본 키가 **복합**(여러 컬럼)일 때만 의미가 있습니다. 키가 단일 컬럼이면, 1NF가 자동으로 2NF를 만족합니다.

### 위반

복합 키 `(student_id, course_id)`:

| student_id | course_id | student_name | course_name | grade |
|---|---|---|---|---|
| 1 | 101 | Alice | Database | A |
| 1 | 102 | Alice | Networks | B |
| 2 | 101 | Bob | Database | B+ |

함수적 종속성:
- `student_id → student_name` (부분: 키의 일부에만 종속)
- `course_id → course_name` (부분: 키의 일부에만 종속)
- `(student_id, course_id) → grade` (완전: 전체 키에 종속)

`student_name`은 `student_id`에만 종속되지, 전체 키 `(student_id, course_id)`에 종속되지 않습니다. 이것이 **부분 종속성**입니다.

### 수정: 2NF

세 테이블로 분해:

**students**

| student_id | student_name |
|---|---|
| 1 | Alice |
| 2 | Bob |

**courses**

| course_id | course_name |
|---|---|
| 101 | Database |
| 102 | Networks |

**enrollments**

| student_id | course_id | grade |
|---|---|---|
| 1 | 101 | A |
| 1 | 102 | B |
| 2 | 101 | B+ |

이제 모든 비키 속성이 자신의 테이블의 전체 키에 종속됩니다.

### 2NF 체크리스트

- [ ] 1NF임
- [ ] 비키 컬럼이 복합 기본 키의 일부에만 종속되지 않음
- [ ] 기본 키가 단일 컬럼이면 자동으로 2NF 만족

---

## 제3정규형 (3NF)

**규칙**: 2NF이면서, 모든 비키 컬럼이 기본 키에 **직접** 종속되어야 합니다 — 다른 비키 컬럼을 통하지 않아야 합니다 (**이행적 종속성** 없음).

즉: 비키 컬럼이 다른 비키 컬럼을 결정해서는 안 됩니다.

### 위반

| emp_id | emp_name | dept_id | dept_name | dept_location |
|---|---|---|---|---|
| 1 | Alice | 10 | Engineering | Building A |
| 2 | Bob | 20 | Marketing | Building B |
| 3 | Charlie | 10 | Engineering | Building A |

함수적 종속성:
- `emp_id → emp_name, dept_id, dept_name, dept_location`
- `dept_id → dept_name, dept_location`

체인: `emp_id → dept_id → dept_name, dept_location`

`dept_name`과 `dept_location`은 `dept_id`를 통해 `emp_id`에 **이행적으로** 종속됩니다. 이것이 **이행적 종속성**입니다.

### 수정: 3NF

**employees**

| emp_id | emp_name | dept_id |
|---|---|---|
| 1 | Alice | 10 |
| 2 | Bob | 20 |
| 3 | Charlie | 10 |

**departments**

| dept_id | dept_name | dept_location |
|---|---|---|
| 10 | Engineering | Building A |
| 20 | Marketing | Building B |

이제 `dept_name`과 `dept_location`은 `emp_id`를 통해 이행적으로가 아닌, 자기 테이블의 키(`dept_id`)에 직접 종속됩니다.

### 3NF 체크리스트

- [ ] 2NF임
- [ ] 비키 컬럼이 다른 비키 컬럼에 종속되지 않음 (이행적 종속성 없음)
- [ ] 모든 비키 컬럼이 기본 키에만 직접 종속

---

## 보이스-코드 정규형 (BCNF)

**규칙**: 3NF이면서, 모든 함수적 종속성 `A → B`에서 A가 **슈퍼키**(후보 키 또는 그 상위 집합)여야 합니다.

BCNF는 3NF의 더 엄격한 버전입니다. 차이는 다음 경우에만 발생합니다:
1. **다중 후보 키**가 있고
2. 후보 키가 **복합적**이고 **겹치는** 경우

### 3NF ≠ BCNF인 경우

| student | subject | professor |
|---|---|---|
| Alice | Database | Dr. Kim |
| Bob | Database | Dr. Kim |
| Alice | Networks | Dr. Park |
| Charlie | Networks | Dr. Lee |

**비즈니스 규칙**:
- 각 교수는 하나의 과목만 담당: `professor → subject`
- 각 학생은 각 과목을 한 번만 수강: `(student, subject)`가 후보 키
- 각 학생은 과목당 한 교수: `(student, subject) → professor`

함수적 종속성:
- `(student, subject) → professor` ← `(student, subject)`는 슈퍼키 ✅
- `professor → subject` ← `professor`는 슈퍼키가 **아님** ❌ BCNF 위반

`professor → subject`가 BCNF를 위반합니다. `professor`만으로는 후보 키가 아니기 때문입니다.

### 수정: BCNF

**professor_subjects**

| professor | subject |
|---|---|
| Dr. Kim | Database |
| Dr. Park | Networks |
| Dr. Lee | Networks |

**student_professors**

| student | professor |
|---|---|
| Alice | Dr. Kim |
| Bob | Dr. Kim |
| Alice | Dr. Park |
| Charlie | Dr. Lee |

이제 모든 결정자가 자기 테이블에서 슈퍼키입니다.

### BCNF vs 3NF 트레이드오프

BCNF 분해는 때때로 특정 종속성을 직접 강제할 수 있는 **능력을 잃을** 수 있습니다. 위 예제에서 "각 학생은 각 과목을 한 번만 수강"이라는 제약은 두 테이블을 조인하지 않고는 강제하기 어렵습니다.

실무에서는 대부분의 3NF 설계가 이미 BCNF입니다. BCNF 엣지 케이스는 비교적 드뭅니다.

---

## 정규형 요약

| 정규형 | 규칙 | 제거 대상 |
|---|---|---|
| **1NF** | 원자적 값, 고유 행 | 반복 그룹 |
| **2NF** | 부분 종속성 없음 | 부분 종속성 (복합 키 문제) |
| **3NF** | 이행적 종속성 없음 | 이행적 종속성 |
| **BCNF** | 모든 결정자가 슈퍼키 | 비-슈퍼키 결정자 |

각 단계는 이전을 기반으로 합니다:

```
비정규형 → 1NF → 2NF → 3NF → BCNF
```

---

## 정규화 과정: 종합 예제

시작 테이블:

| order_id | date | cust_id | cust_name | cust_email | product_id | product_name | price | qty |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-01-15 | 100 | Alice | a@m.com | P1 | Laptop | 1200 | 1 |
| 1 | 2026-01-15 | 100 | Alice | a@m.com | P2 | Mouse | 25 | 2 |
| 2 | 2026-01-16 | 101 | Bob | b@m.com | P1 | Laptop | 1200 | 1 |

### 1단계: 1NF

이미 1NF — 모든 값이 원자적이고 행이 고유 (복합 키 `(order_id, product_id)`).

### 2단계: 2NF

복합 키 `(order_id, product_id)`에 대한 부분 종속성:
- `order_id → date, cust_id, cust_name, cust_email` (부분)
- `product_id → product_name, price` (부분)
- `(order_id, product_id) → qty` (완전)

분해:

**orders**: `(order_id, date, cust_id, cust_name, cust_email)`

**products**: `(product_id, product_name, price)`

**order_items**: `(order_id, product_id, qty)`

### 3단계: 3NF

`orders`에 이행적 종속성:
- `order_id → cust_id → cust_name, cust_email`

추가 분해:

**orders**: `(order_id, date, cust_id)`

**customers**: `(cust_id, cust_name, cust_email)`

**products**: `(product_id, product_name, price)`

**order_items**: `(order_id, product_id, qty)`

### 최종 스키마

```sql
CREATE TABLE customers (
    cust_id    INT PRIMARY KEY,
    cust_name  VARCHAR(100) NOT NULL,
    cust_email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
    product_id   VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    price        DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
    order_id   INT PRIMARY KEY,
    order_date DATE NOT NULL,
    cust_id    INT NOT NULL REFERENCES customers(cust_id)
);

CREATE TABLE order_items (
    order_id   INT NOT NULL REFERENCES orders(order_id),
    product_id VARCHAR(10) NOT NULL REFERENCES products(product_id),
    qty        INT NOT NULL CHECK (qty > 0),
    PRIMARY KEY (order_id, product_id)
);
```

---

## 반정규화 (Denormalization)

때때로 성능을 위해 **의도적으로** 정규화를 위반합니다. 이것을 **반정규화**라고 합니다.

### 반정규화 시점

- **읽기 비중이 높은 워크로드**: 매번 비싼 JOIN을 피할 때
- **보고/분석**: 집계를 사전 계산
- **자주 접근하는 데이터 캐싱**: 계산된 또는 조인된 값 저장
- **트래픽이 높은 쿼리**: 쿼리 복잡도 감소

### 일반적인 반정규화 패턴

```sql
-- 매번 계산 대신 합계를 저장
ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2);

-- JOIN을 피하기 위해 중복 컬럼 저장
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100);
-- 이제 쿼리가 customers 테이블을 JOIN할 필요 없음
```

### 트레이드오프

| 정규화 | 반정규화 |
|---|---|
| 저장 공간 적음 | 저장 공간 많음 |
| 중복 없음 | 통제된 중복 |
| 느린 읽기 (JOIN) | 빠른 읽기 |
| 빠른 쓰기 | 느린 쓰기 (중복 데이터 업데이트) |
| 데이터 무결성 보장 | 일관성 수동 유지 필요 |

**경험 법칙**: 설계 시 먼저 정규화하세요. 정규화가 야기하는 성능 문제를 측정한 후에만 반정규화하세요.

---

## 빠른 참조

| 정규형 | 핵심 질문 |
|---|---|
| **1NF** | 모든 값이 원자적인가? |
| **2NF** | 모든 비키 컬럼이 *전체* 키에 종속되는가? |
| **3NF** | 모든 비키 컬럼이 키에 *직접* 종속되는가 (다른 비키를 통하지 않고)? |
| **BCNF** | 모든 결정자가 슈퍼키인가? |

```
1NF: 반복 그룹 없음
2NF: 1NF + 부분 종속성 없음
3NF: 2NF + 이행적 종속성 없음
BCNF: 3NF + 모든 결정자가 슈퍼키
```
