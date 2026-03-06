---
title: "SQL 인덱스: 개념, 유형, 최적화"
description: "데이터베이스 인덱스의 포괄적 가이드 — 내부 동작 원리(B-Tree, Hash, GIN, GiST), 생성 시점, 복합 인덱스, 커버링 인덱스, 흔한 안티패턴."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "인덱스", "B-Tree", "데이터베이스 최적화", "쿼리 성능", "복합 인덱스", "커버링 인덱스"]
author: "Nemit"
featured: false
pinned: false
---

# SQL 인덱스: 개념, 유형, 최적화

**인덱스**는 추가 저장 공간과 느린 쓰기를 대가로 데이터 검색 속도를 높이는 자료구조입니다. 책의 색인처럼 생각하세요 — 주제를 찾기 위해 모든 페이지를 읽는 대신, 색인에서 페이지 번호를 찾습니다.

인덱스 없이는 데이터베이스가 **풀 테이블 스캔**을 수행해야 합니다 — 일치하는 행을 찾기 위해 모든 행을 읽습니다. 인덱스가 있으면 관련 행으로 직접 점프할 수 있습니다.

---

## 인덱스 동작 원리

### 문제: 풀 테이블 스캔

```sql
SELECT * FROM employees WHERE last_name = 'Kim';
```

`last_name`에 인덱스가 없으면, 데이터베이스는 테이블의 **모든 행**을 읽고 조건을 확인합니다. 100만 행이 있는 테이블이면 100만 번의 비교입니다.

### 해결책: B-Tree 인덱스

대부분의 데이터베이스는 B-Tree(균형 트리) 인덱스를 기본으로 사용합니다. B-Tree는 로그 시간 조회가 가능한 트리 구조로 정렬된 데이터를 유지합니다.

```
                    [Johnson]
                   /         \
          [Davis]              [Smith]
         /       \            /       \
    [Adams]  [Garcia]   [Kim, Lee]  [Wilson]
       ↓        ↓          ↓   ↓       ↓
    rows...  rows...    rows  rows   rows...
```

`last_name = 'Kim'`을 찾으려면:
1. 루트에서 시작: 'Kim' < 'Johnson'? 아니오 → 오른쪽으로
2. 'Smith'에서: 'Kim' < 'Smith'? 예 → 왼쪽으로
3. 리프에서: 'Kim' 발견 → 실제 행 포인터를 따라감

**시간 복잡도**: O(n) 대신 O(log n). 100만 행에서 100만 번 비교 대신 ~20번 비교.

---

## 인덱스 생성과 관리

### 기본 문법

```sql
-- 인덱스 생성
CREATE INDEX idx_emp_lastname ON employees(last_name);

-- 고유 인덱스 생성 (유일성 강제)
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- 인덱스 삭제
DROP INDEX idx_emp_lastname;

-- PostgreSQL: 동시 생성 (테이블 잠금 없음)
CREATE INDEX CONCURRENTLY idx_emp_lastname ON employees(last_name);
```

### 인덱스 조회

```sql
-- PostgreSQL
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'employees';

-- MySQL
SHOW INDEX FROM employees;

-- SQL Server
EXEC sp_helpindex 'employees';
```

---

## 인덱스 유형

### 1. B-Tree 인덱스 (기본값)

적합: 등가(`=`), 범위(`>`, `<`, `BETWEEN`), 정렬(`ORDER BY`), 접두사 `LIKE` (`LIKE 'abc%'`).

```sql
CREATE INDEX idx_salary ON employees(salary);

-- 다음 모두 B-Tree 인덱스 사용 가능:
SELECT * FROM employees WHERE salary = 75000;
SELECT * FROM employees WHERE salary > 50000;
SELECT * FROM employees WHERE salary BETWEEN 40000 AND 80000;
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees WHERE last_name LIKE 'Kim%';  -- 접두사만!
```

**사용 불가**: `LIKE '%Kim'` (선행 와일드카드 없음).

### 2. Hash 인덱스

적합: 정확한 등가(`=`)만. 등가 조회에서 B-Tree보다 빠르지만 범위 쿼리에는 쓸모없음.

