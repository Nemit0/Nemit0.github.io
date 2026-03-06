---
title: "Database Normalization: 1NF, 2NF, 3NF, BCNF"
description: "A thorough guide to database normalization — why we normalize, functional dependencies, normal forms from 1NF through BCNF, denormalization trade-offs, and practical examples at each level."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "normalization", "1NF", "2NF", "3NF", "BCNF", "database design", "functional dependency"]
author: "Nemit"
featured: false
pinned: false
---

# Database Normalization: 1NF, 2NF, 3NF, BCNF

**Normalization** is the process of organizing a relational database to reduce redundancy and prevent anomalies (insertion, update, deletion anomalies). It decomposes tables into smaller, well-structured tables connected by foreign keys.

---

## Why Normalize?

Consider this unnormalized table:

**orders_raw**

| order_id | customer_name | customer_email | product | price | qty |
|---|---|---|---|---|---|
| 1 | Alice | alice@mail.com | Laptop | 1200 | 1 |
| 2 | Alice | alice@mail.com | Mouse | 25 | 2 |
| 3 | Bob | bob@mail.com | Laptop | 1200 | 1 |
| 4 | Alice | alice_new@mail.com | Keyboard | 75 | 1 |

### Problems (Anomalies)

**Update anomaly**: Alice's email appears in multiple rows. If she changes her email, we must update every row — and row 4 shows it was already updated inconsistently.

**Insertion anomaly**: We can't add a new customer without an order. There's no place to store customer info independently.

**Deletion anomaly**: If we delete Bob's only order (row 3), we lose all information about Bob.

**Data redundancy**: `customer_name` and `customer_email` are repeated for every order by that customer. `product` and `price` are repeated every time that product is ordered.

Normalization eliminates these issues by giving each "fact" exactly one home.

---

## Prerequisite: Functional Dependencies

A **functional dependency** (FD) describes a relationship between columns: if column A determines column B, we write **A → B** ("A functionally determines B").

Given `A → B`: for any two rows with the same value of A, the value of B must also be the same.

Examples from the table above:
- `order_id → customer_name, customer_email, product, price, qty` (order_id uniquely determines everything)
- `customer_name → customer_email` (each customer has one email)
- `product → price` (each product has one price)

**Candidate key**: A minimal set of columns that uniquely determines all other columns. Here, `order_id` is the candidate key (and primary key).

---

## First Normal Form (1NF)

**Rule**: Every column must contain **atomic** (indivisible) values. No repeating groups or arrays.

### Violation

| student_id | name | courses |
|---|---|---|
| 1 | Alice | Math, Physics, CS |
| 2 | Bob | Chemistry, Biology |

`courses` contains multiple values — not atomic.

### Fix: 1NF

**Option A** — Separate rows:

| student_id | name | course |
|---|---|---|
| 1 | Alice | Math |
| 1 | Alice | Physics |
| 1 | Alice | CS |
| 2 | Bob | Chemistry |
| 2 | Bob | Biology |

**Option B** — Separate table:

**students**

| student_id | name |
|---|---|
| 1 | Alice |
| 2 | Bob |

**student_courses**

| student_id | course |
|---|---|
| 1 | Math |
| 1 | Physics |
| 1 | CS |
| 2 | Chemistry |
| 2 | Biology |

Option B is typically preferred — it avoids redundancy of `name`.

### 1NF Checklist

- [ ] Each column has atomic values (no lists, sets, or nested tables)
- [ ] Each row is unique (has a primary key)
- [ ] Column order doesn't matter
- [ ] All entries in a column have the same data type

---

## Second Normal Form (2NF)

**Rule**: Must be in 1NF, and every non-key column must depend on the **whole** primary key — not just part of it (no **partial dependencies**).

2NF only matters when the primary key is **composite** (multiple columns). If the key is a single column, 1NF automatically satisfies 2NF.

### Violation

Consider a composite key `(student_id, course_id)`:

| student_id | course_id | student_name | course_name | grade |
|---|---|---|---|---|
| 1 | 101 | Alice | Database | A |
| 1 | 102 | Alice | Networks | B |
| 2 | 101 | Bob | Database | B+ |

