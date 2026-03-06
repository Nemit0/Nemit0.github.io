---
title: "SQL JOIN: INNER, LEFT, RIGHT, FULL OUTER"
description: "SQL JOIN의 완전한 가이드 — 각 타입의 동작 원리, 사용 시점, 벤 다이어그램 직관, 성능 고려사항, 실무 패턴."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN", "CROSS JOIN", "데이터베이스"]
author: "Nemit"
featured: false
pinned: false
---

# SQL JOIN: INNER, LEFT, RIGHT, FULL OUTER

JOIN은 관련된 컬럼을 기반으로 두 개 이상의 테이블에서 행을 결합합니다. 관계형 데이터베이스를 *관계형*으로 만드는 핵심 메커니즘입니다 — 데이터는 테이블 간에 정규화되고, 쿼리 시점에 재조합됩니다.

---

## 설정: 샘플 테이블

다음 두 테이블을 사용합니다:

**employees**

| emp_id | name | dept_id |
|---|---|---|
| 1 | Alice | 10 |
| 2 | Bob | 20 |
| 3 | Charlie | 10 |
| 4 | Diana | 30 |
| 5 | Eve | NULL |

**departments**

| dept_id | dept_name |
|---|---|
| 10 | Engineering |
| 20 | Marketing |
| 30 | Sales |
| 40 | HR |

주목할 점:
- Eve는 부서가 없음 (`NULL`)
- HR (dept_id 40)에는 직원이 없음

---

## INNER JOIN

조인 조건이 **양쪽** 테이블에서 일치하는 행만 반환합니다.

```sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Alice | Engineering |
| Bob | Marketing |
| Charlie | Engineering |
| Diana | Sales |

Eve는 제외 (일치하는 `dept_id` 없음). HR도 제외 (일치하는 직원 없음).

### 동작 원리

`employees`의 각 행에 대해, 데이터베이스는 ON 조건이 참인 `departments`의 모든 행을 찾습니다. 일치하는 쌍만 살아남습니다.

```
employees       departments       Result
---------       -----------       ------
Alice (10)  ──→ 10 Engineering ──→ Alice, Engineering
Bob (20)    ──→ 20 Marketing   ──→ Bob, Marketing
Charlie (10)──→ 10 Engineering ──→ Charlie, Engineering
Diana (30)  ──→ 30 Sales       ──→ Diana, Sales
Eve (NULL)  ──→ (매치 없음)        (제외)
                40 HR              (제외)
```

### 암묵적 JOIN 문법 (구 스타일)

```sql
-- INNER JOIN과 동일하지만, 가독성이 떨어짐
SELECT e.name, d.dept_name
FROM employees e, departments d
WHERE e.dept_id = d.dept_id;
```

현대 SQL에서는 이 문법을 피하세요. `WHERE`에서 조인 조건과 필터 조건이 섞여 복잡한 쿼리를 이해하기 어렵게 만듭니다.

---

## LEFT JOIN (LEFT OUTER JOIN)

**왼쪽 테이블의 모든 행**과 오른쪽 테이블의 일치하는 행을 반환합니다. 일치하지 않으면 오른쪽 컬럼이 `NULL`이 됩니다.

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Alice | Engineering |
| Bob | Marketing |
| Charlie | Engineering |
| Diana | Sales |
| Eve | NULL |

Eve는 `dept_name`이 `NULL`로 나타남 — 왼쪽 테이블에 있으므로 보존됩니다.

### 활용: 일치하지 않는 행 찾기

일반적인 패턴 — 부서가 없는 직원 찾기:

```sql
SELECT e.name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_id IS NULL;
```

| name |
|---|
| Eve |

이것을 **안티 조인(anti-join)** 패턴이라고 합니다. `LEFT JOIN` + `IS NULL` 조합은 왼쪽 테이블에서 오른쪽 테이블에 일치하지 않는 행을 효율적으로 찾습니다.

---

## RIGHT JOIN (RIGHT OUTER JOIN)

**오른쪽 테이블의 모든 행**과 왼쪽 테이블의 일치하는 행을 반환합니다. 일치하지 않으면 왼쪽 컬럼이 `NULL`이 됩니다.

```sql
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Alice | Engineering |
| Charlie | Engineering |
| Bob | Marketing |
| Diana | Sales |
| NULL | HR |

HR는 `name`이 `NULL`로 나타남 — 직원이 없습니다.

### RIGHT JOIN = 뒤집힌 LEFT JOIN

