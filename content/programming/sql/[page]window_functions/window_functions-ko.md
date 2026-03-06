---
title: "윈도우 함수"
description: "SQL 윈도우 함수 심층 분석 — ROW_NUMBER, RANK, DENSE_RANK, NTILE, PARTITION BY, OVER 절, LAG/LEAD, 누적 합계, 이동 평균, 고급 분석 패턴."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "윈도우 함수", "ROW_NUMBER", "RANK", "PARTITION BY", "분석", "데이터베이스"]
author: "Nemit"
featured: false
pinned: false
---

# 윈도우 함수

윈도우 함수는 **현재 행과 관련된 행 집합**에 걸쳐 계산을 수행합니다 — `GROUP BY`처럼 행을 하나의 결과로 축소하지 않습니다. 표준 집계로는 표현하기 매우 어렵거나 불가능한 분석 기능을 제공합니다.

---

## OVER 절

모든 윈도우 함수는 `OVER()` 절을 사용하여 어떤 행에 대해 연산할지를 정의합니다.

```sql
-- 집계 함수: 행을 축소
SELECT department, AVG(salary) FROM employees GROUP BY department;
-- 부서당 1행 반환

-- 윈도우 함수: 모든 행 유지
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER() AS company_avg
FROM employees;
-- 모든 행을 반환하며, 각각 전사 평균 포함
```

### OVER() 구조

```sql
function_name() OVER (
    [PARTITION BY col1, col2, ...]    -- 행을 그룹으로 나눔
    [ORDER BY col3 [ASC|DESC], ...]   -- 각 그룹 내 행 순서 지정
    [frame_clause]                     -- 행 범위 정의
)
```

---

## PARTITION BY

행을 그룹(파티션)으로 나눕니다. 윈도우 함수는 각 파티션마다 초기화됩니다.

```sql
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg,
    salary - AVG(salary) OVER (PARTITION BY department) AS diff_from_avg
FROM employees;
```

| name | department | salary | dept_avg | diff_from_avg |
|---|---|---|---|---|
| Alice | Engineering | 120000 | 100000 | 20000 |
| Bob | Engineering | 80000 | 100000 | -20000 |
| Carol | Marketing | 90000 | 85000 | 5000 |
| Dave | Marketing | 80000 | 85000 | -5000 |

`PARTITION BY` 없이는 윈도우에 **모든 행**이 포함됩니다. `PARTITION BY department`를 사용하면 각 부서가 별도로 처리됩니다.

---

## 순위 함수

### ROW_NUMBER()

각 행에 **고유한 순차 번호**를 부여합니다. 동순위 없음 — 동일한 값도 서로 다른 번호를 받습니다 (동순위 시 순서는 임의).

```sql
SELECT
    name,
    department,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;
```

| name | salary | row_num |
|---|---|---|
| Alice | 120000 | 1 |
| Carol | 90000 | 2 |
| Bob | 80000 | 3 |
| Dave | 80000 | 4 |

### RANK()

`ROW_NUMBER()`와 비슷하지만, **동순위는 같은 순위**를 받습니다. 다음 순위는 동순위 행 수만큼 **건너뜁니다**.

```sql
SELECT
    name,
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rnk
FROM employees;
```

| name | salary | rnk |
|---|---|---|
| Alice | 120000 | 1 |
| Carol | 90000 | 2 |
| Bob | 80000 | 3 |
| Dave | 80000 | 3 |
| Eve | 70000 | **5** |

참고: 두 행이 순위 3을 공유하므로 순위 4가 건너뛰어집니다.

### DENSE_RANK()

`RANK()`와 비슷하지만, **갭이 없습니다**. 동순위 이후의 다음 순위는 다음 연속 숫자입니다.

```sql
SELECT
    name,
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;
```

| name | salary | dense_rnk |
|---|---|---|
| Alice | 120000 | 1 |
| Carol | 90000 | 2 |
| Bob | 80000 | 3 |
| Dave | 80000 | 3 |
| Eve | 70000 | **4** |

### 비교

```
Salary:      120000  90000  80000  80000  70000
ROW_NUMBER:    1       2      3      4      5
RANK:          1       2      3      3      5
DENSE_RANK:    1       2      3      3      4
```

### NTILE(n)

행을 `n`개의 대략 같은 크기의 그룹(버킷)으로 분배합니다.

```sql
SELECT
    name,
    salary,
    NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

백분위수, 사분위수 또는 십분위수로 데이터를 나누는 데 유용합니다.

---

## PARTITION BY와 순위

가장 일반적인 패턴: **그룹 내** 순위 매기기.

```sql
-- 부서별 최고 연봉 상위 3명
SELECT * FROM (
    SELECT
        name,
        department,
        salary,
        ROW_NUMBER() OVER (
            PARTITION BY department
            ORDER BY salary DESC
        ) AS rn
    FROM employees
) ranked
WHERE rn <= 3;
```

```sql
-- 고객별 가장 최근 주문
SELECT * FROM (
    SELECT
        customer_id,
        order_id,
        order_date,
        total,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id
            ORDER BY order_date DESC
        ) AS rn
    FROM orders
) latest
WHERE rn = 1;
```

---

## 오프셋 함수: LAG와 LEAD

셀프 조인 없이 **이전** 또는 **다음** 행의 값에 접근합니다.

### LAG()

```sql
SELECT
    order_date,
    revenue,
    LAG(revenue) OVER (ORDER BY order_date)           AS prev_revenue,
    revenue - LAG(revenue) OVER (ORDER BY order_date)  AS revenue_change