Functional dependencies:
- `student_id → student_name` (partial: depends only on part of the key)
- `course_id → course_name` (partial: depends only on part of the key)
- `(student_id, course_id) → grade` (full: depends on the whole key)

`student_name` depends only on `student_id`, not on the full key `(student_id, course_id)`. This is a **partial dependency**.

### Fix: 2NF

Decompose into three tables:

**students**

| student_id | student_name |
|---|---|
| 1 | Alice |
| 2 | Bob |

**courses**

| course_id | course_name |
|---|---|
| 101 | Database |
| 102 | Networks |

**enrollments**

| student_id | course_id | grade |
|---|---|---|
| 1 | 101 | A |
| 1 | 102 | B |
| 2 | 101 | B+ |

Now every non-key attribute depends on the whole key of its table.

### 2NF Checklist

- [ ] Is in 1NF
- [ ] No non-key column depends on only part of the composite primary key
- [ ] If the primary key is a single column, 2NF is automatically satisfied

---

## Third Normal Form (3NF)

**Rule**: Must be in 2NF, and every non-key column must depend **directly** on the primary key — not through another non-key column (no **transitive dependencies**).

In other words: non-key columns shouldn't determine other non-key columns.

### Violation

| emp_id | emp_name | dept_id | dept_name | dept_location |
|---|---|---|---|---|
| 1 | Alice | 10 | Engineering | Building A |
| 2 | Bob | 20 | Marketing | Building B |
| 3 | Charlie | 10 | Engineering | Building A |

Functional dependencies:
- `emp_id → emp_name, dept_id, dept_name, dept_location`
- `dept_id → dept_name, dept_location`

The chain: `emp_id → dept_id → dept_name, dept_location`

`dept_name` and `dept_location` depend on `emp_id` **transitively** through `dept_id`. This is a **transitive dependency**.

### Fix: 3NF

**employees**

| emp_id | emp_name | dept_id |
|---|---|---|
| 1 | Alice | 10 |
| 2 | Bob | 20 |
| 3 | Charlie | 10 |

**departments**

| dept_id | dept_name | dept_location |
|---|---|---|
| 10 | Engineering | Building A |
| 20 | Marketing | Building B |

Now `dept_name` and `dept_location` depend directly on their own table's key (`dept_id`), not transitively through `emp_id`.

### 3NF Checklist

- [ ] Is in 2NF
- [ ] No non-key column depends on another non-key column (no transitive dependency)
- [ ] Every non-key column depends directly on the primary key only

---

## Boyce-Codd Normal Form (BCNF)

**Rule**: Must be in 3NF, and for every functional dependency `A → B`, A must be a **superkey** (a candidate key or superset of one).

BCNF is a stricter version of 3NF. The difference only matters when:
1. There are **multiple candidate keys**
2. The candidate keys are **composite** and **overlapping**

### When 3NF ≠ BCNF

| student | subject | professor |
|---|---|---|
| Alice | Database | Dr. Kim |
| Bob | Database | Dr. Kim |
| Alice | Networks | Dr. Park |
| Charlie | Networks | Dr. Lee |

**Business rules**:
- Each professor teaches only one subject: `professor → subject`
- Each student takes each subject once: `(student, subject)` is a candidate key
- Each student has one professor per subject: `(student, subject) → professor`

Functional dependencies:
- `(student, subject) → professor` ← `(student, subject)` is a superkey ✅
- `professor → subject` ← `professor` is **not** a superkey ❌ BCNF violation

`professor → subject` violates BCNF because `professor` alone is not a candidate key.

### Fix: BCNF

**professor_subjects**

| professor | subject |
|---|---|
| Dr. Kim | Database |
| Dr. Park | Networks |
| Dr. Lee | Networks |

**student_professors**

| student | professor |
|---|---|
| Alice | Dr. Kim |
| Bob | Dr. Kim |
| Alice | Dr. Park |
| Charlie | Dr. Lee |

Now every determinant is a superkey in its table.

### BCNF vs 3NF Trade-off

BCNF decomposition can sometimes **lose** the ability to enforce certain dependencies directly. In the example above, the constraint "each student takes each subject once" is harder to enforce without joining both tables.

