---
date: 2026-03-05T12:00:00+01:00
researcher: Claude
git_commit: 0fa5fea0885de83cf6ff6b581829dd6144d4c70a
branch: main
repository: balance-frontend
topic: "PWA iOS stale data and slow app update issues"
tags: [research, codebase, pwa, service-worker, ios, caching, react-query, workbox]
status: complete
last_updated: 2026-03-05
last_updated_by: Claude
---

# Research: PWA iOS Stale Data and Slow App Update Issues

**Date**: 2026-03-05T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: 0fa5fea
**Branch**: main
**Repository**: balance-frontend

## Research Question
When using the app in PWA mode on iOS, two issues occur:
1. Data updates are slow — e.g., creating a budget and navigating to the budgets page doesn't show the new budget immediately
2. App updates (new deployments) are slow to propagate — requires removing and re-adding the PWA
3. No manual update mechanism exists in PWA mode on iOS

## Summary

The investigation identified **two separate root cause areas** contributing to the observed behavior:

**Stale API data**: The `fetch()` calls in `src/api/client.ts` use the browser's default cache mode (no `cache: 'no-store'` option). Combined with no explicit `Cache-Control` headers on the nginx API proxy responses (`nginx.conf.template`), iOS Safari in standalone PWA mode may aggressively cache GET API responses at the HTTP level — even though React Query correctly invalidates queries after mutations.

**Slow app updates**: The service worker update check relies solely on the `visibilitychange` event (`src/main.tsx:19-26`). On iOS standalone PWA mode, this event fires unreliably. There is no interval-based fallback. iOS Safari also has known conservative SW update checking behavior in standalone mode.

## Detailed Findings

### 1. Service Worker Configuration

**`vite.config.ts:12-30`** — VitePWA plugin config:
- `registerType: 'prompt'` — new SW waits for activation signal
- Workbox `globPatterns` precaches all static assets (`js,css,html,png,svg,ico,woff2`)
- **No `runtimeCaching` rules defined** — API requests (`/api/*`) are NOT intercepted by the service worker
- **No `navigateFallbackDenylist`** configured (not needed since no runtime caching)

**`dist/sw.js`** — The generated service worker:
- Uses `precacheAndRoute` for static assets (with revision hashes for cache-busting)
- Registers a `NavigationRoute` that serves cached `index.html` for all navigation requests
- Listens for `SKIP_WAITING` messages to activate immediately
- **Does NOT intercept `/api/` requests** — they go straight to the network

### 2. Service Worker Registration and Update Mechanism

**`src/main.tsx:13-28`** — SW registration:
```typescript
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    sessionStorage.setItem('pwa-updated', '1')
    updateSW(true)  // Auto-activate new SW without user prompt
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update()  // Check for SW updates on tab focus
        }
      })
    }
  },
})
```

Key observations:
- `onNeedRefresh` auto-activates the new SW (despite `registerType: 'prompt'`) — no user confirmation shown
- **Only update trigger is `visibilitychange`** — no periodic interval check
- `immediate: true` registers the SW immediately on page load

**`src/App.tsx:30-35`** — Post-update toast:
- Reads `'pwa-updated'` from sessionStorage and shows "App updated" toast
- This only fires after the SW has already been updated and the page reloaded

### 3. Nginx Cache Headers

**`nginx.conf.template`**:
- `location = /sw.js` → `Cache-Control: no-cache` (good — browser revalidates SW on each check)
- `location ~* \.(js|css|png|...)$` → `expires 1y; Cache-Control: public, immutable` (correct for hashed assets)
- `location /` (SPA fallback) → **No Cache-Control header set for `index.html`**
- `location /api/` (proxy) → **No Cache-Control header set** — passes through whatever the backend sends

### 4. API Client Fetch Behavior

**`src/api/client.ts:63-65`** — GET requests:
```typescript
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  return handleResponse<T>(response)
}
```

- **No `cache` option set** — uses browser default (`'default'` mode)
- In default mode, the browser may serve a cached response if it considers it "fresh"
- No custom headers (no `Cache-Control`, `Pragma`, etc.) sent with the request

