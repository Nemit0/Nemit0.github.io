---
title: "Java: 객체지향 프로그래밍과 JVM"
description: "Java의 객체지향 프로그래밍 모델 — 클래스, 상속, 인터페이스, 다형성 — 과 JVM이 바이트코드, JIT 컴파일, 가비지 컬렉션을 통해 Java 코드를 실행하는 방식을 깊이 살펴봅니다."
date: "2026-03-05"
category: "programming/java"
tags: ["Java", "OOP", "JVM", "바이트코드", "가비지 컬렉션", "JIT", "상속", "인터페이스"]
author: "Nemit"
featured: false
pinned: false
---

# Java: 객체지향 프로그래밍과 JVM

Java는 **"한 번 작성하면 어디서나 실행된다(Write Once, Run Anywhere)"** 는 원칙을 중심으로 설계된 정적 타입 객체지향 언어입니다. 이를 가능하게 하는 것이 바로 하드웨어를 추상화하는 **Java Virtual Machine(JVM)** 입니다. Java는 저수준 제어와 고수준 생산성 사이의 균형을 잘 잡아, 엔터프라이즈 소프트웨어, 안드로이드 개발, 대규모 분산 시스템에서 가장 많이 사용되는 언어 중 하나입니다.

---

## Java의 객체지향 프로그래밍

Java는 OOP의 네 가지 기둥인 **캡슐화(Encapsulation)**, **상속(Inheritance)**, **다형성(Polymorphism)**, **추상화(Abstraction)** 를 중심으로 설계되었습니다.

### 클래스와 객체

**클래스**는 청사진입니다. **객체**는 그 청사진의 인스턴스입니다.

```java
public class Dog {
    // 필드 (상태)
    private String name;
    private int age;

    // 생성자
    public Dog(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 메서드 (행동)
    public void bark() {
        System.out.println(name + " says: Woof!");
    }

    public String getName() { return name; }
}

// 인스턴스 생성
Dog d = new Dog("Rex", 3);
d.bark(); // Rex says: Woof!
```

---

### 캡슐화

캡슐화는 내부 상태를 숨기고 getter/setter와 같은 제어된 인터페이스를 통해서만 노출합니다.

```java
public class BankAccount {
    private double balance; // 외부에서 직접 접근 불가

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

| 접근 제어자 | 같은 클래스 | 같은 패키지 | 하위 클래스 | 어디서나 |
|---|---|---|---|---|
| `private` | O | X | X | X |
| (package-private) | O | O | X | X |
| `protected` | O | O | O | X |
| `public` | O | O | O | O |

---

### 상속

하위 클래스는 `extends`를 통해 상위 클래스의 필드와 메서드를 물려받습니다. Java는 **단일 상속**만 지원하여 다이아몬드 문제를 방지합니다.

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
a.speak(); // Whiskers says: Meow!  ← 런타임 디스패치
```

`@Override` 어노테이션은 컴파일러에게 메서드 시그니처가 부모 메서드와 일치하는지 확인하도록 지시합니다.

---

### 다형성

부모 타입의 참조 변수는 어느 하위 클래스 객체든 가리킬 수 있습니다. 실행되는 실제 메서드는 **런타임**에 결정됩니다(동적 디스패치).

```java
Animal[] animals = { new Dog("Rex", 3), new Cat("Whiskers") };

for (Animal a : animals) {
    a.speak(); // 각 하위 클래스의 올바른 메서드 호출
}
```

---

### 추상화: 추상 클래스 vs 인터페이스

**추상 클래스**는 구현된 메서드와 미구현 메서드를 모두 가질 수 있습니다. 직접 인스턴스화할 수 없습니다.

```java
public abstract class Shape {
    protected String color;

    public Shape(String color) { this.color = color; }

    public abstract double area();       // 하위 클래스가 반드시 구현
    public abstract double perimeter();

    public void describe() {             // 공유 구현
        System.out.printf("A %s shape with area %.2f%n", color, area());
    }
}
```

**인터페이스**는 순수한 계약을 정의합니다. 클래스는 여러 인터페이스를 **구현(implement)** 할 수 있어 단일 상속의 한계를 극복합니다.

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

