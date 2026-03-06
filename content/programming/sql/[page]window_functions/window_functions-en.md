---
title: "Window Functions"
description: "Deep dive into SQL window functions — ROW_NUMBER, RANK, DENSE_RANK, NTILE, PARTITION BY, OVER clause, LAG/LEAD, running totals, moving averages, and advanced analytical patterns."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "window function", "ROW_NUMBER", "RANK", "PARTITION BY", "analytics", "database"]
author: "Nemit"
featured: false
pinned: false
---

# Window Functions

Window functions perform calculations across a **set of rows related to the current row** — without collapsing them into a single output like `GROUP BY`. They provide analytical capabilities that are extremely difficult (or impossible) to express with standard aggregation.

---

## The OVER Clause

Every window function uses the `OVER()` clause to define which rows to operate on.

```sql
-- Aggregate function: collapses rows
SELECT department, AVG(salary) FROM employees GROUP BY department;
-- Returns 1 row per department

-- Window function: keeps all rows
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER() AS company_avg
FROM employees;
-- Returns every row, each with the company-wide average
```

### OVER() Breakdown

```sql
function_name() OVER (
    [PARTITION BY col1, col2, ...]    -- divide rows into groups
    [ORDER BY col3 [ASC|DESC], ...]   -- order rows within each group
    [frame_clause]                     -- define the row range
)
```

---

## PARTITION BY

Divides rows into groups (partitions). The window function resets for each partition.

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

Without `PARTITION BY`, the window includes **all rows**. With `PARTITION BY department`, each department is treated separately.

---

## Ranking Functions

### ROW_NUMBER()

Assigns a **unique sequential number** to each row. No ties — even identical values get different numbers (order is arbitrary for ties).

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

Like `ROW_NUMBER()`, but **ties get the same rank**. The next rank **skips** the number of tied rows.

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

Note: rank 4 is skipped because two rows share rank 3.

### DENSE_RANK()

Like `RANK()`, but **no gaps**. The next rank after a tie is the next consecutive number.

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

### Comparison

```
Salary:      120000  90000  80000  80000  70000
ROW_NUMBER:    1       2      3      4      5
RANK:          1       2      3      3      5
DENSE_RANK:    1       2      3      3      4
```

### NTILE(n)

Distributes rows into `n` roughly equal groups (buckets).

```sql
SELECT
    name,
    salary,
    NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

| name | salary | quartile |
|---|---|---|
| Alice | 120000 | 1 |
| Carol | 90000 | 1 |
| Bob | 80000 | 2 |
| Dave | 80000 | 3 |
| Eve | 70000 | 4 |

Useful for dividing data into percentiles, quartiles, or deciles.

---

## Ranking with PARTITION BY

The most common pattern: rank **within groups**.

```sql
-- Top 3 highest-paid employees per department
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
-- Latest order per customer
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

## Offset Functions: LAG and LEAD

Access values from **previous** or **next** rows without a self-join.

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

### Offset and Default Value

```sql
-- LAG(column, offset, default)
LAG(revenue, 1, 0)    -- 1 row back, default 0 if no previous
LAG(revenue, 7)       -- 7 rows back (week-over-week)
LEAD(revenue, 1, 0)   -- 1 row forward, default 0 if no next
```

### Practical Example: Year-over-Year Growth

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

> **Important**: `LAST_VALUE` requires a frame clause extending to the end of the partition. The default frame (`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`) only goes up to the current row.

```sql
-- NTH_VALUE: get the Nth row's value
NTH_VALUE(salary, 2) OVER (
    PARTITION BY department ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
) AS second_highest_salary
```

---

## Aggregate Window Functions

Standard aggregates work as window functions when paired with `OVER()`.

### Running Total

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

### Running Average

```sql
SELECT
    order_date,
    revenue,
    AVG(revenue) OVER (ORDER BY order_date) AS running_avg
FROM daily_sales;
```

### Moving Average (7-Day)

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

### Cumulative Count and Percentage

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

## Frame Clause (Window Frame)

The frame clause defines **which rows** within the partition are included in the calculation.

### Syntax

```sql
{ ROWS | RANGE | GROUPS } BETWEEN
    frame_start AND frame_end
```

### Frame Boundaries

| Boundary | Meaning |
|---|---|
| `UNBOUNDED PRECEDING` | First row of partition |
| `n PRECEDING` | n rows before current row |
| `CURRENT ROW` | The current row |
| `n FOLLOWING` | n rows after current row |
| `UNBOUNDED FOLLOWING` | Last row of partition |

### Default Frames

```sql
-- With ORDER BY: default is
RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

-- Without ORDER BY: default is
RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
```

### ROWS vs RANGE vs GROUPS

```sql
-- ROWS: physical rows
SUM(salary) OVER (ORDER BY hire_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
-- Includes current row + 2 rows before it (3 rows total)

-- RANGE: logical range of values
SUM(salary) OVER (ORDER BY hire_date RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW)
-- Includes all rows within 7 days before the current row's hire_date

-- GROUPS: groups of tied rows
SUM(salary) OVER (ORDER BY hire_date GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
-- Includes current group + 1 group before + 1 group after
```

### Practical Frame Examples

