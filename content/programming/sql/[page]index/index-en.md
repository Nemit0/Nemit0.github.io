---
title: "SQL Indexes: Concepts, Types, and Optimization"
description: "A comprehensive guide to database indexes — how they work internally (B-Tree, Hash, GIN, GiST), when to create them, composite indexes, covering indexes, and common anti-patterns."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "index", "B-Tree", "database optimization", "query performance", "composite index", "covering index"]
author: "Nemit"
featured: false
pinned: false
---

# SQL Indexes: Concepts, Types, and Optimization

An **index** is a data structure that speeds up data retrieval at the cost of additional storage and slower writes. Think of it like a book's index — instead of reading every page to find a topic, you look up the page number in the index.

Without indexes, the database must perform a **full table scan** — reading every row to find matches. With an index, it can jump directly to the relevant rows.

---

## How Indexes Work

### The Problem: Full Table Scan

```sql
SELECT * FROM employees WHERE last_name = 'Kim';
```

Without an index on `last_name`, the database reads **every row** in the table and checks the condition. For a table with 1 million rows, that's 1 million comparisons.

### The Solution: B-Tree Index

Most databases default to B-Tree (Balanced Tree) indexes. A B-Tree maintains sorted data in a tree structure with logarithmic lookup time.

```
                    [Johnson]
                   /         \
          [Davis]              [Smith]
         /       \            /       \
    [Adams]  [Garcia]   [Kim, Lee]  [Wilson]
       ↓        ↓          ↓   ↓       ↓
    rows...  rows...    rows  rows   rows...
```

To find `last_name = 'Kim'`:
1. Start at root: 'Kim' < 'Johnson'? No → go right
2. At 'Smith': 'Kim' < 'Smith'? Yes → go left
3. At leaf: found 'Kim' → follow pointer to actual rows

**Time complexity**: O(log n) instead of O(n). For 1 million rows, ~20 comparisons instead of 1 million.

---

## Creating and Managing Indexes

### Basic Syntax

```sql
-- Create an index
CREATE INDEX idx_emp_lastname ON employees(last_name);

-- Create a unique index (enforces uniqueness)
CREATE UNIQUE INDEX idx_emp_email ON employees(email);

-- Drop an index
DROP INDEX idx_emp_lastname;

-- PostgreSQL: create concurrently (doesn't lock the table)
CREATE INDEX CONCURRENTLY idx_emp_lastname ON employees(last_name);
```

### Viewing Indexes

```sql
-- PostgreSQL
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'employees';

-- MySQL
SHOW INDEX FROM employees;

-- SQL Server
EXEC sp_helpindex 'employees';
```

---

## Index Types

### 1. B-Tree Index (Default)

Best for: equality (`=`), range (`>`, `<`, `BETWEEN`), sorting (`ORDER BY`), prefix `LIKE` (`LIKE 'abc%'`).

```sql
CREATE INDEX idx_salary ON employees(salary);

-- All of these can use the B-Tree index:
SELECT * FROM employees WHERE salary = 75000;
SELECT * FROM employees WHERE salary > 50000;
SELECT * FROM employees WHERE salary BETWEEN 40000 AND 80000;
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees WHERE last_name LIKE 'Kim%';  -- prefix only!
```

**Cannot use for**: `LIKE '%Kim'` (no leading wildcard).

### 2. Hash Index

Best for: exact equality (`=`) only. Faster than B-Tree for equality lookups but useless for range queries.

```sql
-- PostgreSQL
CREATE INDEX idx_emp_email_hash ON employees USING HASH (email);

-- Only useful for:
SELECT * FROM employees WHERE email = 'alice@example.com';

-- CANNOT use for:
SELECT * FROM employees WHERE email > 'a';  -- range query
SELECT * FROM employees ORDER BY email;      -- sorting
```

Most databases (MySQL InnoDB, SQL Server) only support B-Tree. PostgreSQL supports Hash indexes.

### 3. GIN (Generalized Inverted Index)

Best for: full-text search, array containment, JSONB queries.

```sql
-- PostgreSQL: index for full-text search
CREATE INDEX idx_articles_fts ON articles USING GIN (to_tsvector('english', content));

-- Query
SELECT * FROM articles
WHERE to_tsvector('english', content) @@ to_tsquery('database & optimization');

-- JSONB index
CREATE INDEX idx_data_gin ON events USING GIN (metadata);
SELECT * FROM events WHERE metadata @> '{"type": "click"}';
```

