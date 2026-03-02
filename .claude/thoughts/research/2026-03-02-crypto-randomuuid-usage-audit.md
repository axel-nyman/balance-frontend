---
date: 2026-03-02T14:00:00+01:00
researcher: Claude
git_commit: 175eae83e2ff5990f2eb36a95bc0460e2fc5ee05
branch: main
repository: balance-frontend
topic: "Audit: All crypto.randomUUID() usage in the codebase"
tags: [research, codebase, crypto-randomuuid, audit, secure-context]
status: complete
last_updated: 2026-03-02
last_updated_by: Claude
---

# Research: All `crypto.randomUUID()` Usage in the Codebase

**Date**: 2026-03-02
**Researcher**: Claude
**Git Commit**: 175eae83e2ff5990f2eb36a95bc0460e2fc5ee05
**Branch**: main
**Repository**: balance-frontend

## Research Question

Are there other features that depend on `crypto.randomUUID()` outside of tests, beyond the known wizard copy-items bug documented in `.claude/thoughts/research/2026-03-02-wizard-copy-items-bug-crypto-randomuuid.md`?

## Summary

A codebase-wide search found **no additional production features** affected by unguarded `crypto.randomUUID()` calls beyond what was already documented. The only production call site is `useCopyAnimation.ts:59`. Three additional unguarded calls exist in `types.ts` factory functions, but these are dead code (never imported or called). All other source files that need UUIDs use the safe `generateId()` utility.

## Detailed Findings

### All `crypto.randomUUID()` Call Sites in `src/`

#### Production code — unguarded (would fail in insecure context)

| File | Line | Function | Called in production? |
|---|---|---|---|
| `src/components/wizard/hooks/useCopyAnimation.ts` | 59 | `startCopyAnimation` | **Yes** — the known bug |
| `src/components/wizard/types.ts` | 132 | `createEmptyIncomeItem()` | **No** — dead code |
| `src/components/wizard/types.ts` | 142 | `createEmptyExpenseItem()` | **No** — dead code |
| `src/components/wizard/types.ts` | 155 | `createEmptySavingsItem()` | **No** — dead code |

#### Production code — guarded (safe in insecure context)

| File | Line | Function | Notes |
|---|---|---|---|
| `src/lib/utils.ts` | 196-197 | `generateId()` | Has `typeof crypto !== 'undefined' && crypto.randomUUID` check with `Math.random()` fallback |

#### Test-only code (not shipped to production)

| File | Line | Context |
|---|---|---|
| `src/test/mocks/handlers.ts` | 71 | Mock POST handler for income items |
| `src/test/mocks/handlers.ts` | 84 | Mock POST handler for expense items |
| `src/test/mocks/handlers.ts` | 96 | Mock POST handler for savings items |
| `src/test/mocks/handlers.ts` | 108 | Mock POST handler for accounts |
| `src/components/todo/TodoProgress.test.tsx` | 7 | Test fixture data |

### `createEmpty*Item()` — Dead Code Confirmation

The three factory functions in `src/components/wizard/types.ts` (`createEmptyIncomeItem`, `createEmptyExpenseItem`, `createEmptySavingsItem`) are **exported but never imported** anywhere in the codebase. A grep for their names returns only their own definition lines. The step components construct items inline instead:

- `StepIncome.tsx:64` — `{ id: generateId(), ... }`
- `StepExpenses.tsx:106` — `{ id: generateId(), ... }`
- `StepSavings.tsx:72` — `{ id: generateId(), ... }`

### Files Using the Safe `generateId()` Utility

| File | Line | Context |
|---|---|---|
| `src/components/wizard/steps/StepExpenses.tsx` | 106 | Manual "Add Item" button handler |
| `src/components/wizard/steps/StepIncome.tsx` | 64 | Manual "Add Item" button handler |
| `src/components/wizard/steps/StepSavings.tsx` | 72 | Manual "Add Item" button handler |

All three step components import `generateId` from `@/lib/utils`.

## Code References

- `src/components/wizard/hooks/useCopyAnimation.ts:59` — Only production unguarded `crypto.randomUUID()` call
- `src/components/wizard/types.ts:130-161` — Three dead-code factory functions with unguarded calls
- `src/lib/utils.ts:195-205` — Safe `generateId()` with fallback
- `src/components/wizard/steps/StepExpenses.tsx:106` — Uses safe `generateId()`
- `src/components/wizard/steps/StepIncome.tsx:64` — Uses safe `generateId()`
- `src/components/wizard/steps/StepSavings.tsx:72` — Uses safe `generateId()`
- `src/test/mocks/handlers.ts:71,84,96,108` — Test mock handlers (unguarded but test-only)
- `src/components/todo/TodoProgress.test.tsx:7` — Test fixture (test-only)

## Architecture Documentation

The codebase has a two-tier ID generation pattern:
1. **`generateId()`** in `src/lib/utils.ts` — the safe utility with insecure-context fallback, used by wizard step components for manual item creation
2. **Direct `crypto.randomUUID()`** — used in the copy animation hook and dead-code factory functions, without the fallback guard

No features outside the wizard use client-side UUID generation. The rest of the app (accounts, recurring expenses, budgets, todos) receives server-generated IDs from the Spring Boot backend.

## Related Research

- `.claude/thoughts/research/2026-03-02-wizard-copy-items-bug-crypto-randomuuid.md` — Root cause analysis of the wizard copy-items bug
- `.claude/thoughts/plans/2026-03-02-fix-crypto-randomuuid-insecure-context.md` — Fix plan for the bug

## Open Questions

None — the audit is comprehensive. All `crypto.randomUUID()` usage in the codebase has been catalogued.
