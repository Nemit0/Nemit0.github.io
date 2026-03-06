---
title: "SQL 서브쿼리: 스칼라, 행, 테이블, 상관 서브쿼리"
description: "SQL 서브쿼리 심층 분석 — 스칼라, 단일행, 다중행, 상관 서브쿼리, EXISTS, IN vs EXISTS 성능 비교, 서브쿼리 vs JOIN 사용 시점."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "서브쿼리", "상관 서브쿼리", "EXISTS", "IN", "중첩 쿼리", "데이터베이스"]
author: "Nemit"
featured: false
pinned: false
---

# SQL 서브쿼리: 스칼라, 행, 테이블, 상관 서브쿼리

**서브쿼리**(중첩 쿼리 또는 내부 쿼리라고도 함)는 다른 SQL 문 안에 포함된 `SELECT` 문입니다. `SELECT`, `FROM`, `WHERE`, `HAVING` 절에 나타날 수 있으며, 단일 쿼리로 복잡한 로직을 표현하기 위한 가장 강력한 도구 중 하나입니다.

---

## 서브쿼리 기초

서브쿼리는 괄호로 감싸지며, 외부 쿼리 **이전에** 실행됩니다 (상관 서브쿼리 제외 — 외부 행당 한 번씩 실행).

```sql
-- 회사 평균보다 많이 버는 직원 찾기
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

내부 쿼리 `(SELECT AVG(salary) FROM employees)`가 먼저 실행되어 단일 값(예: 65000)을 반환하고, 외부 쿼리는 다음과 같이 됩니다:

```sql
SELECT name, salary FROM employees WHERE salary > 65000;
```

---

## 서브쿼리 유형

### 1. 스칼라 서브쿼리

**정확히 하나의 값** (1행 1열)을 반환합니다. 단일 값이 기대되는 어디서든 사용 가능합니다.

```sql
-- SELECT에서
SELECT
    name,
    salary,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;

-- WHERE에서
SELECT name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);

