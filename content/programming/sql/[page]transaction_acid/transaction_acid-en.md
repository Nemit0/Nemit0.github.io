---
title: "Transactions and ACID Properties"
description: "A deep dive into database transactions — ACID guarantees (Atomicity, Consistency, Isolation, Durability), isolation levels, concurrency problems (dirty reads, phantom reads), and practical transaction management."
date: "2026-03-06"
category: "programming/sql"
tags: ["SQL", "transaction", "ACID", "isolation level", "concurrency", "locking", "database"]
author: "Nemit"
featured: false
pinned: false
---

# Transactions and ACID Properties

A **transaction** is a sequence of SQL operations that form a single logical unit of work. Either **all** operations succeed (commit) or **none** of them take effect (rollback). Transactions are the foundation of data integrity in relational databases.

---

## What Is a Transaction?

```sql
-- Transfer $500 from Account A to Account B
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A';
UPDATE accounts SET balance = balance + 500 WHERE account_id = 'B';

COMMIT;
```

If the system crashes between the two `UPDATE` statements, the money would vanish — debited from A but never credited to B. Transactions prevent this: if any part fails, the entire transaction is rolled back.

```sql
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A';
-- System crash here!
-- On recovery: the first UPDATE is rolled back
-- Account A still has its original balance

COMMIT;
```

---

## ACID Properties

The four guarantees that every transaction must provide:

### Atomicity — "All or Nothing"

A transaction is an **indivisible** unit. Either all operations within it succeed, or none do. There is no partial execution.

```sql
BEGIN;
INSERT INTO orders (order_id, customer_id, total) VALUES (1, 100, 250.00);
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 'P1', 2);
INSERT INTO order_items (order_id, product_id, qty) VALUES (1, 'P2', 1);
-- If this INSERT fails (e.g., foreign key violation):
-- ALL three INSERTs are rolled back
COMMIT;
```

**Implementation**: Databases use a **write-ahead log** (WAL). Before modifying data, they write the intended change to a log file. On crash recovery, the log is replayed or undone to restore consistency.

### Consistency — "Valid State to Valid State"

A transaction brings the database from one **valid state** to another. All constraints (primary keys, foreign keys, CHECK constraints, triggers) must be satisfied after the transaction completes.

```sql
BEGIN;
-- This violates a CHECK constraint: balance >= 0
UPDATE accounts SET balance = balance - 10000
WHERE account_id = 'A';  -- account A only has $500

-- The database rejects this and rolls back
-- Consistency maintained: no negative balances
COMMIT;
```

Consistency is enforced by:
- Primary key / unique constraints
- Foreign key constraints
- CHECK constraints
- NOT NULL constraints
- Triggers and stored procedures

### Isolation — "Concurrent Transactions Don't Interfere"

Even when multiple transactions run simultaneously, each should behave as if it were the only one running. The result must be equivalent to some **serial** (one-at-a-time) execution.

```
Transaction 1:                  Transaction 2:
BEGIN;                          BEGIN;
READ balance of A → $1000      
                                READ balance of A → $1000
UPDATE A: balance = $500
                                UPDATE A: balance = $200
COMMIT;                         COMMIT;
-- What is A's balance? Depends on isolation level!
```

Without proper isolation, concurrent transactions can interfere in harmful ways (covered in detail below).

### Durability — "Committed = Permanent"

Once a transaction is committed, its changes **survive** any subsequent failure — power outage, crash, hardware failure.

**Implementation**: The WAL is flushed to disk before the `COMMIT` returns. Even if the system crashes immediately after, the committed changes can be recovered from the log.

---

## Transaction Control

```sql
-- Start a transaction
BEGIN;                  -- PostgreSQL, MySQL
BEGIN TRANSACTION;      -- SQL Server
START TRANSACTION;      -- MySQL alternative

-- Commit: make changes permanent
COMMIT;

-- Rollback: undo all changes since BEGIN
ROLLBACK;
```

### Savepoints — Partial Rollback

```sql
BEGIN;

INSERT INTO employees (emp_id, name) VALUES (1, 'Alice');
SAVEPOINT sp1;

INSERT INTO employees (emp_id, name) VALUES (2, 'Bob');
-- Oops, something went wrong with Bob
ROLLBACK TO sp1;
-- Bob's INSERT is undone, but Alice's remains

INSERT INTO employees (emp_id, name) VALUES (3, 'Charlie');
COMMIT;
-- Result: Alice (1) and Charlie (3) are inserted. Bob (2) is not.
```

### Auto-Commit Mode

By default, most databases run in **auto-commit** mode — each statement is its own transaction:

