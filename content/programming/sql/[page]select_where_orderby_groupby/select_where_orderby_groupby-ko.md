---
title: "SQL 기초: SELECT, WHERE, ORDER BY, GROUP BY"
description: "SQL의 핵심 절(clause)인 SELECT(투영), WHERE(필터링), ORDER BY(정렬), GROUP BY(집계)에 대한 심층 가이드 — 실무 예제와 엣지 케이스 포함."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "SELECT", "WHERE", "ORDER BY", "GROUP BY", "HAVING", "집계", "데이터베이스"]
author: "Nemit"
featured: false
pinned: false
---

# SQL 기초: SELECT, WHERE, ORDER BY, GROUP BY

SQL(Structured Query Language)은 관계형 데이터베이스와 상호작용하기 위한 표준 언어입니다. 모든 쿼리는 핵심 절(clause) 몇 가지를 중심으로 구성됩니다. 이 네 가지를 마스터하면 나머지 모든 것의 기반을 갖추게 됩니다.

---

## 논리적 실행 순서

SQL은 작성 순서대로 실행되지 **않습니다**. 논리적 처리 순서는 다음과 같습니다:

```
1. FROM        — 테이블 식별
2. WHERE       — 행 필터링
3. GROUP BY    — 행 그룹화
4. HAVING      — 그룹 필터링
5. SELECT      — 컬럼 선택 / 표현식 계산
6. ORDER BY    — 결과 정렬
7. LIMIT       — 반환 행 수 제한
```

이것이 중요한 이유: `SELECT`에서 정의한 컬럼 별칭(alias)을 `WHERE` 절에서 참조할 수 없습니다 — `WHERE`가 `SELECT`보다 먼저 실행되기 때문입니다.

---

## SELECT — 투영(Projection)

`SELECT`는 결과에 **어떤 컬럼이 나타날지**를 결정합니다.

```sql
-- 모든 컬럼
SELECT * FROM employees;

-- 특정 컬럼
SELECT first_name, last_name, salary FROM employees;

-- 표현식과 별칭
SELECT
    first_name,
    last_name,
    salary * 12 AS annual_salary
FROM employees;
```

### DISTINCT — 중복 제거

```sql
SELECT DISTINCT department_id FROM employees;
```

`DISTINCT`는 **전체 행**에 적용됩니다. 여러 컬럼을 선택하면, 선택된 *모든* 컬럼이 동일한 행만 제거합니다.

```sql
-- 부서와 직함의 고유한 조합
SELECT DISTINCT department_id, job_title FROM employees;
```

### SELECT에서의 표현식과 함수

```sql
SELECT
    first_name || ' ' || last_name AS full_name,        -- 문자열 연결 (PostgreSQL)
    CONCAT(first_name, ' ', last_name) AS full_name2,    -- CONCAT은 대부분의 RDBMS에서 동작
    UPPER(last_name) AS upper_last,
    ROUND(salary / 12, 2) AS monthly_salary,
    COALESCE(commission, 0) AS commission_safe            -- NULL 처리
FROM employees;
```

---

## WHERE — 행 필터링

`WHERE`는 그룹화나 집계 **이전에** 행을 필터링합니다.

### 비교 연산자

```sql
SELECT * FROM employees WHERE salary > 50000;
SELECT * FROM employees WHERE department_id = 10;
SELECT * FROM employees WHERE hire_date >= '2024-01-01';
SELECT * FROM employees WHERE last_name != 'Smith';   -- 또는 <>
```

### 논리 연산자

```sql
-- AND: 두 조건 모두 참이어야 함
SELECT * FROM employees
WHERE department_id = 10 AND salary > 60000;

-- OR: 하나 이상의 조건이 참이면 됨
SELECT * FROM employees
WHERE department_id = 10 OR department_id = 20;

-- NOT: 조건을 부정
SELECT * FROM employees
WHERE NOT department_id = 10;
```

**연산자 우선순위**: `NOT` > `AND` > `OR`. 괄호를 사용하여 의도를 명확하게 하세요:

```sql
-- 괄호 없이: AND가 OR보다 우선
SELECT * FROM employees
WHERE department_id = 10 OR department_id = 20 AND salary > 60000;
-- 평가: dept=10 OR (dept=20 AND salary>60000)

-- 괄호 사용: 명시적 의도
SELECT * FROM employees
WHERE (department_id = 10 OR department_id = 20) AND salary > 60000;
```

### IN, BETWEEN, LIKE

```sql
-- IN: 리스트의 값 중 하나와 일치
SELECT * FROM employees WHERE department_id IN (10, 20, 30);

-- BETWEEN: 범위 (양쪽 포함)
SELECT * FROM employees WHERE salary BETWEEN 40000 AND 80000;
-- 동일: salary >= 40000 AND salary <= 80000

-- LIKE: 패턴 매칭
SELECT * FROM employees WHERE last_name LIKE 'S%';     -- S로 시작
SELECT * FROM employees WHERE last_name LIKE '%son';    -- son으로 끝남
SELECT * FROM employees WHERE last_name LIKE '_a%';     -- 두 번째 글자가 'a'
SELECT * FROM employees WHERE email LIKE '%@gmail.com';
```