Java 8부터 인터페이스도 **default 메서드**(구현 포함)와 **static 메서드**를 가질 수 있습니다.

| | 추상 클래스 | 인터페이스 |
|---|---|---|
| 인스턴스화 | 불가 | 불가 |
| 다중 상속 | 불가 (단일) | 가능 (여러 구현) |
| 필드 | 모든 타입 | `static final` 상수만 |
| 생성자 | 있음 | 없음 |
| 메서드 구현 | 있음 | `default`로 가능 |
| 사용 시점 | 관련 클래스 간 코드 공유 | 기능/계약 정의 |

---

## JVM (Java Virtual Machine)

JVM은 Java의 플랫폼 독립성을 가능하게 합니다. 소스 코드를 한 번 **바이트코드**로 컴파일하면 모든 JVM이 이를 실행할 수 있습니다.

```
Java 소스(.java)
      ↓  javac
  바이트코드(.class)
      ↓  JVM
네이티브 머신 코드
```

### 클래스 로딩

**클래스 로더**는 `.class` 파일을 세 단계로 메모리에 로드합니다:

1. **로딩(Loading)** — 디스크, 네트워크, JAR에서 `.class` 파일 읽기
2. **링킹(Linking)** — 바이트코드 무결성 검증, 정적 필드 할당, 심볼릭 참조 해석
3. **초기화(Initialization)** — `static {}` 블록 실행, 정적 필드 값 할당

```java
public class Config {
    public static final String VERSION;

    static {  // 클래스가 처음 로드될 때 한 번 실행
        VERSION = System.getProperty("app.version", "1.0");
    }
}
```

### JIT 컴파일

JVM은 처음에 바이트코드를 한 명령씩 **인터프리팅**합니다. 동시에 실행을 프로파일링하여 자주 호출되는 메서드(약 10,000회 이상)를 감지합니다. 이런 "핫" 메서드는 **JIT(Just-In-Time) 컴파일러**가 최적화된 네이티브 머신 코드로 컴파일합니다.

주요 JIT 최적화:

| 최적화 | 효과 |
|---|---|
| **인라이닝** | 메서드 호출을 메서드 본문으로 교체 (호출 오버헤드 제거) |
| **루프 언롤링** | 반복문의 분기 명령 감소 |
| **이스케이프 분석** | 단기 객체를 힙 대신 스택에 할당 |
| **데드 코드 제거** | 절대 실행되지 않는 분기 제거 |
| **가상 호출 최적화** | 하나의 서브타입만 활성 상태일 때 가상 디스패치를 직접 호출로 대체 |

---

### JVM 메모리 구조

```
┌──────────────────────────────────────┐
│             JVM 메모리               │
├──────────────────────────────────────┤
│  메서드 영역 (Metaspace)             │  ← 스레드 공유
│  클래스 메타데이터, 바이트코드, 상수  │
├──────────────────────────────────────┤
│              힙(Heap)                │  ← 스레드 공유
│  ┌──────────────┬──────────────────┐ │
│  │  Young Gen   │    Old Gen       │ │
│  │  Eden│S0│ S1 │  (Tenured)       │ │
│  └──────────────┴──────────────────┘ │
├────────────────────────┬─────────────┤
│  JVM 스택 (스레드별)   │ PC 레지스터 │  ← 스레드 로컬
│  [프레임][프레임]...   │             │
└────────────────────────┴─────────────┘
```

| 영역 | 내용 | 공유 여부 |
|---|---|---|
| **힙** | 객체 인스턴스, 배열 | 공유 |
| **메서드 영역/Metaspace** | 클래스 바이트코드, 정적 필드, 상수 풀 | 공유 |
| **JVM 스택** | 스택 프레임 (지역 변수 + 피연산자 스택) | 스레드별 |
| **PC 레지스터** | 현재 명령어 주소 | 스레드별 |

---

### 가비지 컬렉션 (GC)

Java는 메모리 관리를 자동화합니다. **가비지 컬렉터**는 더 이상 어떤 살아있는 스레드나 정적 참조에서도 도달할 수 없는 객체의 메모리를 회수합니다.

#### 세대별 가설

대부분의 객체는 일찍 죽습니다. JVM은 **세대별 GC**로 이를 활용합니다:

