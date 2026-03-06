---
title: "SQL Subqueries: Scalar, Row, Table, and Correlated"
description: "A deep dive into SQL subqueries — scalar, single-row, multi-row, and correlated subqueries, plus EXISTS, IN vs EXISTS performance, and when to use subqueries vs JOINs."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "subquery", "correlated subquery", "EXISTS", "IN", "nested query", "database"]
author: "Nemit"
featured: false
pinned: false
---

# SQL Subqueries: Scalar, Row, Table, and Correlated

A **subquery** (also called a nested query or inner query) is a `SELECT` statement embedded inside another SQL statement. Subqueries can appear in `SELECT`, `FROM`, `WHERE`, and `HAVING` clauses, and they're one of the most powerful tools for expressing complex logic in a single query.

---

## Subquery Basics

A subquery is enclosed in parentheses and executed **before** the outer query (except correlated subqueries, which execute once per outer row).

```sql
-- Find employees who earn more than the company average
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

The inner query `(SELECT AVG(salary) FROM employees)` runs first, returns a single value (e.g., 65000), and the outer query becomes:

```sql
SELECT name, salary FROM employees WHERE salary > 65000;
```

---

## Types of Subqueries

### 1. Scalar Subquery

Returns **exactly one value** (one row, one column). Can be used anywhere a single value is expected.

```sql
-- In SELECT
SELECT
    name,
    salary,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;

-- In WHERE
SELECT name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);

-- In HAVING
SELECT department_id, AVG(salary) AS avg_sal
FROM employees
GROUP BY department_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);
```

**If a scalar subquery returns more than one row, you get an error.** Use `LIMIT 1` or aggregate functions to guarantee a single value.

### 2. Single-Row Subquery

Returns one row with one or more columns. Used with `=`, `>`, `<`, `>=`, `<=`, `<>`.

```sql
-- Find employees in the same department as 'Alice'
SELECT name, dept_id
FROM employees
WHERE dept_id = (
    SELECT dept_id FROM employees WHERE name = 'Alice'
);
```

### 3. Multi-Row Subquery

Returns multiple rows. Used with `IN`, `ANY`, `ALL`, `EXISTS`.

```sql
-- Employees in departments that are located in 'New York'
SELECT name, dept_id
FROM employees
WHERE dept_id IN (
    SELECT dept_id FROM departments WHERE location = 'New York'
);
```

### 4. Multi-Column Subquery

Returns multiple columns. Used with row constructors:

```sql
-- Find employees whose (dept_id, job_title) matches any manager's
SELECT name, dept_id, job_title
FROM employees
WHERE (dept_id, job_title) IN (
    SELECT dept_id, job_title FROM managers
);
```

### 5. Table Subquery (Derived Table)

A subquery in the `FROM` clause. Creates a temporary result set that the outer query treats as a table.

```sql
-- Top earner in each department
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

Derived tables **must** have an alias (`sub` in this case).

---

## Correlated Subqueries

A **correlated subquery** references columns from the outer query. It executes **once for each row** of the outer query, unlike regular subqueries which execute once total.

```sql
-- Find employees who earn more than their department's average
SELECT e.name, e.salary, e.dept_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id    -- references outer query's e.dept_id
);
```

Execution:
1. For Alice (dept 10): compute `AVG(salary)` where `dept_id = 10` → compare
2. For Bob (dept 20): compute `AVG(salary)` where `dept_id = 20` → compare
3. ... and so on for each row

### Correlated DELETE

```sql
-- Delete employees who are not the highest paid in their department
DELETE FROM employees e
WHERE e.salary < (
    SELECT MAX(e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id
);
```

### Correlated UPDATE

```sql
-- Set each employee's department name based on dept_id
UPDATE employees e
SET dept_name = (
    SELECT d.dept_name
    FROM departments d
    WHERE d.dept_id = e.dept_id
);
```

---

## EXISTS and NOT EXISTS

`EXISTS` returns `TRUE` if the subquery returns **at least one row**. It doesn't care about the actual values returned — only whether rows exist.

```sql
-- Departments that have at least one employee
SELECT d.dept_name
FROM departments d
WHERE EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.dept_id = d.dept_id
);
```

`SELECT 1` is a convention — the value doesn't matter. `EXISTS` just checks for row existence.

### NOT EXISTS — Anti-Join Pattern

```sql
-- Departments with no employees
SELECT d.dept_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.dept_id = d.dept_id
);
```

This is the correlated subquery equivalent of `LEFT JOIN ... WHERE ... IS NULL`.

---

## IN vs EXISTS

Both can express the same logic, but they have different performance characteristics:

### IN

```sql
SELECT name FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE location = 'NY');
```

- The subquery runs **once**, producing a list of values
- The outer query checks each row against this list
- Better when the subquery result set is **small**
- **NULL pitfall**: `IN` with `NULL` in the list can produce unexpected results

### EXISTS

```sql
SELECT name FROM employees e
WHERE EXISTS (
    SELECT 1 FROM departments d
    WHERE d.dept_id = e.dept_id AND d.location = 'NY'
);
```

