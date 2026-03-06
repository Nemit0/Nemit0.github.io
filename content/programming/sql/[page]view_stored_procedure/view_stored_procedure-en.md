---
title: "Views and Stored Procedures"
description: "Comprehensive guide to SQL views and stored procedures — creating, updating, and dropping views (including updatable and materialized views), writing stored procedures with parameters, control flow, error handling, and practical use cases."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "view", "stored procedure", "materialized view", "database", "function"]
author: "Nemit"
featured: false
pinned: false
---

# Views and Stored Procedures

**Views** provide virtual tables built from queries. **Stored procedures** are reusable programs stored in the database. Together, they encapsulate logic, improve security, and simplify complex operations.

---

## Views

A view is a **named query** stored as a database object. It doesn't store data itself — every time you query a view, the underlying query runs.

### Creating a View

```sql
CREATE VIEW active_employees AS
SELECT emp_id, name, email, department
FROM employees
WHERE status = 'active';
```

Now you can query it like a table:

```sql
SELECT * FROM active_employees WHERE department = 'Engineering';
```

This is equivalent to:

```sql
SELECT emp_id, name, email, department
FROM employees
WHERE status = 'active'
  AND department = 'Engineering';
```

### Why Use Views?

| Benefit | Example |
|---|---|
| **Simplify complex queries** | Wrap a multi-join query in a view |
| **Data abstraction** | Users see `customer_summary` instead of 5 joined tables |
| **Security** | Expose only specific columns (hide salary, SSN, etc.) |
| **Consistency** | Define business logic once, reuse everywhere |
| **Backward compatibility** | Rename/restructure tables without breaking applications |

### Modifying and Dropping Views

```sql
-- Replace an existing view (or create if it doesn't exist)
CREATE OR REPLACE VIEW active_employees AS
SELECT emp_id, name, email, department, hire_date
FROM employees
WHERE status = 'active';

-- Rename a view (PostgreSQL)
ALTER VIEW active_employees RENAME TO current_employees;

-- Drop a view
DROP VIEW active_employees;
DROP VIEW IF EXISTS active_employees;  -- no error if missing
```

### Views with Complex Queries

```sql
-- Aggregation view
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

-- Usage
SELECT * FROM department_stats
WHERE employee_count > 10
ORDER BY avg_salary DESC;
```

```sql
-- Multi-join view
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

### Updatable Views

Some views allow `INSERT`, `UPDATE`, and `DELETE`. A view is updatable if it:

1. References a **single base table**
2. Contains **no** aggregation (`GROUP BY`, `HAVING`, aggregate functions)
3. Contains **no** `DISTINCT`, `UNION`, subqueries in SELECT
4. Every column maps directly to a base table column

```sql
CREATE VIEW engineering_staff AS
SELECT emp_id, name, email, salary
FROM employees
WHERE department = 'Engineering';

-- This works: simple single-table view
UPDATE engineering_staff SET salary = salary * 1.1 WHERE emp_id = 42;

-- This also works
INSERT INTO engineering_staff (emp_id, name, email, salary)
VALUES (100, 'Alice', 'alice@co.com', 90000);
-- Note: department won't be set to 'Engineering' automatically!
```

### WITH CHECK OPTION

Prevents modifications that would make the row disappear from the view:

```sql
CREATE VIEW engineering_staff AS
SELECT emp_id, name, email, salary, department
FROM employees
WHERE department = 'Engineering'
WITH CHECK OPTION;

-- This fails: the row would no longer match the WHERE clause
UPDATE engineering_staff
SET department = 'Marketing'
WHERE emp_id = 42;
-- ERROR: new row violates check option for view "engineering_staff"
```

### Materialized Views

A **materialized view** stores the query result physically on disk. The data is a **snapshot** — it must be refreshed to reflect changes in the base tables.

```sql
-- PostgreSQL
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(total)                      AS revenue,
    COUNT(*)                        AS order_count
FROM orders
GROUP BY DATE_TRUNC('month', order_date);

-- Query it (fast: reads from stored data)
SELECT * FROM monthly_sales WHERE month >= '2025-01-01';

-- Refresh when data changes
REFRESH MATERIALIZED VIEW monthly_sales;

-- Refresh without blocking reads (PostgreSQL)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
-- Requires a unique index on the materialized view
```

| Feature | Regular View | Materialized View |
|---|---|---|
| **Data storage** | None (virtual) | Stores result on disk |
| **Query speed** | Re-executes each time | Fast (reads stored data) |
| **Data freshness** | Always current | Stale until refreshed |
| **Use case** | Simple abstraction | Expensive queries, reporting |
| **Write operations** | Updatable (if simple) | Read-only |

> **Note**: MySQL does not natively support materialized views. You can simulate them with a table + scheduled refresh.

---

## Stored Procedures

A stored procedure is a **named block of SQL code** stored in the database that can accept parameters, contain control flow logic, and return results.

### Creating a Basic Stored Procedure

```sql
-- PostgreSQL (uses functions — no separate PROCEDURE before v11)
CREATE OR REPLACE FUNCTION get_employee_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM employees);
END;
$$ LANGUAGE plpgsql;