| 와일드카드 | 의미 |
|---|---|
| `%` | 0개 이상의 문자 |
| `_` | 정확히 1개의 문자 |

### NULL 처리

`NULL`은 값이 아닙니다 — 값의 **부재**를 나타냅니다. `NULL`과 `=` 또는 `!=`를 사용할 수 없습니다.

```sql
-- 잘못됨: commission이 NULL이어도 행이 반환되지 않음
SELECT * FROM employees WHERE commission = NULL;

-- 올바름
SELECT * FROM employees WHERE commission IS NULL;
SELECT * FROM employees WHERE commission IS NOT NULL;
```

이유: `NULL`과의 모든 비교는 `UNKNOWN`을 반환하고(`TRUE`나 `FALSE`가 아님), `WHERE`는 `TRUE`로 평가되는 행만 유지합니다.

---

## ORDER BY — 결과 정렬

```sql
-- 오름차순 (기본값)
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees ORDER BY salary ASC;

-- 내림차순
SELECT * FROM employees ORDER BY salary DESC;

-- 다중 컬럼: 부서별로 먼저 정렬, 각 부서 내에서 급여로 정렬
SELECT * FROM employees ORDER BY department_id ASC, salary DESC;
```

### 별칭 또는 위치로 정렬

```sql
-- 별칭으로 (ORDER BY는 SELECT 이후에 실행되므로 가능)
SELECT first_name, salary * 12 AS annual_salary
FROM employees
ORDER BY annual_salary DESC;

-- 컬럼 위치로 (1부터 시작)
SELECT first_name, last_name, salary
FROM employees
ORDER BY 3 DESC;   -- salary(3번째 컬럼)로 정렬
```

위치 기반 정렬은 취약합니다 — 프로덕션 코드에서는 피하세요. 컬럼이 추가되면 번호가 바뀝니다.

### NULL 정렬 순서

RDBMS마다 NULL 정렬 순서가 다릅니다:

| RDBMS | NULL 정렬 위치... |
|---|---|
| PostgreSQL | ASC에서 마지막, DESC에서 처음 |
| MySQL | ASC에서 처음, DESC에서 마지막 |
| Oracle | ASC에서 마지막, DESC에서 처음 |
| SQL Server | ASC에서 처음, DESC에서 마지막 |

PostgreSQL과 Oracle은 명시적 제어를 지원합니다:

```sql
SELECT * FROM employees ORDER BY commission ASC NULLS LAST;
SELECT * FROM employees ORDER BY commission DESC NULLS FIRST;
```

---

## GROUP BY — 집계

`GROUP BY`는 하나 이상의 컬럼을 기준으로 행을 **그룹**으로 축소합니다. 그런 다음 각 그룹에 **집계 함수**를 적용합니다.

### 집계 함수

| 함수 | 설명 |
|---|---|
| `COUNT(*)` | 그룹 내 행 수 |
| `COUNT(column)` | NULL이 아닌 값의 수 |
| `COUNT(DISTINCT column)` | 고유한 NULL이 아닌 값의 수 |
| `SUM(column)` | 값의 합계 |
| `AVG(column)` | 값의 평균 |
| `MIN(column)` | 최솟값 |
| `MAX(column)` | 최댓값 |

### 기본 그룹화

```sql
-- 부서별 평균 급여
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id;

-- 부서별 직원 수
SELECT department_id, COUNT(*) AS headcount
FROM employees
GROUP BY department_id;

-- 다중 집계
SELECT
    department_id,
    COUNT(*) AS headcount,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS total_salary
FROM employees
GROUP BY department_id;
```

### SELECT 규칙

`GROUP BY`를 사용할 때, `SELECT`의 모든 컬럼은 다음 중 하나여야 합니다:
1. `GROUP BY`에 포함되었거나
2. 집계 함수 안에 있거나

```sql
-- 유효
SELECT department_id, AVG(salary) FROM employees GROUP BY department_id;

-- 무효 (first_name이 그룹화되거나 집계되지 않음)
SELECT department_id, first_name, AVG(salary) FROM employees GROUP BY department_id;
-- 에러: "first_name" 컬럼은 GROUP BY 절에 나타나거나
-- 집계 함수에서 사용되어야 합니다
```

### 다중 컬럼 그룹화

```sql
SELECT department_id, job_title, COUNT(*) AS headcount
FROM employees
GROUP BY department_id, job_title
ORDER BY department_id, headcount DESC;
```

이것은 각 고유한 `(department_id, job_title)` 조합에 대해 그룹을 생성합니다.

---

## HAVING — 집계 후 필터링

