---
title: "Basic Data Structure Implementations in C"
description: "Implementing linked lists, stacks, and queues in C from scratch — memory management, operations, complexity analysis, and practical patterns."
date: "2026-03-04"
category: "programming/c"
tags: ["C", "data structures", "linked list", "stack", "queue", "implementation"]
author: "Nemit"
featured: false
pinned: false
---

# Basic Data Structure Implementations in C

## Singly Linked List

A linked list is a chain of **nodes** where each node contains data and a pointer to the next node.

```
head → [10|→] → [20|→] → [30|→] → NULL
```

### Node Structure

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;
```

### Creating Nodes

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

### Operations

```c
// Insert at head — O(1)
void push_front(Node **head, int data) {
    Node *node = create_node(data);
    node->next = *head;
    *head = node;
}

// Insert at tail — O(n) (O(1) if you maintain a tail pointer)
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

// Delete first occurrence of value — O(n)
void delete_value(Node **head, int data) {
    Node *curr = *head;
    Node *prev = NULL;

    while (curr && curr->data != data) {
        prev = curr;
        curr = curr->next;
    }
    if (!curr) return;   // Not found

    if (prev)
        prev->next = curr->next;
    else
        *head = curr->next;   // Deleting head

    free(curr);
}

// Search — O(n)
Node *find(Node *head, int data) {
    while (head) {
        if (head->data == data)
            return head;
        head = head->next;
    }
    return NULL;
}

// Print list
void print_list(Node *head) {
    while (head) {
        printf("%d -> ", head->data);
        head = head->next;
    }
    printf("NULL\n");
}

// Free entire list
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

### Usage

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

### Why `Node **head`?

Functions that may change the head pointer need a **pointer to the head pointer** (`Node **`). Otherwise, changes to `head` inside the function only affect the local copy:

```c
// WRONG — doesn't update caller's head
void push_front_bad(Node *head, int data) {
    Node *node = create_node(data);
    node->next = head;
    head = node;    // Only changes local copy
}

// CORRECT — updates caller's head through pointer
void push_front(Node **head, int data) {
    Node *node = create_node(data);
    node->next = *head;
    *head = node;   // Changes the actual head pointer
}
```

---

## Doubly Linked List

Each node has pointers to both next and previous nodes, enabling O(1) deletion given a node pointer and bidirectional traversal.

```
NULL ← [10|←→] ↔ [20|←→] ↔ [30|←→] → NULL
```

### Structure

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

### Operations

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

// Remove a specific node — O(1) given the node pointer
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

### Sentinel Node Pattern

Using a dummy sentinel node simplifies edge cases (no NULL checks for head/tail):

```c
typedef struct {
    DNode sentinel;   // Dummy node — never holds real data
    size_t size;
} DList;

void dlist_init(DList *list) {
    list->sentinel.prev = &list->sentinel;
    list->sentinel.next = &list->sentinel;
    list->size = 0;
}

// Insert after a node (no NULL checks needed)
void insert_after(DNode *node, int data) {
    DNode *new_node = malloc(sizeof(DNode));
    new_node->data = data;
    new_node->next = node->next;
    new_node->prev = node;
    node->next->prev = new_node;
    node->next = new_node;
}

// push_front = insert after sentinel
// push_back = insert before sentinel (= insert after sentinel->prev)
```

---

## Stack (LIFO)

Last In, First Out. Only the top element is accessible.

### Array-Based Stack

```c
#define STACK_CAPACITY 1024

typedef struct {
    int data[STACK_CAPACITY];
    int top;    // Index of top element (-1 when empty)
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
        fprintf(stderr, "Stack overflow\n");
        exit(1);
    }
    s->data[++s->top] = value;
}

int stack_pop(Stack *s) {
    if (stack_empty(s)) {
        fprintf(stderr, "Stack underflow\n");
        exit(1);
    }
    return s->data[s->top--];
}

int stack_peek(const Stack *s) {
    if (stack_empty(s)) {
        fprintf(stderr, "Stack is empty\n");
        exit(1);
    }
    return s->data[s->top];
}
```

### Dynamic Array Stack

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
    if (s->top == -1) { fprintf(stderr, "Empty\n"); exit(1); }
    return s->data[s->top--];
}

void dynstack_free(DynStack *s) {
    free(s->data);
    free(s);
}
```

### Linked List Stack

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
    if (!s->top) { fprintf(stderr, "Empty\n"); exit(1); }
    StackNode *node = s->top;
    int value = node->data;
    s->top = node->next;
    free(node);
    s->size--;
    return value;
}
```

### Complexity

| Operation | Array Stack | Linked List Stack |
|---|---|---|
| Push | O(1) amortized | O(1) |
| Pop | O(1) | O(1) |
| Peek | O(1) | O(1) |
| Space | Contiguous (cache-friendly) | Scattered (cache-unfriendly) |

### Stack Applications

- Function call stack (recursion)
- Expression evaluation (postfix, infix to postfix conversion)
- Parenthesis matching
- Undo operations
- DFS (depth-first search)
- Backtracking algorithms