```sql
-- 3-row moving average
AVG(val) OVER (ORDER BY date ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)

-- Running total (all rows up to current)
SUM(val) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

-- Total of all rows in partition (ignores ORDER BY)
SUM(val) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)

-- Future running total (current row to end)
SUM(val) OVER (ORDER BY date ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)
```

---

## Advanced Patterns

### Identify Gaps in Sequences

```sql
SELECT
    id,
    id - ROW_NUMBER() OVER (ORDER BY id) AS grp
FROM existing_ids;
-- Rows with the same grp value are consecutive
```

### Islands Problem (Consecutive Date Ranges)

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

### Running Distinct Count (Approximate)

```sql
-- Count of distinct customers up to each date
SELECT
    order_date,
    COUNT(DISTINCT customer_id) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_unique_customers   -- Note: not supported in all RDBMS
FROM orders;

-- Alternative: use a subquery or CTE
WITH daily AS (
    SELECT order_date, customer_id,
        MIN(order_date) OVER (PARTITION BY customer_id) AS first_order
    FROM orders
)
SELECT
    order_date,
    SUM(CASE WHEN order_date = first_order THEN 1 ELSE 0 END) OVER (
        ORDER BY order_date
    ) AS cumulative_new_customers
FROM daily;
```

### Percent Rank and Cumulative Distribution

```sql
SELECT
    name,
    salary,
    PERCENT_RANK() OVER (ORDER BY salary)  AS pct_rank,   -- 0.0 to 1.0
    CUME_DIST() OVER (ORDER BY salary)     AS cume_dist    -- 0.0 to 1.0
FROM employees;
```

- `PERCENT_RANK()`: `(rank - 1) / (total_rows - 1)` — what percentage of rows are below this one
- `CUME_DIST()`: `rows_at_or_below / total_rows` — what fraction includes this value

---

## Named Windows

Avoid repeating the same `OVER()` clause by defining named windows:

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

## Performance Considerations

1. **Window functions scan the partition** — large partitions are slow
2. **Indexes on ORDER BY columns** help performance
3. **ROWS is faster than RANGE** — RANGE must compare values, ROWS just counts
4. **Avoid unnecessary PARTITION BY** — it creates more groups to process
5. **Combine window functions on the same window** — the optimizer can compute them in one pass

```sql
-- Efficient: same window
SELECT
    SUM(x) OVER w,
    AVG(x) OVER w,
    COUNT(x) OVER w
FROM t
WINDOW w AS (ORDER BY id);

-- Less efficient: different windows (forces multiple passes)
SELECT
    SUM(x) OVER (ORDER BY id),
    AVG(x) OVER (ORDER BY date),      -- different ORDER BY
    COUNT(x) OVER (PARTITION BY dept)   -- different partitioning
FROM t;
```

---

## Common Pitfalls

### Default Frame Trap

```sql
-- Surprising: LAST_VALUE returns the CURRENT ROW, not the actual last row!
LAST_VALUE(name) OVER (PARTITION BY dept ORDER BY salary)
-- Default frame: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

-- Fix: extend the frame
LAST_VALUE(name) OVER (
    PARTITION BY dept ORDER BY salary
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
```

### NULL Handling

```sql
-- LAG returns NULL for the first row (no previous row)
-- Use a default: LAG(col, 1, 0)

-- NULLs in ORDER BY: behavior varies by RDBMS
-- PostgreSQL: NULLS LAST (default for ASC)
-- MySQL: treats NULL as smallest value
```

### Window Functions in WHERE

```sql
-- This does NOT work:
SELECT * FROM employees
WHERE ROW_NUMBER() OVER (ORDER BY salary DESC) <= 5;
-- ERROR: window functions not allowed in WHERE

-- Fix: use a subquery or CTE
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
    FROM employees
) t
WHERE rn <= 5;
```

---

## Quick Reference

```sql
-- Ranking
ROW_NUMBER() OVER (ORDER BY col)               -- unique sequential
RANK()       OVER (ORDER BY col)               -- ties, with gaps
DENSE_RANK() OVER (ORDER BY col)               -- ties, no gaps
NTILE(n)     OVER (ORDER BY col)               -- n equal buckets

-- Offset
LAG(col, offset, default)  OVER (ORDER BY col) -- previous row
LEAD(col, offset, default) OVER (ORDER BY col) -- next row
FIRST_VALUE(col) OVER (...)                     -- first in frame
LAST_VALUE(col)  OVER (... ROWS BETWEEN ... AND UNBOUNDED FOLLOWING)
NTH_VALUE(col, n) OVER (...)                   -- nth in frame

-- Aggregates
SUM(col)   OVER (...)       -- running/windowed sum
AVG(col)   OVER (...)       -- running/windowed average
COUNT(col) OVER (...)       -- running/windowed count
MIN(col)   OVER (...)       -- running/windowed min
MAX(col)   OVER (...)       -- running/windowed max

-- Distribution
PERCENT_RANK() OVER (ORDER BY col)  -- 0.0 to 1.0
CUME_DIST()    OVER (ORDER BY col)  -- cumulative distribution

-- Frame clause
ROWS BETWEEN n PRECEDING AND m FOLLOWING
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING

-- Named window
SELECT ... OVER w FROM t WINDOW w AS (ORDER BY col);
```