### 4. GiST (Generalized Search Tree)

Best for: geometric data, range types, full-text search (alternative to GIN).

```sql
-- PostgreSQL: spatial index
CREATE INDEX idx_locations_geo ON locations USING GIST (coordinates);

-- Range type index
CREATE INDEX idx_booking_dates ON bookings USING GIST (date_range);
```

---

## Composite (Multi-Column) Indexes

An index on multiple columns. The column order matters significantly.

```sql
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);
```

### The Leftmost Prefix Rule

A composite index can be used for queries that filter on a **left prefix** of the indexed columns:

```sql
-- Given: INDEX(department_id, salary)

-- ✅ Uses index: filters on department_id (leftmost)
SELECT * FROM employees WHERE department_id = 10;

-- ✅ Uses index: filters on both columns
SELECT * FROM employees WHERE department_id = 10 AND salary > 50000;

-- ❌ Cannot use index: skips department_id
SELECT * FROM employees WHERE salary > 50000;
```

Think of it like a phone book sorted by (last_name, first_name). You can look up everyone named "Kim" (last_name), or "Kim, Minjun" (both). But you can't efficiently look up everyone named "Minjun" (first_name only) — the data isn't sorted that way.

### Column Order Strategy

Put the most **selective** (most unique values) column first, or the column most frequently used in `WHERE` clauses:

```sql
-- If queries always filter by department_id and sometimes by salary:
CREATE INDEX idx_dept_salary ON employees(department_id, salary);

-- If queries always filter by both:
-- Put the more selective column first
CREATE INDEX idx_dept_salary ON employees(department_id, salary);
```

---

## Covering Indexes

A **covering index** contains all columns needed by a query, so the database never needs to access the actual table — it reads everything from the index alone. This is called an **index-only scan**.

```sql
-- Index covers department_id and salary
CREATE INDEX idx_dept_salary ON employees(department_id, salary);

-- This query is "covered" — only needs index columns
SELECT department_id, salary FROM employees WHERE department_id = 10;

-- This query is NOT covered — needs name from the table
SELECT department_id, salary, name FROM employees WHERE department_id = 10;
```

### INCLUDE Columns (PostgreSQL, SQL Server)

Add columns to the index leaf pages without including them in the sort order:

```sql
-- PostgreSQL
CREATE INDEX idx_dept_salary_incl ON employees(department_id, salary) INCLUDE (name, email);

-- Now this is a covered query:
SELECT department_id, salary, name, email
FROM employees
WHERE department_id = 10;
```

`INCLUDE` columns are stored in the index but don't affect the tree structure — the index is still sorted only by `(department_id, salary)`.

---

## Clustered vs Non-Clustered Indexes

### Clustered Index

- Determines the **physical order** of data on disk
- Only **one** per table (data can only be physically sorted one way)
- In many databases, the primary key automatically creates a clustered index

```sql
-- SQL Server: explicit clustered index
CREATE CLUSTERED INDEX idx_emp_id ON employees(emp_id);

-- InnoDB (MySQL): PRIMARY KEY is always the clustered index
-- PostgreSQL: uses CLUSTER command (but doesn't maintain order automatically)
CLUSTER employees USING idx_emp_lastname;
```

### Non-Clustered Index

- A separate structure that **points** to the actual data
- Multiple per table (as many as needed)
- Contains the indexed columns + a pointer (row locator) to the data

```
Non-Clustered Index          Table (Heap/Clustered)
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

## When to Create Indexes

### Good Candidates

| Scenario | Why |
|---|---|
| `WHERE` clause columns | Direct filtering performance |
| `JOIN` columns (foreign keys) | Join performance |
| `ORDER BY` columns | Avoid sorting overhead |
| `GROUP BY` columns | Faster grouping |
| Columns with high cardinality | More selective = more useful |
| Frequently queried columns | Higher usage = higher benefit |

### Bad Candidates

| Scenario | Why |
|---|---|
| Small tables (< few thousand rows) | Full scan is fast enough |
| Columns with low cardinality | e.g., `gender` (only 2-3 values) |
| Rarely queried columns | Storage cost with no benefit |
| Heavily updated columns | Write overhead |
| Wide columns (large text/blob) | Huge index size |

---

## Index Performance Analysis

### EXPLAIN — Query Execution Plans

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM employees WHERE last_name = 'Kim';

-- Output shows:
-- Index Scan using idx_emp_lastname on employees
--   Index Cond: (last_name = 'Kim')
--   Rows Removed by Index Recheck: 0
--   Actual time: 0.023..0.025 rows=3 loops=1
```

