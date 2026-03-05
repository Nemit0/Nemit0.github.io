---
title: "JavaScript: 비동기 프로그래밍과 이벤트 루프"
description: "JavaScript가 스레드 없이 동시성을 처리하는 방법 — 이벤트 루프, 콜 스택, 콜백, Promise, async/await — 과 클로저, 프로토타입, ES6+ 기능."
date: "2026-03-05"
category: "programming/javascript"
tags: ["JavaScript", "비동기", "이벤트 루프", "Promise", "async/await", "콜백", "클로저", "ES6"]
author: "Nemit"
featured: false
pinned: false
---

# JavaScript: 비동기 프로그래밍과 이벤트 루프

JavaScript는 원래 웹 브라우저에서 실행되도록 설계된 동적 타입 인터프리터 스크립팅 언어입니다. 오늘날에는 서버(Node.js), 모바일 기기, 심지어 임베디드 시스템에서도 실행됩니다. JavaScript의 가장 두드러진 특징 — 그리고 입문자에게 가장 혼란스러운 부분 — 은 **싱글 스레드이면서도 논블로킹**이라는 것입니다: 한 번에 하나의 코드만 실행하지만, 수천 개의 동시 I/O 작업을 효율적으로 처리할 수 있습니다.

---

## 싱글 스레드 모델

JavaScript는 정확히 **하나의 콜 스택**과 **하나의 실행 스레드**를 가집니다. 같은 컨텍스트에서 두 개의 JavaScript 코드를 진정으로 동시에 실행하는 방법은 없습니다.

이것이 심각한 제약처럼 들리지만, 큰 장점이 있습니다: **락(lock)이나 뮤텍스(mutex)가 필요 없습니다**. 한 번에 하나의 코드만 실행되기 때문에 공유 메모리에 대한 경쟁 조건이 없습니다.

문제는: 느린 작업(네트워크 요청, 파일 읽기, 타이머)을 기다려야 할 때 어떻게 하느냐입니다. 기다리는 동안 스레드를 블록하면 전체 페이지나 서버가 멈춥니다.

해결책이 바로 **이벤트 루프**입니다.

---

## 이벤트 루프

이벤트 루프는 JavaScript가 싱글 스레드를 유지하면서도 논블로킹이 될 수 있게 하는 메커니즘입니다. 세 가지를 조율합니다:

- **콜 스택** — 함수 호출이 추적되는 곳 (LIFO)
- **Web APIs / Node.js APIs** — JS 외부에서 실행되는 브라우저/런타임 기능 (타이머, 네트워크, 파일 I/O)
- **태스크 큐 (콜백 큐)** — 완료된 비동기 작업이 대기하는 곳

```
┌─────────────────────────────────────────────────┐
│                  JavaScript 엔진                 │
│                                                 │
│   콜 스택              메모리 힙                │
│   ┌─────────┐         ┌───────────┐             │
│   │ main()  │         │  객체들   │             │
│   │ foo()   │         │  배열들   │             │
│   │ bar()   │         │  ...      │             │
│   └─────────┘         └───────────┘             │
└────────────────┬────────────────────────────────┘
                 │ Web APIs / Node APIs
                 │ (setTimeout, fetch, fs.readFile...)
                 ▼
┌────────────────────────────────────────┐
│              태스크 큐                 │
│  마이크로태스크 큐  │  매크로태스크 큐 │
│  (Promise)         │  (setTimeout,    │
│                    │   setInterval,   │
│                    │   I/O 콜백)      │
└────────────┬───────┴──────────────────┘
             │
             ▼  스택이 비면 이벤트 루프가 다음 태스크 선택
```

**이벤트 루프 알고리즘:**
1. 현재 콜 스택이 빌 때까지 실행
2. **마이크로태스크 큐**를 완전히 소진 (Promise 콜백, `queueMicrotask`)
3. **매크로태스크 큐**에서 태스크 하나 선택 (타이머, I/O 콜백)
4. 반복

```javascript
console.log("1");

setTimeout(() => console.log("2"), 0); // 매크로태스크 — 태스크 큐로 이동

Promise.resolve().then(() => console.log("3")); // 마이크로태스크 — 매크로태스크보다 먼저 실행

console.log("4");

// 출력: 1, 4, 3, 2
// 동기 코드 실행 → 마이크로태스크 → 매크로태스크
```

---

## 콜백: 최초의 비동기 패턴

