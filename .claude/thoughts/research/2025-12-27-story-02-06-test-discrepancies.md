---
date: 2025-12-27T12:00:00+01:00
researcher: Claude
git_commit: 93b3e168e7a94513787e438d4d2faf9de4e0a7d5
branch: main
repository: balance-frontend
topic: "Story 02-06 Balance History Drawer Test Discrepancies"
tags: [research, testing, story-02-06, balance-history-drawer]
status: complete
last_updated: 2025-12-27
last_updated_by: Claude
---

# Research: Story 02-06 Balance History Drawer Test Discrepancies

**Date**: 2025-12-27T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: 93b3e168e7a94513787e438d4d2faf9de4e0a7d5
**Branch**: main
**Repository**: balance-frontend

## Research Question
Why are tests failing when implementing according to `.claude/thoughts/plans/story-02-06-balance-history-drawer.md`? What discrepancies exist between the story plan and the actual codebase setup?

## Summary
Several discrepancies were found between the story plan and the actual codebase that would cause test failures:

1. **Missing `beforeEach` import** - The test file imports don't include `beforeEach`
2. **Missing `UpdateBalanceModal` component** - Story imports a component that doesn't exist
3. **Story shows two conflicting hook implementations** - Standard `useQuery` vs `useInfiniteQuery`

## Detailed Findings

### 1. Missing `beforeEach` Import in Test File

**Story Plan (line 163):**
```typescript
import { describe, it, expect, vi } from 'vitest'
```

**Story Plan (line 204):**
```typescript
beforeEach(() => {
  server.use(...)
})
```

**Issue:** The test uses `beforeEach` but doesn't import it from vitest.

**Fix:** Change line 163 to:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
```

**Reference:** Actual test files in codebase properly import `beforeEach`:
- `src/components/accounts/EditAccountModal.test.tsx:1`
- `src/components/accounts/DeleteAccountDialog.test.tsx:1`

---

### 2. Missing `UpdateBalanceModal` Component

**Story Plan (lines 37, 148-154):**
```typescript
import { UpdateBalanceModal } from './UpdateBalanceModal'
// ...
{account && (
  <UpdateBalanceModal
    account={account}
    open={isUpdateModalOpen}
    onOpenChange={setIsUpdateModalOpen}
  />
)}
```

**Actual State:** The `UpdateBalanceModal` component does not exist in the codebase.

**Existing Account Components:**
- `src/components/accounts/CreateAccountModal.tsx`
- `src/components/accounts/EditAccountModal.tsx`
- `src/components/accounts/DeleteAccountDialog.tsx`
- `src/components/accounts/AccountCard.tsx`
- `src/components/accounts/AccountRow.tsx`
- `src/components/accounts/AccountsList.tsx`
- `src/components/accounts/AccountsSummary.tsx`

**Story 02-07** contains the plan for `UpdateBalanceModal` - it should be implemented first.

---

### 3. Conflicting Hook Implementations in Story

The story shows two different implementations for the balance history hook:

**Version 1 (lines 78-81) - Standard useQuery:**
```typescript
const { data, isLoading, isFetching } = useBalanceHistory(
  account?.id ?? '',
  page
)
```

**Version 2 (lines 325-354) - useInfiniteQuery:**
```typescript
export function useBalanceHistory({
  accountId,
  enabled = true,
  pageSize = 20,
}: UseBalanceHistoryOptions) {
  return useInfiniteQuery({...})
}
```

**Actual Codebase (src/hooks/use-accounts.ts:24-30):**
```typescript
export function useBalanceHistory(accountId: string, page: number = 0) {
  return useQuery({
    queryKey: [...queryKeys.accounts.history(accountId), page],
    queryFn: () => getBalanceHistory(accountId, page),
    enabled: !!accountId,
  })
}
```

**Issue:** The story shows a "Pagination Implementation" section that overhauls the hook to use `useInfiniteQuery` with different API (object params vs positional params). The test examples assume the simpler implementation.

**Recommendation:** Stick with the existing hook pattern (standard useQuery with manual pagination) for initial implementation, as shown in the test examples.

---

### 4. Components and Utilities That DO Exist

The following items referenced in the story plan exist and are correctly implemented:

**Utility Functions (src/lib/utils.ts):**
- `formatCurrency(amount)` - Line 12-20, returns `"1 234,56 kr"` format
- `formatDate(dateString)` - Line 26-33, returns `"15 mar 2025"` format

**API Types (src/api/types.ts):**
- `BankAccount` - Lines 15-21
- `BalanceHistoryEntry` - Lines 55-63
- `BalanceHistoryResponse` - Lines 65-73

**Hooks (src/hooks/use-accounts.ts):**
- `useBalanceHistory(accountId, page)` - Lines 24-30

**Test Infrastructure:**
- MSW server at `src/test/mocks/server.ts`
- Custom render at `src/test/test-utils.tsx`
- Test setup at `src/test/setup.ts`

---

### 5. Test Pattern Alignment

The test patterns in the story plan align well with actual codebase patterns:

| Pattern | Story Plan | Actual Codebase | Status |
|---------|-----------|-----------------|--------|
| Import from `@/test/test-utils` | Yes | Yes | |
| MSW server override in `beforeEach` | Yes | Yes | |
| `vi.fn()` for mock callbacks | Yes | Yes | |
| `screen.getByText()` assertions | Yes | Yes | |
| `waitFor` for async | Yes | Yes | |
| Loading state via `animate-pulse` | Yes | Yes | |
| Currency format `/5 000,00 kr/` | Yes | Yes | |

---

## Code References

- Story plan: `.claude/thoughts/plans/story-02-06-balance-history-drawer.md`
- Test utils: `src/test/test-utils.tsx`
- MSW handlers: `src/test/mocks/handlers.ts`
- Hook implementation: `src/hooks/use-accounts.ts:24-30`
- API types: `src/api/types.ts:55-73`
- Format utilities: `src/lib/utils.ts:12-33`

## Recommended Implementation Order

1. **Implement Story 02-07 first** (`UpdateBalanceModal`)
2. **Add `beforeEach` to imports** in test file
3. **Use the simpler component implementation** (lines 24-157 in story), not the pagination overhaul
4. **Use existing `useBalanceHistory` hook** with manual page state

## Open Questions

1. Should the drawer use infinite scroll (useInfiniteQuery) or manual "Load More" pagination?
2. Is Story 02-07 (UpdateBalanceModal) required before this story, or should it be stubbed?
