---
title: "뷰와 저장 프로시저"
description: "SQL 뷰와 저장 프로시저 종합 가이드 — 뷰 생성, 수정, 삭제(갱신 가능 뷰, 물리화된 뷰 포함), 매개변수가 있는 저장 프로시저 작성, 제어 흐름, 오류 처리, 실무 활용 사례."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "뷰", "저장 프로시저", "물리화된 뷰", "데이터베이스", "함수"]
author: "Nemit"
featured: false
pinned: false
---

# 뷰와 저장 프로시저

**뷰**는 쿼리로 만들어진 가상 테이블을 제공합니다. **저장 프로시저**는 데이터베이스에 저장된 재사용 가능한 프로그램입니다. 둘을 함께 사용하면 로직을 캡슐화하고, 보안을 향상시키며, 복잡한 연산을 단순화할 수 있습니다.

---

## 뷰 (View)

뷰는 데이터베이스 객체로 저장된 **이름 있는 쿼리**입니다. 데이터 자체를 저장하지 않으며 — 뷰를 쿼리할 때마다 기반 쿼리가 실행됩니다.

### 뷰 생성

```sql
CREATE VIEW active_employees AS
SELECT emp_id, name, email, department
FROM employees
WHERE status = 'active';
```

테이블처럼 쿼리할 수 있습니다:

```sql
SELECT * FROM active_employees WHERE department = 'Engineering';
```

이는 다음과 동등합니다:

```sql
SELECT emp_id, name, email, department
FROM employees
WHERE status = 'active'
  AND department = 'Engineering';
```

### 뷰를 사용하는 이유

| 장점 | 예시 |
|---|---|
| **복잡한 쿼리 단순화** | 다중 조인 쿼리를 뷰로 래핑 |
| **데이터 추상화** | 5개 조인 테이블 대신 `customer_summary` 노출 |
| **보안** | 특정 컬럼만 노출 (급여, 주민번호 등 숨김) |
| **일관성** | 비즈니스 로직을 한 번 정의하고 어디서나 재사용 |
| **하위 호환성** | 애플리케이션을 깨지 않고 테이블 이름/구조 변경 |

### 뷰 수정 및 삭제

```sql
-- 기존 뷰 교체 (없으면 생성)
CREATE OR REPLACE VIEW active_employees AS
SELECT emp_id, name, email, department, hire_date
FROM employees
WHERE status = 'active';

-- 뷰 이름 변경 (PostgreSQL)
ALTER VIEW active_employees RENAME TO current_employees;

-- 뷰 삭제
DROP VIEW active_employees;
DROP VIEW IF EXISTS active_employees;  -- 없어도 오류 없음
```

### 복잡한 쿼리가 있는 뷰

```sql
-- 집계 뷰
CREATE VIEW department_stats AS
SELECT
    d.dept_name,
    COUNT(e.emp_id)        AS employee_count,
    AVG(e.salary)          AS avg_salary,
    MAX(e.salary)          AS max_salary,
    MIN(e.hire_date)       AS earliest_hire
FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name;

-- 사용법
SELECT * FROM department_stats
WHERE employee_count > 10
ORDER BY avg_salary DESC;
```

```sql
-- 다중 조인 뷰
CREATE VIEW order_details_full AS
SELECT
    o.order_id,
    o.order_date,
    c.name       AS customer_name,
    p.name       AS product_name,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price AS line_total
FROM orders o
JOIN customers c     ON o.customer_id = c.customer_id
JOIN order_items oi  ON o.order_id = oi.order_id
JOIN products p      ON oi.product_id = p.product_id;
```

### 갱신 가능 뷰

일부 뷰는 `INSERT`, `UPDATE`, `DELETE`를 허용합니다. 뷰가 갱신 가능하려면:

1. **단일 기본 테이블**을 참조
2. 집계 없음 (`GROUP BY`, `HAVING`, 집계 함수)
3. `DISTINCT`, `UNION`, SELECT 내 서브쿼리 없음
4. 모든 컬럼이 기본 테이블 컬럼에 직접 매핑

```sql
CREATE VIEW engineering_staff AS
SELECT emp_id, name, email, salary
FROM employees
WHERE department = 'Engineering';

-- 작동: 단순한 단일 테이블 뷰
UPDATE engineering_staff SET salary = salary * 1.1 WHERE emp_id = 42;
```

### WITH CHECK OPTION

행이 뷰에서 사라지게 만드는 수정을 방지합니다:

```sql
CREATE VIEW engineering_staff AS
SELECT emp_id, name, email, salary, department
FROM employees
WHERE department = 'Engineering'
WITH CHECK OPTION;

-- 실패: 행이 더 이상 WHERE 절에 매칭되지 않음
UPDATE engineering_staff
SET department = 'Marketing'
WHERE emp_id = 42;
-- ERROR: new row violates check option for view "engineering_staff"
```

### 물리화된 뷰 (Materialized View)