JavaScript 최초의 비동기 패턴은 작업 완료 시 호출되는 **콜백 함수**를 전달하는 것입니다.

```javascript
const fs = require('fs');

fs.readFile('data.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('읽기 실패:', err);
        return;
    }
    console.log('파일 내용:', data);
});

console.log('이것이 파일 읽기보다 먼저 실행됩니다');
```

여러 비동기 작업을 연쇄해야 할 때 콜백의 문제가 드러납니다:

```javascript
// "콜백 지옥" — 깊게 중첩되고 가독성이 나쁨
getUserFromDB(userId, (err, user) => {
    if (err) return handleError(err);
    getOrdersForUser(user.id, (err, orders) => {
        if (err) return handleError(err);
        getItemsForOrder(orders[0].id, (err, items) => {
            if (err) return handleError(err);
            console.log('아이템:', items); // 세 단계 중첩
        });
    });
});
```

---

## Promise: 구조화된 비동기

**Promise**는 비동기 작업의 최종 완료(또는 실패)를 나타내는 객체입니다. 세 가지 상태를 가집니다:

- **Pending** — 작업 진행 중
- **Fulfilled** — 작업 성공 (값 있음)
- **Rejected** — 작업 실패 (오류 이유 있음)

```javascript
const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (url.startsWith('https')) {
                resolve({ data: '안전한 응답' }); // 성공
            } else {
                reject(new Error('HTTPS 필요'));  // 실패
            }
        }, 1000);
    });
};

fetchData('https://api.example.com/data')
    .then(response => {
        console.log('받음:', response.data);
        return response.data.toUpperCase();
    })
    .then(upper => console.log('대문자:', upper))
    .catch(err => console.error('실패:', err.message))
    .finally(() => console.log('성공/실패 관계없이 실행'));
```

`.then()` 체인은 평탄하게(중첩 없이) 이어지며, 오류는 자동으로 체인 아래 가장 가까운 `.catch()`로 전파됩니다.

### Promise 조합자

```javascript
// 여러 Promise를 병렬 실행, 모두 완료 대기
const [users, products] = await Promise.all([
    fetchUsers(),
    fetchProducts(),
]);

// 가장 먼저 완료되는 것 사용
const fastest = await Promise.race([fetchFromServer1(), fetchFromServer2()]);

// 실패 여부 관계없이 모두 대기 (ES2020)
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
results.forEach(result => {
    if (result.status === 'fulfilled') console.log(result.value);
    else console.error(result.reason);
});
```

---

## async/await: 동기처럼 보이는 비동기

`async`/`await`는 Promise 위의 문법 설탕입니다. `async` 함수는 항상 Promise를 반환하고, `await`는 이벤트 루프를 블록하지 않으면서 해당 함수의 실행을 일시 정지합니다.

```javascript
async function getUserData(userId) {
    try {
        const user   = await fetchUserFromDB(userId);    // 여기서 대기
        const orders = await getOrdersForUser(user.id);  // 그 다음 여기서 대기
        const items  = await getItemsForOrder(orders[0].id);
        return items;
    } catch (err) {
        console.error('무언가 실패했습니다:', err);
        throw err;
    }
}
```

`try/catch` 블록이 `await`와 자연스럽게 동작합니다 — 거부된 Promise의 오류가 동기 예외처럼 잡힙니다.

**흔한 실수: 순차 vs 병렬 await**

```javascript
// 느림 — 순차적: 총 2초 소요
const a = await fetchA(); // 1초
const b = await fetchB(); // 1초

// 빠름 — 병렬: 약 1초 소요 (동시에 시작)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

두 번째 작업이 첫 번째 결과에 의존하는 경우에만 순차 `await`를 사용하세요. 그렇지 않으면 `Promise.all`로 병렬 실행하세요.

---

## 클로저

**클로저**는 외부(둘러싸는) 함수가 반환된 후에도 그 외부 스코프에 대한 접근을 유지하는 함수입니다.

```javascript
function makeCounter(start = 0) {
    let count = start; // 클로저에 캡처됨

    return {
        increment: () => ++count,
        decrement: () => --count,
        value:     () => count,
    };
}

