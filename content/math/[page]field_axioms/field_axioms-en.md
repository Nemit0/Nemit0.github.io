---
title: "Field Axioms"
description: "A comprehensive introduction to field axioms, ordered fields, and the completeness of the real numbers — foundations of real analysis."
date: "2025-11-26"
category: "math"
tags: ["math", "analysis", "algebra", "field theory"]
author: "Nemit"
featured: false
pinned: false
---

# Field Axioms

Analysis is the branch of mathematics concerned with limits, continuity, differentiation, and integration. Before any of those concepts can be made precise, we need an algebraic and order-theoretic foundation: the **field axioms** and the **completeness axiom** for the real numbers $\mathbb{R}$.

This article develops those foundations carefully. We state every axiom, derive the most important elementary consequences, survey the main examples, and explain why completeness is what distinguishes $\mathbb{R}$ from $\mathbb{Q}$.

---

## 1. Binary Operations and Algebraic Structures

A **binary operation** on a set $S$ is a function $\ast : S \times S \to S$. We write $a \ast b$ instead of $\ast(a, b)$.

A binary operation $\ast$ on $S$ is:

| Property | Definition |
|---|---|
| **Commutative** | $a \ast b = b \ast a$ for all $a, b \in S$ |
| **Associative** | $(a \ast b) \ast c = a \ast (b \ast c)$ for all $a, b, c \in S$ |

An **identity element** for $\ast$ is an element $e \in S$ such that $a \ast e = e \ast a = a$ for every $a \in S$. If it exists, it is unique.

An **inverse** of $a$ with respect to $\ast$ and identity $e$ is an element $a' \in S$ with $a \ast a' = a' \ast a = e$.

A **group** is a pair $(G, \ast)$ where $\ast$ is associative, has an identity, and every element has an inverse. If $\ast$ is also commutative, $(G, \ast)$ is an **abelian group**.

---

## 2. Definition of a Field

> **Definition.** A **field** is a triple $(F, +, \cdot\,)$ where $F$ is a set with at least two elements, and $+ : F \times F \to F$ (addition) and $\cdot : F \times F \to F$ (multiplication) are binary operations satisfying the axioms below.

### 2.1 Addition Axioms (A1 – A4)

| Tag | Name | Statement |
|---|---|---|
| **A1** | Commutativity | $a + b = b + a$ for all $a, b \in F$ |
| **A2** | Associativity | $(a + b) + c = a + (b + c)$ for all $a, b, c \in F$ |
| **A3** | Additive identity | There exists $0 \in F$ such that $a + 0 = a$ for every $a \in F$ |
| **A4** | Additive inverse | For each $a \in F$ there exists $-a \in F$ with $a + (-a) = 0$ |

In short, $(F, +)$ is an **abelian group** with identity $0$.

### 2.2 Multiplication Axioms (M1 – M4)

| Tag | Name | Statement |
|---|---|---|
| **M1** | Commutativity | $a \cdot b = b \cdot a$ for all $a, b \in F$ |
| **M2** | Associativity | $(a \cdot b) \cdot c = a \cdot (b \cdot c)$ for all $a, b, c \in F$ |
| **M3** | Multiplicative identity | There exists $1 \in F$, $1 \neq 0$, such that $a \cdot 1 = a$ for every $a \in F$ |
| **M4** | Multiplicative inverse | For each $a \in F$ with $a \neq 0$, there exists $a^{-1} \in F$ with $a \cdot a^{-1} = 1$ |

In short, $(F \setminus \{0\}, \cdot\,)$ is an **abelian group** with identity $1$.

### 2.3 Distributive Law (D)

| Tag | Name | Statement |
|---|---|---|
| **D** | Distributivity | $a \cdot (b + c) = a \cdot b + a \cdot c$ for all $a, b, c \in F$ |

This single axiom links the two operations.

> **Remark.** The requirement $1 \neq 0$ in M3 excludes the trivial one-element set. A field must have at least two distinct elements.

---

## 3. Elementary Consequences of the Field Axioms

All of the following are **theorems**, proved using only A1–A4, M1–M4, and D.

### 3.1 Uniqueness of Identities and Inverses

**Theorem 3.1.** The additive identity $0$ is unique.

*Proof.* Suppose $0$ and $0'$ are both additive identities. Then $0 = 0 + 0' = 0'$. $\square$

By an identical argument the multiplicative identity $1$ is unique, and each element has a unique additive (resp. multiplicative) inverse.

