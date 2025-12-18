---
date: 2025-12-18T12:00:00+01:00
researcher: Claude Code
git_commit: e0a6e09f25873b9adb156a2e3b96b8945e6e5759
branch: main
repository: balance-frontend
topic: "Planning Files Inconsistencies Analysis"
tags: [research, planning, documentation, inconsistencies, api, data-models]
status: complete
last_updated: 2025-12-18
last_updated_by: Claude Code
---

# Research: Planning Files Inconsistencies Analysis

**Date**: 2025-12-18T12:00:00+01:00
**Researcher**: Claude Code
**Git Commit**: e0a6e09f25873b9adb156a2e3b96b8945e6e5759
**Branch**: main
**Repository**: balance-frontend

## Research Question

Map out inconsistencies across all planning files in this repository.

## Summary

Analysis of 27 planning/documentation files revealed **5 categories of inconsistencies**, with **3 critical issues** that should be addressed before implementation begins. The most significant inconsistencies involve API endpoint path notation, HTTP method disagreements for budget lock/unlock, and an outdated field reference in CLAUDE.md.

## Files Analyzed

### Root Documentation (4 files)
- `CLAUDE.md` - Project instructions for Claude Code
- `TECH_STACK.md` - Technical stack decisions
- `TODO_LIST_FLOW.md` - Todo list page specification
- `backend-stories.md` - Backend API stories (API contract reference)

### UX Flows (6 files)
- `ux-flows/PROJECT_OVERVIEW.md`
- `ux-flows/ACCOUNTS_FLOW.md`
- `ux-flows/BUDGET_LIST_FLOW.md`
- `ux-flows/BUDGET_DETAIL_FLOW.md`
- `ux-flows/BUDGET_WIZARD_FLOW.md`
- `ux-flows/RECURRING_EXPENSES_FLOW.md`

### Implementation Stories (8 files)
- `todo/backlog/FRONTEND_STORIES_EPIC1.md` through `EPIC7.md`
- `todo/backlog/FRONTEND_STORIES_EPIC1_TESTING.md`

## Detailed Findings

### 1. API Endpoint Path Parameter Notation (MEDIUM PRIORITY)

Three different styles are used across files for path parameters:

