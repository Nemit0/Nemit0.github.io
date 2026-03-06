---
title: "SQL Fundamentals: SELECT, WHERE, ORDER BY, GROUP BY"
description: "A thorough guide to the foundational SQL clauses — SELECT for projection, WHERE for filtering, ORDER BY for sorting, and GROUP BY for aggregation — with practical examples and edge cases."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "SELECT", "WHERE", "ORDER BY", "GROUP BY", "HAVING", "aggregation", "database"]
author: "Nemit"
featured: false
pinned: false
---

# SQL Fundamentals: SELECT, WHERE, ORDER BY, GROUP BY

SQL (Structured Query Language) is the standard language for interacting with relational databases. Every query you write revolves around a handful of core clauses. Master these four and you have the foundation for everything else.

---

## Logical Order of Execution

Before diving into syntax, understand that SQL does **not** execute in the order you write it. The logical processing order is:

```
1. FROM        — identify the table(s)
2. WHERE       — filter rows
3. GROUP BY    — group rows
4. HAVING      — filter groups
5. SELECT      — choose columns / compute expressions
6. ORDER BY    — sort the result
7. LIMIT       — restrict the number of rows returned
```

This matters. You cannot reference a column alias defined in `SELECT` inside a `WHERE` clause — because `WHERE` runs before `SELECT`.

---

## SELECT — Projection

`SELECT` determines **which columns** appear in the result.

```sql
-- All columns
SELECT * FROM employees;

-- Specific columns
SELECT first_name, last_name, salary FROM employees;

-- Expressions and aliases
SELECT
    first_name,
    last_name,
    salary * 12 AS annual_salary
FROM employees;
```

### DISTINCT — Remove Duplicates

```sql
SELECT DISTINCT department_id FROM employees;
```

`DISTINCT` applies to the **entire row**. If you select multiple columns, it removes rows where *all* selected columns are identical.

```sql
-- Distinct combinations of department and job title
SELECT DISTINCT department_id, job_title FROM employees;
```

### Expressions and Functions in SELECT

```sql
SELECT
    first_name || ' ' || last_name AS full_name,       -- string concatenation (PostgreSQL)
    CONCAT(first_name, ' ', last_name) AS full_name2,   -- CONCAT works across most RDBMS
    UPPER(last_name) AS upper_last,
    ROUND(salary / 12, 2) AS monthly_salary,
    COALESCE(commission, 0) AS commission_safe           -- NULL handling
FROM employees;
```

---

## WHERE — Row Filtering

`WHERE` filters rows **before** any grouping or aggregation.

### Comparison Operators

```sql
SELECT * FROM employees WHERE salary > 50000;
SELECT * FROM employees WHERE department_id = 10;
SELECT * FROM employees WHERE hire_date >= '2024-01-01';
SELECT * FROM employees WHERE last_name != 'Smith';   -- or <>
```

### Logical Operators

```sql
-- AND: both conditions must be true
SELECT * FROM employees
WHERE department_id = 10 AND salary > 60000;

-- OR: at least one condition must be true
SELECT * FROM employees
WHERE department_id = 10 OR department_id = 20;

-- NOT: negate a condition
SELECT * FROM employees
WHERE NOT department_id = 10;
```

**Operator precedence**: `NOT` > `AND` > `OR`. Use parentheses to be explicit:

```sql
-- Without parentheses: AND binds tighter than OR
SELECT * FROM employees
WHERE department_id = 10 OR department_id = 20 AND salary > 60000;
-- Evaluates as: dept=10 OR (dept=20 AND salary>60000)

-- With parentheses: explicit intent
SELECT * FROM employees
WHERE (department_id = 10 OR department_id = 20) AND salary > 60000;
```

### IN, BETWEEN, LIKE