```sql
-- MySQL
EXPLAIN SELECT * FROM employees WHERE last_name = 'Kim';

-- Look for:
-- type: ref (index used) vs ALL (full scan)
-- key: which index was used
-- rows: estimated rows scanned
```

### Common Scan Types (PostgreSQL)

| Scan Type | Meaning |
|---|---|
| **Seq Scan** | Full table scan (no index used) |
| **Index Scan** | Uses index, then fetches rows from table |
| **Index Only Scan** | Everything from the index (covering) |
| **Bitmap Index Scan** | Uses index to build a bitmap, then scans table |

---

## Common Anti-Patterns

### 1. Function on Indexed Column

```sql
-- Index on salary exists, but this query CANNOT use it:
SELECT * FROM employees WHERE UPPER(last_name) = 'KIM';

-- The index stores last_name, not UPPER(last_name)

-- Solution: functional index
CREATE INDEX idx_upper_lastname ON employees(UPPER(last_name));
-- Now the query can use the index
```

### 2. Implicit Type Conversion

```sql
-- phone_number is VARCHAR, but you compare with an integer:
SELECT * FROM employees WHERE phone_number = 12345;
-- Database may convert phone_number to integer, invalidating the index

-- Solution: use the correct type
SELECT * FROM employees WHERE phone_number = '12345';
```

### 3. Leading Wildcard in LIKE

```sql
-- Cannot use B-Tree index:
SELECT * FROM employees WHERE last_name LIKE '%Kim%';

-- Can use B-Tree index:
SELECT * FROM employees WHERE last_name LIKE 'Kim%';

-- For contains/suffix searches, use full-text search (GIN index)
```

### 4. OR Conditions

```sql
-- May not use index efficiently:
SELECT * FROM employees WHERE dept_id = 10 OR salary > 80000;

-- Solution: separate indexes on each column, or rewrite as UNION:
SELECT * FROM employees WHERE dept_id = 10
UNION
SELECT * FROM employees WHERE salary > 80000;
```

### 5. Over-Indexing

Every index:
- Increases storage (can be 10-30% of table size per index)
- Slows `INSERT`, `UPDATE`, `DELETE` (must update all indexes)
- Requires maintenance (`REINDEX`, `VACUUM` in PostgreSQL)

**Don't** create an index on every column. Profile your queries first with `EXPLAIN`, then add indexes for the bottlenecks.

---

## Index Maintenance

```sql
-- PostgreSQL: rebuild indexes
REINDEX TABLE employees;
REINDEX INDEX idx_emp_lastname;

-- PostgreSQL: check index bloat
SELECT
    schemaname, tablename, indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- MySQL: optimize table (rebuilds indexes)
OPTIMIZE TABLE employees;

-- SQL Server: rebuild/reorganize
ALTER INDEX idx_emp_lastname ON employees REBUILD;
ALTER INDEX idx_emp_lastname ON employees REORGANIZE;
```

---

## Quick Reference

```sql
-- Create index
CREATE INDEX idx_name ON table(column);
CREATE INDEX idx_name ON table(col1, col2);               -- composite
CREATE UNIQUE INDEX idx_name ON table(column);             -- unique
CREATE INDEX idx_name ON table(col1) INCLUDE (col2, col3); -- covering

-- Drop index
DROP INDEX idx_name;

-- Analyze query
EXPLAIN ANALYZE SELECT ...;
```

| Index Type | Best For | Supports Range? |
|---|---|---|
| B-Tree | General purpose | Yes |
| Hash | Exact equality | No |
| GIN | Full-text, JSONB, arrays | Depends |
| GiST | Spatial, ranges | Yes |

**Golden Rule**: Don't guess — measure. Use `EXPLAIN ANALYZE` to verify that your indexes are actually being used.