In practice, most 3NF designs are already in BCNF. The BCNF edge case is relatively rare.

---

## Summary of Normal Forms

| NF | Rule | Eliminates |
|---|---|---|
| **1NF** | Atomic values, unique rows | Repeating groups |
| **2NF** | No partial dependencies | Partial dependencies (composite key issue) |
| **3NF** | No transitive dependencies | Transitive dependencies |
| **BCNF** | Every determinant is a superkey | Non-superkey determinants |

Each level builds on the previous:

```
Unnormalized → 1NF → 2NF → 3NF → BCNF
```

---

## The Normalization Process: A Complete Example

Starting table:

| order_id | date | cust_id | cust_name | cust_email | product_id | product_name | price | qty |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-01-15 | 100 | Alice | a@m.com | P1 | Laptop | 1200 | 1 |
| 1 | 2026-01-15 | 100 | Alice | a@m.com | P2 | Mouse | 25 | 2 |
| 2 | 2026-01-16 | 101 | Bob | b@m.com | P1 | Laptop | 1200 | 1 |

### Step 1: 1NF

Already in 1NF — all values are atomic and rows are unique (composite key `(order_id, product_id)`).

### Step 2: 2NF

Partial dependencies on the composite key `(order_id, product_id)`:
- `order_id → date, cust_id, cust_name, cust_email` (partial)
- `product_id → product_name, price` (partial)
- `(order_id, product_id) → qty` (full)

Decompose:

**orders**: `(order_id, date, cust_id, cust_name, cust_email)`

**products**: `(product_id, product_name, price)`

**order_items**: `(order_id, product_id, qty)`

### Step 3: 3NF

In `orders`, there's a transitive dependency:
- `order_id → cust_id → cust_name, cust_email`

Decompose further:

**orders**: `(order_id, date, cust_id)`

**customers**: `(cust_id, cust_name, cust_email)`

**products**: `(product_id, product_name, price)`

**order_items**: `(order_id, product_id, qty)`

### Final Schema

```sql
CREATE TABLE customers (
    cust_id    INT PRIMARY KEY,
    cust_name  VARCHAR(100) NOT NULL,
    cust_email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
    product_id   VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    price        DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
    order_id   INT PRIMARY KEY,
    order_date DATE NOT NULL,
    cust_id    INT NOT NULL REFERENCES customers(cust_id)
);

CREATE TABLE order_items (
    order_id   INT NOT NULL REFERENCES orders(order_id),
    product_id VARCHAR(10) NOT NULL REFERENCES products(product_id),
    qty        INT NOT NULL CHECK (qty > 0),
    PRIMARY KEY (order_id, product_id)
);
```

---

## Denormalization

Sometimes you **intentionally** violate normalization for performance. This is called **denormalization**.

### When to Denormalize

- **Read-heavy workloads**: Avoid expensive JOINs on every read
- **Reporting/analytics**: Pre-compute aggregates
- **Caching frequently accessed data**: Store computed or joined values
- **High-traffic queries**: Reduce query complexity

### Common Denormalization Patterns

```sql
-- Store a computed total instead of calculating it each time
ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2);

-- Store a redundant column to avoid a JOIN
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100);
-- Now queries don't need to JOIN customers table
```

### Trade-offs

| Normalized | Denormalized |
|---|---|
| Less storage | More storage |
| No redundancy | Controlled redundancy |
| Slower reads (JOINs) | Faster reads |
| Faster writes | Slower writes (update redundant data) |
| Data integrity guaranteed | Must maintain consistency manually |

**Rule of thumb**: Normalize first during design. Denormalize later only when you have measured performance problems that normalization causes.

---

## Quick Reference

| Normal Form | Key Question |
|---|---|
| **1NF** | Are all values atomic? |
| **2NF** | Does every non-key column depend on the *whole* key? |
| **3NF** | Does every non-key column depend *directly* on the key (not through another non-key)? |
| **BCNF** | Is every determinant a superkey? |

```
1NF: no repeating groups
2NF: 1NF + no partial dependencies
3NF: 2NF + no transitive dependencies
BCNF: 3NF + every determinant is a superkey
```
