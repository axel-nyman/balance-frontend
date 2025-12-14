# Update #002: Fix API Endpoint Paths

**Purpose:** Correct API endpoint paths and HTTP methods to match backend  
**Files Affected:** `FRONTEND_STORIES_EPIC6.md`, `FRONTEND_STORIES_EPIC7.md`, `FRONTEND_STORIES_EPIC1.md`  
**Priority:** Critical (will cause runtime errors if not fixed)

---

## Problem Summary

Several frontend epic documents reference incorrect API endpoints:

| Document | Current (Wrong) | Correct (Backend) |
|----------|-----------------|-------------------|
| Epic 6 | `POST /api/budgets/:id/lock` | `PUT /api/budgets/{id}/lock` |
| Epic 6 | `POST /api/budgets/:id/unlock` | `PUT /api/budgets/{id}/unlock` |
| Epic 7 | `GET /api/budgets/:id/todo` | `GET /api/budgets/{budgetId}/todo-list` |
| Epic 7 | `PUT /api/budgets/:id/todo/:itemId` | `PUT /api/budgets/{budgetId}/todo-list/items/{id}` |

**Note:** The actual API client in Epic 1 (`src/api/budgets.ts` and `src/api/todo.ts`) already uses the correct paths. This is a documentation inconsistency.

---

## Changes Required

### 1. Update Epic 6 API Endpoints Section

**File:** `FRONTEND_STORIES_EPIC6.md`  
**Location:** Lines 24-37

**Replace:**
```markdown
**API Endpoints Used:**
- `GET /api/budgets/:id` — Get budget detail
- `DELETE /api/budgets/:id` — Delete budget
- `POST /api/budgets/:id/lock` — Lock budget
- `POST /api/budgets/:id/unlock` — Unlock budget
```

**With:**
```markdown
**API Endpoints Used:**
- `GET /api/budgets/{id}` — Get budget detail
- `DELETE /api/budgets/{id}` — Delete budget
- `PUT /api/budgets/{id}/lock` — Lock budget
- `PUT /api/budgets/{id}/unlock` — Unlock budget
```

---

### 2. Update Epic 7 API Endpoints Section

**File:** `FRONTEND_STORIES_EPIC7.md`  
**Location:** Lines 23-25

**Replace:**
```markdown
**API Endpoints Used:**
- `GET /api/budgets/:id/todo` — Get todo list for budget
- `PUT /api/budgets/:id/todo/:itemId` — Update todo item (toggle completion)
```

**With:**
```markdown
**API Endpoints Used:**
- `GET /api/budgets/{budgetId}/todo-list` — Get todo list for budget
- `PUT /api/budgets/{budgetId}/todo-list/items/{id}` — Update todo item (toggle completion)
```

---

### 3. Update Epic 1 TodoList Type

**File:** `FRONTEND_STORIES_EPIC1.md`  
**Location:** In `src/api/types.ts` section (around line 530)

The backend returns a `summary` object in the todo list response. Update the type:

**Replace:**
```typescript
export interface TodoList {
  budgetId: string
  items: TodoItem[]
}
```

**With:**
```typescript
export interface TodoListSummary {
  totalItems: number
  pendingItems: number
  completedItems: number
}

export interface TodoList {
  id: string
  budgetId: string
  createdAt: string
  items: TodoItem[]
  summary: TodoListSummary
}
```

---

### 4. Verify Epic 1 API Client (Already Correct)

The API client in Epic 1 already uses the correct paths. Verify these are unchanged:

**In `src/api/budgets.ts`:**
```typescript
export async function lockBudget(id: string): Promise<BudgetDetail> {
  return apiPut(`/budgets/${id}/lock`)  // ✓ Correct: PUT
}

export async function unlockBudget(id: string): Promise<BudgetDetail> {
  return apiPut(`/budgets/${id}/unlock`)  // ✓ Correct: PUT
}
```

**In `src/api/todo.ts`:**
```typescript
export async function getTodoList(budgetId: string): Promise<TodoList> {
  return apiGet(`/budgets/${budgetId}/todo-list`)  // ✓ Correct path
}

export async function updateTodoItem(
  budgetId: string,
  itemId: string,
  data: UpdateTodoItemRequest
): Promise<TodoItem> {
  return apiPut(`/budgets/${budgetId}/todo-list/items/${itemId}`, data)  // ✓ Correct path
}
```

---

## Backend Reference

From `backend-stories.md`:

**Story 24 - Lock Budget:**
```
PUT /api/budgets/{id}/lock
```

**Story 27 - Unlock Budget:**
```
PUT /api/budgets/{id}/unlock
```

**Story 25 - Get Todo List:**
```
GET /api/budgets/{budgetId}/todo-list
```

**Story 28 - Update Todo Item:**
```
PUT /api/budgets/{budgetId}/todo-list/items/{id}
```

---

## Impact Analysis

These are **documentation-only** fixes. The actual implementation code in Epic 1 is already correct, so no code changes are needed beyond updating Epic 1's TypeScript types for `TodoList`.

---

*Created: [Current Date]*