FROM daily_sales;
```

| order_date | revenue | prev_revenue | revenue_change |
|---|---|---|---|
| 2025-01-01 | 1000 | NULL | NULL |
| 2025-01-02 | 1200 | 1000 | 200 |
| 2025-01-03 | 900 | 1200 | -300 |
| 2025-01-04 | 1500 | 900 | 600 |

### LEAD()

```sql
SELECT
    order_date,
    revenue,
    LEAD(revenue) OVER (ORDER BY order_date) AS next_revenue
FROM daily_sales;
```

### 오프셋과 기본값

```sql
-- LAG(컬럼, 오프셋, 기본값)
LAG(revenue, 1, 0)    -- 1행 이전, 이전 행이 없으면 기본값 0
LAG(revenue, 7)       -- 7행 이전 (주 단위 비교)
LEAD(revenue, 1, 0)   -- 1행 이후, 다음 행이 없으면 기본값 0
```

### 실전 예시: 전년 대비 성장률

```sql
SELECT
    year,
    revenue,
    LAG(revenue) OVER (ORDER BY year) AS prev_year_revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY year))
        / LAG(revenue) OVER (ORDER BY year) * 100,
        1
    ) AS yoy_growth_pct
FROM annual_sales;
```

---

## FIRST_VALUE, LAST_VALUE, NTH_VALUE

```sql
SELECT
    name,
    department,
    salary,
    FIRST_VALUE(name) OVER (
        PARTITION BY department ORDER BY salary DESC
    ) AS highest_paid,
    LAST_VALUE(name) OVER (
        PARTITION BY department ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_paid
FROM employees;
```

> **중요**: `LAST_VALUE`는 파티션 끝까지 확장되는 프레임 절이 필요합니다. 기본 프레임(`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`)은 현재 행까지만 포함합니다.

---

## 집계 윈도우 함수

표준 집계 함수는 `OVER()`와 함께 사용하면 윈도우 함수로 작동합니다.

### 누적 합계

```sql
SELECT
    order_date,
    revenue,
    SUM(revenue) OVER (ORDER BY order_date) AS running_total
FROM daily_sales;
```

| order_date | revenue | running_total |
|---|---|---|
| 2025-01-01 | 1000 | 1000 |
| 2025-01-02 | 1200 | 2200 |
| 2025-01-03 | 900 | 3100 |
| 2025-01-04 | 1500 | 4600 |

### 이동 평균 (7일)

```sql
SELECT
    order_date,
    revenue,
    AVG(revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d
FROM daily_sales;
```

### 누적 카운트와 비율

```sql
SELECT
    department,
    name,
    salary,
    COUNT(*) OVER (PARTITION BY department) AS dept_total,
    ROUND(
        salary / SUM(salary) OVER (PARTITION BY department) * 100, 1
    ) AS pct_of_dept_salary
FROM employees;
```

---

## 프레임 절 (Window Frame)

프레임 절은 파티션 내에서 계산에 포함할 **행**을 정의합니다.

### 문법

```sql
{ ROWS | RANGE | GROUPS } BETWEEN
    frame_start AND frame_end
```

### 프레임 경계

| 경계 | 의미 |
|---|---|
| `UNBOUNDED PRECEDING` | 파티션의 첫 행 |
| `n PRECEDING` | 현재 행의 n행 이전 |
| `CURRENT ROW` | 현재 행 |
| `n FOLLOWING` | 현재 행의 n행 이후 |
| `UNBOUNDED FOLLOWING` | 파티션의 마지막 행 |

### 기본 프레임

```sql
-- ORDER BY가 있을 때 기본값:
RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

-- ORDER BY가 없을 때 기본값:
RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
```

### ROWS vs RANGE vs GROUPS

```sql
-- ROWS: 물리적 행
SUM(salary) OVER (ORDER BY hire_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
-- 현재 행 + 이전 2행 포함 (총 3행)

-- RANGE: 논리적 값 범위
SUM(salary) OVER (ORDER BY hire_date RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW)
-- 현재 행의 hire_date 이전 7일 내의 모든 행 포함

-- GROUPS: 동순위 행 그룹
SUM(salary) OVER (ORDER BY hire_date GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
-- 현재 그룹 + 이전 1그룹 + 이후 1그룹 포함
```

---

## 고급 패턴

### 시퀀스의 갭 식별

```sql
SELECT
    id,
    id - ROW_NUMBER() OVER (ORDER BY id) AS grp
FROM existing_ids;
-- 같은 grp 값을 가진 행들이 연속적임
```

### 아일랜드 문제 (연속 날짜 범위)

```sql
WITH numbered AS (
    SELECT
        event_date,
        event_date - (ROW_NUMBER() OVER (ORDER BY event_date) * INTERVAL '1 day') AS grp
    FROM events
)
SELECT
    MIN(event_date) AS island_start,
    MAX(event_date) AS island_end,
    COUNT(*)        AS consecutive_days
FROM numbered
GROUP BY grp;
```

### 백분위 순위와 누적 분포

```sql
SELECT
    name,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary)  AS pct_rank,   -- 0.0 ~ 1.0
    CUME_DIST() OVER (ORDER BY salary)     AS cume_dist    -- 0.0 ~ 1.0
FROM employees;
```

- `PERCENT_RANK()`: `(순위 - 1) / (전체 행 수 - 1)` — 이 행 아래에 몇 퍼센트의 행이 있는지
- `CUME_DIST()`: `같거나 낮은 행 수 / 전체 행 수` — 이 값을 포함하는 비율

---

## 명명된 윈도우

동일한 `OVER()` 절의 반복을 피하기 위해 명명된 윈도우를 정의합니다:

```sql
SELECT
    order_date,
    revenue,
    SUM(revenue) OVER w   AS running_total,
    AVG(revenue) OVER w   AS running_avg,
    COUNT(*)     OVER w   AS running_count
FROM daily_sales
WINDOW w AS (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW);
```

---

## 성능 고려사항

1. **윈도우 함수는 파티션을 스캔** — 큰 파티션은 느림
2. **ORDER BY 컬럼의 인덱스**가 성능에 도움
3. **ROWS가 RANGE보다 빠름** — RANGE는 값을 비교해야 하고, ROWS는 행만 셈
4. **불필요한 PARTITION BY 피하기** — 더 많은 그룹을 처리해야 함
5. **같은 윈도우의 함수를 결합** — 옵티마이저가 한 번의 패스로 계산 가능

```sql
-- 효율적: 같은 윈도우
SELECT
    SUM(x) OVER w,
    AVG(x) OVER w,
    COUNT(x) OVER w
FROM t
WINDOW w AS (ORDER BY id);

-- 덜 효율적: 다른 윈도우 (여러 패스 필요)
SELECT
    SUM(x) OVER (ORDER BY id),
    AVG(x) OVER (ORDER BY date),      -- 다른 ORDER BY
    COUNT(x) OVER (PARTITION BY dept)   -- 다른 파티셔닝
FROM t;
```

---

## 흔한 실수

### 기본 프레임 함정

```sql
-- 놀라운 결과: LAST_VALUE가 실제 마지막 행이 아닌 현재 행을 반환!
LAST_VALUE(name) OVER (PARTITION BY dept ORDER BY salary)
-- 기본 프레임: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

-- 수정: 프레임 확장
LAST_VALUE(name) OVER (
    PARTITION BY dept ORDER BY salary
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
```

### WHERE에서 윈도우 함수

```sql
-- 작동하지 않음:
SELECT * FROM employees
WHERE ROW_NUMBER() OVER (ORDER BY salary DESC) <= 5;
-- ERROR: window functions not allowed in WHERE

-- 해결: 서브쿼리 또는 CTE 사용
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
    FROM employees
) t
WHERE rn <= 5;
```

---

## 빠른 참조

```sql
-- 순위
ROW_NUMBER() OVER (ORDER BY col)               -- 고유 순차
RANK()       OVER (ORDER BY col)               -- 동순위, 갭 있음
DENSE_RANK() OVER (ORDER BY col)               -- 동순위, 갭 없음
NTILE(n)     OVER (ORDER BY col)               -- n개의 버킷

-- 오프셋
LAG(col, offset, default)  OVER (ORDER BY col) -- 이전 행
LEAD(col, offset, default) OVER (ORDER BY col) -- 다음 행
FIRST_VALUE(col) OVER (...)                     -- 프레임 첫 값
LAST_VALUE(col)  OVER (... ROWS BETWEEN ... AND UNBOUNDED FOLLOWING)
NTH_VALUE(col, n) OVER (...)                   -- 프레임 n번째 값

-- 집계
SUM(col)   OVER (...)       -- 윈도우 합계
AVG(col)   OVER (...)       -- 윈도우 평균
COUNT(col) OVER (...)       -- 윈도우 카운트

-- 분포
PERCENT_RANK() OVER (ORDER BY col)  -- 0.0 ~ 1.0
CUME_DIST()    OVER (ORDER BY col)  -- 누적 분포

-- 프레임 절
ROWS BETWEEN n PRECEDING AND m FOLLOWING
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING

-- 명명된 윈도우
SELECT ... OVER w FROM t WINDOW w AS (ORDER BY col);
```