- **Young Generation (Eden + 두 개의 Survivor 공간)** — 새 객체가 생성되는 곳, Minor GC로 자주 수집
- **Old Generation (Tenured)** — 여러 Minor GC를 살아남은 객체, 덜 자주 수집

```
새 객체 → Eden
Eden 가득 참 → Minor GC: 살아있는 객체를 Survivor로 복사 (S0 ↔ S1)
N번 살아남음 → Old Gen으로 승격
Old Gen 가득 참 → Full GC (비용이 가장 큰 작업)
```

#### GC 알고리즘

| 알고리즘 | 일시 정지 특성 | 적합한 상황 |
|---|---|---|
| **Serial GC** | Stop-the-world, 단일 스레드 | 소규모 앱 |
| **Parallel GC** | Stop-the-world, 멀티스레드 | 최대 처리량 |
| **G1 GC** (JDK 9+ 기본값) | 짧고 예측 가능한 일시 정지 | 처리량 + 지연시간 균형 |
| **ZGC** | 밀리초 이하 일시 정지 | 저지연, 대용량 힙 |
| **Shenandoah** | 동시 압축 | ZGC와 유사 |

---

## 주요 Java 기능

### 제네릭 (Generics)

제네릭은 컴파일 타임 타입 안전성을 제공합니다. **타입 소거(type erasure)** 로 인해 컴파일 후에는 모든 `List<T>`가 원시 `List`가 됩니다.

```java
// 제네릭 없이 — 캐스팅 필요, 런타임 오류 위험
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0);

// 제네릭 사용 — 타입 안전, 캐스팅 불필요
List<String> names = new ArrayList<>();
names.add("Alice");
String name = names.get(0);
```

### 예외 처리

Java는 **체크드 예외**(컴파일러가 처리를 강제)와 **언체크드 예외**(`RuntimeException` 및 하위 클래스, 강제 처리 없음)를 구분합니다.

```java
// 체크드 예외 — 선언하거나 처리해야 함
public void readFile(String path) throws IOException {
    BufferedReader reader = new BufferedReader(new FileReader(path));
    reader.readLine();
    reader.close();
}

try {
    readFile("data.txt");
} catch (IOException e) {
    System.err.println("읽기 실패: " + e.getMessage());
} finally {
    System.out.println("예외 발생 여부와 관계없이 항상 실행");
}
```

### 동시성 (Concurrency)

Python과 달리 Java 스레드는 **GIL 없이 여러 CPU 코어에서 진정한 병렬 실행**이 가능합니다.

```java
// 고수준: ExecutorService + Future
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(() -> computeExpensiveResult());
int result = future.get(); // 완료될 때까지 블록
pool.shutdown();

// 현대적: CompletableFuture (비블로킹 체이닝)
CompletableFuture.supplyAsync(() -> fetchData())
    .thenApply(data -> process(data))
    .thenAccept(result -> display(result));
```

---

## 빠른 참조

```bash
# 컴파일 및 실행
javac MyClass.java    # MyClass.class 생성
java  MyClass         # JVM에서 실행

# 유용한 JVM 플래그
java -Xmx512m MyClass           # 최대 힙 = 512 MB
java -XX:+UseG1GC MyClass       # G1 가비지 컬렉터 사용
java -XX:+PrintGCDetails MyClass # GC 이벤트 출력
```

| 개념 | Java 메커니즘 |
|---|---|
| 캡슐화 | 접근 제어자 (`private`, `protected`, `public`) |
| 상속 | `extends` (단일 클래스), `implements` (다중 인터페이스) |
| 다형성 | 가상 메서드 테이블을 통한 동적 디스패치 |
| 추상화 | `abstract` 클래스, `interface` |
| 플랫폼 독립성 | 한 번 컴파일된 바이트코드를 모든 JVM에서 실행 |
| 메모리 관리 | 자동 GC (세대별, G1, ZGC) |
| 성능 | JIT 컴파일 (HotSpot, GraalVM) |
| 타입 안전성 | 정적 타입 + 제네릭 (타입 소거 포함) |
| 진정한 병렬성 | 스레드가 여러 코어에서 실행 (GIL 없음) |