-- HAVING에서
SELECT department_id, AVG(salary) AS avg_sal
FROM employees
GROUP BY department_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);
```

**스칼라 서브쿼리가 둘 이상의 행을 반환하면 에러가 발생합니다.** `LIMIT 1`이나 집계 함수를 사용하여 단일 값을 보장하세요.

### 2. 단일행 서브쿼리

하나 이상의 컬럼을 가진 한 행을 반환합니다. `=`, `>`, `<`, `>=`, `<=`, `<>`와 함께 사용됩니다.

```sql
-- 'Alice'와 같은 부서의 직원 찾기
SELECT name, dept_id
FROM employees
WHERE dept_id = (
    SELECT dept_id FROM employees WHERE name = 'Alice'
);
```

### 3. 다중행 서브쿼리

여러 행을 반환합니다. `IN`, `ANY`, `ALL`, `EXISTS`와 함께 사용됩니다.

```sql
-- 'New York'에 위치한 부서의 직원
SELECT name, dept_id
FROM employees
WHERE dept_id IN (
    SELECT dept_id FROM departments WHERE location = 'New York'
);
```

### 4. 다중 컬럼 서브쿼리

여러 컬럼을 반환합니다. 행 생성자와 함께 사용:

```sql
-- (dept_id, job_title)이 매니저의 것과 일치하는 직원 찾기
SELECT name, dept_id, job_title
FROM employees
WHERE (dept_id, job_title) IN (
    SELECT dept_id, job_title FROM managers
);
```

### 5. 테이블 서브쿼리 (파생 테이블)

`FROM` 절의 서브쿼리입니다. 외부 쿼리가 테이블처럼 취급하는 임시 결과 셋을 생성합니다.

```sql
-- 각 부서의 최고 연봉자
SELECT sub.dept_name, sub.name, sub.salary
FROM (
    SELECT
        d.dept_name,
        e.name,
        e.salary,
        ROW_NUMBER() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS rn
    FROM employees e
    JOIN departments d ON e.dept_id = d.dept_id
) sub
WHERE sub.rn = 1;
```

파생 테이블은 **반드시** 별칭이 있어야 합니다 (이 경우 `sub`).

---

## 상관 서브쿼리

**상관 서브쿼리**는 외부 쿼리의 컬럼을 참조합니다. 일반 서브쿼리가 한 번만 실행되는 것과 달리, 외부 쿼리의 **각 행에 대해 한 번씩** 실행됩니다.

```sql
-- 자기 부서의 평균보다 많이 버는 직원 찾기
SELECT e.name, e.salary, e.dept_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id    -- 외부 쿼리의 e.dept_id 참조
);
```

실행 과정:
1. Alice (부서 10): `dept_id = 10`인 `AVG(salary)` 계산 → 비교
2. Bob (부서 20): `dept_id = 20`인 `AVG(salary)` 계산 → 비교
3. ... 각 행에 대해 반복

### 상관 DELETE

```sql
-- 자기 부서에서 최고 연봉이 아닌 직원 삭제
DELETE FROM employees e
WHERE e.salary < (
    SELECT MAX(e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id
);
```

### 상관 UPDATE

```sql
-- 각 직원의 dept_name을 dept_id 기반으로 설정
UPDATE employees e
SET dept_name = (
    SELECT d.dept_name
    FROM departments d
    WHERE d.dept_id = e.dept_id
);
```

---

## EXISTS와 NOT EXISTS

`EXISTS`는 서브쿼리가 **최소 하나의 행**을 반환하면 `TRUE`를 반환합니다. 반환되는 실제 값은 신경 쓰지 않습니다 — 행의 존재 여부만 확인합니다.

```sql
-- 직원이 최소 1명인 부서
SELECT d.dept_name
FROM departments d
WHERE EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.dept_id = d.dept_id
);
```

`SELECT 1`은 관례입니다 — 값은 중요하지 않습니다. `EXISTS`는 행의 존재만 확인합니다.

### NOT EXISTS — 안티 조인 패턴

```sql
-- 직원이 없는 부서
SELECT d.dept_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.dept_id = d.dept_id
);
```

이것은 `LEFT JOIN ... WHERE ... IS NULL`의 상관 서브쿼리 등가물입니다.

---

## IN vs EXISTS

둘 다 같은 로직을 표현할 수 있지만, 성능 특성이 다릅니다:

### IN

```sql
SELECT name FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE location = 'NY');
```

- 서브쿼리가 **한 번** 실행되어 값 리스트를 생성
- 외부 쿼리가 이 리스트에 대해 각 행을 확인
- 서브쿼리 결과 셋이 **작을 때** 유리
- **NULL 함정**: 리스트에 `NULL`이 있으면 예상치 못한 결과 발생 가능

### EXISTS

```sql
SELECT name FROM employees e
WHERE EXISTS (
    SELECT 1 FROM departments d
    WHERE d.dept_id = e.dept_id AND d.location = 'NY'
);
```

- 서브쿼리가 **외부 행당 한 번** 실행 (상관)
- 일치하는 것을 찾자마자 중단 (단락 평가)
- 외부 테이블이 **작고** 내부 테이블이 **크고 인덱스가 있을 때** 유리
- NULL을 올바르게 처리

### IN에서의 NULL 동작

```sql
-- 서브쿼리가 (10, 20, NULL)을 반환한다고 가정

SELECT * FROM employees WHERE dept_id IN (10, 20, NULL);
-- dept_id가 10이나 20인 직원 반환
-- dept_id가 NULL인 직원은 반환하지 않음 (NULL IN (...) → UNKNOWN)

SELECT * FROM employees WHERE dept_id NOT IN (10, 20, NULL);
-- 아무것도 반환하지 않음! 이유:
-- dept_id = 30 → NOT (30=10 OR 30=20 OR 30=NULL)
--              → NOT (FALSE OR FALSE OR UNKNOWN)
--              → NOT UNKNOWN → UNKNOWN
-- 어떤 행도 필터를 통과하지 못함
```

**규칙**: 서브쿼리가 `NULL`을 반환할 수 있으면, `NOT IN`보다 `NOT EXISTS`를 사용하세요.

---

## 다양한 절에서의 서브쿼리

### SELECT에서 (스칼라)

```sql
SELECT
    e.name,
    e.salary,
    (SELECT COUNT(*) FROM employees e2 WHERE e2.dept_id = e.dept_id) AS dept_size