```sql
-- Each statement auto-commits:
INSERT INTO logs (msg) VALUES ('event 1');  -- committed immediately
INSERT INTO logs (msg) VALUES ('event 2');  -- committed immediately
```

To group statements into a single transaction, use `BEGIN ... COMMIT` explicitly.

---

## Concurrency Problems

When multiple transactions access the same data concurrently, several problems can occur:

### 1. Dirty Read

Reading data that another transaction has written **but not yet committed**.

```
T1: BEGIN;
T1: UPDATE accounts SET balance = 0 WHERE id = 'A';    -- not yet committed
T2: SELECT balance FROM accounts WHERE id = 'A';         -- reads 0 (dirty!)
T1: ROLLBACK;                                             -- undo the update
-- T2 used a value that never actually existed
```

### 2. Non-Repeatable Read

Reading the same row twice within a transaction and getting **different values** because another transaction modified and committed it in between.

```
T1: BEGIN;
T1: SELECT balance FROM accounts WHERE id = 'A';  -- reads $1000
T2: UPDATE accounts SET balance = 500 WHERE id = 'A';
T2: COMMIT;
T1: SELECT balance FROM accounts WHERE id = 'A';  -- reads $500 (different!)
T1: COMMIT;
```

### 3. Phantom Read

Running the same query twice and getting **different sets of rows** because another transaction inserted or deleted rows that match the query.

```
T1: BEGIN;
T1: SELECT COUNT(*) FROM employees WHERE dept_id = 10;  -- returns 5
T2: INSERT INTO employees (name, dept_id) VALUES ('New', 10);
T2: COMMIT;
T1: SELECT COUNT(*) FROM employees WHERE dept_id = 10;  -- returns 6 (phantom!)
T1: COMMIT;
```

### 4. Lost Update

Two transactions read the same value, both modify it, and the second write overwrites the first.

```
T1: SELECT balance FROM accounts WHERE id = 'A';  -- reads $1000
T2: SELECT balance FROM accounts WHERE id = 'A';  -- reads $1000
T1: UPDATE accounts SET balance = 1000 - 200 WHERE id = 'A';  -- sets $800
T2: UPDATE accounts SET balance = 1000 - 300 WHERE id = 'A';  -- sets $700
-- T1's update is lost! Should be $500 (1000 - 200 - 300)
```

---

## Isolation Levels

SQL defines four isolation levels, each preventing a different set of problems:

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| **READ UNCOMMITTED** | Possible | Possible | Possible |
| **READ COMMITTED** | Prevented | Possible | Possible |
| **REPEATABLE READ** | Prevented | Prevented | Possible |
| **SERIALIZABLE** | Prevented | Prevented | Prevented |

### Setting the Isolation Level

```sql
-- PostgreSQL
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
-- ... queries ...
COMMIT;

-- MySQL
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
-- ... queries ...
COMMIT;

-- Or set it globally/session-wide
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### READ UNCOMMITTED

The lowest isolation. Transactions can see uncommitted changes from others. Almost never used in practice.

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
-- Can see other transactions' uncommitted writes (dirty reads)
SELECT * FROM accounts;
COMMIT;
```

### READ COMMITTED (Default in PostgreSQL, Oracle, SQL Server)

Each query within a transaction sees only data that was **committed before that query started**. Different queries in the same transaction might see different committed states.

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
SELECT balance FROM accounts WHERE id = 'A';  -- sees committed state at time T1
-- Another transaction commits a change to A
SELECT balance FROM accounts WHERE id = 'A';  -- sees new committed state at time T2
COMMIT;
```

### REPEATABLE READ (Default in MySQL/InnoDB)

The transaction sees a **snapshot** of the database as of the transaction start. All reads within the transaction return the same data, regardless of concurrent commits.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT balance FROM accounts WHERE id = 'A';  -- reads $1000
-- Another transaction changes A to $500 and commits
SELECT balance FROM accounts WHERE id = 'A';  -- still reads $1000 (snapshot)
COMMIT;
```

In MySQL/InnoDB, `REPEATABLE READ` also prevents phantom reads using **gap locks**.

### SERIALIZABLE

The highest isolation. Transactions execute as if they were run **one after another** serially. No concurrency anomalies are possible, but it has the highest performance cost.

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
SELECT COUNT(*) FROM employees WHERE dept_id = 10;
-- Other transactions trying to INSERT into dept 10 will block or abort
COMMIT;
```

**Implementation varies**:
- PostgreSQL uses **Serializable Snapshot Isolation** (SSI) — optimistic, detects conflicts at commit time
- MySQL uses **locking** — pessimistic, locks ranges to prevent conflicts
- SQL Server supports both approaches

---

## Isolation Level Trade-offs

```
READ UNCOMMITTED ←→ SERIALIZABLE
                ↑                  ↑
    More concurrency      Less concurrency
    Less consistency      More consistency
    Faster                Slower
    More anomalies        No anomalies