```sql
-- PostgreSQL
CREATE INDEX idx_emp_email_hash ON employees USING HASH (email);

-- 유용한 경우:
SELECT * FROM employees WHERE email = 'alice@example.com';

-- 사용 불가:
SELECT * FROM employees WHERE email > 'a';  -- 범위 쿼리
SELECT * FROM employees ORDER BY email;      -- 정렬
```

대부분의 데이터베이스(MySQL InnoDB, SQL Server)는 B-Tree만 지원합니다. PostgreSQL은 Hash 인덱스를 지원합니다.

### 3. GIN (Generalized Inverted Index)

적합: 전문 검색, 배열 포함, JSONB 쿼리.

```sql
-- PostgreSQL: 전문 검색용 인덱스
CREATE INDEX idx_articles_fts ON articles USING GIN (to_tsvector('english', content));

-- 쿼리
SELECT * FROM articles
WHERE to_tsvector('english', content) @@ to_tsquery('database & optimization');

-- JSONB 인덱스
CREATE INDEX idx_data_gin ON events USING GIN (metadata);
SELECT * FROM events WHERE metadata @> '{"type": "click"}';
```

### 4. GiST (Generalized Search Tree)

적합: 기하학적 데이터, 범위 타입, 전문 검색 (GIN 대안).

```sql
-- PostgreSQL: 공간 인덱스
CREATE INDEX idx_locations_geo ON locations USING GIST (coordinates);

-- 범위 타입 인덱스
CREATE INDEX idx_booking_dates ON bookings USING GIST (date_range);
```

---

## 복합 (다중 컬럼) 인덱스

여러 컬럼에 대한 인덱스. 컬럼 순서가 매우 중요합니다.

```sql
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);
```

### 최좌선 접두사 규칙

복합 인덱스는 인덱스 컬럼의 **왼쪽 접두사**로 필터링하는 쿼리에 사용될 수 있습니다:

```sql
-- 주어진: INDEX(department_id, salary)

-- ✅ 인덱스 사용: department_id(최좌선)로 필터링
SELECT * FROM employees WHERE department_id = 10;

-- ✅ 인덱스 사용: 두 컬럼 모두로 필터링
SELECT * FROM employees WHERE department_id = 10 AND salary > 50000;

-- ❌ 인덱스 사용 불가: department_id를 건너뜀
SELECT * FROM employees WHERE salary > 50000;
```

(성, 이름)으로 정렬된 전화번호부와 같습니다. "Kim"(성) 전체를 찾거나, "Kim, Minjun"(둘 다)을 찾을 수 있습니다. 하지만 "Minjun"(이름만)을 효율적으로 찾을 수 없습니다 — 데이터가 그렇게 정렬되어 있지 않습니다.

### 컬럼 순서 전략

가장 **선택적인**(고유한 값이 가장 많은) 컬럼을 먼저, 또는 `WHERE` 절에서 가장 자주 사용되는 컬럼을 먼저 넣으세요:

```sql
-- 쿼리가 항상 department_id로 필터링하고 가끔 salary로:
CREATE INDEX idx_dept_salary ON employees(department_id, salary);

-- 쿼리가 항상 둘 다로 필터링:
-- 더 선택적인 컬럼을 먼저
CREATE INDEX idx_dept_salary ON employees(department_id, salary);
```

---

## 커버링 인덱스

**커버링 인덱스**는 쿼리에 필요한 모든 컬럼을 포함하여, 데이터베이스가 실제 테이블에 접근할 필요 없이 인덱스만으로 모든 것을 읽습니다. 이를 **인덱스 전용 스캔**이라고 합니다.

```sql
-- 인덱스가 department_id와 salary를 포함
CREATE INDEX idx_dept_salary ON employees(department_id, salary);

-- 이 쿼리는 "커버됨" — 인덱스 컬럼만 필요
SELECT department_id, salary FROM employees WHERE department_id = 10;

-- 이 쿼리는 커버되지 않음 — 테이블에서 name 필요
SELECT department_id, salary, name FROM employees WHERE department_id = 10;
```

### INCLUDE 컬럼 (PostgreSQL, SQL Server)

정렬 순서에 포함하지 않고 인덱스 리프 페이지에 컬럼을 추가:

