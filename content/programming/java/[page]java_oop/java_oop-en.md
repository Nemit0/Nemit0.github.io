---
title: "Java: OOP and the JVM"
description: "A deep dive into Java's object-oriented programming model — classes, inheritance, interfaces, polymorphism — and how the JVM executes Java code through bytecode, JIT compilation, and garbage collection."
date: "2026-03-05"
category: "programming/java"
tags: ["Java", "OOP", "JVM", "bytecode", "garbage collection", "JIT", "inheritance", "interfaces"]
author: "Nemit"
featured: false
pinned: false
---

# Java: OOP and the JVM

Java is a statically-typed, object-oriented language built around the principle of **"Write Once, Run Anywhere"**. This is made possible by the Java Virtual Machine (JVM), which abstracts away the underlying hardware. Java sits in a sweet spot between low-level control and high-level productivity, making it one of the most widely used languages in enterprise software, Android development, and large-scale distributed systems.

---

## Object-Oriented Programming in Java

Java is built around four pillars of OOP: **Encapsulation**, **Inheritance**, **Polymorphism**, and **Abstraction**.

### Classes and Objects

A **class** is a blueprint. An **object** is an instance of that blueprint.

```java
public class Dog {
    // Fields (state)
    private String name;
    private int age;

    // Constructor
    public Dog(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // Methods (behavior)
    public void bark() {
        System.out.println(name + " says: Woof!");
    }

    public String getName() { return name; }
}

// Instantiation
Dog d = new Dog("Rex", 3);
d.bark(); // Rex says: Woof!
```

---

### Encapsulation

Encapsulation hides internal state and exposes it only through controlled interfaces (getters/setters). This prevents unintended modification and keeps implementation details private.

```java
public class BankAccount {
    private double balance; // hidden from outside

    public double getBalance() { return balance; }

    public void deposit(double amount) {
        if (amount > 0) balance += amount;
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && balance >= amount) {
            balance -= amount;
            return true;
        }
        return false;
    }
}
```

| Access Modifier | Same Class | Same Package | Subclass | Anywhere |
|---|---|---|---|---|
| `private` | Yes | No | No | No |
| (package-private) | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes | No |
| `public` | Yes | Yes | Yes | Yes |

---

### Inheritance

A subclass **extends** a superclass, inheriting its fields and methods. Java supports **single inheritance** for classes, avoiding the diamond problem. The `super` keyword calls the parent constructor or method.

```java
public class Animal {
    protected String name;

    public Animal(String name) { this.name = name; }

    public void speak() {
        System.out.println(name + " makes a sound.");
    }
}

public class Cat extends Animal {
    public Cat(String name) { super(name); }

    @Override
    public void speak() {
        System.out.println(name + " says: Meow!");
    }
}

Animal a = new Cat("Whiskers");
a.speak(); // Whiskers says: Meow!  ← runtime dispatch
```

`@Override` is an annotation that tells the compiler to verify the method signature matches a parent method. If you misspell the method name, the compiler catches it rather than silently creating a new method.

---

### Polymorphism

A reference variable of a parent type can point to any subclass object. The actual method that executes is determined at **runtime** — this is called dynamic dispatch.

```java
Animal[] animals = { new Dog("Rex", 3), new Cat("Whiskers") };

for (Animal a : animals) {
    a.speak(); // calls the correct subclass method for each
}
```

This lets you write generic code that works with any subtype, which is the foundation of frameworks, collections, and design patterns like Strategy and Observer.

---

### Abstraction: Abstract Classes vs Interfaces

**Abstract classes** mix implemented and unimplemented methods. They cannot be instantiated directly.

```java
public abstract class Shape {
    protected String color;

    public Shape(String color) { this.color = color; }

    public abstract double area();       // subclass must implement
    public abstract double perimeter();

    public void describe() {             // shared implementation
        System.out.printf("A %s shape with area %.2f%n", color, area());
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override public double area()      { return Math.PI * radius * radius; }
    @Override public double perimeter() { return 2 * Math.PI * radius; }
}
```

