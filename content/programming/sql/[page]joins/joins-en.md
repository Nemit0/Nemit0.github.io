---
title: "SQL JOINs: INNER, LEFT, RIGHT, FULL OUTER"
description: "A complete guide to SQL JOINs — how they work, when to use each type, visual intuition with Venn diagrams, performance considerations, and real-world patterns."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN", "CROSS JOIN", "database"]
author: "Nemit"
featured: false
pinned: false
---

# SQL JOINs: INNER, LEFT, RIGHT, FULL OUTER

JOINs combine rows from two or more tables based on a related column. They are the mechanism that makes relational databases *relational* — data is normalized across tables and reassembled at query time.

---

## Setup: Sample Tables

We'll use these two tables throughout:

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

Notice:
- Eve has no department (`NULL`).
- HR (dept_id 40) has no employees.

---

## INNER JOIN

Returns only rows where the join condition matches in **both** tables.

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

Eve is excluded (no matching `dept_id`). HR is excluded (no matching employee).

### How It Works

For each row in `employees`, the database finds all rows in `departments` where the ON condition is true. Only matching pairs survive.

```
employees       departments       Result
---------       -----------       ------
Alice (10)  ──→ 10 Engineering ──→ Alice, Engineering
Bob (20)    ──→ 20 Marketing   ──→ Bob, Marketing
Charlie (10)──→ 10 Engineering ──→ Charlie, Engineering
Diana (30)  ──→ 30 Sales       ──→ Diana, Sales
Eve (NULL)  ──→ (no match)        (excluded)
                40 HR              (excluded)
```

### Implicit JOIN Syntax (Old Style)

```sql
-- Equivalent to INNER JOIN, but harder to read
SELECT e.name, d.dept_name
FROM employees e, departments d
WHERE e.dept_id = d.dept_id;
```

Avoid this syntax in modern SQL. It mixes join conditions with filter conditions in `WHERE`, making complex queries hard to understand.

---

## LEFT JOIN (LEFT OUTER JOIN)

Returns **all rows from the left table** and matching rows from the right table. If there's no match, right-side columns are `NULL`.

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

Eve appears with `NULL` for `dept_name` — she's preserved because she's in the left table.

### Use Case: Find Unmatched Rows

A common pattern — find employees without a department:

```sql
SELECT e.name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_id IS NULL;
```

| name |
|---|
| Eve |

This is called an **anti-join** pattern. The `LEFT JOIN` + `IS NULL` combination efficiently finds rows in the left table with no match in the right table.

---

## RIGHT JOIN (RIGHT OUTER JOIN)

Returns **all rows from the right table** and matching rows from the left table. If there's no match, left-side columns are `NULL`.

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

HR appears with `NULL` for `name` — it has no employees.

### RIGHT JOIN = Reversed LEFT JOIN

Any `RIGHT JOIN` can be rewritten as a `LEFT JOIN` by swapping the table order:

```sql
-- These are equivalent:
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;

SELECT e.name, d.dept_name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id;
```

In practice, most developers prefer `LEFT JOIN` exclusively for consistency and readability.

---

## FULL OUTER JOIN

Returns **all rows from both tables**. Where there's no match, the missing side gets `NULL`.

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

Both Eve (no department) and HR (no employees) appear.

### MySQL Note

MySQL doesn't natively support `FULL OUTER JOIN`. Emulate it with `UNION`:

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
UNION
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;
```

`UNION` removes duplicates. Use `UNION ALL` if you want to preserve them (and add `WHERE` clauses to prevent overlap).

---

## CROSS JOIN

Returns the **Cartesian product** — every row from the left table paired with every row from the right table. No join condition.

```sql
SELECT e.name, d.dept_name
FROM employees e
CROSS JOIN departments d;
```

With 5 employees and 4 departments, this produces 5 × 4 = 20 rows.

### When to Use CROSS JOIN

- Generating combinations (e.g., all product-color combinations)
- Creating date ranges or grids
- Testing or data generation

```sql
-- Generate all month-year combinations for a report
SELECT m.month_name, y.year_val
FROM months m
CROSS JOIN years y;
```

**Warning**: Cross joins on large tables produce enormous result sets. A 10,000 × 10,000 cross join yields 100,000,000 rows.

---

## SELF JOIN

A table joined to itself. Useful for hierarchical data or comparing rows within the same table.

```sql
-- Find employees and their managers (both are in employees table)
SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;
```

```sql
-- Find employees in the same department
SELECT
    e1.name AS employee1,
    e2.name AS employee2
