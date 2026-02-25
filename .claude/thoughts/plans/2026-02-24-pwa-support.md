# PWA Support Implementation Plan

## Overview

Add lightweight PWA support to Balance using `vite-plugin-pwa`. Goals: installable app shell, web app manifest, static asset precaching, and automatic updates with a post-reload toast notification. No offline data strategy, no background sync, no push notifications.

## Current State Analysis

- **No PWA infrastructure exists** — no manifest, no service worker, no registration code
- Vite 7.3.0 + React 19 + Sonner toasts + nginx in Docker
- Icons exist but are **non-square** (logo.png is 781x766) — square icons must be generated
- `nginx.conf.template` aggressively caches all `.js` files for 1 year — `sw.js` must be excluded

### Key Discoveries:
- `vite.config.ts:8` — plugins array has `react()` and `tailwindcss()`, VitePWA goes here
- `src/App.tsx:44` — `<Toaster position="top-right" />` is where we show the "App updated" toast
- `tsconfig.app.json:22` — types array needs `vite-plugin-pwa/client`
- `nginx.conf.template:22-24` — static cache rule matches `*.js`, would incorrectly cache `sw.js`
- Toast pattern: `toast.success('Short past-tense message')` used consistently across codebase
- `src/main.tsx` — simple entry point, ideal location for `registerSW()` call

## Desired End State

- App is installable from browser (Add to Home Screen)
- `manifest.webmanifest` is auto-generated with correct name, icons, colors, and scope
- Service worker precaches all built static assets (JS, CSS, HTML, fonts, images)
- When a new version deploys, the SW auto-updates and shows `toast.success('App updated')` after reload
- On iOS, foregrounding the app triggers an update check so users get new versions promptly
- `sw.js` is served with `Cache-Control: no-cache` in production nginx

### Verification:
- `npm run build` produces `dist/sw.js`, `dist/manifest.webmanifest`, and `dist/workbox-*.js`
- Chrome DevTools > Application > Manifest shows correct metadata
- Chrome DevTools > Application > Service Workers shows active SW
- Lighthouse PWA audit passes installability checks

## What We're NOT Doing

- Offline data/API caching (API calls fail normally when offline)
- Background sync
- Push notifications
- Maskable icons (future enhancement)
- Custom offline fallback page
- Runtime caching strategies for API routes

## Implementation Approach

Use `registerType: 'prompt'` with **auto-triggered** `updateSW(true)` — not `registerType: 'autoUpdate'`. This is critical for iOS compatibility: the `autoUpdate` codepath relies on the `activated` event which is unreliable on iOS Safari in standalone mode. The `prompt` codepath's `onNeedRefresh` fires more reliably. By auto-triggering `updateSW(true)` inside `onNeedRefresh`, the user gets automatic updates without needing to take action.

A `sessionStorage` flag is set before the reload so the reloaded page can show a brief "App updated" toast.

---

## Phase 1: Install & Configure

### Overview
Install the plugin, add it to Vite config, and update TypeScript types.

### Changes Required:

#### 1. Install dependency
```bash
npm install -D vite-plugin-pwa
```

#### 2. Vite config
**File**: `vite.config.ts`
**Changes**: Import and add `VitePWA()` plugin

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
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
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

#### 3. TypeScript types
**File**: `tsconfig.app.json`
**Changes**: Add `vite-plugin-pwa/client` to the types array

```json
"types": ["vitest/globals", "@testing-library/jest-dom", "vite-plugin-pwa/client"]
```

### Success Criteria:

#### Automated Verification:
- [x] `npm install` completes without errors
- [x] `npx tsc -b` passes with no type errors
- [x] `npm run build` produces `dist/sw.js` and `dist/manifest.webmanifest`

#### Manual Verification:
- [ ] Inspect `dist/manifest.webmanifest` — contains correct name, icons, colors

---

## Phase 2: Generate PWA Icons

### Overview
Generate square 192x192 and 512x512 PNG icons from the existing logo (`src/assets/logo.png`, 781x766).

### Changes Required:

#### 1. Generate square icons
The source logo is slightly non-square (781x766). Pad it to 781x781 with transparent background (centered), then resize to both target sizes. Place output files in `public/`.

Use whatever image tool is available (ImageMagick `magick`, Python Pillow, or macOS `sips`):

```bash
# Example with ImageMagick:
magick src/assets/logo.png -gravity center -background transparent -extent 781x781 -resize 512x512 public/pwa-512x512.png
magick src/assets/logo.png -gravity center -background transparent -extent 781x781 -resize 192x192 public/pwa-192x192.png
```

Output files:
- `public/pwa-192x192.png` (192x192, square)
- `public/pwa-512x512.png` (512x512, square)

### Success Criteria:

#### Automated Verification:
- [x] `public/pwa-192x192.png` exists and is 192x192
- [x] `public/pwa-512x512.png` exists and is 512x512
- [x] `npm run build` succeeds (icons are referenced in manifest)