| Style | Example | Used In |
|-------|---------|---------|
| `{id}` | `/api/budgets/{id}` | backend-stories.md, CLAUDE.md |
| `:id` | `/api/budgets/:id` | ux-flows/*.md, EPIC5.md |
| `{budgetId}` vs `{id}` | `/api/budgets/{budgetId}/income` | backend-stories.md uses `{budgetId}`, EPIC6 uses `{id}` |

**Specific Examples:**
- Backend: `/api/bank-accounts/{id}` (backend-stories.md:292)
- Frontend docs: `/api/bank-accounts/:id` (FRONTEND_STORIES_EPIC2.md:22)

**Impact**: Minor - both notations are documentation conventions. Backend uses `{id}` (OpenAPI/Swagger style), frontend uses `:id` (React Router style). Implementation should use the backend specification.

---

### 2. Budget Lock/Unlock HTTP Method (CRITICAL)

**The Issue**: Conflicting HTTP methods specified for lock/unlock endpoints.

| Document | Lock Endpoint | Method |
|----------|---------------|--------|
| CLAUDE.md:124 | `/api/budgets/{id}/lock` | **PUT** (explicitly states "NOT POST") |
| backend-stories.md:2091 | `/api/budgets/{id}/lock` | **PUT** |
| FRONTEND_STORIES_EPIC5.md:32 | `/api/budgets/:id/lock` | **POST** |
| FRONTEND_STORIES_EPIC6.md:27 | `/api/budgets/{id}/lock` | **PUT** |
| ux-flows/BUDGET_DETAIL_FLOW.md:389 | `/api/budgets/:id/lock` | **PUT** |

**Correct Answer**: **PUT** (as specified in backend-stories.md and CLAUDE.md)

**File to Fix**: `todo/backlog/FRONTEND_STORIES_EPIC5.md:32` - change `POST` to `PUT`

---

### 3. Todo List API Path (CRITICAL - Already Documented)

CLAUDE.md explicitly documents this correction at lines 128-129:

| Incorrect Path | Correct Path |
|----------------|--------------|
| `/api/budgets/:id/todo` | `/api/budgets/{budgetId}/todo-list` |
| `/api/budgets/:id/todo/:itemId` | `/api/budgets/{budgetId}/todo-list/items/{id}` |

**Status**: CLAUDE.md already flags this. Verify all implementation stories use the correct paths.

---

### 4. RecurringExpense Field Name Mismatch (CRITICAL)

**The Issue**: CLAUDE.md references a field that doesn't exist in the backend specification.

| Document | Field Name | Description |
|----------|-----------|-------------|
| CLAUDE.md:233 | `lastUsedInBudgetMonth` | "helps identify which recurring expenses are due" |
| backend-stories.md:2121 | `lastUsedBudgetId` | UUID of the budget that last used this template |
| backend-stories.md:480 | `lastUsedDate` | Date when last used in a locked budget |

**Correct Fields**: The backend defines `lastUsedBudgetId` (UUID) and `lastUsedDate` (Date) - there is no `lastUsedInBudgetMonth` field.

**File to Fix**: `CLAUDE.md:233` - update to reference `lastUsedBudgetId` and `lastUsedDate`

---

### 5. Budget Item ID Parameter Naming (LOW PRIORITY)

Two naming conventions for item IDs in nested routes:

| Document | Path Pattern |
|----------|-------------|
| backend-stories.md | `/api/budgets/{budgetId}/income/{id}` |
| FRONTEND_STORIES_EPIC6.md | `/api/budgets/{id}/income/{itemId}` |

**Impact**: Documentation inconsistency only. Implementation should follow backend-stories.md as the source of truth.

---

## Consistent Areas (No Issues Found)

### Frontend Routes
All documents consistently define these routes:
- `/` - Home (redirects to `/budgets`)
- `/accounts` - Bank accounts management
- `/recurring-expenses` - Recurring expense templates
- `/budgets` - Budget list
- `/budgets/new` - Budget wizard
- `/budgets/:id` - Budget detail
- `/budgets/:id/todo` - Todo list

### Component Naming
- Page components: `[Feature]Page.tsx` pattern
- List components: `[Feature]List.tsx` pattern
- Modal components: `[Action][Feature]Modal.tsx` pattern
- Responsive variants: `[Feature]Row.tsx` + `[Feature]Card.tsx`

### Business Terminology
- Budget states: UNLOCKED/LOCKED (consistent)
- Todo item types: TRANSFER/PAYMENT (consistent)
- Todo item states: PENDING/COMPLETED (consistent)
- Recurrence intervals: MONTHLY/QUARTERLY/BIANNUALLY/YEARLY (consistent)

### Data Models
- TodoList and TodoListSummary interfaces match between CLAUDE.md and backend-stories.md
- Budget balance calculation (`income - expenses - savings = 0`) consistent everywhere
- All entity field types match across documents

---

## Recommended Fixes

### Critical (Fix Before Implementation)

1. **FRONTEND_STORIES_EPIC5.md:32** - Change `POST /api/budgets/:id/lock` to `PUT /api/budgets/:id/lock`

2. **CLAUDE.md:233** - Replace:
   ```
   `lastUsedInBudgetMonth` field helps identify which recurring expenses are due
   ```
   With:
   ```
   `lastUsedBudgetId` and `lastUsedDate` fields help identify which recurring expenses are due
   ```

### Medium Priority (Clean Up)

3. **Standardize path parameter notation** - Consider using `{id}` notation (backend style) consistently in all documentation, or add a note that `:id` is the frontend equivalent.

4. **Standardize budget/item ID naming** - Use `{budgetId}` for budget ID and `{id}` for item ID in nested routes (as backend-stories.md does).

---

## Architecture Documentation

### Documentation Hierarchy (Source of Truth)

1. **backend-stories.md** - Authoritative source for API contracts, entity definitions, HTTP methods
2. **CLAUDE.md** - High-level guidance and corrections, references backend-stories.md
3. **ux-flows/*.md** - UI/UX specifications, component interactions
4. **todo/backlog/FRONTEND_STORIES_EPIC*.md** - Implementation details, should align with above

### Inconsistency Pattern

Most inconsistencies occur between:
- `backend-stories.md` (backend team documentation) and
- `FRONTEND_STORIES_EPIC*.md` (frontend implementation stories)

This suggests the frontend stories were written at a different time or by different authors without full synchronization with the backend specification.

---

## Code References

- `CLAUDE.md:124-125` - Correct lock/unlock endpoints documented
- `CLAUDE.md:128-129` - Correct todo list endpoints documented
- `CLAUDE.md:233` - Outdated `lastUsedInBudgetMonth` reference
- `backend-stories.md:2091` - Budget lock endpoint definition
- `backend-stories.md:2121` - `lastUsedBudgetId` field definition
- `FRONTEND_STORIES_EPIC5.md:32` - Incorrect POST method for lock

---

## Open Questions

1. Should all planning documents be updated to use a single path parameter notation (`{id}` vs `:id`)?
2. Are there other fields in CLAUDE.md that may reference outdated backend field names?
3. Should a validation script be created to check consistency across planning files?