### 3.2 Multiplication by Zero

**Theorem 3.2.** For every $a \in F$, $\;a \cdot 0 = 0$.

*Proof.*
$$
a \cdot 0 = a \cdot (0 + 0) = a \cdot 0 + a \cdot 0.
$$
Adding $-(a \cdot 0)$ to both sides gives $0 = a \cdot 0$. $\square$

### 3.3 Negation Rules

**Theorem 3.3.** For all $a, b \in F$:

1. $(-1) \cdot a = -a$.
2. $(-a)(-b) = ab$.
3. $-(a + b) = (-a) + (-b)$.

*Proof of (1).* $a + (-1) \cdot a = 1 \cdot a + (-1) \cdot a = (1 + (-1)) \cdot a = 0 \cdot a = 0$, so $(-1)\cdot a$ is the additive inverse of $a$. $\square$

### 3.4 Zero-Product Property

**Theorem 3.4 (Zero-product property).** If $a \cdot b = 0$ then $a = 0$ or $b = 0$.

*Proof.* Suppose $a \neq 0$. Then $a^{-1}$ exists, and $b = 1 \cdot b = (a^{-1} a) b = a^{-1}(ab) = a^{-1} \cdot 0 = 0$. $\square$

This property is what makes polynomial root-finding work: a degree-$n$ polynomial over a field has at most $n$ roots.

### 3.5 Cancellation Laws

**Theorem 3.5.** For all $a, b, c \in F$:

1. If $a + c = b + c$ then $a = b$ (additive cancellation).
2. If $ac = bc$ and $c \neq 0$ then $a = b$ (multiplicative cancellation).

### 3.6 Inverse of a Product

**Theorem 3.6.** For $a, b \in F$ with $a \neq 0$ and $b \neq 0$:

$$
(a \cdot b)^{-1} = a^{-1} \cdot b^{-1}.
$$

*Proof.* $(ab)(a^{-1}b^{-1}) = (aa^{-1})(bb^{-1}) = 1 \cdot 1 = 1$, using commutativity and associativity. $\square$

### 3.7 Subtraction and Division

We define:

$$
a - b := a + (-b), \qquad \frac{a}{b} := a \cdot b^{-1} \quad (b \neq 0).
$$

From these definitions and the axioms one derives the familiar rules of fraction arithmetic:

$$
\frac{a}{b} + \frac{c}{d} = \frac{ad + bc}{bd}, \qquad \frac{a}{b} \cdot \frac{c}{d} = \frac{ac}{bd}, \qquad \frac{a/b}{c/d} = \frac{ad}{bc}.
$$

---

## 4. Examples of Fields

### 4.1 Classical Number Fields

| Field | Notation | Characteristic |
|---|---|---|
| Rational numbers | $\mathbb{Q}$ | $0$ |
| Real numbers | $\mathbb{R}$ | $0$ |
| Complex numbers | $\mathbb{C}$ | $0$ |

Each of these satisfies all nine axioms A1–A4, M1–M4, D with the usual arithmetic.

### 4.2 Finite Fields

For each prime $p$, the integers modulo $p$ form a field:

$$
\mathbb{F}_p = \mathbb{Z}/p\mathbb{Z} = \{0, 1, 2, \dots, p-1\}
$$

with addition and multiplication performed modulo $p$. More generally, for every prime power $q = p^k$ there exists (up to isomorphism) a unique finite field $\mathbb{F}_q$ with $q$ elements.

**Example.** $\mathbb{F}_2 = \{0, 1\}$ with addition and multiplication tables:

| $+$ | $0$ | $1$ |
|---|---|---|
| $0$ | $0$ | $1$ |
| $1$ | $1$ | $0$ |

| $\cdot$ | $0$ | $1$ |
|---|---|---|
| $0$ | $0$ | $0$ |
| $1$ | $0$ | $1$ |

### 4.3 Non-Examples

- $\mathbb{Z}$ (the integers) is **not** a field: $2$ has no multiplicative inverse in $\mathbb{Z}$.
- $\mathbb{Z}/6\mathbb{Z}$ is **not** a field: $2 \cdot 3 \equiv 0 \pmod{6}$, violating the zero-product property.
- The set of $n \times n$ matrices ($n \ge 2$) with matrix multiplication is **not** a field: multiplication is not commutative, and singular matrices have no inverse.

---

## 5. Ordered Fields

