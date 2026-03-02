# Fix: `crypto.randomUUID()` Failing in Insecure Context

## Overview

Replace all unguarded `crypto.randomUUID()` calls with the existing `generateId()` utility from `src/lib/utils.ts`, which has a fallback for environments where `crypto.randomUUID` is unavailable (e.g., production served over plain HTTP on non-localhost).

## Current State Analysis

- `useCopyAnimation.ts:59` calls `crypto.randomUUID()` directly — this is the **primary bug** causing copied wizard items to visually disappear but never get added to the budget
- `types.ts:132,142,155` — three factory functions (`createEmptyIncomeItem`, `createEmptyExpenseItem`, `createEmptySavingsItem`) also call `crypto.randomUUID()` directly, but are currently unused (dead code)
- `utils.ts:195-205` — `generateId()` exists with proper guard and `Math.random()`-based fallback
- All three wizard steps (StepIncome, StepExpenses, StepSavings) use `useCopyAnimation` and are all affected

### Key Discoveries:
- The step components already import `generateId` for their manual "Add Item" buttons — only the copy-from-previous-budget flow is broken
- The three `createEmpty*Item()` functions in `types.ts` are exported but not imported anywhere — dead code, but should still be fixed for safety

## Desired End State

All `crypto.randomUUID()` calls outside of `generateId()` itself are replaced with `generateId()`. The wizard copy-from-previous-budget feature works in insecure contexts (HTTP on non-localhost).

## What We're NOT Doing

- Not adding HTTPS/TLS to the production deployment
- Not removing the `createEmpty*Item()` factory functions (even though unused, fixing is safer than removing)
- Not refactoring the animation flow or reducer pattern

## Implementation Approach

Simple find-and-replace: import `generateId` and use it instead of `crypto.randomUUID()` in the two affected files.

## Phase 1: Replace `crypto.randomUUID()` with `generateId()`

### Changes Required:

#### 1. `src/components/wizard/hooks/useCopyAnimation.ts`

**Add import** at top of file:
```typescript
import { generateId } from '@/lib/utils'
```

**Replace line 59**:
```typescript
// Before:
const newId = crypto.randomUUID()

// After:
const newId = generateId()
```

#### 2. `src/components/wizard/types.ts`

**Add import** at top of file (add `generateId` to existing imports from `@/lib/utils`, or add a new import if none exists):
```typescript
import { generateId } from '@/lib/utils'
```

**Replace line 132** in `createEmptyIncomeItem()`:
```typescript
// Before:
id: crypto.randomUUID(),

// After:
id: generateId(),
```

**Replace line 142** in `createEmptyExpenseItem()`:
```typescript
// Before:
id: crypto.randomUUID(),

// After:
id: generateId(),
```

**Replace line 155** in `createEmptySavingsItem()`:
```typescript
// Before:
id: crypto.randomUUID(),

// After:
id: generateId(),
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] No lint errors: `npm run lint`
- [x] Tests pass: `npm test`
- [x] No remaining unguarded `crypto.randomUUID()` in `src/` (excluding `utils.ts` and test files)

#### Manual Verification:
- [x] In wizard, copying items from previous budget works over HTTP on a non-localhost device (or simulated insecure context)
- [x] Items visually animate AND actually appear in the budget items list
- [x] Manual "Add Item" button still works in all three steps
- [x] Copy animation visual behavior unchanged (check icon → collapse → entrance)

## References

- Research: `.claude/thoughts/research/2026-03-02-wizard-copy-items-bug-crypto-randomuuid.md`
- Bug source: `src/components/wizard/hooks/useCopyAnimation.ts:59`
- Safe utility: `src/lib/utils.ts:195-205`
