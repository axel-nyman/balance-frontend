---
date: 2026-02-24T12:00:00+01:00
researcher: Claude
git_commit: 9e4c877ae2d9f82d4176d2f51ff47cad97d3788f
branch: main
repository: balance-frontend
topic: "PWA implementation with vite-plugin-pwa"
tags: [research, pwa, vite-plugin-pwa, service-worker, manifest, sonner]
status: complete
last_updated: 2026-02-24
last_updated_by: Claude
---

# Research: PWA Implementation with vite-plugin-pwa

**Date**: 2026-02-24
**Git Commit**: 9e4c877
**Branch**: main
**Repository**: balance-frontend

## Research Question

What exists in the codebase that's relevant to implementing lightweight PWA support using vite-plugin-pwa? Goals: installable app shell, manifest, asset precaching, update detection with Sonner toast prompt.

## Summary

The codebase has no existing PWA infrastructure — no manifest, no service worker, no prior research on the topic. The project uses Vite 7.3.0, React 19, Sonner for toasts, and deploys via nginx in Docker. All building blocks are in place for a minimal PWA integration.

## Detailed Findings

### 1. Vite Configuration

**File**: `vite.config.ts`

Current plugins: `react()` and `tailwindcss()`. Uses path alias `@` -> `./src`. Dev server proxies `/api` to backend. The `VitePWA()` plugin would be added as a third plugin.

### 2. Package Dependencies

**File**: `package.json` (v1.6.0)

- **Vite**: `^7.3.0`
- **Sonner**: `^2.0.7` (toast library)
- **React**: `^19.2.3`
- **TypeScript**: `~5.6.2`

New dependencies needed:
- `vite-plugin-pwa` (dev) — v1.2.0 supports Vite 7 via peer dep `^7.0.0`
- `workbox-build` and `workbox-window` are peer deps pulled in automatically

### 3. Entry Points

**`index.html`**: Minimal HTML with favicon and apple-touch-icon links. PWA manifest `<link>` will be auto-injected by the plugin.

**`src/main.tsx`**: Simple StrictMode + createRoot render. SW registration code will go here or in a component mounted in App.tsx.

**`src/App.tsx`**: Uses BrowserRouter, QueryClientProvider, `<Toaster position="top-right" />`. The ReloadPrompt/SW update component should be mounted here alongside `<Toaster>`.

### 4. Toast System (Sonner)

**Toaster wrapper**: `src/components/ui/sonner.tsx` — shadcn/ui wrapper with custom icons and CSS variable styling. Mounted in `App.tsx` with `position="top-right"`.

**Toast API used throughout**: `import { toast } from 'sonner'`

Established patterns:
- `toast.success('Message')` — short past-tense labels
- `toast.error('Message')` — with fallback strings
- No usage of `toast()` with action buttons yet, but Sonner supports them via `toast('message', { action: { label, onClick } })`

For the PWA update prompt, using `toast('New version available', { action: { label: 'Update', onClick: () => updateServiceWorker(true) } })` would be the most consistent approach — or simply calling `toast()` with a description and action.

### 5. Icon Assets

| File | Dimensions | Notes |
|---|---|---|
| `public/favicon.png` | 128x126 | **Not square** — needs attention |
| `public/apple-touch-icon.png` | 180x177 | **Not square** — needs attention |
| `src/assets/logo.png` | 781x766 | **Not square** — source for generating PWA icons |

**Critical issue**: All icons are slightly non-square. PWA manifest requires square icons (192x192 and 512x512 minimum). New square icons must be generated from `src/assets/logo.png` (the largest source at 781x766).

Options:
- Use `sips` or `ImageMagick` to resize logo.png into square 192x192 and 512x512 PNGs, padding or cropping as needed
- Place generated icons in `public/` as `pwa-192x192.png` and `pwa-512x512.png`

### 6. TypeScript Configuration

**`tsconfig.app.json`**: Targets ES2020, includes `src/`, has `types: ["vitest/globals", "@testing-library/jest-dom"]`. Need to add `"vite-plugin-pwa/react"` to the types array for `virtual:pwa-register/react` module resolution.

**`tsconfig.node.json`**: Includes only `vite.config.ts`. No changes needed here.

