---
title: "C에서 기본 자료구조 구현"
description: "C에서 연결 리스트, 스택, 큐를 처음부터 구현 — 메모리 관리, 연산, 복잡도 분석, 실용적 패턴."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "자료구조", "연결 리스트", "스택", "큐", "구현"]
author: "Nemit"
featured: false
pinned: false
---

# C에서 기본 자료구조 구현

## 단일 연결 리스트

연결 리스트는 **노드**의 체인으로, 각 노드는 데이터와 다음 노드에 대한 포인터를 포함한다.

```
head → [10|→] → [20|→] → [30|→] → NULL
```

### 노드 구조체

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;
```

### 노드 생성

```c
Node *create_node(int data) {
    Node *node = malloc(sizeof(Node));
    if (!node) {
        perror("malloc");
        exit(1);
    }
    node->data = data;
    node->next = NULL;
    return node;
}
```

### 연산

```c
// 앞에 삽입 — O(1)
void push_front(Node **head, int data) {
    Node *node = create_node(data);
    node->next = *head;
    *head = node;
}

// 뒤에 삽입 — O(n) (tail 포인터가 있으면 O(1))
void push_back(Node **head, int data) {
    Node *node = create_node(data);
    if (*head == NULL) {
        *head = node;
        return;
    }
    Node *curr = *head;
    while (curr->next)
        curr = curr->next;
    curr->next = node;
}

// 값의 첫 번째 출현 삭제 — O(n)
void delete_value(Node **head, int data) {
    Node *curr = *head;
    Node *prev = NULL;

    while (curr && curr->data != data) {
        prev = curr;
        curr = curr->next;
    }
    if (!curr) return;   // 찾지 못함

    if (prev)
        prev->next = curr->next;
    else
        *head = curr->next;   // head 삭제

    free(curr);
}

// 검색 — O(n)
Node *find(Node *head, int data) {
    while (head) {
        if (head->data == data)
            return head;
        head = head->next;
    }
    return NULL;
}

// 리스트 출력
void print_list(Node *head) {
    while (head) {
        printf("%d -> ", head->data);
        head = head->next;
    }
    printf("NULL\n");
}

// 전체 리스트 해제
void free_list(Node **head) {
    Node *curr = *head;
    while (curr) {
        Node *next = curr->next;
        free(curr);
        curr = next;
    }
    *head = NULL;
}
```

### 사용법

```c
int main() {
    Node *list = NULL;

    push_front(&list, 30);
    push_front(&list, 20);
    push_front(&list, 10);
    push_back(&list, 40);

    print_list(list);      // 10 -> 20 -> 30 -> 40 -> NULL

    delete_value(&list, 20);
    print_list(list);      // 10 -> 30 -> 40 -> NULL

    free_list(&list);
    return 0;
}
```

### 왜 `Node **head`인가?

head 포인터를 변경할 수 있는 함수는 **head 포인터에 대한 포인터** (`Node **`)가 필요하다. 그렇지 않으면 함수 내에서 `head`의 변경이 지역 복사본에만 영향을 미친다:

```c
// 틀림 — 호출자의 head를 업데이트하지 않음
void push_front_bad(Node *head, int data) {
    Node *node = create_node(data);
    node->next = head;
    head = node;    // 지역 복사본만 변경
}

// 맞음 — 포인터를 통해 호출자의 head를 업데이트
void push_front(Node **head, int data) {
    Node *node = create_node(data);
    node->next = *head;
    *head = node;   // 실제 head 포인터를 변경
}
```

---

## 이중 연결 리스트

각 노드가 다음과 이전 노드에 대한 포인터를 가져, 노드 포인터가 주어지면 O(1) 삭제와 양방향 순회가 가능하다.

```
NULL ← [10|←→] ↔ [20|←→] ↔ [30|←→] → NULL
```

### 구조체

```c
typedef struct DNode {
    int data;
    struct DNode *prev;
    struct DNode *next;
} DNode;

typedef struct {
    DNode *head;
    DNode *tail;
    size_t size;
} DList;
```

### 연산

```c
DList *dlist_create() {
    DList *list = calloc(1, sizeof(DList));
    return list;
}

void dlist_push_front(DList *list, int data) {
    DNode *node = malloc(sizeof(DNode));
    node->data = data;
    node->prev = NULL;
    node->next = list->head;

    if (list->head)
        list->head->prev = node;
    else
        list->tail = node;

    list->head = node;
    list->size++;
}

void dlist_push_back(DList *list, int data) {
    DNode *node = malloc(sizeof(DNode));
    node->data = data;
    node->next = NULL;
    node->prev = list->tail;

    if (list->tail)
        list->tail->next = node;
    else
        list->head = node;

    list->tail = node;
    list->size++;
}