#### Manual Verification:
- [ ] Icons look correct (logo is centered, not distorted or cropped)

---

## Phase 3: Service Worker Registration & Update Toast

### Overview
Register the service worker in `main.tsx` with automatic update behavior. Add a post-reload toast in `App.tsx` using the established Sonner pattern.

### Changes Required:

#### 1. SW registration
**File**: `src/main.tsx`
**Changes**: Add `registerSW()` call after the React render

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    sessionStorage.setItem('pwa-updated', '1')
    updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update()
        }
      })
    }
  },
})
```

Key details:
- `immediate: true` — registers the SW as soon as the page loads (required for update detection to work)
- `onNeedRefresh` — fires when a new SW is waiting. Sets a `sessionStorage` flag and immediately triggers `updateSW(true)` which activates the waiting SW and reloads the page
- `onRegisteredSW` — adds a `visibilitychange` listener that forces an update check when the app is foregrounded (critical for iOS where background SW checks are unreliable)
- Placed after `createRoot().render()` so the app is interactive before SW registration begins

#### 2. Post-reload toast
**File**: `src/App.tsx`
**Changes**: Add a `useEffect` in the `App` component to check for the sessionStorage flag and show a toast

```typescript
import { useEffect } from 'react'
import { toast } from 'sonner'
// ... existing imports ...

function App() {
  useEffect(() => {
    if (sessionStorage.getItem('pwa-updated')) {
      sessionStorage.removeItem('pwa-updated')
      toast.success('App updated')
    }
  }, [])

  return (
    // ... existing JSX unchanged ...
  )
}
```

This follows the codebase's established pattern of `toast.success('Short past-tense message')`.

### Success Criteria:

#### Automated Verification:
- [x] `npx tsc -b` passes (virtual module types resolve correctly)
- [x] `npm run build` succeeds
- [x] No lint errors

#### Manual Verification:
- [ ] `npm run preview` — Chrome DevTools > Application > Service Workers shows "activated and is running"
- [ ] Deploy a new version — the page reloads automatically and shows "App updated" toast

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the service worker registration works correctly before proceeding.

---

## Phase 4: nginx Configuration

### Overview
Prevent nginx from aggressively caching the service worker file. Browsers must always check for a new `sw.js` on navigation.

### Changes Required:

#### 1. Add no-cache rule for sw.js
**File**: `nginx.conf.template`
**Changes**: Add a specific location block for `sw.js` **before** the static asset caching rule

```nginx
    # Service worker must not be cached
    location = /sw.js {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
```

The `location = /sw.js` block uses exact match (`=`), which takes precedence over the regex match below it. This ensures `sw.js` is always served fresh while all other static assets remain cached with immutable headers.

### Success Criteria:

#### Automated Verification:
- [x] nginx config is syntactically valid (tested during Docker build)

#### Manual Verification:
- [ ] After Docker deployment, `curl -I https://host/sw.js` shows `Cache-Control: no-cache`
- [ ] Other JS files still show `Cache-Control: public, immutable`

---

## Phase 5: Verify

### Overview
Build the project and verify all PWA artifacts are correct.

### Success Criteria:

#### Automated Verification:
- [x] `npm run build` succeeds without warnings
- [x] `npx tsc -b` passes
- [x] `dist/sw.js` exists
- [x] `dist/manifest.webmanifest` exists and contains correct JSON
- [x] `dist/pwa-192x192.png` and `dist/pwa-512x512.png` exist in output
- [x] `dist/index.html` contains `<link rel="manifest">` (auto-injected)
- [x] `dist/index.html` contains `<meta name="theme-color">` (added to source HTML)
- [x] All existing tests pass: `npm test` (490 passed)

#### Manual Verification:
- [ ] `npm run preview` — app loads, SW registers in DevTools
- [ ] Chrome DevTools > Application > Manifest shows correct name, icons, colors
- [ ] Lighthouse > PWA shows installability criteria met
- [ ] On iOS Safari: "Add to Home Screen" works, app opens in standalone mode
- [ ] After deploying a new version: app auto-updates and shows toast

---

## Files Changed Summary

| File | Change |
|---|---|
| `package.json` | Add `vite-plugin-pwa` to devDependencies |
| `vite.config.ts` | Add `VitePWA()` plugin with manifest and workbox config |
| `tsconfig.app.json` | Add `vite-plugin-pwa/client` to types |
| `src/main.tsx` | Add `registerSW()` with auto-update + visibility listener |
| `src/App.tsx` | Add `useEffect` for post-update toast |
| `public/pwa-192x192.png` | New file — generated from logo |
| `public/pwa-512x512.png` | New file — generated from logo |
| `nginx.conf.template` | Add `sw.js` no-cache rule |

## References

- Research: `.claude/thoughts/research/2026-02-24-pwa-implementation-research.md`
- vite-plugin-pwa docs: https://vite-pwa-org.netlify.app/
- iOS autoUpdate issues: GitHub issues #377, #438, #554