```

Choosing an isolation level is a balance between **data correctness** and **performance/throughput**.

| Use Case | Recommended Level |
|---|---|
| Financial transactions | SERIALIZABLE or REPEATABLE READ |
| General web application | READ COMMITTED |
| Read-only analytics | READ COMMITTED or READ UNCOMMITTED |
| Inventory management | REPEATABLE READ or SERIALIZABLE |

---

## Locking Mechanisms

### Shared Locks (Read Locks)

Multiple transactions can hold shared locks on the same resource simultaneously. Used for `SELECT` statements.

### Exclusive Locks (Write Locks)

Only one transaction can hold an exclusive lock. Others must wait. Used for `INSERT`, `UPDATE`, `DELETE`.

### Explicit Locking

```sql
-- PostgreSQL: lock a specific row
SELECT * FROM accounts WHERE id = 'A' FOR UPDATE;
-- No other transaction can modify this row until we commit/rollback

-- Lock in share mode (allows other reads, blocks writes)
SELECT * FROM accounts WHERE id = 'A' FOR SHARE;

-- MySQL: similar syntax
SELECT * FROM accounts WHERE id = 'A' FOR UPDATE;
SELECT * FROM accounts WHERE id = 'A' LOCK IN SHARE MODE;
```

### Deadlocks

```
T1: locks row A, wants to lock row B
T2: locks row B, wants to lock row A
→ Deadlock: both wait forever
```

Databases detect deadlocks and abort one transaction (the "victim"):

```sql
-- PostgreSQL auto-detects:
-- ERROR: deadlock detected
-- DETAIL: Process 123 waits for ShareLock on transaction 456

-- The aborted transaction should be retried by the application
```

**Prevention strategies**:
- Always lock resources in the same order
- Keep transactions short
- Use appropriate isolation levels

---

## Optimistic vs Pessimistic Concurrency

### Pessimistic (Locking)

Assume conflicts are **likely**. Lock data before modifying it.

```sql
BEGIN;
SELECT balance FROM accounts WHERE id = 'A' FOR UPDATE;  -- lock the row
-- Process business logic
UPDATE accounts SET balance = balance - 100 WHERE id = 'A';
COMMIT;
```

### Optimistic (Versioning)

Assume conflicts are **rare**. Read data, do work, and check for conflicts at commit time.

```sql
-- Read with version number
SELECT balance, version FROM accounts WHERE id = 'A';
-- → balance=1000, version=5

-- Process business logic in application code

-- Update only if version hasn't changed
UPDATE accounts
SET balance = 900, version = version + 1
WHERE id = 'A' AND version = 5;
-- If 0 rows affected → conflict detected, retry
```

| Approach | Best For | Drawback |
|---|---|---|
| Pessimistic | High contention | Locks reduce concurrency |
| Optimistic | Low contention | Retries on conflict |

---

## Best Practices

1. **Keep transactions short** — long transactions hold locks and block others
2. **Don't interact with users inside a transaction** — never `BEGIN`, prompt for input, then `COMMIT`
3. **Handle deadlocks** — implement retry logic in your application
4. **Use the right isolation level** — don't default to SERIALIZABLE if READ COMMITTED suffices
5. **Avoid unnecessary locks** — use `FOR UPDATE` only when you truly need exclusive access
6. **Prefer batch operations** — one UPDATE for 1000 rows is better than 1000 separate transactions

```sql
-- Bad: 1000 separate transactions
FOR EACH row IN data:
    BEGIN;
    INSERT INTO table VALUES (row);
    COMMIT;

-- Good: single transaction
BEGIN;
INSERT INTO table VALUES (row1), (row2), ..., (row1000);
COMMIT;
```

---

## Quick Reference

```sql
BEGIN;                            -- start transaction
SAVEPOINT sp1;                    -- create savepoint
ROLLBACK TO sp1;                  -- partial rollback
COMMIT;                           -- make permanent
ROLLBACK;                         -- undo everything

SET TRANSACTION ISOLATION LEVEL   -- set isolation
    READ UNCOMMITTED |
    READ COMMITTED |
    REPEATABLE READ |
    SERIALIZABLE;

SELECT ... FOR UPDATE;            -- exclusive row lock
SELECT ... FOR SHARE;             -- shared row lock
```

| ACID Property | Guarantee | Mechanism |
|---|---|---|
| **Atomicity** | All or nothing | WAL + rollback |
| **Consistency** | Valid state transitions | Constraints + triggers |
| **Isolation** | No interference | Locks + MVCC |
| **Durability** | Committed = permanent | WAL + disk flush |
