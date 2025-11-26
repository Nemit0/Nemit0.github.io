---
title: "체 공리"
description: "해석학과 체 공리 소개"
date: "2025-11-26"
category: "math"
tags: ["수학", "해석학"]
author: "Nemit"
featured: false
pinned: false
---
# 체 공리

해석학은 수 체계와 그 구조를 다루는 분야입니다. 가장 익숙한 예는 실수 집합 $\mathbb{R}$ 입니다.

## 체 공리 요약
집합 $F$ 와 두 연산 $+, \cdot$ 이 있을 때 다음을 만족하면 $F$ 를 체라고 합니다.

1. $(F, +)$ 는 항등원 $0$ 을 가진 아벨 군이다.
2. $(F \setminus \{0\}, \cdot)$ 는 항등원 $1$ 을 가진 아벨 군이다.
3. 분배법칙:
   $$
   a \cdot (b + c) = a \cdot b + a \cdot c \quad (\forall a,b,c \in F).
   $$

## 순서체와 완비성
실수 $\mathbb{R}$ 은 다음을 만족합니다.

- **순서:** 전순서 $\ge$ 가 존재하여  
  $x \ge y \Rightarrow x + z \ge y + z$,  
  $x \ge 0,\, y \ge 0 \Rightarrow xy \ge 0$.
- **데데킨트 완비성:** 상한이 있는 공집합이 아닌 모든 부분집합 $S \subset \mathbb{R}$ 은 $\mathbb{R}$ 안에 최소 상한 $\sup S$ 을 가진다.

반면 유리수 $\mathbb{Q}$ 는 완비하지 않습니다. 예를 들어
$$
S = \{\, x \in \mathbb{Q} : x^2 < 2 \,\}
$$
는 상한을 갖지만(예: $2$), $\mathbb{Q}$ 안에 최소 상한이 없습니다.

## 간단한 항등식 확인
임의의 $a, b \in \mathbb{R}$ (단 $a \neq 0$)에 대해:
$$
\frac{a}{b} = a \cdot b^{-1}, \qquad (ab)^{-1} = a^{-1} b^{-1}.
$$