**물리화된 뷰**는 쿼리 결과를 디스크에 물리적으로 저장합니다. 데이터는 **스냅샷**이므로 — 기본 테이블의 변경을 반영하려면 갱신해야 합니다.

```sql
-- PostgreSQL
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(total)                      AS revenue,
    COUNT(*)                        AS order_count
FROM orders
GROUP BY DATE_TRUNC('month', order_date);

-- 쿼리 (빠름: 저장된 데이터에서 읽기)
SELECT * FROM monthly_sales WHERE month >= '2025-01-01';

-- 데이터 변경 시 갱신
REFRESH MATERIALIZED VIEW monthly_sales;

-- 읽기를 차단하지 않고 갱신 (PostgreSQL)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
-- 물리화된 뷰에 고유 인덱스 필요
```

| 특성 | 일반 뷰 | 물리화된 뷰 |
|---|---|---|
| **데이터 저장** | 없음 (가상) | 디스크에 결과 저장 |
| **쿼리 속도** | 매번 재실행 | 빠름 (저장된 데이터 읽기) |
| **데이터 최신성** | 항상 최신 | 갱신할 때까지 오래됨 |
| **사용 사례** | 단순 추상화 | 비용이 큰 쿼리, 리포팅 |
| **쓰기 연산** | 갱신 가능 (단순한 경우) | 읽기 전용 |

> **참고**: MySQL은 물리화된 뷰를 기본적으로 지원하지 않습니다. 테이블 + 예약된 갱신으로 시뮬레이션할 수 있습니다.

---

## 저장 프로시저 (Stored Procedure)

저장 프로시저는 데이터베이스에 저장된 **이름 있는 SQL 코드 블록**으로, 매개변수를 받고, 제어 흐름 로직을 포함하며, 결과를 반환할 수 있습니다.

### 기본 저장 프로시저 생성

```sql
-- PostgreSQL (v11 이전에는 함수 사용)
CREATE OR REPLACE FUNCTION get_employee_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM employees);
END;
$$ LANGUAGE plpgsql;

SELECT get_employee_count();
```

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE get_employee_count()
BEGIN
    SELECT COUNT(*) AS total_employees FROM employees;
END //
DELIMITER ;

CALL get_employee_count();
```

```sql
-- SQL Server
CREATE PROCEDURE GetEmployeeCount
AS
BEGIN
    SELECT COUNT(*) AS TotalEmployees FROM employees;
END;