-- Call it
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

-- Call it
CALL get_employee_count();
```

```sql
-- SQL Server
CREATE PROCEDURE GetEmployeeCount
AS
BEGIN
    SELECT COUNT(*) AS TotalEmployees FROM employees;
END;

-- Call it
EXEC GetEmployeeCount;
```

### Parameters

#### Input Parameters

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

#### Output Parameters

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

#### INOUT Parameters

```sql
-- MySQL: parameter used as both input and output
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

### Variables and Control Flow

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE process_orders()
BEGIN
    -- Variable declaration
    DECLARE total_orders INT DEFAULT 0;
    DECLARE processed INT DEFAULT 0;
    DECLARE order_id INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    -- Cursor declaration
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

        -- Process each order
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

    -- IF statement
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

```sql
-- CASE statement
CASE
    WHEN sal >= 100000 THEN SET category = 'Senior';
    WHEN sal >= 60000  THEN SET category = 'Mid';
    ELSE SET category = 'Junior';
END CASE;
```

### WHILE / LOOP

```sql
-- WHILE loop
DECLARE i INT DEFAULT 1;
WHILE i <= 10 DO
    INSERT INTO numbers (val) VALUES (i);
    SET i = i + 1;
END WHILE;

-- REPEAT loop (executes at least once)
DECLARE i INT DEFAULT 1;
REPEAT
    INSERT INTO numbers (val) VALUES (i);
    SET i = i + 1;
UNTIL i > 10
END REPEAT;
```

### Error Handling

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

### Modifying and Dropping

```sql
-- Drop
DROP PROCEDURE IF EXISTS get_employee_count;    -- MySQL / SQL Server
DROP FUNCTION IF EXISTS get_employee_count();    -- PostgreSQL

-- View existing procedures
SHOW PROCEDURE STATUS;                          -- MySQL
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;  -- PostgreSQL
```

---

## Functions vs Stored Procedures

| Feature | Function | Stored Procedure |
|---|---|---|
| **Return value** | Must return a value | Optional (via OUT params) |
| **Use in SELECT** | Yes: `SELECT fn()` | No (use `CALL`) |
| **Transaction control** | Cannot COMMIT/ROLLBACK (usually) | Can manage transactions |
| **Side effects** | Should be side-effect free (ideally) | Can have side effects |
| **Use case** | Calculations, transformations | Business logic, batch operations |

---

## Security with Views and Procedures

### Column-Level Security via Views

```sql
-- Full table (sensitive data)
-- employees(emp_id, name, email, salary, ssn, address)

-- Public view: expose only non-sensitive columns
CREATE VIEW employee_directory AS
SELECT emp_id, name, email
FROM employees;

-- Grant access to view only
GRANT SELECT ON employee_directory TO public_role;
-- Revoke access to base table
REVOKE ALL ON employees FROM public_role;
```

### Procedure-Level Security

```sql
-- Grant EXECUTE permission only
GRANT EXECUTE ON PROCEDURE safe_transfer TO app_role;
-- Users can call the procedure but can't access the tables directly
```

This is called the **"thick database"** pattern: all data access goes through views and procedures, never directly through tables.

---

## Best Practices

1. **Name views descriptively** — `active_customer_orders`, not `v1`
2. **Avoid nested views** — view referencing view referencing view makes debugging and performance tuning painful
3. **Use `WITH CHECK OPTION`** for updatable views to prevent row migration
4. **Keep procedures focused** — one procedure, one responsibility
5. **Always handle errors** — use exception handlers in procedures
6. **Document parameters** — use comments to describe IN/OUT params
7. **Refresh materialized views** — set up automated refresh schedules
8. **Test with edge cases** — NULL inputs, empty result sets, constraint violations

---

## Quick Reference

```sql
-- Views
CREATE VIEW view_name AS SELECT ...;
CREATE OR REPLACE VIEW view_name AS SELECT ...;
DROP VIEW IF EXISTS view_name;

-- Materialized Views (PostgreSQL)
CREATE MATERIALIZED VIEW mv_name AS SELECT ...;
REFRESH MATERIALIZED VIEW mv_name;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_name;

-- Stored Procedures (MySQL)
DELIMITER //
CREATE PROCEDURE proc_name(IN p1 TYPE, OUT p2 TYPE)
BEGIN ... END //
DELIMITER ;
CALL proc_name(arg1, @out);

-- Functions (PostgreSQL)
CREATE FUNCTION fn_name(p1 TYPE) RETURNS TYPE AS $$
BEGIN ... END; $$ LANGUAGE plpgsql;
SELECT fn_name(arg1);

-- Security
GRANT SELECT ON view_name TO role;
GRANT EXECUTE ON PROCEDURE proc_name TO role;
```
