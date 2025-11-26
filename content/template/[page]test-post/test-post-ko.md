---
title: "테스트 블로그 포스트"
description: "마크다운 처리 검증을 위한 테스트 포스트"
date: "2025-11-25"
category: "engineering"
tags: ["테스트", "마크다운", "nextjs"]
author: "테스트 작성자"
featured: true
pinned: true
---

# 테스트 포스트에 오신 것을 환영합니다

이것은 마크다운 처리 파이프라인이 올바르게 작동하는지 확인하기 위한 테스트 포스트입니다.

## 테스트할 기능

### 기본 마크다운

이 단락에는 **굵은 텍스트**, *기울임 텍스트*, 그리고 ***굵은 기울임 텍스트***가 포함되어 있습니다. ~~취소선~~ 텍스트도 있습니다.

여기 [구글 링크](https://google.com)가 있습니다.

### 목록

순서 없는 목록:
- 항목 1
- 항목 2
  - 중첩 항목 2.1
  - 중첩 항목 2.2
- 항목 3

순서 있는 목록:
1. 첫 번째 항목
2. 두 번째 항목
3. 세 번째 항목

작업 목록:
- [x] 완료된 작업
- [ ] 미완료 작업
- [ ] 또 다른 미완료 작업

### 코드 블록

인라인 코드: `const x = 42;`

구문 강조가 있는 JavaScript 코드 블록:

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

TypeScript 예제:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "홍길동",
  email: "hong@example.com"
};
```

### 표

| 기능 | 지원 여부 | 비고 |
|-----|---------|-----|
| 기본 마크다운 | ✅ | 완전 지원 |
| 코드 하이라이팅 | ✅ | 다중 언어 |
| 수식 | ✅ | KaTeX 렌더링 |
| 표 | ✅ | GFM 지원 |

### 수학 방정식

인라인 수식: 이차 방정식의 해는 $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ 입니다.

블록 수식:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

또 다른 방정식:

$$
E = mc^2
$$

### 인용구

> 이것은 인용구입니다.
> 여러 줄에 걸쳐 작성할 수 있습니다.
>
> 그리고 여러 단락으로도 가능합니다.

### 이미지

![플레이스홀더 이미지](https://via.placeholder.com/600x400)

## 결론

위의 모든 기능이 올바르게 렌더링되면 마크다운 처리 파이프라인이 작동하고 있습니다! 🎉