#### Balanced Parentheses Checker

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

## Queue (FIFO)

First In, First Out. Elements are added at the rear and removed from the front.

### Circular Array Queue

A linear array queue wastes space as elements are dequeued. A **circular buffer** (ring buffer) wraps around:

```c
#define QUEUE_CAPACITY 1024

typedef struct {
    int data[QUEUE_CAPACITY];
    int front;    // Index of front element
    int rear;     // Index of next insertion point
    int size;     // Current number of elements
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
        fprintf(stderr, "Queue full\n");
        exit(1);
    }
    q->data[q->rear] = value;
    q->rear = (q->rear + 1) % QUEUE_CAPACITY;
    q->size++;
}

int queue_dequeue(Queue *q) {
    if (queue_empty(q)) {
        fprintf(stderr, "Queue empty\n");
        exit(1);
    }
    int value = q->data[q->front];
    q->front = (q->front + 1) % QUEUE_CAPACITY;
    q->size--;
    return value;
}

int queue_peek(const Queue *q) {
    if (queue_empty(q)) {
        fprintf(stderr, "Queue empty\n");
        exit(1);
    }
    return q->data[q->front];
}
```

### Linked List Queue

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
    if (!q->front) { fprintf(stderr, "Empty\n"); exit(1); }
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

### Complexity

| Operation | Circular Array | Linked List |
|---|---|---|
| Enqueue | O(1) | O(1) |
| Dequeue | O(1) | O(1) |
| Peek | O(1) | O(1) |
| Space | Fixed capacity (or amortized resize) | Dynamic |

### Queue Applications

- BFS (breadth-first search)
- Task scheduling (OS process queues)
- Message queues (producer-consumer)
- Buffer management (I/O, network packets)
- Print spooling

---

## Deque (Double-Ended Queue)

Supports insertion and removal at both ends:

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
    if (d->size == d->capacity) { /* resize */ }
    d->front = (d->front - 1 + d->capacity) % d->capacity;
    d->data[d->front] = value;
    d->size++;
}

void deque_push_back(Deque *d, int value) {
    if (d->size == d->capacity) { /* resize */ }
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

## Generic Data Structures with `void *`

C's `void *` enables type-generic containers:

```c
typedef struct GNode {
    void *data;
    struct GNode *next;
} GNode;

typedef struct {
    GNode *head;
    size_t size;
    size_t elem_size;     // Size of each element
    void (*free_fn)(void *);  // Optional custom destructor
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

// Usage:
GList *int_list = glist_create(sizeof(int), NULL);
int val = 42;
glist_push_front(int_list, &val);

GList *str_list = glist_create(sizeof(char *), free);
char *s = strdup("hello");
glist_push_front(str_list, &s);
```

---

## Intrusive Linked Lists (Linux Kernel Style)

Instead of wrapping data in a node, embed the list node **inside** the data structure:

```c
// Generic list node (embedded in your struct)
typedef struct list_head {
    struct list_head *prev, *next;
} list_head;

// Macro to get the containing struct from a list_head pointer
#define container_of(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))

// Your data structure
typedef struct {
    int id;
    char name[32];
    list_head link;     // Embedded list node
} Task;

// Initialize list (circular, with sentinel)
void list_init(list_head *head) {
    head->prev = head;
    head->next = head;
}

// Insert after head
void list_add(list_head *new_node, list_head *head) {
    new_node->next = head->next;
    new_node->prev = head;
    head->next->prev = new_node;
    head->next = new_node;
}

// Remove
void list_del(list_head *node) {
    node->prev->next = node->next;
    node->next->prev = node->prev;
}

// Usage:
list_head task_list;
list_init(&task_list);

Task t1 = {.id = 1, .name = "init"};
Task t2 = {.id = 2, .name = "shell"};
list_add(&t1.link, &task_list);
list_add(&t2.link, &task_list);

// Iterate:
list_head *pos;
for (pos = task_list.next; pos != &task_list; pos = pos->next) {
    Task *task = container_of(pos, Task, link);
    printf("Task %d: %s\n", task->id, task->name);
}
```

Advantages:
- Zero extra allocation (node is part of the struct)
- An object can be on multiple lists simultaneously
- Cache-friendly (no extra indirection to get data)
- Used extensively in the Linux kernel

---

## Complexity Summary

| Operation | Array | Singly LL | Doubly LL |
|---|---|---|---|
| Access by index | O(1) | O(n) | O(n) |
| Insert at front | O(n) | O(1) | O(1) |
| Insert at back | O(1) amortized | O(n)* | O(1) |
| Insert at position | O(n) | O(n) | O(1)** |
| Delete at front | O(n) | O(1) | O(1) |
| Delete at back | O(1) | O(n) | O(1) |
| Delete at position | O(n) | O(n) | O(1)** |
| Search | O(n) | O(n) | O(n) |

\* O(1) with tail pointer
\** O(1) given a pointer to the node