**Interfaces** define a pure contract. A class can implement **multiple** interfaces, working around the single-inheritance restriction.

```java
public interface Flyable  { void fly(); }
public interface Swimmable { void swim(); }

public class Duck extends Animal implements Flyable, Swimmable {
    public Duck(String name) { super(name); }

    @Override public void speak() { System.out.println(name + ": Quack!"); }
    @Override public void fly()   { System.out.println(name + " is flying."); }
    @Override public void swim()  { System.out.println(name + " is swimming."); }
}
```

Since Java 8, interfaces can also have **default methods** (concrete implementations) and **static methods**.

```java
public interface Greeter {
    String greet(String name); // abstract — must be implemented

    default String greetLoudly(String name) { // optional override
        return greet(name).toUpperCase();
    }
}
```

| | Abstract Class | Interface |
|---|---|---|
| Can be instantiated | No | No |
| Multiple inheritance | No | Yes (implement many) |
| Fields | Any type | `static final` constants only |
| Constructors | Yes | No |
| Method implementations | Yes | Yes (via `default`) |
| Best for | Sharing code between related classes | Defining a capability/contract |

---

## The Java Virtual Machine (JVM)

The JVM is what makes Java platform-independent. You compile source code once into **bytecode**, and any JVM can run it.

```
Java Source (.java)
      ↓  javac
  Bytecode (.class)
      ↓  JVM
Native Machine Code
```

### Class Loading

The **Class Loader** loads `.class` files into memory in three phases:

1. **Loading** — reads the `.class` file from disk, network, or JAR
2. **Linking** — verifies bytecode integrity, allocates static fields, resolves symbolic references to concrete memory addresses
3. **Initialization** — runs `static {}` blocks and assigns static field values

```java
public class Config {
    public static final String VERSION;

    static {  // runs once when class is first loaded
        VERSION = System.getProperty("app.version", "1.0");
    }
}
```

### JIT Compilation

The JVM begins by **interpreting** bytecode instruction by instruction. It simultaneously profiles execution, counting how often each method is called. Methods that are called frequently (typically ~10,000 invocations) are considered "hot" and handed to the **Just-In-Time (JIT) compiler**, which compiles them into optimized native machine code.

```
Interpret bytecode
  → Count invocations per method
  → Hot method detected
  → JIT compile to native code
  → Replace interpreted path with native code
  → Re-optimize as more profiling data arrives
```

Common JIT optimizations:

| Optimization | Effect |
|---|---|
| **Inlining** | Replaces method call with the method body (eliminates call overhead) |
| **Loop unrolling** | Reduces branch instructions in tight loops |
| **Escape analysis** | Allocates short-lived objects on the stack instead of the heap |
| **Dead code elimination** | Removes branches that are never taken |
| **Devirtualization** | Replaces virtual dispatch with a direct call when only one subtype is active |

This is why Java performance often matches or approaches C/C++ for long-running, CPU-intensive workloads after the warm-up period.

---

### JVM Memory Layout

```
┌──────────────────────────────────────┐
│             JVM Memory               │
├──────────────────────────────────────┤
│  Method Area (Metaspace)             │  ← shared
│  Class metadata, bytecode, constants │
├──────────────────────────────────────┤
│              Heap                    │  ← shared
│  ┌──────────────┬──────────────────┐ │
│  │  Young Gen   │    Old Gen       │ │
│  │  Eden│S0│ S1 │  (Tenured)       │ │
│  └──────────────┴──────────────────┘ │
├────────────────────────┬─────────────┤
│  JVM Stack (per thread)│ PC Register │  ← thread-local
│  [Frame][Frame]...     │             │
└────────────────────────┴─────────────┘
```

| Region | Contents | Shared? |
|---|---|---|
| **Heap** | Object instances, arrays | Yes |
| **Method Area / Metaspace** | Class bytecode, static fields, constant pool | Yes |
| **JVM Stack** | Stack frames: local variables + operand stack | No (per thread) |
| **PC Register** | Address of current instruction | No (per thread) |

---

### Garbage Collection