### 5. React Query Configuration

**`src/App.tsx:19-27`** — Global defaults:
- `staleTime: 1000 * 60` (1 minute) — queries won't refetch within 1 minute
- `refetchOnWindowFocus: true` — refetches when the window gains focus
- `retry: 1`

**Mutation invalidation** (from hooks): All mutations correctly invalidate relevant query keys. For example, `useCreateBudget` invalidates `queryKeys.budgets.all`. This should trigger a refetch on the next render of components using that query.

**However**: If iOS's HTTP cache returns a stale response to the refetch, React Query would receive and display the cached (old) data — defeating the invalidation.

### 6. iOS-Specific PWA Behavior (Platform Knowledge)

iOS Safari in standalone PWA mode has well-documented quirks:

1. **SW update checks**: iOS only checks for SW updates on navigation events, not reliably on `visibilitychange`. When the user swipes back to the PWA, iOS may resume the webview without firing `visibilitychange`, so `registration.update()` never runs.

2. **Aggressive HTTP caching**: iOS Safari's HTTP cache can be more aggressive than desktop browsers, especially in standalone mode where there's no address bar refresh button.

3. **No manual refresh**: Users cannot force-refresh in standalone mode (no pull-to-refresh by default, no reload button).

4. **SW lifecycle**: iOS may terminate and restart the PWA process, but the old service worker remains active until a new one is detected and activated.

## Code References

- `vite.config.ts:12-30` — VitePWA plugin configuration
- `src/main.tsx:13-28` — Service worker registration and update logic
- `src/App.tsx:19-27` — React Query global defaults
- `src/App.tsx:30-35` — Post-update toast handler
- `src/api/client.ts:63-65` — API GET fetch (no cache options)
- `nginx.conf.template:12-14` — SPA fallback (no cache headers)
- `nginx.conf.template:17-23` — API proxy (no cache headers)
- `nginx.conf.template:26-29` — SW no-cache header
- `dist/sw.js` — Generated Workbox service worker (precache only)
- `src/hooks/use-budgets.ts` — Budget mutation invalidation hooks

## Architecture Documentation

### Current Caching Architecture

```
Request Flow (API data):
  App → fetch() [no cache option] → Service Worker [no /api rules, passes through] → nginx proxy → Spring Boot backend
  Response: backend → nginx [no cache headers added] → browser HTTP cache [may cache] → React Query cache [staleTime: 1min]

Request Flow (static assets):
  App → Service Worker [precache hit] → cached response (or network fallback)

SW Update Flow:
  visibilitychange → registration.update() → browser checks sw.js (no-cache header) → if new SW found:
    → installs new precache → fires onNeedRefresh → auto-activates → page reloads → "App updated" toast
```

### What's Missing

1. **No interval-based SW update polling** — only `visibilitychange` triggers
2. **No `cache: 'no-store'` on fetch requests** — browser may serve stale HTTP-cached API responses
3. **No `Cache-Control` on nginx API proxy responses** — browser decides caching heuristically
4. **No `Cache-Control: no-cache` on `index.html`** — may be cached before SW takes over
5. **No manual update/refresh UI** in the app for PWA mode

## Historical Context (from thoughts/)

- `.claude/thoughts/research/2026-02-24-pwa-implementation-research.md` — Original PWA implementation research. Notes that the scope was "lightweight PWA support" focused on installability and asset precaching. **Explicitly out of scope**: offline data strategy, background sync, push notifications.
- `.claude/thoughts/plans/2026-02-24-pwa-support.md` — Implementation plan confirming the minimal PWA scope.

## Open Questions

1. What `Cache-Control` headers does the Spring Boot backend set on API responses? If it sets none, the browser uses heuristic caching which varies by platform.
2. Does iOS standalone mode reliably fire `visibilitychange` when resuming the PWA from the app switcher?
3. Would adding `navigationPreload: true` to the Workbox config help with iOS update detection?