FROM employees e;
```

### FROM에서 (파생 테이블)

```sql
SELECT dept_id, avg_salary
FROM (
    SELECT dept_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY dept_id
) dept_stats
WHERE avg_salary > 70000;
```

### WHERE에서

```sql
SELECT name FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 30);
-- 부서 30의 가장 높은 급여보다 높은 급여
```

### HAVING에서

```sql
SELECT dept_id, AVG(salary)
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > (
    SELECT AVG(dept_count) FROM (
        SELECT COUNT(*) AS dept_count FROM employees GROUP BY dept_id
    ) sub
);
```

---

## ANY와 ALL

### ANY (SOME)

서브쿼리가 반환한 값 중 **하나 이상**에 대해 비교가 참이면 `TRUE`를 반환합니다.

```sql
-- 부서 10의 누군가보다 많이 버는 직원
SELECT name, salary
FROM employees
WHERE salary > ANY (SELECT salary FROM employees WHERE dept_id = 10);
-- 동등: salary > MIN(부서 10의 salary)
```

### ALL

서브쿼리가 반환한 **모든** 값에 대해 비교가 참이면 `TRUE`를 반환합니다.

```sql
-- 부서 10의 모든 사람보다 많이 버는 직원
SELECT name, salary
FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 10);
-- 동등: salary > MAX(부서 10의 salary)
```

| 연산자 | 의미 |
|---|---|
| `> ANY` | 최솟값보다 큼 |
| `> ALL` | 최댓값보다 큼 |
| `< ANY` | 최댓값보다 작음 |
| `< ALL` | 최솟값보다 작음 |
| `= ANY` | `IN`과 동일 |

---

## 서브쿼리 vs JOIN

많은 서브쿼리는 JOIN으로, 그리고 그 반대로 다시 쓸 수 있습니다.

```sql
-- 서브쿼리 방식
SELECT name FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE location = 'NY');

-- JOIN 방식
SELECT DISTINCT e.name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE d.location = 'NY';
```

### 서브쿼리를 사용할 때

- **집계 로직**: `WHERE salary > (SELECT AVG(salary) ...)`
- **존재 확인**: `WHERE EXISTS (...)`
- **가독성**: 일부 쿼리는 서브쿼리로 더 자연스럽게 읽힘
- **NOT IN / NOT EXISTS** 패턴

### JOIN을 사용할 때

- **두 테이블의 컬럼을 반환**할 때
- 하나의 쿼리에서 **여러 관계**를 다룰 때
- **성능**: JOIN이 상관 서브쿼리보다 더 잘 최적화되는 경우가 많음

### 성능 비교

```sql
-- 상관 서브쿼리: N번 실행 (외부 행당 한 번)
SELECT e.name, (SELECT d.dept_name FROM departments d WHERE d.dept_id = e.dept_id)
FROM employees e;

-- JOIN: 최적화된 알고리즘으로 한 번 실행
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id;
```

JOIN 버전이 보통 더 빠릅니다 — 옵티마이저가 해시 조인이나 머지 조인을 선택할 수 있기 때문입니다. 상관 서브쿼리는 각 행에 대해 내부 쿼리를 실행해야 합니다.

---

## CTE(Common Table Expression) — 서브쿼리의 대안

CTE는 특히 같은 서브쿼리를 여러 번 참조할 때 더 깔끔한 작성 방법을 제공합니다.

```sql
-- CTE 없이 (반복 서브쿼리)
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary - (SELECT AVG(salary) FROM employees) DESC;

-- CTE 사용 (더 깔끔, 한 번만 계산)
WITH avg_sal AS (
    SELECT AVG(salary) AS val FROM employees
)
SELECT e.name, e.salary
FROM employees e, avg_sal
WHERE e.salary > avg_sal.val
ORDER BY e.salary - avg_sal.val DESC;
```

### 재귀 CTE (고급)

조직도 같은 계층적 데이터에 활용:

```sql
WITH RECURSIVE org_tree AS (
    -- 기본 케이스: 최상위 직원 (매니저 없음)
    SELECT emp_id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- 재귀 케이스: 트리에 있는 누군가에게 보고하는 직원
    SELECT e.emp_id, e.name, e.manager_id, t.level + 1
    FROM employees e
    JOIN org_tree t ON e.manager_id = t.emp_id
)
SELECT * FROM org_tree ORDER BY level, name;
```

---

## 빠른 참조

| 서브쿼리 유형 | 반환 | 사용 대상 |
|---|---|---|
| 스칼라 | 1개 값 | `=`, `>`, `<`, `SELECT`에서 |
| 단일행 | 1행 | `=`, `>`, `<` |
| 다중행 | 여러 행 | `IN`, `ANY`, `ALL`, `EXISTS` |
| 다중 컬럼 | 여러 컬럼 | 행 생성자와 `IN` |
| 파생 테이블 | 결과 셋 | `FROM` 절 |
| 상관 | 외부 행에 의존 | 모든 절 (행당 실행) |

```sql
-- 서브쿼리 템플릿
SELECT columns
FROM table
WHERE column OPERATOR (
    SELECT column FROM table WHERE condition
);
```