Java automates memory management. The **Garbage Collector (GC)** identifies objects that are no longer reachable from any live thread or static reference and frees their memory.

#### Generational Hypothesis

Most objects die young — they are allocated, used briefly, and become unreachable quickly. The JVM exploits this with **generational collection**:

- **Young Generation (Eden + two Survivor spaces)** — new objects land here; collected frequently with low cost (Minor GC)
- **Old Generation (Tenured)** — objects that survive enough Minor GCs are promoted here; collected less often (Major GC)

```
New object → Eden
Eden full → Minor GC: copy live objects to Survivor (S0 ↔ S1)
Object survives N cycles → promote to Old Gen
Old Gen full → Major (Full) GC
```

#### GC Algorithms

| Algorithm | Pause Behavior | Best For |
|---|---|---|
| **Serial GC** | Stop-the-world, single thread | Small apps |
| **Parallel GC** | Stop-the-world, multi-threaded | Maximum throughput |
| **G1 GC** (default since JDK 9) | Short, predictable pauses | Balanced throughput + latency |
| **ZGC** | Sub-millisecond pauses | Low-latency, large heaps |
| **Shenandoah** | Concurrent compaction | Similar to ZGC |

An object is **reachable** (and therefore not collected) if it can be found by tracing from a **GC root**:
- Local variables in active stack frames
- Static fields of loaded classes
- Active thread objects
- JNI references

---

## Key Java Features

### Generics

Generics provide compile-time type safety without runtime overhead (types are erased to `Object` after compilation — this is called **type erasure**).

```java
// Without generics — cast required, runtime failure risk
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0);

// With generics — type-safe, no cast
List<String> names = new ArrayList<>();
names.add("Alice");
String name = names.get(0);

// Generic method
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}
```

### Exception Handling

Java has two kinds of exceptions: **checked** (compiler forces you to handle them) and **unchecked** (`RuntimeException` and subclasses, no forced handling).

```java
// Checked exception — must declare or catch
public void readFile(String path) throws IOException {
    BufferedReader reader = new BufferedReader(new FileReader(path));
    String line = reader.readLine();
    reader.close();
}

// Unchecked exception
public int divide(int a, int b) {
    if (b == 0) throw new ArithmeticException("Division by zero");
    return a / b;
}

try {
    readFile("data.txt");
} catch (IOException e) {
    System.err.println("Read failed: " + e.getMessage());
} finally {
    System.out.println("Runs whether or not an exception occurred");
}
```

### Concurrency

Unlike Python, Java threads run **truly in parallel** on multiple CPU cores with no equivalent of the GIL. Java provides multiple layers of concurrency tools:

```java
// Low-level: synchronized block
synchronized (this) {
    sharedCounter++;
}

// High-level: ExecutorService + Future
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(() -> computeExpensiveResult());
int result = future.get(); // blocks until done
pool.shutdown();

// Modern: CompletableFuture (non-blocking chaining)
CompletableFuture.supplyAsync(() -> fetchData())
    .thenApply(data -> process(data))
    .thenAccept(result -> display(result));
```

---

## Quick Reference

```bash
# Compile and run
javac MyClass.java    # produces MyClass.class
java  MyClass         # runs on JVM

# Useful JVM flags
java -Xmx512m MyClass           # max heap = 512 MB
java -XX:+UseG1GC MyClass       # use G1 garbage collector
java -XX:+PrintGCDetails MyClass # print GC events
java -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining MyClass  # JIT inlining log
```

| Concept | Java Mechanism |
|---|---|
| Encapsulation | Access modifiers (`private`, `protected`, `public`) |
| Inheritance | `extends` (single class), `implements` (multiple interfaces) |
| Polymorphism | Dynamic dispatch via virtual method table |
| Abstraction | `abstract` class, `interface` |
| Platform independence | Bytecode compiled once, run on any JVM |
| Memory management | Automatic GC (Generational, G1, ZGC) |
| Performance | JIT compilation (HotSpot, GraalVM) |
| Type safety | Static typing + generics (with type erasure) |
| True parallelism | Threads run on multiple cores (no GIL) |