const counter = makeCounter(10);
console.log(counter.increment()); // 11
console.log(counter.increment()); // 12
console.log(counter.decrement()); // 11
// `count`는 외부에서 직접 접근 불가 — private
```

클로저는 클래스 없이 **데이터 캡슐화**를 가능하게 하고, 모듈 패턴의 기반입니다.

---

## 프로토타입과 프로토타입 체인

JavaScript는 **프로토타입 기반 상속**을 사용합니다. 모든 객체는 **프로토타입**이라 불리는 다른 객체로의 내부 링크를 가집니다. 객체에 없는 속성에 접근하면 JavaScript는 프로토타입 체인을 따라 찾습니다.

```javascript
const animal = {
    breathe() { console.log('숨쉬는 중...'); }
};

const dog = Object.create(animal); // dog의 프로토타입은 animal
dog.bark = function() { console.log('Woof!'); };

dog.bark();    // dog에서 직접 찾음
dog.breathe(); // dog에 없음, animal(프로토타입)에서 찾음
```

ES6 `class` 문법은 프로토타입 위의 **문법 설탕**입니다 — 고전적 OOP처럼 보이지만 프로토타입 체인으로 컴파일됩니다.

```javascript
class Animal {
    constructor(name) { this.name = name; }
    speak() { console.log(`${this.name}이(가) 소리를 냅니다.`); }
}

class Dog extends Animal {
    speak() { console.log(`${this.name}이(가) 짖습니다!`); }
}

const d = new Dog('Rex');
d.speak(); // Rex이(가) 짖습니다!
```

---

## 주요 언어 특성

### 동적 타이핑

변수에는 타입이 없고 값에 타입이 있습니다.

```javascript
let x = 42;
x = "hello"; // 완전히 유효
x = [1, 2, 3];

typeof 42        // "number"
typeof "hello"   // "string"
typeof null      // "object"  ← 역사적 버그, 호환성을 위해 유지
typeof undefined // "undefined"
typeof []        // "object"  ← Array.isArray() 사용 권장
```

### `var`, `let`, `const`

| 키워드 | 스코프 | 호이스팅 | 재할당 | 재선언 |
|---|---|---|---|---|
| `var` | 함수 | 예 (`undefined`로 초기화) | 가능 | 가능 |
| `let` | 블록 | 예 (일시적 사각지대) | 가능 | 불가 |
| `const` | 블록 | 예 (일시적 사각지대) | 불가 | 불가 |

기본적으로 `const`를 사용하고, 재할당이 필요할 때만 `let`을 사용하세요.

### `this` 컨텍스트

`this`는 함수가 **어떻게 호출되는지**에 따라 결정됩니다 (화살표 함수 제외 — 외부 스코프의 `this`를 상속).

```javascript
const obj = {
    name: 'Alice',
    greetRegular: function() {
        console.log(this.name); // 'Alice' — this = obj
    },
    greetArrow: () => {
        console.log(this.name); // undefined — this = 외부 스코프 (obj 아님)
    },
};
```

---

## ES6+ 기능 요약

| 기능 | 예시 |
|---|---|
| 화살표 함수 | `const add = (a, b) => a + b;` |
| 구조 분해 | `const { name, age } = user;` |
| 템플릿 리터럴 | `` `안녕, ${name}!` `` |
| 전개/나머지 | `const copy = [...arr]; function f(...args) {}` |
| 기본 매개변수 | `function greet(name = '세계') {}` |
| 모듈 | `import { fn } from './utils.js'; export default fn;` |
| 옵셔널 체이닝 | `user?.address?.city` |
| Null 병합 | `value ?? '기본값'` |

---

## 빠른 참조

```javascript
// 비동기 패턴 비교

// 콜백
readFile(path, (err, data) => { if (err) throw err; use(data); });

// Promise
readFilePromise(path)
    .then(data => use(data))
    .catch(err => handle(err));

// async/await
async function main() {
    try {
        const data = await readFilePromise(path);
        use(data);
    } catch (err) {
        handle(err);
    }
}
```

| 개념 | 동작 |
|---|---|
| 스레딩 모델 | 싱글 스레드 |
| 동시성 모델 | 이벤트 루프 + 논블로킹 I/O |
| 마이크로태스크 (Promise) | 현재 태스크 후, 다음 매크로태스크 전에 실행 |
| 매크로태스크 (타이머, I/O) | 이벤트 루프 반복당 하나씩 실행 |
| `async` 함수 반환 타입 | 항상 `Promise` |
| `await` 블록 범위 | 스레드가 아닌 현재 async 함수만 일시 정지 |
| 오류 전파 | Promise 체인의 `catch` / `await`와 함께 `try/catch` |