```sql
-- PostgreSQL
CREATE INDEX idx_dept_salary_incl ON employees(department_id, salary) INCLUDE (name, email);

-- 이제 이것은 커버드 쿼리:
SELECT department_id, salary, name, email
FROM employees
WHERE department_id = 10;
```

`INCLUDE` 컬럼은 인덱스에 저장되지만 트리 구조에 영향을 주지 않습니다 — 인덱스는 여전히 `(department_id, salary)`로만 정렬됩니다.

---

## 클러스터드 vs 비클러스터드 인덱스

### 클러스터드 인덱스

- 디스크상의 데이터 **물리적 순서**를 결정
- 테이블당 **하나**만 가능 (데이터는 한 가지 방식으로만 물리적 정렬 가능)
- 많은 데이터베이스에서 기본 키가 자동으로 클러스터드 인덱스를 생성

```sql
-- SQL Server: 명시적 클러스터드 인덱스
CREATE CLUSTERED INDEX idx_emp_id ON employees(emp_id);

-- InnoDB (MySQL): PRIMARY KEY가 항상 클러스터드 인덱스
-- PostgreSQL: CLUSTER 명령어 사용 (자동으로 순서 유지하지 않음)
CLUSTER employees USING idx_emp_lastname;
```

### 비클러스터드 인덱스

- 실제 데이터를 **가리키는** 별도의 구조
- 테이블당 여러 개 가능 (필요한 만큼)
- 인덱스 컬럼 + 데이터에 대한 포인터(행 로케이터) 포함

```
비클러스터드 인덱스             테이블 (힙/클러스터드)
┌──────────┬──────────┐      ┌─────┬──────────┬────────┐
│ last_name│ row_ptr  │      │ id  │ last_name│ salary │
├──────────┼──────────┤      ├─────┼──────────┼────────┤
│ Adams    │ → row 45 │      │  1  │ Kim      │ 75000  │
│ Garcia   │ → row 12 │      │  2  │ Adams    │ 60000  │
│ Kim      │ → row 1  │      │  3  │ Wilson   │ 80000  │
│ Wilson   │ → row 3  │      │ ... │ ...      │ ...    │
└──────────┴──────────┘      └─────┴──────────┴────────┘
```

---

## 인덱스 생성 시점

### 좋은 후보

| 시나리오 | 이유 |
|---|---|
| `WHERE` 절 컬럼 | 직접적인 필터링 성능 |
| `JOIN` 컬럼 (외래 키) | 조인 성능 |
| `ORDER BY` 컬럼 | 정렬 오버헤드 제거 |
| `GROUP BY` 컬럼 | 더 빠른 그룹화 |
| 카디널리티가 높은 컬럼 | 더 선택적 = 더 유용 |
| 자주 쿼리되는 컬럼 | 높은 사용 빈도 = 높은 이점 |

### 나쁜 후보

| 시나리오 | 이유 |
|---|---|
| 작은 테이블 (수천 행 미만) | 풀 스캔으로 충분히 빠름 |
| 카디널리티가 낮은 컬럼 | 예: `gender` (2-3개 값) |
| 거의 쿼리되지 않는 컬럼 | 이점 없이 저장 비용만 발생 |
| 자주 업데이트되는 컬럼 | 쓰기 오버헤드 |
| 넓은 컬럼 (큰 텍스트/BLOB) | 거대한 인덱스 크기 |

---

## 인덱스 성능 분석

### EXPLAIN — 쿼리 실행 계획

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM employees WHERE last_name = 'Kim';

-- 출력:
-- Index Scan using idx_emp_lastname on employees
--   Index Cond: (last_name = 'Kim')
--   Rows Removed by Index Recheck: 0
--   Actual time: 0.023..0.025 rows=3 loops=1
```

```sql
-- MySQL
EXPLAIN SELECT * FROM employees WHERE last_name = 'Kim';