FROM employees e1
JOIN employees e2
    ON e1.dept_id = e2.dept_id
    AND e1.emp_id < e2.emp_id;   -- avoid duplicates and self-pairs
```

The `e1.emp_id < e2.emp_id` condition prevents (Alice, Charlie) and (Charlie, Alice) from both appearing, and prevents (Alice, Alice).

---

## Multiple JOINs

Real queries often join 3+ tables:

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

Each JOIN narrows or expands the result. Think of it as building up the dataset one relationship at a time.

---

## JOIN Conditions: ON vs WHERE

```sql
-- These produce different results with LEFT JOIN:

-- ON clause: filter applied DURING the join
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d
    ON e.dept_id = d.dept_id AND d.dept_name = 'Engineering';

-- WHERE clause: filter applied AFTER the join
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'Engineering';
```

With `ON`: All employees appear; only Engineering gets a department name — others get `NULL`.

With `WHERE`: Only employees in Engineering appear — the `LEFT JOIN` is effectively converted to an `INNER JOIN` because the `WHERE` filters out `NULL` values.

**Rule**: For `INNER JOIN`, `ON` and `WHERE` behave the same. For `OUTER JOIN`, they differ. Put join logic in `ON` and filter logic in `WHERE`.

---

## Non-Equi Joins

Joins don't have to use `=`. Any boolean expression works:

```sql
-- Find employees whose salary falls within a salary grade range
SELECT e.name, e.salary, g.grade
FROM employees e
JOIN salary_grades g
    ON e.salary BETWEEN g.min_salary AND g.max_salary;
```

```sql
-- Find all pairs where one employee earns more than another
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

## NATURAL JOIN and USING

### NATURAL JOIN

Automatically joins on all columns with the same name:

```sql
SELECT * FROM employees NATURAL JOIN departments;
-- Joins on dept_id (the common column)
```

**Avoid NATURAL JOIN** in production. If someone adds a column with the same name to both tables, the join condition silently changes.

### USING

A shorthand when the join column has the same name in both tables:

```sql
-- Instead of ON e.dept_id = d.dept_id
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d USING (dept_id);
```

`USING` is cleaner than `ON` when column names match. The joined column appears only once in the result (no duplication).

---

## Performance Considerations

### Indexes

The most important factor for JOIN performance. Ensure join columns are indexed:

```sql
-- These should have indexes:
CREATE INDEX idx_emp_dept ON employees(dept_id);
CREATE INDEX idx_dept_id ON departments(dept_id);
```

Without indexes, the database must do a **nested loop scan** — O(n × m) for each join.

### Join Algorithms

Databases use three main algorithms:

| Algorithm | Best For | How It Works |
|---|---|---|
| **Nested Loop** | Small tables or indexed joins | For each row in outer table, scan inner table |
| **Hash Join** | Large unsorted tables, equi-joins | Build hash table on smaller table, probe with larger |
| **Merge Join** | Pre-sorted data on join key | Walk both sorted inputs simultaneously |

The optimizer picks the algorithm based on table statistics, indexes, and data distribution.

### Reduce Rows Early

```sql
-- Better: filter before joining
SELECT e.name, d.dept_name
FROM (SELECT * FROM employees WHERE salary > 50000) e
JOIN departments d ON e.dept_id = d.dept_id;

-- Or equivalently with WHERE (optimizer usually handles this)
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE e.salary > 50000;
```

Modern optimizers typically push predicates down automatically, but understanding this helps when analyzing query plans.

---

## Quick Reference

| JOIN Type | Left Unmatched | Right Unmatched | Use When |
|---|---|---|---|
| `INNER JOIN` | Excluded | Excluded | You only want matched rows |
| `LEFT JOIN` | Included (NULLs) | Excluded | You need all left rows regardless |
| `RIGHT JOIN` | Excluded | Included (NULLs) | You need all right rows (prefer LEFT) |
| `FULL OUTER JOIN` | Included (NULLs) | Included (NULLs) | You need all rows from both sides |
| `CROSS JOIN` | N/A | N/A | You want every combination |

```sql
-- Template
SELECT columns
FROM left_table
[INNER | LEFT | RIGHT | FULL OUTER | CROSS] JOIN right_table
    ON left_table.col = right_table.col
[WHERE conditions]
[ORDER BY columns];
```