`WHERE`는 그룹화 **이전에** 행을 필터링합니다. `HAVING`은 집계 **이후에** 그룹을 필터링합니다.

```sql
-- 평균 급여가 70,000 이상인 부서
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 70000;

-- 직원이 5명 이상인 부서
SELECT department_id, COUNT(*) AS headcount
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 5;
```

### WHERE vs HAVING

```sql
-- WHERE는 그룹화 전에 행을 필터링
-- HAVING은 집계 후에 그룹을 필터링
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
WHERE hire_date >= '2023-01-01'       -- 최근 입사자만
GROUP BY department_id
HAVING AVG(salary) > 60000            -- 평균 급여가 높은 부서만
ORDER BY avg_salary DESC;
```

| 절 | 필터 대상 | 실행 시점 | 집계 함수 사용 가능? |
|---|---|---|---|
| `WHERE` | 개별 행 | `GROUP BY` 이전 | 아니오 |
| `HAVING` | 그룹 | `GROUP BY` 이후 | 예 |

**성능 팁**: 가능하면 항상 `HAVING`보다 `WHERE`를 사용하세요. 행을 미리 필터링하면 `GROUP BY`가 처리해야 할 데이터가 줄어듭니다.

---

## 종합 예제

네 가지 절을 모두 사용하는 실무 쿼리:

```sql
-- 인원수 기준 상위 5개 부서,
-- 2022년 이후 입사한 활동 중인 직원만 집계,
-- 10명 이상인 부서만 포함
SELECT
    d.department_name,
    COUNT(*) AS headcount,
    ROUND(AVG(e.salary), 2) AS avg_salary,
    MIN(e.salary) AS min_salary,
    MAX(e.salary) AS max_salary
FROM employees e
JOIN departments d ON e.department_id = d.department_id
WHERE e.status = 'active'
  AND e.hire_date >= '2022-01-01'
GROUP BY d.department_name
HAVING COUNT(*) >= 10
ORDER BY headcount DESC
LIMIT 5;
```

실행 순서:
1. **FROM** + **JOIN** — `employees`와 `departments` 결합
2. **WHERE** — 2022년 이후 입사한 활동 중인 직원만 유지
3. **GROUP BY** — 부서명으로 그룹화
4. **HAVING** — 10명 이상인 부서만 유지
5. **SELECT** — 집계 계산 및 컬럼 투영
6. **ORDER BY** — 인원수 내림차순 정렬
7. **LIMIT** — 상위 5개 반환

---

## 흔한 실수

### 1. WHERE에서 집계 함수 사용

```sql
-- 잘못됨
SELECT department_id, COUNT(*)
FROM employees
WHERE COUNT(*) > 5        -- WHERE에서 집계 함수 → 에러
GROUP BY department_id;

-- 올바름: HAVING 사용
SELECT department_id, COUNT(*)
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 5;
```

### 2. WHERE에서 별칭 참조

```sql
-- 잘못됨 (WHERE는 SELECT 이전에 실행)
SELECT salary * 12 AS annual_salary
FROM employees
WHERE annual_salary > 100000;

-- 올바름: 표현식을 반복
SELECT salary * 12 AS annual_salary
FROM employees
WHERE salary * 12 > 100000;

-- 또는 서브쿼리 사용
SELECT * FROM (
    SELECT *, salary * 12 AS annual_salary FROM employees
) sub
WHERE annual_salary > 100000;
```

### 3. GROUP BY와 NULL

`GROUP BY`는 모든 `NULL` 값을 **같은 그룹**으로 취급합니다:

```sql
SELECT department_id, COUNT(*) 
FROM employees 
GROUP BY department_id;
-- department_id가 NULL인 직원이 있으면,
-- 모두 department_id = NULL인 하나의 그룹에 나타남
```

### 4. COUNT(*) vs COUNT(column)

```sql
-- COUNT(*)는 NULL 값이 있는 행을 포함하여 모든 행을 셈
-- COUNT(column)은 해당 컬럼에서 NULL이 아닌 값만 셈

SELECT
    COUNT(*) AS total_rows,              -- 예: 100
    COUNT(commission) AS with_commission  -- 예: 35 (NULL 65개)
FROM employees;
```

---

## 빠른 참조

```sql
SELECT [DISTINCT] columns / expressions
FROM table
[WHERE row_conditions]
[GROUP BY columns]
[HAVING group_conditions]
[ORDER BY columns [ASC|DESC]]
[LIMIT n];
```

| 절 | 목적 | 필수? |
|---|---|---|
| `SELECT` | 반환할 내용 | 예 |
| `FROM` | 소스 테이블 | 예 |
| `WHERE` | 행 필터링 | 아니오 |
| `GROUP BY` | 집계를 위한 행 그룹화 | 아니오 |
| `HAVING` | 그룹 필터링 | 아니오 |
| `ORDER BY` | 결과 정렬 | 아니오 |
| `LIMIT` | 행 수 제한 | 아니오 |
