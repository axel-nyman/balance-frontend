# PWA iOS Stale Data and Slow Update Fix

## Overview

Fix two iOS PWA issues — stale API data after mutations and slow app update propagation — with minimal, targeted changes that address the root causes directly. No new UI components needed.

## Current State Analysis

### Stale API Data
- `apiGet` (`src/api/client.ts:63-65`) calls `fetch()` with no `cache` option, defaulting to browser heuristic caching
- iOS Safari in standalone PWA mode aggressively HTTP-caches GET responses
- React Query correctly invalidates queries after mutations, but the re-fetch hits the browser's HTTP cache and returns stale data
- nginx API proxy (`nginx.conf.template:17-23`) adds no `Cache-Control` headers, leaving caching behavior entirely to the browser

### Slow App Updates
- SW update checks only trigger on `visibilitychange` (`src/main.tsx:19-26`)
- iOS standalone mode fires `visibilitychange` unreliably when resuming from app switcher
- No interval-based fallback exists
- Users have no way to manually trigger an update check

### Missing Cache Header on index.html
- `nginx.conf.template:12-14` serves `index.html` via the SPA fallback with no `Cache-Control` header
- Browser may cache the HTML shell, delaying discovery of new asset hashes that would trigger a SW update

## Desired End State

1. API GET requests always bypass the browser HTTP cache, so React Query invalidation results in fresh data
2. The service worker checks for updates periodically (not just on `visibilitychange`), so new deployments propagate within minutes
3. `index.html` is never cached by the browser, ensuring the latest asset references are always served

### How to Verify
- Create a budget on iOS PWA, navigate to budgets page → new budget appears immediately
- Deploy a new version → PWA picks up the update within ~15 minutes without removing/re-adding the app
- No regressions on desktop browsers

## What We're NOT Doing

- Pull-to-refresh UI (can be added later as a UX enhancement)
- Runtime caching of API requests in the service worker (Workbox runtimeCaching)
- Offline data support
- Changes to React Query `staleTime` or other query config
- Backend `Cache-Control` header changes (out of scope — frontend repo only)

## Implementation (Single Phase)

All three changes are independent and small enough to ship together.

### 1. Add `cache: 'no-store'` to API GET requests

**File**: `src/api/client.ts`
**Change**: Add `cache: 'no-store'` to the fetch call in `apiGet`

```typescript
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
  return handleResponse<T>(response)
}
```

This tells the browser to bypass its HTTP cache entirely for GET requests. POST/PUT/DELETE are unaffected (they don't get cached by browsers).

### 2. Add interval-based SW update polling

**File**: `src/main.tsx`
**Change**: Add a `setInterval` inside `onRegisteredSW` to poll for SW updates every 15 minutes, alongside the existing `visibilitychange` listener.

```typescript
onRegisteredSW(_swUrl, registration) {
  if (registration) {
    // Check for updates when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update()
      }
    })
    // Also poll every 15 minutes (iOS standalone doesn't reliably fire visibilitychange)
    setInterval(() => {
      registration.update()
    }, 15 * 60 * 1000)
  }
},
```

15 minutes is a reasonable balance — frequent enough that users get updates within a session, infrequent enough to avoid unnecessary network traffic.

### 3. Add `Cache-Control: no-cache` on `index.html`

**File**: `nginx.conf.template`
**Change**: Add a specific `location` block for `index.html` with `Cache-Control: no-cache` before the SPA fallback, and add the same header to the fallback itself.

```nginx
# index.html must not be cached (ensures fresh asset references for SW updates)
location = /index.html {
    add_header Cache-Control "no-cache";
}

# SPA routing - serve index.html for all routes
location / {
    add_header Cache-Control "no-cache";
    try_files $uri $uri/ /index.html;
}
```

`no-cache` means the browser will revalidate with the server before using a cached copy (it doesn't mean "don't cache" — that's `no-store`). This is the standard approach for SPA index files.

## Success Criteria

### Automated Verification
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test` (2 pre-existing test file failures unrelated to changes)
- [x] TypeScript type-checking passes: `npx tsc --noEmit`
- [x] Linting passes: `npm run lint`

### Manual Verification
- [ ] **Stale data fix**: On iOS PWA, create a new budget → navigate to budgets page → new budget appears immediately without extra navigation
- [ ] **App update fix**: Deploy a new version → within 15 minutes the iOS PWA shows the "App updated" toast without removing/re-adding the PWA
- [ ] **No regression**: Desktop browser still works normally (data loads, updates apply)
- [ ] **No regression**: Budget creation wizard still navigates correctly after save

## References

- Research: `.claude/thoughts/research/2026-03-05-pwa-ios-stale-data-and-update-issues.md`
- Original PWA implementation: `.claude/thoughts/plans/2026-02-24-pwa-support.md`
