---
title: "Test Blog Post"
description: "A test post to verify markdown processing"
date: "2025-11-25"
category: "template"
tags: ["test", "markdown", "nextjs"]
author: "Test Author"
featured: true
pinned: true
---

# Welcome to My Test Post

This is a test post to verify that our markdown processing pipeline works correctly.

## Features to Test

### Basic Markdown

This paragraph contains **bold text**, *italic text*, and ***bold italic text***. We also have ~~strikethrough~~ text.

Here's a [link to Google](https://google.com).

### Lists

Unordered list:
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

Ordered list:
1. First item
2. Second item
3. Third item

Task list:
- [x] Completed task
- [ ] Incomplete task
- [ ] Another incomplete task

### Code Blocks

Inline code: `const x = 42;`

JavaScript code block with syntax highlighting:

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

TypeScript example:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
```

### Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Basic Markdown | ✅ | Full support |
| Code Highlighting | ✅ | Multiple languages |
| Math Equations | ✅ | KaTeX rendering |
| Tables | ✅ | GFM support |

### Math Equations

Inline math: The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

Block math equation:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

Another equation:

$$
E = mc^2
$$

### Blockquotes

> This is a blockquote.
> It can span multiple lines.
> And multiple paragraphs.

### Images

![Placeholder Image](https://via.placeholder.com/600x400)

## Conclusion

If you can see all the features above rendered correctly, the markdown processing pipeline is working! 🎉
