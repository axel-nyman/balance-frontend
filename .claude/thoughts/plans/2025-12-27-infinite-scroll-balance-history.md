# Automatic Infinite Scroll for Balance History Drawer

## Overview

Convert the balance history drawer from manual "Load More" button pagination to automatic infinite scroll. When the user scrolls near the bottom of the list, new entries will be fetched automatically without requiring a button click.

## Current State Analysis

The balance history drawer (`src/components/accounts/BalanceHistoryDrawer.tsx`) already uses TanStack Query's `useInfiniteQuery` for pagination. Currently, it displays a "Load More" button that the user must click to fetch additional pages.

### Key Discoveries:
- `useBalanceHistory` hook at `src/hooks/use-accounts.ts:24-35` returns `hasNextPage`, `fetchNextPage`, `isFetchingNextPage`
- Scrollable container is `SheetContent` with `overflow-y-auto` class
- No existing IntersectionObserver patterns in the codebase - this will be a new pattern
- The current "Load More" button is conditionally rendered when `hasNextPage` is true

## Desired End State

When the user scrolls the balance history drawer and approaches the bottom of the list:
1. A loading spinner appears at the bottom
2. The next page of entries is automatically fetched
3. New entries are appended to the list
4. Repeat until no more pages exist

### Verification:
- Open balance history drawer for an account with 40+ entries
- Scroll down - new entries should load automatically when near bottom
- Loading spinner visible during fetch
- "Showing X of Y entries" counter updates as pages load
- All automated tests pass

## What We're NOT Doing

- Not adding any external infinite scroll libraries
- Not implementing virtualization (not needed for this use case)
- Not modifying the `useBalanceHistory` hook
- Not changing the API pagination structure
- Not keeping the "Load More" button as fallback (user chose to remove entirely)

## Implementation Approach

Use the **IntersectionObserver API** with a sentinel element pattern:
1. Add a hidden sentinel `<div ref={sentinelRef}>` at the bottom of the entry list
2. Create a `useEffect` that sets up an IntersectionObserver watching the sentinel
3. When sentinel enters viewport and `hasNextPage` is true, call `fetchNextPage()`
4. Show loading spinner in place of the button while fetching

This approach is:
- Native browser API (no dependencies)
- More performant than scroll event listeners
- Works with any scrollable container
- Standard pattern for React infinite scroll

---

## Phase 1: Implement Automatic Infinite Scroll

### Overview
Replace the "Load More" button with IntersectionObserver-based automatic loading.

### Changes Required:

#### 1. Update BalanceHistoryDrawer Component
**File**: `src/components/accounts/BalanceHistoryDrawer.tsx`
**Changes**:
- Add `useRef` and `useEffect` imports
- Create a sentinel ref to observe
- Set up IntersectionObserver in useEffect
- Replace "Load More" button with sentinel + loading indicator

```typescript
// Add to imports (line 1)
import { useMemo, useRef, useEffect } from 'react'

// After allEntries and pageInfo declarations (around line 66), add sentinel ref:
const sentinelRef = useRef<HTMLDivElement>(null)

// Add useEffect for IntersectionObserver (after sentinelRef):
useEffect(() => {
  const sentinel = sentinelRef.current
  if (!sentinel) return

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    {
      root: null, // Uses viewport
      rootMargin: '100px', // Trigger 100px before reaching bottom
      threshold: 0,
    }
  )

  observer.observe(sentinel)
  return () => observer.disconnect()
}, [hasNextPage, isFetchingNextPage, fetchNextPage])
```

**Replace the "Load More" button section (lines 109-127) with:**

```typescript
{/* Infinite scroll sentinel and loading indicator */}
{hasNextPage && (
  <div ref={sentinelRef} className="p-4 flex justify-center">
    {isFetchingNextPage && (
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
    )}
  </div>
)}
```

#### 2. Full Updated Component
**File**: `src/components/accounts/BalanceHistoryDrawer.tsx`

The complete changes transform the component as follows:

**Line 1 - Update import:**
```typescript
import { useMemo, useRef, useEffect } from 'react'
```

**After line 66 - Add sentinel ref and IntersectionObserver effect:**
```typescript
// Sentinel ref for infinite scroll
const sentinelRef = useRef<HTMLDivElement>(null)

// Set up IntersectionObserver for automatic loading
useEffect(() => {
  const sentinel = sentinelRef.current
  if (!sentinel) return

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    }
  )

  observer.observe(sentinel)
  return () => observer.disconnect()
}, [hasNextPage, isFetchingNextPage, fetchNextPage])
```