```sql
-- IN: match any value in a list
SELECT * FROM employees WHERE department_id IN (10, 20, 30);

-- BETWEEN: inclusive range
SELECT * FROM employees WHERE salary BETWEEN 40000 AND 80000;
-- Equivalent to: salary >= 40000 AND salary <= 80000

-- LIKE: pattern matching
SELECT * FROM employees WHERE last_name LIKE 'S%';     -- starts with S
SELECT * FROM employees WHERE last_name LIKE '%son';    -- ends with son
SELECT * FROM employees WHERE last_name LIKE '_a%';     -- second char is 'a'
SELECT * FROM employees WHERE email LIKE '%@gmail.com';
```

| Wildcard | Meaning |
|---|---|
| `%` | Zero or more characters |
| `_` | Exactly one character |

### NULL Handling

`NULL` is not a value — it represents the **absence** of a value. You cannot use `=` or `!=` with NULL.

```sql
-- WRONG: this returns no rows even if commission IS null
SELECT * FROM employees WHERE commission = NULL;

-- CORRECT
SELECT * FROM employees WHERE commission IS NULL;
SELECT * FROM employees WHERE commission IS NOT NULL;
```

Why? Because any comparison with `NULL` yields `UNKNOWN` (not `TRUE` or `FALSE`), and `WHERE` only keeps rows that evaluate to `TRUE`.

---

## ORDER BY — Sorting Results

```sql
-- Ascending (default)
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees ORDER BY salary ASC;

-- Descending
SELECT * FROM employees ORDER BY salary DESC;

-- Multiple columns: sort by department first, then by salary within each department
SELECT * FROM employees ORDER BY department_id ASC, salary DESC;
```

### Sorting by Alias or Position

```sql
-- By alias (works because ORDER BY runs after SELECT)
SELECT first_name, salary * 12 AS annual_salary
FROM employees
ORDER BY annual_salary DESC;

-- By column position (1-based index)
SELECT first_name, last_name, salary
FROM employees
ORDER BY 3 DESC;   -- sorts by salary (3rd column)
```

Position-based ordering is fragile — avoid it in production code. If someone adds a column, the number shifts.

### NULL Ordering

Different databases handle NULL sort order differently:

| RDBMS | NULL sorts... |
|---|---|
| PostgreSQL | LAST in ASC, FIRST in DESC |
| MySQL | FIRST in ASC, LAST in DESC |
| Oracle | LAST in ASC, FIRST in DESC |
| SQL Server | FIRST in ASC, LAST in DESC |

PostgreSQL and Oracle support explicit control:

```sql
SELECT * FROM employees ORDER BY commission ASC NULLS LAST;
SELECT * FROM employees ORDER BY commission DESC NULLS FIRST;
```

---

## GROUP BY — Aggregation

`GROUP BY` collapses rows into **groups** based on one or more columns. You then apply **aggregate functions** to each group.

### Aggregate Functions

| Function | Description |
|---|---|
| `COUNT(*)` | Number of rows in the group |
| `COUNT(column)` | Number of non-NULL values |
| `COUNT(DISTINCT column)` | Number of distinct non-NULL values |
| `SUM(column)` | Sum of values |
| `AVG(column)` | Average of values |
| `MIN(column)` | Minimum value |
| `MAX(column)` | Maximum value |

### Basic Grouping

```sql
-- Average salary per department
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id;

-- Number of employees per department
SELECT department_id, COUNT(*) AS headcount
FROM employees
GROUP BY department_id;

-- Multiple aggregations
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

### The SELECT Rule

When using `GROUP BY`, every column in `SELECT` must be either:
1. Listed in `GROUP BY`, or
2. Inside an aggregate function

```sql
-- VALID
SELECT department_id, AVG(salary) FROM employees GROUP BY department_id;