// 특정 노드 제거 — 노드 포인터가 주어지면 O(1)
void dlist_remove(DList *list, DNode *node) {
    if (node->prev)
        node->prev->next = node->next;
    else
        list->head = node->next;

    if (node->next)
        node->next->prev = node->prev;
    else
        list->tail = node->prev;

    free(node);
    list->size--;
}

void dlist_free(DList *list) {
    DNode *curr = list->head;
    while (curr) {
        DNode *next = curr->next;
        free(curr);
        curr = next;
    }
    free(list);
}
```

### 센티널 노드 패턴

더미 센티널 노드를 사용하면 엣지 케이스가 단순해진다 (head/tail에 대한 NULL 검사 불필요):

```c
typedef struct {
    DNode sentinel;   // 더미 노드 — 실제 데이터를 보유하지 않음
    size_t size;
} DList;

void dlist_init(DList *list) {
    list->sentinel.prev = &list->sentinel;
    list->sentinel.next = &list->sentinel;
    list->size = 0;
}

// 노드 뒤에 삽입 (NULL 검사 불필요)
void insert_after(DNode *node, int data) {
    DNode *new_node = malloc(sizeof(DNode));
    new_node->data = data;
    new_node->next = node->next;
    new_node->prev = node;
    node->next->prev = new_node;
    node->next = new_node;
}

// push_front = sentinel 뒤에 삽입
// push_back = sentinel 앞에 삽입 (= sentinel->prev 뒤에 삽입)
```

---

## 스택 (LIFO)

후입선출. 최상위 요소만 접근 가능.

### 배열 기반 스택

```c
#define STACK_CAPACITY 1024

typedef struct {
    int data[STACK_CAPACITY];
    int top;    // 최상위 요소의 인덱스 (비어있으면 -1)
} Stack;

void stack_init(Stack *s) {
    s->top = -1;
}

int stack_empty(const Stack *s) {
    return s->top == -1;
}

int stack_full(const Stack *s) {
    return s->top == STACK_CAPACITY - 1;
}

void stack_push(Stack *s, int value) {
    if (stack_full(s)) {
        fprintf(stderr, "스택 오버플로우\n");
        exit(1);
    }
    s->data[++s->top] = value;
}

int stack_pop(Stack *s) {
    if (stack_empty(s)) {
        fprintf(stderr, "스택 언더플로우\n");
        exit(1);
    }
    return s->data[s->top--];
}

int stack_peek(const Stack *s) {
    if (stack_empty(s)) {
        fprintf(stderr, "스택이 비어있음\n");
        exit(1);
    }
    return s->data[s->top];
}
```

### 동적 배열 스택

```c
typedef struct {
    int *data;
    int top;
    int capacity;
} DynStack;

DynStack *dynstack_create(int initial_cap) {
    DynStack *s = malloc(sizeof(DynStack));
    s->data = malloc(initial_cap * sizeof(int));
    s->top = -1;
    s->capacity = initial_cap;
    return s;
}

void dynstack_push(DynStack *s, int value) {
    if (s->top == s->capacity - 1) {
        s->capacity *= 2;
        int *tmp = realloc(s->data, s->capacity * sizeof(int));
        if (!tmp) { perror("realloc"); exit(1); }
        s->data = tmp;
    }
    s->data[++s->top] = value;
}

int dynstack_pop(DynStack *s) {
    if (s->top == -1) { fprintf(stderr, "비어있음\n"); exit(1); }
    return s->data[s->top--];
}

void dynstack_free(DynStack *s) {
    free(s->data);
    free(s);
}
```

### 연결 리스트 스택

```c
typedef struct StackNode {
    int data;
    struct StackNode *next;
} StackNode;

typedef struct {
    StackNode *top;
    size_t size;
} LStack;

void lstack_push(LStack *s, int value) {
    StackNode *node = malloc(sizeof(StackNode));
    node->data = value;
    node->next = s->top;
    s->top = node;
    s->size++;
}

