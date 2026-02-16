---
title: "Basic Partial Differential Equations (PDE): A First Guide"
description: "A beginner-friendly introduction to partial differential equations, including core examples, classifications, and first solution methods."
date: "2026-02-16"
category: "math"
tags: ["math", "pde", "differential equations", "analysis"]
author: "Nemit"
featured: false
pinned: false
---

# Basic Partial Differential Equations (PDE): A First Guide

Partial differential equations (PDEs) appear whenever a quantity depends on **several variables** and we care about how it changes in space and time.

Examples:
- Temperature in a metal rod: $u(x,t)$
- Pressure in a fluid: $p(x,y,z,t)$
- Electric potential in space: $\phi(x,y,z)$

If ordinary differential equations (ODEs) describe change in one variable, PDEs describe coupled change across multiple variables.

---

## 1. What is a PDE?

A PDE is an equation involving:
- an unknown function $u$,
- its partial derivatives,
- and independent variables (such as $x, y, z, t$).

General form:
$$
F\left(x_1,\dots,x_n,\; u,\; u_{x_1},\dots,u_{x_n},\; u_{x_ix_j},\dots\right)=0.
$$

Simple examples:
- $u_t = k\,u_{xx}$ (heat equation in 1D),
- $u_{tt} = c^2 u_{xx}$ (wave equation in 1D),
- $u_{xx}+u_{yy}=0$ (Laplace equation in 2D).

---

## 2. Order and Linearity

### 2.1 Order
The **order** is the highest derivative appearing.

- $u_t + u_x = 0$ is first-order.
- $u_t - u_{xx} = 0$ is second-order.

### 2.2 Linear vs nonlinear
A PDE is **linear** if $u$ and its derivatives appear linearly:
$$
a_0 u + \sum_i a_i u_{x_i} + \sum_{i,j} a_{ij} u_{x_ix_j} = f.
$$
Coefficients $a_0,a_i,a_{ij}$ may depend on variables, but not on $u$.

Examples:
- Linear: $u_t - u_{xx} = \sin x$
- Nonlinear: $u_t + u\,u_x = 0$ (inviscid Burgers equation)

---

## 3. Three canonical PDEs

### 3.1 Heat equation (diffusion)
$$
u_t = k u_{xx},\qquad k>0.
$$
Interpretation: heat flows from hot regions to cold regions, smoothing the profile over time.

### 3.2 Wave equation (propagation)
$$
u_{tt} = c^2 u_{xx},\qquad c>0.
$$
Interpretation: disturbances propagate with speed $c$, preserving wave-like behavior.

### 3.3 Laplace equation (equilibrium)
$$
u_{xx}+u_{yy}=0.
$$
Interpretation: steady-state fields with no internal source/sink. Solutions are called **harmonic functions**.

---

## 4. Initial and boundary conditions

A PDE alone usually has infinitely many solutions. We select the physical one using additional conditions.

### 4.1 Initial condition (IC)
Specifies the state at $t=0$:
$$
u(x,0)=f(x).
$$
For second-order time equations (like wave):
$$
u(x,0)=f(x),\qquad u_t(x,0)=g(x).
$$

### 4.2 Boundary conditions (BC)
On a spatial domain $0\le x\le L$:

- **Dirichlet**: value fixed, $u(0,t)=A,\;u(L,t)=B$
- **Neumann**: flux/slope fixed, $u_x(0,t)=\alpha,\;u_x(L,t)=\beta$
- **Robin**: mixed form, $a u + b u_x = h(t)$

Together with the PDE, IC/BC define a well-posed problem.

---

## 5. Classification of second-order PDEs

For a 2D second-order linear PDE
$$
A u_{xx} + B u_{xy} + C u_{yy} + \cdots = 0,
$$
look at the discriminant:
$$
\Delta = B^2 - 4AC.
$$

- $\Delta < 0$: **elliptic** (e.g., Laplace)
- $\Delta = 0$: **parabolic** (e.g., heat)
- $\Delta > 0$: **hyperbolic** (e.g., wave)

This classification predicts qualitative behavior: smoothing, diffusion, or finite-speed propagation.

---

## 6. A first method: separation of variables

Use this when geometry and BCs are simple (interval/rectangle with homogeneous BCs).

Assume:
$$
u(x,t)=X(x)T(t).
$$
Substitute into the PDE and separate variables, turning one PDE into two ODEs.

For the heat equation on $0<x<L$, with $u(0,t)=u(L,t)=0$:
$$
u_t = k u_{xx}
\Rightarrow
\frac{T'}{kT}=\frac{X''}{X}=-\lambda.
$$
So
$$
X''+\lambda X=0,\qquad T'+k\lambda T=0.
$$

Boundary conditions force eigenvalues:
$$
\lambda_n=\left(\frac{n\pi}{L}\right)^2,\qquad X_n(x)=\sin\left(\frac{n\pi x}{L}\right).
$$

Hence
$$
u(x,t)=\sum_{n=1}^{\infty} b_n
\sin\left(\frac{n\pi x}{L}\right)
\exp\left(-k\left(\frac{n\pi}{L}\right)^2 t\right),
$$
where coefficients $b_n$ come from the initial condition via a Fourier sine series.

---

## 7. Why PDEs matter

PDEs are the mathematical language of:
- heat and mass transfer,
- acoustics and electromagnetism,
- fluid dynamics and weather models,
- quantum mechanics and relativity,
- image processing and machine learning-inspired diffusion models.

Learning the basics gives you a unifying toolkit across physics, engineering, and applied math.

---

## 8. Suggested next steps

1. Solve the 1D heat equation on $0\le x\le L$ with a simple initial profile.
2. Study Fourier series, since they are central to PDE solutions on bounded domains.
3. Learn method of characteristics for first-order PDEs.
4. Move to weak solutions and Sobolev spaces for modern PDE theory.

PDEs start with a few canonical equations, but quickly open into deep and beautiful mathematics.