EXEC GetEmployeeCount;
```

### 매개변수

#### 입력 매개변수

```sql
-- PostgreSQL
CREATE OR REPLACE FUNCTION get_employees_by_dept(dept_name VARCHAR)
RETURNS TABLE(emp_id INT, name VARCHAR, salary DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT e.emp_id, e.name, e.salary
    FROM employees e
    WHERE e.department = dept_name;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_employees_by_dept('Engineering');
```

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE get_employees_by_dept(IN dept_name VARCHAR(100))
BEGIN
    SELECT emp_id, name, salary
    FROM employees
    WHERE department = dept_name;
END //
DELIMITER ;

CALL get_employees_by_dept('Engineering');
```

#### 출력 매개변수

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE get_dept_stats(
    IN  dept_name   VARCHAR(100),
    OUT emp_count   INT,
    OUT avg_salary  DECIMAL(10,2)
)
BEGIN
    SELECT COUNT(*), AVG(salary)
    INTO emp_count, avg_salary
    FROM employees
    WHERE department = dept_name;
END //
DELIMITER ;

CALL get_dept_stats('Engineering', @count, @avg_sal);
SELECT @count, @avg_sal;
```

#### INOUT 매개변수

```sql
-- MySQL: 매개변수가 입력과 출력 모두로 사용됨
DELIMITER //
CREATE PROCEDURE double_value(INOUT val INT)
BEGIN
    SET val = val * 2;
END //
DELIMITER ;

SET @num = 5;
CALL double_value(@num);
SELECT @num;  -- 10
```

### 변수와 제어 흐름

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE process_orders()
BEGIN
    DECLARE total_orders INT DEFAULT 0;
    DECLARE processed INT DEFAULT 0;
    DECLARE order_id INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    -- 커서 선언
    DECLARE order_cursor CURSOR FOR
        SELECT o.order_id FROM orders o WHERE o.status = 'pending';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    SELECT COUNT(*) INTO total_orders
    FROM orders WHERE status = 'pending';

    OPEN order_cursor;

    read_loop: LOOP
        FETCH order_cursor INTO order_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE orders SET status = 'processing'
        WHERE orders.order_id = order_id;

        SET processed = processed + 1;
    END LOOP;

    CLOSE order_cursor;

    SELECT processed AS orders_processed, total_orders;
END //
DELIMITER ;
```

### IF / CASE

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE categorize_salary(
    IN emp_id INT,
    OUT category VARCHAR(20)
)
BEGIN
    DECLARE sal DECIMAL(10,2);
    SELECT salary INTO sal FROM employees WHERE employees.emp_id = emp_id;

    IF sal >= 100000 THEN
        SET category = 'Senior';
    ELSEIF sal >= 60000 THEN
        SET category = 'Mid';
    ELSE
        SET category = 'Junior';
    END IF;
END //
DELIMITER ;
```

### 오류 처리

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE safe_transfer(
    IN from_id INT,
    IN to_id INT,
    IN amount DECIMAL(10,2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Transfer failed' AS result;
    END;

    START TRANSACTION;

    UPDATE accounts SET balance = balance - amount
    WHERE account_id = from_id AND balance >= amount;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient funds';
    END IF;

    UPDATE accounts SET balance = balance + amount
    WHERE account_id = to_id;

    COMMIT;
    SELECT 'Transfer successful' AS result;
END //
DELIMITER ;
```

```sql
-- PostgreSQL
CREATE OR REPLACE FUNCTION safe_transfer(
    from_id INT, to_id INT, amount DECIMAL
) RETURNS TEXT AS $$
BEGIN
    UPDATE accounts SET balance = balance - amount
    WHERE account_id = from_id AND balance >= amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    UPDATE accounts SET balance = balance + amount
    WHERE account_id = to_id;

    RETURN 'Transfer successful';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Transfer failed: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

---

## 함수 vs 저장 프로시저

| 특성 | 함수 | 저장 프로시저 |
|---|---|---|
| **반환값** | 반드시 값을 반환 | 선택적 (OUT 매개변수) |
| **SELECT에서 사용** | 가능: `SELECT fn()` | 불가 (`CALL` 사용) |
| **트랜잭션 제어** | COMMIT/ROLLBACK 불가 (보통) | 트랜잭션 관리 가능 |
| **부수 효과** | 부수 효과 없어야 함 (이상적) | 부수 효과 가능 |
| **사용 사례** | 계산, 변환 | 비즈니스 로직, 배치 작업 |

---

## 뷰와 프로시저를 이용한 보안

### 뷰를 통한 컬럼 수준 보안

```sql
-- 전체 테이블 (민감한 데이터)
-- employees(emp_id, name, email, salary, ssn, address)

-- 공개 뷰: 민감하지 않은 컬럼만 노출
CREATE VIEW employee_directory AS
SELECT emp_id, name, email
FROM employees;

-- 뷰에만 접근 권한 부여
GRANT SELECT ON employee_directory TO public_role;
-- 기본 테이블에 대한 접근 권한 회수
REVOKE ALL ON employees FROM public_role;
```

### 프로시저 수준 보안

```sql
-- EXECUTE 권한만 부여
GRANT EXECUTE ON PROCEDURE safe_transfer TO app_role;
-- 사용자는 프로시저를 호출할 수 있지만 테이블에 직접 접근 불가
```

이를 **"씩 데이터베이스(thick database)"** 패턴이라 합니다: 모든 데이터 접근이 테이블을 직접 통하지 않고 뷰와 프로시저를 통합니다.

---

## 모범 사례

1. **뷰 이름을 설명적으로** — `v1`이 아닌 `active_customer_orders`
2. **중첩 뷰 피하기** — 뷰가 뷰를 참조하고 그 뷰가 또 뷰를 참조하면 디버깅과 성능 튜닝이 어려움
3. **갱신 가능 뷰에 `WITH CHECK OPTION` 사용** — 행 이탈 방지
4. **프로시저를 집중적으로** — 하나의 프로시저, 하나의 책임
5. **항상 오류 처리** — 프로시저에서 예외 처리기 사용
6. **매개변수 문서화** — 주석으로 IN/OUT 매개변수 설명
7. **물리화된 뷰 갱신** — 자동화된 갱신 일정 설정
8. **엣지 케이스로 테스트** — NULL 입력, 빈 결과 집합, 제약 위반

---

## 빠른 참조

```sql
-- 뷰
CREATE VIEW view_name AS SELECT ...;
CREATE OR REPLACE VIEW view_name AS SELECT ...;
DROP VIEW IF EXISTS view_name;

-- 물리화된 뷰 (PostgreSQL)
CREATE MATERIALIZED VIEW mv_name AS SELECT ...;
REFRESH MATERIALIZED VIEW mv_name;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_name;

-- 저장 프로시저 (MySQL)
DELIMITER //
CREATE PROCEDURE proc_name(IN p1 TYPE, OUT p2 TYPE)
BEGIN ... END //
DELIMITER ;
CALL proc_name(arg1, @out);

-- 함수 (PostgreSQL)
CREATE FUNCTION fn_name(p1 TYPE) RETURNS TYPE AS $$
BEGIN ... END; $$ LANGUAGE plpgsql;
SELECT fn_name(arg1);

-- 보안
GRANT SELECT ON view_name TO role;
GRANT EXECUTE ON PROCEDURE proc_name TO role;
```