모든 `RIGHT JOIN`은 테이블 순서를 교환하여 `LEFT JOIN`으로 다시 쓸 수 있습니다:

```sql
-- 이 두 쿼리는 동일:
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;

SELECT e.name, d.dept_name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id;
```

실무에서는 일관성과 가독성을 위해 대부분 `LEFT JOIN`만 사용합니다.

---

## FULL OUTER JOIN

**양쪽 테이블의 모든 행**을 반환합니다. 일치하지 않는 쪽은 `NULL`이 됩니다.

```sql
SELECT e.name, d.dept_name
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Alice | Engineering |
| Bob | Marketing |
| Charlie | Engineering |
| Diana | Sales |
| Eve | NULL |
| NULL | HR |

Eve(부서 없음)와 HR(직원 없음) 모두 나타납니다.

### MySQL 참고

MySQL은 `FULL OUTER JOIN`을 네이티브로 지원하지 않습니다. `UNION`으로 에뮬레이트하세요:

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
UNION
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;
```

`UNION`은 중복을 제거합니다. 중복을 유지하려면 `UNION ALL`을 사용하고 (중복 방지를 위해 `WHERE` 절을 추가하세요).

---

## CROSS JOIN

**데카르트 곱** 반환 — 왼쪽 테이블의 모든 행과 오른쪽 테이블의 모든 행을 짝지음. 조인 조건 없음.

```sql
SELECT e.name, d.dept_name
FROM employees e
CROSS JOIN departments d;
```

직원 5명과 부서 4개로, 5 × 4 = 20행이 생성됩니다.

### CROSS JOIN 사용 시점

- 조합 생성 (예: 모든 제품-색상 조합)
- 날짜 범위나 그리드 생성
- 테스트나 데이터 생성

```sql
-- 보고서용 모든 월-년도 조합 생성
SELECT m.month_name, y.year_val
FROM months m
CROSS JOIN years y;
```

**주의**: 큰 테이블에 대한 크로스 조인은 거대한 결과 셋을 만듭니다. 10,000 × 10,000 크로스 조인은 1억 행을 생성합니다.

---

## SELF JOIN

테이블을 자기 자신과 조인합니다. 계층적 데이터나 동일 테이블 내 행 비교에 유용합니다.

```sql
-- 직원과 그 매니저 찾기 (둘 다 employees 테이블에 있음)
SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;
```

```sql
-- 같은 부서의 직원 쌍 찾기
SELECT
    e1.name AS employee1,
    e2.name AS employee2
FROM employees e1
JOIN employees e2
    ON e1.dept_id = e2.dept_id
    AND e1.emp_id < e2.emp_id;   -- 중복과 자기 쌍 방지
```

`e1.emp_id < e2.emp_id` 조건은 (Alice, Charlie)와 (Charlie, Alice)가 모두 나타나는 것을, 그리고 (Alice, Alice)를 방지합니다.

---

## 다중 JOIN

실제 쿼리는 3개 이상의 테이블을 조인하는 경우가 많습니다:

```sql
SELECT
    e.name,
    d.dept_name,
    p.project_name,
    r.role_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
JOIN project_assignments pa ON e.emp_id = pa.emp_id
JOIN projects p ON pa.project_id = p.project_id
JOIN roles r ON pa.role_id = r.role_id
WHERE d.dept_name = 'Engineering'
ORDER BY p.project_name, e.name;
```

각 JOIN은 결과를 좁히거나 넓힙니다. 한 번에 하나의 관계를 구축하며 데이터셋을 만든다고 생각하세요.

---

## JOIN 조건: ON vs WHERE

```sql
-- LEFT JOIN에서는 다른 결과를 만듦:

-- ON 절: 조인 도중에 필터 적용
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d
    ON e.dept_id = d.dept_id AND d.dept_name = 'Engineering';

-- WHERE 절: 조인 이후에 필터 적용
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'Engineering';
```

`ON` 사용: 모든 직원이 나타남; Engineering만 부서명을 가짐 — 나머지는 `NULL`.

`WHERE` 사용: Engineering의 직원만 나타남 — `WHERE`가 `NULL` 값을 필터링하여 `LEFT JOIN`이 사실상 `INNER JOIN`으로 변환됨.

**규칙**: `INNER JOIN`에서는 `ON`과 `WHERE`가 동일하게 동작합니다. `OUTER JOIN`에서는 다릅니다. 조인 로직은 `ON`에, 필터 로직은 `WHERE`에 넣으세요.

---