int lstack_pop(LStack *s) {
    if (!s->top) { fprintf(stderr, "비어있음\n"); exit(1); }
    StackNode *node = s->top;
    int value = node->data;
    s->top = node->next;
    free(node);
    s->size--;
    return value;
}
```

### 복잡도

| 연산 | 배열 스택 | 연결 리스트 스택 |
|---|---|---|
| Push | O(1) 상각 | O(1) |
| Pop | O(1) | O(1) |
| Peek | O(1) | O(1) |
| 공간 | 연속 (캐시 친화적) | 분산 (캐시 비친화적) |

### 스택 응용

- 함수 호출 스택 (재귀)
- 수식 평가 (후위, 중위를 후위로 변환)
- 괄호 매칭
- 실행 취소 연산
- DFS (깊이 우선 탐색)
- 백트래킹 알고리즘

#### 균형 괄호 검사기

```c
int is_balanced(const char *expr) {
    Stack s;
    stack_init(&s);

    for (int i = 0; expr[i]; i++) {
        char c = expr[i];
        if (c == '(' || c == '[' || c == '{') {
            stack_push(&s, c);
        } else if (c == ')' || c == ']' || c == '}') {
            if (stack_empty(&s)) return 0;
            char top = stack_pop(&s);
            if ((c == ')' && top != '(') ||
                (c == ']' && top != '[') ||
                (c == '}' && top != '{'))
                return 0;
        }
    }
    return stack_empty(&s);
}
```

---

## 큐 (FIFO)

선입선출. 요소는 뒤에서 추가되고 앞에서 제거된다.

### 원형 배열 큐

선형 배열 큐는 요소가 제거되면 공간을 낭비한다. **원형 버퍼** (링 버퍼)는 래핑된다:

```c
#define QUEUE_CAPACITY 1024

typedef struct {
    int data[QUEUE_CAPACITY];
    int front;    // 앞 요소의 인덱스
    int rear;     // 다음 삽입 지점의 인덱스
    int size;     // 현재 요소 수
} Queue;

void queue_init(Queue *q) {
    q->front = 0;
    q->rear = 0;
    q->size = 0;
}

int queue_empty(const Queue *q) {
    return q->size == 0;
}

int queue_full(const Queue *q) {
    return q->size == QUEUE_CAPACITY;
}

void queue_enqueue(Queue *q, int value) {
    if (queue_full(q)) {
        fprintf(stderr, "큐가 가득 참\n");
        exit(1);
    }
    q->data[q->rear] = value;
    q->rear = (q->rear + 1) % QUEUE_CAPACITY;
    q->size++;
}

int queue_dequeue(Queue *q) {
    if (queue_empty(q)) {
        fprintf(stderr, "큐가 비어있음\n");
        exit(1);
    }
    int value = q->data[q->front];
    q->front = (q->front + 1) % QUEUE_CAPACITY;
    q->size--;
    return value;
}

int queue_peek(const Queue *q) {
    if (queue_empty(q)) {
        fprintf(stderr, "큐가 비어있음\n");
        exit(1);
    }
    return q->data[q->front];
}
```

### 연결 리스트 큐

```c
typedef struct QNode {
    int data;
    struct QNode *next;
} QNode;

typedef struct {
    QNode *front;
    QNode *rear;
    size_t size;
} LQueue;

void lqueue_init(LQueue *q) {
    q->front = q->rear = NULL;
    q->size = 0;
}

void lqueue_enqueue(LQueue *q, int value) {
    QNode *node = malloc(sizeof(QNode));
    node->data = value;
    node->next = NULL;

    if (q->rear) {
        q->rear->next = node;
    } else {
        q->front = node;
    }
    q->rear = node;
    q->size++;
}

int lqueue_dequeue(LQueue *q) {
    if (!q->front) { fprintf(stderr, "비어있음\n"); exit(1); }
    QNode *node = q->front;
    int value = node->data;
    q->front = node->next;
    if (!q->front) q->rear = NULL;
    free(node);
    q->size--;
    return value;
}

void lqueue_free(LQueue *q) {
    while (q->front) {
        QNode *next = q->front->next;
        free(q->front);
        q->front = next;
    }
    q->rear = NULL;
    q->size = 0;
}
```

### 복잡도

| 연산 | 원형 배열 | 연결 리스트 |
|---|---|---|
| Enqueue | O(1) | O(1) |
| Dequeue | O(1) | O(1) |
| Peek | O(1) | O(1) |
| 공간 | 고정 용량 (또는 상각 리사이즈) | 동적 |

### 큐 응용

- BFS (너비 우선 탐색)
- 태스크 스케줄링 (OS 프로세스 큐)
- 메시지 큐 (생산자-소비자)
- 버퍼 관리 (I/O, 네트워크 패킷)
- 인쇄 스풀링

---

## 덱 (양방향 큐)

양쪽 끝에서의 삽입과 제거를 지원한다:

```c
typedef struct {
    int *data;
    int front;
    int rear;
    int size;
    int capacity;
} Deque;

Deque *deque_create(int capacity) {
    Deque *d = malloc(sizeof(Deque));
    d->data = malloc(capacity * sizeof(int));
    d->front = 0;
    d->rear = 0;
    d->size = 0;
    d->capacity = capacity;
    return d;
}

void deque_push_front(Deque *d, int value) {
    if (d->size == d->capacity) { /* 리사이즈 */ }
    d->front = (d->front - 1 + d->capacity) % d->capacity;
    d->data[d->front] = value;
    d->size++;
}