A field $F$ becomes an **ordered field** when it is equipped with a subset $P \subset F$ (the "positive cone") satisfying:

> **O1 (Trichotomy).** For every $a \in F$, exactly one of $a \in P$, $\;a = 0$, $\;{-a} \in P$ holds.
>
> **O2 (Closure under addition).** If $a, b \in P$ then $a + b \in P$.
>
> **O3 (Closure under multiplication).** If $a, b \in P$ then $a \cdot b \in P$.

We write $a > 0$ to mean $a \in P$, and define $a > b$ iff $a - b > 0$.

### 5.1 Consequences of Order

**Theorem 5.1.** In any ordered field:

1. $1 > 0$.
2. If $a > 0$ then $a^{-1} > 0$.
3. If $a > b$ and $c > 0$ then $ac > bc$.
4. $a^2 \ge 0$ for all $a$, with equality iff $a = 0$.

*Proof of (1).* Either $1 \in P$ or $-1 \in P$ by trichotomy. If $-1 \in P$, then by O3, $(-1)(-1) = 1 \in P$, contradicting the assumption that $-1 \in P$ and $1 \in P$ cannot both hold (since $1 + (-1) = 0$, but $0 \notin P$). Wait — actually, if $-1 \in P$, then $(-1)(-1) = 1 \in P$ as well, so both $1$ and $-1$ would be positive, but $1 + (-1) = 0 \notin P$... The cleaner route: if $1 \notin P$ and $1 \neq 0$ (since $1 \neq 0$), then $-1 \in P$. But then $(-1)(-1) = 1 \in P$ by O3, contradicting $1 \notin P$. Hence $1 \in P$, i.e., $1 > 0$. $\square$

*Proof of (4).* If $a > 0$ then $a^2 = a \cdot a > 0$ by O3. If $a < 0$ then $-a > 0$, so $a^2 = (-a)(-a) > 0$. If $a = 0$, $a^2 = 0$. $\square$

### 5.2 Absolute Value

In an ordered field, the **absolute value** is defined by:

$$
|a| = \begin{cases} a & \text{if } a \ge 0, \\ -a & \text{if } a < 0. \end{cases}
$$

Key properties:

1. $|a| \ge 0$, with $|a| = 0 \iff a = 0$.
2. $|ab| = |a||b|$.
3. **Triangle inequality:** $|a + b| \le |a| + |b|$.
4. **Reverse triangle inequality:** $\big||a| - |b|\big| \le |a - b|$.

The triangle inequality is foundational for the theory of metric spaces and, hence, for all of analysis.

### 5.3 The Archimedean Property

An ordered field $F$ is **Archimedean** if for every $a \in F$ with $a > 0$, and every $b \in F$, there exists a natural number $n$ such that $na > b$.

Equivalently, $F$ is Archimedean iff $\mathbb{N}$ is unbounded in $F$: for every $x \in F$ there exists $n \in \mathbb{N}$ with $n > x$.

$\mathbb{Q}$ and $\mathbb{R}$ are Archimedean. However, there exist non-Archimedean ordered fields (for example, the field of formal Laurent series $\mathbb{R}((x))$, where $x$ is "infinitesimally small").

---

## 6. The Completeness Axiom

### 6.1 Upper Bounds and Suprema

Let $S \subseteq F$ be nonempty.

- $M \in F$ is an **upper bound** of $S$ if $s \le M$ for all $s \in S$.
- $S$ is **bounded above** if it has an upper bound.
- $\alpha \in F$ is the **least upper bound** (or **supremum**) of $S$, written $\alpha = \sup S$, if:
  1. $\alpha$ is an upper bound of $S$, and
  2. if $M$ is any upper bound of $S$, then $\alpha \le M$.

Analogously one defines **lower bound**, **bounded below**, **infimum** ($\inf S$), and **greatest lower bound**.

### 6.2 The Axiom (Dedekind Completeness)

> **(C) Completeness Axiom.** Every nonempty subset of $\mathbb{R}$ that is bounded above has a supremum in $\mathbb{R}$.

This is the axiom that separates $\mathbb{R}$ from $\mathbb{Q}$.

**Example (incompleteness of $\mathbb{Q}$).** Define

$$
S = \{\, x \in \mathbb{Q} : x \ge 0 \text{ and } x^2 < 2 \,\}.
$$