## 비등가 조인 (Non-Equi Join)

조인은 `=`만 사용할 필요가 없습니다. 모든 불리언 표현식이 가능합니다:

```sql
-- 직원의 급여가 급여 등급 범위에 해당하는 경우 찾기
SELECT e.name, e.salary, g.grade
FROM employees e
JOIN salary_grades g
    ON e.salary BETWEEN g.min_salary AND g.max_salary;
```

```sql
-- 같은 부서에서 한 직원이 다른 직원보다 더 많이 받는 모든 쌍 찾기
SELECT
    e1.name AS higher_paid,
    e2.name AS lower_paid,
    e1.salary - e2.salary AS difference
FROM employees e1
JOIN employees e2
    ON e1.salary > e2.salary
    AND e1.dept_id = e2.dept_id;
```

---

## NATURAL JOIN과 USING

### NATURAL JOIN

같은 이름의 모든 컬럼을 기준으로 자동 조인:

```sql
SELECT * FROM employees NATURAL JOIN departments;
-- dept_id (공통 컬럼)로 조인
```

**프로덕션에서는 NATURAL JOIN을 피하세요**. 누군가 두 테이블에 같은 이름의 컬럼을 추가하면, 조인 조건이 조용히 변경됩니다.

### USING

조인 컬럼의 이름이 두 테이블에서 같을 때 사용하는 단축 문법:

```sql
-- ON e.dept_id = d.dept_id 대신
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d USING (dept_id);
```

`USING`은 컬럼 이름이 일치할 때 `ON`보다 깔끔합니다. 조인된 컬럼은 결과에 한 번만 나타납니다 (중복 없음).

---

## 성능 고려사항

### 인덱스

JOIN 성능에서 가장 중요한 요소입니다. 조인 컬럼에 인덱스가 있는지 확인하세요:

```sql
-- 다음에 인덱스가 있어야 합니다:
CREATE INDEX idx_emp_dept ON employees(dept_id);
CREATE INDEX idx_dept_id ON departments(dept_id);
```

인덱스 없이는 데이터베이스가 **중첩 루프 스캔**을 해야 합니다 — 각 조인에 대해 O(n × m).

### 조인 알고리즘

데이터베이스는 세 가지 주요 알고리즘을 사용합니다:

| 알고리즘 | 적합한 경우 | 동작 방식 |
|---|---|---|
| **Nested Loop** | 작은 테이블 또는 인덱스 조인 | 외부 테이블의 각 행에 대해 내부 테이블 스캔 |
| **Hash Join** | 정렬되지 않은 큰 테이블, 등가 조인 | 작은 테이블로 해시 테이블 구축, 큰 테이블로 탐색 |
| **Merge Join** | 조인 키로 사전 정렬된 데이터 | 두 정렬된 입력을 동시에 순회 |

옵티마이저는 테이블 통계, 인덱스, 데이터 분포를 기반으로 알고리즘을 선택합니다.

### 행을 미리 줄이기

```sql
-- 더 나은 방법: 조인 전에 필터링
SELECT e.name, d.dept_name
FROM (SELECT * FROM employees WHERE salary > 50000) e
JOIN departments d ON e.dept_id = d.dept_id;

-- 또는 WHERE로 동등하게 (옵티마이저가 보통 처리)
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE e.salary > 50000;
```

현대 옵티마이저는 보통 자동으로 조건을 아래로 푸시하지만, 쿼리 플랜 분석 시 이를 이해하는 것이 도움됩니다.

---

## 빠른 참조

| JOIN 타입 | 왼쪽 미매칭 | 오른쪽 미매칭 | 사용 시점 |
|---|---|---|---|
| `INNER JOIN` | 제외 | 제외 | 일치하는 행만 필요할 때 |
| `LEFT JOIN` | 포함 (NULL) | 제외 | 왼쪽 모든 행이 필요할 때 |
| `RIGHT JOIN` | 제외 | 포함 (NULL) | 오른쪽 모든 행이 필요할 때 (LEFT 선호) |
| `FULL OUTER JOIN` | 포함 (NULL) | 포함 (NULL) | 양쪽 모든 행이 필요할 때 |
| `CROSS JOIN` | 해당 없음 | 해당 없음 | 모든 조합이 필요할 때 |

```sql
-- 템플릿
SELECT columns
FROM left_table
[INNER | LEFT | RIGHT | FULL OUTER | CROSS] JOIN right_table
    ON left_table.col = right_table.col
[WHERE conditions]
[ORDER BY columns];
```
