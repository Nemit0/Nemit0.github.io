---
title: "Field Axioms"
description: "Introduction to Analytics and Field Axioms."
date: "2025-11-26"
category: "math"
tags: ["math", "analytics"]
author: "Nemit"
featured: false
pinned: false
---
# Field Axioms

Analysis is the branch of mathematics where we study the properties and structures of fields. A basic example is the set of real numbers, denoted by $\mathbb{R}$.

## Field axioms (sketch)

A field is a set $F$ with two binary operations $+$ and $\cdot$ such that:

1. $(F, +)$ is an abelian group with identity $0$.
2. $(F \setminus \{0\}, \cdot)$ is an abelian group with identity $1$.
3. Multiplication distributes over addition:
$$
a \cdot (b + c) = a \cdot b + a \cdot c \quad \text{for all } a,b,c \in F.
$$

## Ordered and complete fields

Let $\mathbb{R}$ denote the real numbers. They satisfy:

- **Ordered:** There is a total order $\ge$ such that

  $x \ge y \Rightarrow x + z \ge y + z$ and  
  $x \ge 0,\, y \ge 0 \Rightarrow xy \ge 0$.

- **Dedekind completeness:** Every nonempty subset $S \subset \mathbb{R}$ with an upper bound has a least upper bound $\sup S$ in $\mathbb{R}$.

By contrast, the rationals $\mathbb{Q}$ are not complete:  
$$
S = \{\, x \in \mathbb{Q} : x^2 < 2 \,\}
$$
has no rational supremum, even though it is bounded above (by, say, $2$).

## Quick identity check

For any $a, b \in \mathbb{R}$ with $a \neq 0$:
$$
\frac{a}{b} = a \cdot b^{-1}, \qquad (ab)^{-1} = a^{-1} b^{-1}.
$$

[Source: Wikipedia](https://en.wikipedia.org/wiki/Real_number#Formal_definitions)

 