- The subquery runs **once per outer row** (correlated)
- Stops as soon as it finds one match (short-circuits)
- Better when the outer table is **small** and the inner table is **large and indexed**
- Handles NULLs correctly

### NULL Behavior with IN

```sql
-- Suppose the subquery returns: (10, 20, NULL)

SELECT * FROM employees WHERE dept_id IN (10, 20, NULL);
-- Returns employees with dept_id 10 or 20
-- Does NOT return employees with dept_id NULL (NULL IN (...) → UNKNOWN)

SELECT * FROM employees WHERE dept_id NOT IN (10, 20, NULL);
-- Returns NOTHING! Because:
-- dept_id = 30 → NOT (30=10 OR 30=20 OR 30=NULL)
--              → NOT (FALSE OR FALSE OR UNKNOWN)
--              → NOT UNKNOWN → UNKNOWN
-- No rows pass the filter
```

**Rule**: If the subquery might return `NULL`, prefer `NOT EXISTS` over `NOT IN`.

---

## Subqueries in Different Clauses

### In SELECT (Scalar)

```sql
SELECT
    e.name,
    e.salary,
    (SELECT COUNT(*) FROM employees e2 WHERE e2.dept_id = e.dept_id) AS dept_size
FROM employees e;
```

### In FROM (Derived Table)

```sql
SELECT dept_id, avg_salary
FROM (
    SELECT dept_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY dept_id
) dept_stats
WHERE avg_salary > 70000;
```

### In WHERE

```sql
SELECT name FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 30);
-- Salary greater than the highest salary in department 30
```

### In HAVING

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

## ANY and ALL

### ANY (SOME)

Returns `TRUE` if the comparison is true for **at least one** value returned by the subquery.

```sql
-- Employees who earn more than at least one person in department 10
SELECT name, salary
FROM employees
WHERE salary > ANY (SELECT salary FROM employees WHERE dept_id = 10);
-- Equivalent to: salary > MIN(salary in dept 10)
```

### ALL

Returns `TRUE` if the comparison is true for **every** value returned by the subquery.

```sql
-- Employees who earn more than everyone in department 10
SELECT name, salary
FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 10);
-- Equivalent to: salary > MAX(salary in dept 10)
```

| Operator | Meaning |
|---|---|
| `> ANY` | Greater than the minimum |
| `> ALL` | Greater than the maximum |
| `< ANY` | Less than the maximum |
| `< ALL` | Less than the minimum |
| `= ANY` | Same as `IN` |

---

## Subquery vs JOIN

Many subqueries can be rewritten as JOINs and vice versa.

```sql
-- Subquery approach
SELECT name FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE location = 'NY');

-- JOIN approach
SELECT DISTINCT e.name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE d.location = 'NY';
```

### When to Use Subqueries

- **Aggregation logic**: `WHERE salary > (SELECT AVG(salary) ...)`
- **Existence checks**: `WHERE EXISTS (...)`
- **Readability**: Some queries read more naturally as subqueries
- **NOT IN / NOT EXISTS** patterns

### When to Use JOINs

- **Returning columns from both tables**
- **Multiple relationships** in one query
- **Performance**: JOINs often optimize better than correlated subqueries

### Performance Comparison

```sql
-- Correlated subquery: runs N times (once per outer row)
SELECT e.name, (SELECT d.dept_name FROM departments d WHERE d.dept_id = e.dept_id)
FROM employees e;

-- JOIN: runs once with optimized algorithm
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id;
```

The JOIN version is usually faster because the optimizer can choose hash join or merge join. The correlated subquery must execute the inner query for each row.

---

## Common Table Expressions (CTE) — Alternative to Subqueries

CTEs provide a cleaner way to write subqueries, especially when the same subquery is referenced multiple times.

```sql
-- Without CTE (repeated subquery)
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary - (SELECT AVG(salary) FROM employees) DESC;

-- With CTE (cleaner, computed once)
WITH avg_sal AS (
    SELECT AVG(salary) AS val FROM employees
)
SELECT e.name, e.salary
FROM employees e, avg_sal
WHERE e.salary > avg_sal.val
ORDER BY e.salary - avg_sal.val DESC;
```

### Recursive CTE (Advanced)

For hierarchical data like org charts:

```sql
WITH RECURSIVE org_tree AS (
    -- Base case: top-level employees (no manager)
    SELECT emp_id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: employees who report to someone in the tree
    SELECT e.emp_id, e.name, e.manager_id, t.level + 1
    FROM employees e
    JOIN org_tree t ON e.manager_id = t.emp_id
)
SELECT * FROM org_tree ORDER BY level, name;
```

---

## Quick Reference

| Subquery Type | Returns | Used With |
|---|---|---|
| Scalar | 1 value | `=`, `>`, `<`, in `SELECT` |
| Single-row | 1 row | `=`, `>`, `<` |
| Multi-row | Multiple rows | `IN`, `ANY`, `ALL`, `EXISTS` |
| Multi-column | Multiple columns | `IN` with row constructor |
| Derived table | Result set | `FROM` clause |
| Correlated | Depends on outer row | Any clause (executes per row) |

```sql
-- Subquery template
SELECT columns
FROM table
WHERE column OPERATOR (
    SELECT column FROM table WHERE condition
);
```