Then $S$ is nonempty ($1 \in S$) and bounded above in $\mathbb{Q}$ (for example by $2$), yet $S$ has **no** supremum in $\mathbb{Q}$. The "gap" is at $\sqrt{2}$, which is irrational. In $\mathbb{R}$, completeness guarantees $\sup S = \sqrt{2}$.

### 6.3 Equivalent Formulations

The following are all equivalent to the completeness axiom for an ordered field:

| Formulation | Statement |
|---|---|
| **Dedekind completeness** | Every nonempty bounded-above set has a supremum |
| **Monotone convergence** | Every bounded monotone sequence converges |
| **Nested intervals** | If $[a_n, b_n]$ is a nested sequence of closed intervals with $b_n - a_n \to 0$, then $\bigcap_{n=1}^{\infty} [a_n, b_n]$ is a single point |
| **Cauchy completeness** (+ Archimedean) | Every Cauchy sequence converges |
| **Bolzano–Weierstrass** | Every bounded sequence has a convergent subsequence |

> **Remark.** Cauchy completeness alone is not enough: the non-Archimedean field $\mathbb{Q}_p$ (the $p$-adic numbers) is Cauchy-complete but does not satisfy the other formulations. You need both Cauchy completeness **and** the Archimedean property to get Dedekind completeness.

### 6.4 Consequences of Completeness

**Theorem 6.1 (Archimedean property of $\mathbb{R}$).** $\mathbb{R}$ is Archimedean.

*Proof.* Suppose not: there exist $a > 0$ and $b \in \mathbb{R}$ with $na \le b$ for all $n \in \mathbb{N}$. Then $S = \{na : n \in \mathbb{N}\}$ is nonempty and bounded above by $b$, so $\alpha = \sup S$ exists. Since $\alpha - a < \alpha$, there is some $na \in S$ with $na > \alpha - a$, hence $(n+1)a > \alpha$, contradicting $\alpha$ being an upper bound. $\square$

**Theorem 6.2 (Density of $\mathbb{Q}$ in $\mathbb{R}$).** For any $a, b \in \mathbb{R}$ with $a < b$, there exists $q \in \mathbb{Q}$ with $a < q < b$.

*Proof sketch.* By the Archimedean property, choose $n \in \mathbb{N}$ with $n(b - a) > 1$. Then among the integers $\{\dots, -1, 0, 1, 2, \dots\}$ there is one, say $m$, with $m - 1 \le na < m$. Then $na < m \le na + 1 < nb$, so $a < m/n < b$. $\square$

**Theorem 6.3 (Existence of $n$-th roots).** For every $a > 0$ and every $n \in \mathbb{N}$, there exists a unique $b > 0$ with $b^n = a$.

This guarantees the existence of $\sqrt{2}$, $\sqrt[3]{5}$, etc. — numbers that "should" exist but that the rationals fail to contain.

---

## 7. Characterisation of the Real Numbers

**Theorem 7.1.** Up to isomorphism, $\mathbb{R}$ is the unique **Dedekind-complete ordered field**.

In other words, the axioms A1–A4, M1–M4, D (field), O1–O3 (order), and C (completeness) **pin down** the real numbers completely. Any two models satisfying all these axioms are isomorphic as ordered fields.

This is a remarkable fact: we can define $\mathbb{R}$ purely axiomatically, without ever constructing it via Dedekind cuts or Cauchy sequences.

---

## 8. Summary Table

| Axiom Group | Axioms | What It Gives |
|---|---|---|
| Addition | A1 – A4 | $(F, +)$ is an abelian group |
| Multiplication | M1 – M4 | $(F \setminus \{0\}, \cdot\,)$ is an abelian group |
| Distributivity | D | Links $+$ and $\cdot$ |
| Order | O1 – O3 | Positive cone, $<$, absolute value |
| Completeness | C | Supremum property, no "gaps" |

Together, A1–A4 + M1–M4 + D + O1–O3 + C define the **complete ordered field** $\mathbb{R}$.

---

## References

- Rudin, W. *Principles of Mathematical Analysis*, 3rd ed. McGraw-Hill, 1976. Chapters 1–2.
- Abbott, S. *Understanding Analysis*, 2nd ed. Springer, 2015. Chapter 1.
- Tao, T. *Analysis I*, 3rd ed. Springer, 2016. Chapters 4–5.
- [Wikipedia — Field (mathematics)](https://en.wikipedia.org/wiki/Field_(mathematics))
- [Wikipedia — Real number § Axiomatic approach](https://en.wikipedia.org/wiki/Real_number#Axiomatic_approach)

 