-- INVALID (first_name is not grouped or aggregated)
SELECT department_id, first_name, AVG(salary) FROM employees GROUP BY department_id;
-- Error: column "first_name" must appear in the GROUP BY clause
-- or be used in an aggregate function
```

### Grouping by Multiple Columns

```sql
SELECT department_id, job_title, COUNT(*) AS headcount
FROM employees
GROUP BY department_id, job_title
ORDER BY department_id, headcount DESC;
```

This creates a group for each unique `(department_id, job_title)` combination.

---

## HAVING — Filter After Aggregation

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** aggregation.

```sql
-- Departments with average salary above 70,000
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 70000;

-- Departments with more than 5 employees
SELECT department_id, COUNT(*) AS headcount
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 5;
```

### WHERE vs HAVING

```sql
-- WHERE filters rows before grouping
-- HAVING filters groups after aggregation
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
WHERE hire_date >= '2023-01-01'       -- only recent hires
GROUP BY department_id
HAVING AVG(salary) > 60000            -- only departments with high avg
ORDER BY avg_salary DESC;
```

| Clause | Filters | Runs | Can use aggregates? |
|---|---|---|---|
| `WHERE` | Individual rows | Before `GROUP BY` | No |
| `HAVING` | Groups | After `GROUP BY` | Yes |

**Performance tip**: Always prefer `WHERE` over `HAVING` when possible. Filtering rows early reduces the data that `GROUP BY` has to process.

---

## Putting It All Together

A real-world query using all four clauses:

```sql
-- Top 5 departments by headcount, 
-- only counting active employees hired since 2022,
-- only departments with 10+ people
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

Execution order:
1. **FROM** + **JOIN** — combine `employees` and `departments`
2. **WHERE** — keep only active employees hired since 2022
3. **GROUP BY** — group by department name
4. **HAVING** — keep departments with 10+ employees
5. **SELECT** — compute aggregates and project columns
6. **ORDER BY** — sort by headcount descending
7. **LIMIT** — return top 5

---

## Common Pitfalls

### 1. Using WHERE with Aggregates

```sql
-- WRONG
SELECT department_id, COUNT(*)
FROM employees
WHERE COUNT(*) > 5        -- aggregate in WHERE → error
GROUP BY department_id;

-- CORRECT: use HAVING
SELECT department_id, COUNT(*)
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 5;
```

### 2. Referencing Aliases in WHERE

```sql
-- WRONG (WHERE runs before SELECT)
SELECT salary * 12 AS annual_salary
FROM employees
WHERE annual_salary > 100000;

-- CORRECT: repeat the expression
SELECT salary * 12 AS annual_salary
FROM employees
WHERE salary * 12 > 100000;

-- Or use a subquery
SELECT * FROM (
    SELECT *, salary * 12 AS annual_salary FROM employees
) sub
WHERE annual_salary > 100000;
```

### 3. GROUP BY and NULL

`GROUP BY` treats all `NULL` values as belonging to the **same group**:

```sql
SELECT department_id, COUNT(*) 
FROM employees 
GROUP BY department_id;
-- If some employees have NULL department_id,
-- they all appear in one group with department_id = NULL
```

### 4. COUNT(*) vs COUNT(column)

```sql
-- COUNT(*) counts all rows, including those with NULL values
-- COUNT(column) counts only non-NULL values in that column

SELECT
    COUNT(*) AS total_rows,              -- e.g., 100
    COUNT(commission) AS with_commission  -- e.g., 35 (65 NULLs)
FROM employees;
```

---

## Quick Reference

```sql
SELECT [DISTINCT] columns / expressions
FROM table
[WHERE row_conditions]
[GROUP BY columns]
[HAVING group_conditions]
[ORDER BY columns [ASC|DESC]]
[LIMIT n];
```

| Clause | Purpose | Required? |
|---|---|---|
| `SELECT` | What to return | Yes |
| `FROM` | Source table(s) | Yes |
| `WHERE` | Filter rows | No |
| `GROUP BY` | Group rows for aggregation | No |
| `HAVING` | Filter groups | No |
| `ORDER BY` | Sort results | No |
| `LIMIT` | Restrict row count | No |