-- 확인할 것:
-- type: ref (인덱스 사용) vs ALL (풀 스캔)
-- key: 어떤 인덱스가 사용되었는지
-- rows: 추정 스캔 행 수
```

### 주요 스캔 유형 (PostgreSQL)

| 스캔 유형 | 의미 |
|---|---|
| **Seq Scan** | 풀 테이블 스캔 (인덱스 미사용) |
| **Index Scan** | 인덱스 사용 후 테이블에서 행 가져옴 |
| **Index Only Scan** | 인덱스에서 모든 것을 읽음 (커버링) |
| **Bitmap Index Scan** | 인덱스로 비트맵 생성 후 테이블 스캔 |

---

## 흔한 안티패턴

### 1. 인덱스 컬럼에 함수 적용

```sql
-- salary 인덱스가 있지만, 이 쿼리는 사용 불가:
SELECT * FROM employees WHERE UPPER(last_name) = 'KIM';

-- 인덱스는 last_name을 저장하지, UPPER(last_name)을 저장하지 않음

-- 해결: 함수 인덱스
CREATE INDEX idx_upper_lastname ON employees(UPPER(last_name));
-- 이제 쿼리가 인덱스를 사용할 수 있음
```

### 2. 암묵적 타입 변환

```sql
-- phone_number는 VARCHAR인데 정수로 비교:
SELECT * FROM employees WHERE phone_number = 12345;
-- 데이터베이스가 phone_number를 정수로 변환하여 인덱스 무효화 가능

-- 해결: 올바른 타입 사용
SELECT * FROM employees WHERE phone_number = '12345';
```

### 3. LIKE에서 선행 와일드카드

```sql
-- B-Tree 인덱스 사용 불가:
SELECT * FROM employees WHERE last_name LIKE '%Kim%';

-- B-Tree 인덱스 사용 가능:
SELECT * FROM employees WHERE last_name LIKE 'Kim%';

-- 포함/접미사 검색은 전문 검색(GIN 인덱스) 사용
```

### 4. OR 조건

```sql
-- 인덱스를 효율적으로 사용하지 못할 수 있음:
SELECT * FROM employees WHERE dept_id = 10 OR salary > 80000;

-- 해결: 각 컬럼에 별도 인덱스, 또는 UNION으로 재작성:
SELECT * FROM employees WHERE dept_id = 10
UNION
SELECT * FROM employees WHERE salary > 80000;
```

### 5. 과도한 인덱싱

모든 인덱스는:
- 저장 공간 증가 (인덱스당 테이블 크기의 10-30%)
- `INSERT`, `UPDATE`, `DELETE` 속도 저하 (모든 인덱스 업데이트 필요)
- 유지보수 필요 (PostgreSQL에서 `REINDEX`, `VACUUM`)

모든 컬럼에 인덱스를 만들지 **마세요**. 먼저 `EXPLAIN`으로 쿼리를 프로파일링한 다음, 병목이 되는 곳에 인덱스를 추가하세요.

---

## 인덱스 유지보수

```sql
-- PostgreSQL: 인덱스 재구축
REINDEX TABLE employees;
REINDEX INDEX idx_emp_lastname;

-- PostgreSQL: 인덱스 비대화 확인
SELECT
    schemaname, tablename, indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- MySQL: 테이블 최적화 (인덱스 재구축)
OPTIMIZE TABLE employees;

-- SQL Server: 재구축/재구성
ALTER INDEX idx_emp_lastname ON employees REBUILD;
ALTER INDEX idx_emp_lastname ON employees REORGANIZE;
```

---

## 빠른 참조

```sql
-- 인덱스 생성
CREATE INDEX idx_name ON table(column);
CREATE INDEX idx_name ON table(col1, col2);               -- 복합
CREATE UNIQUE INDEX idx_name ON table(column);             -- 고유
CREATE INDEX idx_name ON table(col1) INCLUDE (col2, col3); -- 커버링

-- 인덱스 삭제
DROP INDEX idx_name;

-- 쿼리 분석
EXPLAIN ANALYZE SELECT ...;
```

| 인덱스 유형 | 적합 용도 | 범위 지원? |
|---|---|---|
| B-Tree | 범용 | 예 |
| Hash | 정확한 등가 | 아니오 |
| GIN | 전문 검색, JSONB, 배열 | 경우에 따라 |
| GiST | 공간, 범위 | 예 |

**황금 규칙**: 추측하지 말고 — 측정하세요. `EXPLAIN ANALYZE`로 인덱스가 실제로 사용되는지 확인하세요.