void deque_push_back(Deque *d, int value) {
    if (d->size == d->capacity) { /* 리사이즈 */ }
    d->data[d->rear] = value;
    d->rear = (d->rear + 1) % d->capacity;
    d->size++;
}

int deque_pop_front(Deque *d) {
    int value = d->data[d->front];
    d->front = (d->front + 1) % d->capacity;
    d->size--;
    return value;
}

int deque_pop_back(Deque *d) {
    d->rear = (d->rear - 1 + d->capacity) % d->capacity;
    d->size--;
    return d->data[d->rear];
}
```

---

## `void *`를 사용한 제네릭 자료구조

C의 `void *`는 타입 제네릭 컨테이너를 가능하게 한다:

```c
typedef struct GNode {
    void *data;
    struct GNode *next;
} GNode;

typedef struct {
    GNode *head;
    size_t size;
    size_t elem_size;     // 각 요소의 크기
    void (*free_fn)(void *);  // 선택적 커스텀 소멸자
} GList;

GList *glist_create(size_t elem_size, void (*free_fn)(void *)) {
    GList *list = calloc(1, sizeof(GList));
    list->elem_size = elem_size;
    list->free_fn = free_fn;
    return list;
}

void glist_push_front(GList *list, const void *data) {
    GNode *node = malloc(sizeof(GNode));
    node->data = malloc(list->elem_size);
    memcpy(node->data, data, list->elem_size);
    node->next = list->head;
    list->head = node;
    list->size++;
}

void *glist_get(GList *list, size_t index) {
    GNode *curr = list->head;
    for (size_t i = 0; i < index && curr; i++)
        curr = curr->next;
    return curr ? curr->data : NULL;
}

void glist_free(GList *list) {
    GNode *curr = list->head;
    while (curr) {
        GNode *next = curr->next;
        if (list->free_fn)
            list->free_fn(curr->data);
        else
            free(curr->data);
        free(curr);
        curr = next;
    }
    free(list);
}

// 사용:
GList *int_list = glist_create(sizeof(int), NULL);
int val = 42;
glist_push_front(int_list, &val);
```

---

## 침입적 연결 리스트 (리눅스 커널 스타일)

데이터를 노드에 감싸는 대신, 리스트 노드를 데이터 구조 **내부에** 임베드한다:

```c
// 제네릭 리스트 노드 (구조체에 임베드)
typedef struct list_head {
    struct list_head *prev, *next;
} list_head;

// list_head 포인터에서 포함하는 구조체를 얻는 매크로
#define container_of(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))

// 데이터 구조
typedef struct {
    int id;
    char name[32];
    list_head link;     // 임베드된 리스트 노드
} Task;

// 리스트 초기화 (순환, 센티널 포함)
void list_init(list_head *head) {
    head->prev = head;
    head->next = head;
}

// head 뒤에 삽입
void list_add(list_head *new_node, list_head *head) {
    new_node->next = head->next;
    new_node->prev = head;
    head->next->prev = new_node;
    head->next = new_node;
}

// 제거
void list_del(list_head *node) {
    node->prev->next = node->next;
    node->next->prev = node->prev;
}

// 사용:
list_head task_list;
list_init(&task_list);

Task t1 = {.id = 1, .name = "init"};
Task t2 = {.id = 2, .name = "shell"};
list_add(&t1.link, &task_list);
list_add(&t2.link, &task_list);

// 반복:
list_head *pos;
for (pos = task_list.next; pos != &task_list; pos = pos->next) {
    Task *task = container_of(pos, Task, link);
    printf("Task %d: %s\n", task->id, task->name);
}
```

장점:
- 추가 할당 없음 (노드가 구조체의 일부)
- 객체가 여러 리스트에 동시에 있을 수 있음
- 캐시 친화적 (데이터 접근을 위한 추가 간접 참조 없음)
- 리눅스 커널에서 광범위하게 사용됨

---

## 복잡도 요약

| 연산 | 배열 | 단일 연결 리스트 | 이중 연결 리스트 |
|---|---|---|---|
| 인덱스 접근 | O(1) | O(n) | O(n) |
| 앞에 삽입 | O(n) | O(1) | O(1) |
| 뒤에 삽입 | O(1) 상각 | O(n)* | O(1) |
| 위치에 삽입 | O(n) | O(n) | O(1)** |
| 앞에서 삭제 | O(n) | O(1) | O(1) |
| 뒤에서 삭제 | O(1) | O(n) | O(1) |
| 위치에서 삭제 | O(n) | O(n) | O(1)** |
| 검색 | O(n) | O(n) | O(n) |

\* tail 포인터가 있으면 O(1)
\** 노드 포인터가 주어진 경우 O(1)