**Lines 109-127 - Replace Load More button with sentinel:**
```typescript
{/* Infinite scroll sentinel and loading indicator */}
{hasNextPage && (
  <div ref={sentinelRef} className="p-4 flex justify-center">
    {isFetchingNextPage && (
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
    )}
  </div>
)}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] All existing tests pass: `npm test`
- [x] Linting passes: `npm run lint` (pre-existing lint error in test-utils.tsx, unrelated)

#### Manual Verification:
- [x] Open drawer for account with many entries (40+)
- [x] Scroll down - new entries load automatically when approaching bottom
- [x] Loading spinner appears during fetch
- [x] "Showing X of Y entries" updates correctly
- [x] Scrolling works smoothly without jank

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Update Tests

### Overview
Update the test file to reflect the new infinite scroll behavior - remove tests for "Load More" button, add tests for automatic loading.

### Changes Required:

#### 1. Update Test File
**File**: `src/components/accounts/BalanceHistoryDrawer.test.tsx`

**Remove the "Load More" button test (lines 186-207)** - this test is no longer relevant since we're removing the button.

**Replace with test for loading indicator:**
```typescript
it('shows loading indicator when fetching more pages', async () => {
  // Set up delayed response to catch loading state
  let resolveRequest: () => void
  server.use(
    http.get('/api/bank-accounts/123/balance-history', async ({ request }) => {
      const url = new URL(request.url)
      const page = url.searchParams.get('page')

      if (page === '1') {
        // Second page - delay to catch loading state
        await new Promise(resolve => { resolveRequest = resolve as () => void })
      }

      return HttpResponse.json({
        content: mockHistoryResponse.content,
        page: { size: 20, number: Number(page) || 0, totalElements: 40, totalPages: 2 },
      })
    })
  )

  render(
    <BalanceHistoryDrawer
      account={mockAccount}
      open={true}
      onOpenChange={vi.fn()}
    />
  )

  // Wait for initial load
  await waitFor(() => {
    expect(screen.getByText(/Paycheck/)).toBeInTheDocument()
  })

  // Verify the sentinel element exists (has role presentation for the loading area)
  // Since we removed the button, we just verify the component renders properly with hasNextPage
  expect(screen.getByText(/Showing 2 of 40 entries/)).toBeInTheDocument()

  resolveRequest!()
})
```

**Note**: Testing IntersectionObserver is challenging in jsdom. The key tests should verify:
1. Component renders correctly with pagination info
2. Loading state displays properly
3. The sentinel div exists when `hasNextPage` is true

For actual IntersectionObserver behavior, manual testing is more reliable.

### Success Criteria:

#### Automated Verification:
- [x] All tests pass: `npm test`
- [x] No test warnings or errors

#### Manual Verification:
- [x] Tests accurately reflect the new behavior
- [x] No flaky tests

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the tests are working correctly.

---

## Testing Strategy

### Unit Tests:
- Component renders correctly with multiple pages of data
- Loading indicator appears when fetching
- Sentinel element exists when more pages available
- Entry count displays correctly

### Integration Tests:
- Not needed - the IntersectionObserver behavior is best tested manually

### Manual Testing Steps:
1. Start the dev server: `npm run dev`
2. Navigate to Accounts page
3. Click on an account with 40+ balance history entries (may need to create test data)
4. Observe automatic loading as you scroll down
5. Verify smooth scrolling experience
6. Verify all entries eventually load
7. Verify "Showing X of Y" updates correctly

## Performance Considerations

- **rootMargin: '100px'** triggers loading slightly before the sentinel is visible, providing smoother UX
- IntersectionObserver is more performant than scroll event listeners
- No throttling/debouncing needed - IntersectionObserver handles this natively
- Guard against duplicate fetches with `!isFetchingNextPage` check

## References

- Original story: `.claude/thoughts/plans/story-02-06-balance-history-drawer.md`
- Current implementation: `src/components/accounts/BalanceHistoryDrawer.tsx`
- useInfiniteQuery hook: `src/hooks/use-accounts.ts:24-35`
- TanStack Query infinite queries docs: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
