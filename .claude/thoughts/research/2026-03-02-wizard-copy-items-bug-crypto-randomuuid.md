---
date: 2026-03-02T12:00:00+01:00
researcher: Claude
git_commit: 175eae83e2ff5990f2eb36a95bc0460e2fc5ee05
branch: main
repository: balance-frontend
topic: "Bug: Wizard quick-add items check off and disappear but don't get added to budget"
tags: [research, codebase, wizard, bug, crypto-randomuuid, secure-context]
status: complete
last_updated: 2026-03-02
last_updated_by: Claude
---

# Research: Wizard Copy Items Bug — `crypto.randomUUID()` in Insecure Context

**Date**: 2026-03-02
**Researcher**: Claude
**Git Commit**: 175eae83e2ff5990f2eb36a95bc0460e2fc5ee05
**Branch**: main
**Repository**: balance-frontend

## Research Question

When adding recurring expenses (or last-budget items) to a new budget in the creation wizard, items visually check off and collapse/disappear but don't actually get added to the budget. Works in dev but not in production. Found on mobile.

## Summary

**Root cause: `crypto.randomUUID()` is called directly in `useCopyAnimation.ts:59` without a fallback. This API requires a secure context (HTTPS or localhost). Production is served via nginx over plain HTTP (port 80), so when accessed from a mobile device (not localhost), `crypto.randomUUID` is `undefined` and the call throws a `TypeError`, preventing the item from being dispatched to wizard state.**

The codebase has a safe `generateId()` utility in `src/lib/utils.ts:195` with a fallback for environments where `crypto.randomUUID` is unavailable, but `useCopyAnimation.ts` bypasses it and calls `crypto.randomUUID()` directly.

## Detailed Findings

### The Animation Flow (`useCopyAnimation.ts`)

The `startCopyAnimation` function (`src/components/wizard/hooks/useCopyAnimation.ts:50-86`) orchestrates the quick-add copy sequence:

```
1. setCopyingIds(sourceId)        ← runs immediately, shows check animation
2. const newId = crypto.randomUUID()  ← LINE 59: THROWS in insecure context
3. setTimeout(() => {             ← NEVER REGISTERED if line 59 throws
     onCopy(newId)                ← item never added to wizard state
   }, COPY_ACTION_DELAY)
4. setTimeout(() => {             ← cleanup, also never registered
     setCopyingIds.delete(sourceId)
   }, TOTAL_ANIMATION_DURATION)
```

When `crypto.randomUUID()` throws at line 59:
- `setCopyingIds` has already been called on line 56 → the UI shows the check animation and the collapse begins
- The error stops execution before the `setTimeout` callbacks are registered
- `onCopy` never fires → `dispatch({ type: 'ADD_EXPENSE_ITEM', ... })` never happens
- The cleanup timeout never fires → `copyingIds` retains the ID permanently
- The CSS collapse animation (`animate-collapse-row`) completes visually

**Visual result**: Item shows check icon, collapses, and disappears — but is never added to the budget items list.

### Why It Works in Dev but Not Production

| Environment | URL Pattern | Secure Context? | `crypto.randomUUID` |
|---|---|---|---|
| Dev (Vite) | `http://localhost:5173` | Yes (localhost exception) | Available |
| Production (nginx) | `http://<IP>:80` | No (plain HTTP, non-localhost) | Undefined |

- **Dev**: Docker Compose runs Vite dev server on port 5173. Accessed via `localhost` which browsers treat as a secure context.
- **Production**: `Dockerfile` builds the app and serves via `nginx:alpine` on port 80 over HTTP. When accessed from a phone on the network (e.g., `http://192.168.x.x`), this is NOT a secure context.

### The Safe Utility That Exists But Isn't Used

`src/lib/utils.ts:195-205` has `generateId()` with a proper fallback:

```typescript
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
```

The step components themselves use `generateId()` for the manual "Add Item" button (e.g., `StepExpenses.tsx:120`, `StepIncome.tsx:64`), but the animation hook uses `crypto.randomUUID()` directly.

### All Affected Call Sites

Direct `crypto.randomUUID()` usage in source code (excluding tests):

| File | Line | Context |
|---|---|---|
| `src/components/wizard/hooks/useCopyAnimation.ts` | 59 | **Primary bug** — generates ID for copied items |
| `src/components/wizard/types.ts` | 132 | `createEmptyIncomeItem()` helper |
| `src/components/wizard/types.ts` | 142 | `createEmptyExpenseItem()` helper |
| `src/components/wizard/types.ts` | 155 | `createEmptySavingsItem()` helper |

The `types.ts` helpers (`createEmpty*Item()`) are defined but may not be called in the current production flow (the step components use `generateId()` directly for manual add). However, they would also fail in insecure contexts.

### Affected Wizard Steps

All three data steps use `useCopyAnimation` for their quick-add/copy-from-last-budget feature:

- **StepIncome** (`src/components/wizard/steps/StepIncome.tsx:111-124`) — copies items from last budget
- **StepExpenses** (`src/components/wizard/steps/StepExpenses.tsx:122-137`) — copies recurring expenses
- **StepSavings** (likely same pattern) — copies items from last budget

### Production Deployment Configuration

- `Dockerfile:19`: Production stage uses `nginx:alpine`
- `Dockerfile:28`: Exposes port 80 (HTTP only)
- `docker-compose.yml:33-48`: Dev setup uses Vite on port 5173

No HTTPS/TLS configuration found in the project.

## Code References

- `src/components/wizard/hooks/useCopyAnimation.ts:59` — Direct `crypto.randomUUID()` call (the bug)
- `src/lib/utils.ts:195-205` — Safe `generateId()` with fallback (exists but not used here)
- `src/components/wizard/steps/StepExpenses.tsx:122-137` — `handleAddRecurring` calling `startCopyAnimation`
- `src/components/wizard/steps/StepIncome.tsx:111-124` — `handleCopyItem` calling `startCopyAnimation`
- `src/components/wizard/types.ts:132,142,155` — Additional direct `crypto.randomUUID()` calls
- `Dockerfile:19-28` — Production nginx serving on HTTP port 80

## Architecture Documentation

The wizard uses a reducer-based state pattern (`WizardContext` + `wizardReducer`) with items tracked client-side before batch submission. The `useCopyAnimation` hook manages visual transition state (copying → entrance animation) with staggered timeouts, using React state (`copyingIds`, `newlyAddedIds`) to drive CSS animations.

## Historical Context (from thoughts/)

- `.claude/thoughts/plans/2025-12-31-income-copy-animation-redesign.md` — Copy animation was redesigned, likely when `useCopyAnimation` hook was created
- `.claude/thoughts/plans/2026-01-16-fix-wizard-copy-items-horizontal-stacking.md` — Previous fix for wizard copy items layout
- `.claude/thoughts/research/2026-01-09-docker-configuration.md` — Docker deployment research

## Open Questions

- Is StepSavings also affected? (Likely yes, if it uses `useCopyAnimation` the same way)
- Are there other features that depend on `crypto.randomUUID()` outside of tests?