### 7. Production Deployment (nginx)

**`nginx.conf.template`**:
```
location / { try_files $uri $uri/ /index.html; }   # SPA routing
location /api/ { proxy_pass ${BACKEND_URL}/api/; }  # API proxy
location ~* \.(js|css|png|...) { expires 1y; Cache-Control: public, immutable; }
```

**Service worker consideration**: The static asset caching rule (`expires 1y, immutable`) will match `sw.js` if it's served from root. Service workers **must not** be cached aggressively — browsers have a byte-diff check but it's best practice to exclude `sw.js` from long-lived caching. Add a specific rule for the service worker file:

```nginx
# Service worker must not be cached
location = /sw.js {
    add_header Cache-Control "no-cache";
    try_files $uri =404;
}
```

### 8. Brand Colors for Manifest

From `src/index.css`:
- Background canvas: `oklch(0.97 0.003 250)` (--surface-2) ≈ `#f4f4f6` (light gray)
- Brand positive/ring: `oklch(0.62 0.15 163)` ≈ a mint-teal green
- Primary: references `--text-primary` (near black)

For manifest `theme_color`, the mint-teal brand color or white are good choices. `background_color` should match the app's canvas background.

### 9. Docker Build

**`Dockerfile`**: Multi-stage build. Stage 1 runs `npm run build`, stage 2 copies `dist/` to nginx. The PWA build artifacts (manifest.webmanifest, sw.js, workbox-*.js) will be output to `dist/` automatically and will be served by nginx without any Dockerfile changes.

## Architecture Documentation

### PWA Plugin Integration Points

1. **`vite.config.ts`** — Add `VitePWA()` plugin with manifest config and `registerType: 'prompt'`
2. **`src/main.tsx` or `src/App.tsx`** — Mount SW update detection (either via `useRegisterSW` hook in a component, or use Sonner toast directly)
3. **`public/`** — Add square PWA icons (192x192, 512x512)
4. **`tsconfig.app.json`** — Add `"vite-plugin-pwa/react"` to types
5. **`nginx.conf.template`** — Add no-cache rule for `sw.js`
6. **`index.html`** — No changes needed (plugin auto-injects manifest link)

### vite-plugin-pwa Key Configuration

```typescript
VitePWA({
  registerType: 'prompt',  // User must confirm updates (default behavior)
  manifest: {
    name: 'Balance',
    short_name: 'Balance',
    scope: '/',
    start_url: '/',
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#f4f4f6',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,png,woff2}'],
  },
})
```

### useRegisterSW Hook API

```typescript
import { useRegisterSW } from 'virtual:pwa-register/react'

const {
  needRefresh: [needRefresh, setNeedRefresh],
  offlineReady: [offlineReady, setOfflineReady],
  updateServiceWorker,  // call with (true) to reload
} = useRegisterSW()
```

- `needRefresh` = true when new SW is waiting
- `updateServiceWorker(true)` activates waiting SW and reloads page

### Update Prompt via Sonner

Using Sonner's action toast (consistent with codebase patterns):

```typescript
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

// In a component mounted in App.tsx:
const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

useEffect(() => {
  if (needRefresh) {
    toast('New version available', {
      action: {
        label: 'Update',
        onClick: () => updateServiceWorker(true),
      },
      duration: Infinity,  // Don't auto-dismiss
    })
  }
}, [needRefresh])
```

## Historical Context (from thoughts/)

No prior PWA research or plans exist in `.claude/thoughts/`. This is a fresh topic.

Relevant existing research:
- `.claude/thoughts/research/2026-01-09-docker-configuration.md` — Docker setup context
- `.claude/thoughts/plans/2026-01-04-production-docker-deployment.md` — Production deployment plan

## Open Questions

1. **Icon generation**: The source logo (781x766) is not square. Should we pad to square (adding transparent space) or crop/center-fit? The visual result depends on the logo's content.
2. **Theme color**: Should `theme_color` be white (`#ffffff`) or the mint-teal brand color? White is safer for browser chrome compatibility.
3. **Offline behavior**: With precaching but no runtime caching for API calls, navigating while offline will show a cached shell but API requests will fail. Is a simple offline fallback toast desired, or is "API calls just fail" acceptable?
