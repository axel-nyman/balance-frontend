---
date: 2025-12-21T12:00:00+01:00
researcher: Claude
git_commit: 289ed185924f99f2c2c42ad09e51f8beb54f16b1
branch: main
repository: balance-frontend
topic: "React Project Setup Analysis and Comparison to Best Practices"
tags: [research, codebase, vite, tailwind, typescript, eslint, vitest, react]
status: complete
last_updated: 2025-12-21
last_updated_by: Claude
---

# Research: React Project Setup Analysis

**Date**: 2025-12-21
**Researcher**: Claude
**Git Commit**: 289ed185924f99f2c2c42ad09e51f8beb54f16b1
**Branch**: main
**Repository**: balance-frontend

## Research Question

Analyze how the React project is set up, compare it to documentation and best practices, and identify any discrepancies between the planning documents and the actual implementation.

## Summary

The project is set up with modern tooling (Vite 5, React 18, TypeScript 5.6, Tailwind CSS v4, Vitest 4, ESLint 9). The implementation **deviates from the original planning documents** because **Tailwind CSS v4 was used instead of v3**, which fundamentally changes the configuration approach. The actual setup follows Tailwind v4 best practices correctly. A few unused dependencies remain from the v3-style planning.

## Detailed Findings

### 1. Vite Configuration

**File**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Analysis**:
- Uses standard Vite template structure
- Path alias `@` correctly configured for `./src`
- Uses `@tailwindcss/vite` plugin (Tailwind v4 approach) instead of PostCSS
- Plugin order (react, tailwindcss) is correct

**Comparison to planning docs**: The planning doc (`story-01-01-project-setup.md`) shows the v3 approach without the Tailwind Vite plugin. The actual implementation is more modern.

---

### 2. Tailwind CSS v4 Setup

**Current Implementation**:
- Uses `@tailwindcss/vite` plugin (v4.1.18)
- CSS file contains only `@import "tailwindcss";`
- No `tailwind.config.js` file exists

**Planning Document Expected** (from `story-01-01-project-setup.md`):
```javascript
// Expected tailwind.config.js (v3 style)
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**Analysis**: The actual setup is **correct for Tailwind v4**:
- Tailwind v4 uses CSS-first configuration with `@theme` blocks
- No `tailwind.config.js` is required (optional in v4)
- The `@import "tailwindcss"` directive replaces the old `@tailwind base/components/utilities` directives
- Content detection is automatic in v4 (no `content` array needed)

**Unused Dependencies**:
- `autoprefixer` (^10.4.23) - Not needed with `@tailwindcss/vite` plugin
- `postcss` (^8.5.6) - Not needed with `@tailwindcss/vite` plugin

The Vite plugin includes Lightning CSS which handles vendor prefixing and import bundling internally.

---

### 3. TypeScript Configuration

**Structure**: Uses a split configuration pattern:
- `tsconfig.json` - Root config with project references
- `tsconfig.app.json` - Application source code
- `tsconfig.node.json` - Vite config file

**tsconfig.app.json Analysis**:
| Setting | Value | Purpose |
|---------|-------|---------|
| `target` | ES2020 | Modern JavaScript features |
| `module` | ESNext | ES modules |
| `moduleResolution` | Bundler | Vite/bundler-aware resolution |
| `jsx` | react-jsx | React 17+ JSX transform |
| `strict` | true | Full type checking |
| `noUnusedLocals` | true | Catch unused variables |
| `noUnusedParameters` | true | Catch unused params |
| `noEmit` | true | Vite handles emit |
| `types` | `["vitest/globals", "@testing-library/jest-dom"]` | Global test types |

**Path Alias**: Correctly configured in `tsconfig.app.json`:
```json
{
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
}
```

This matches the Vite alias configuration.

**Analysis**: The TypeScript setup follows the standard Vite React template with appropriate additions for testing types.

---

### 4. ESLint Configuration

**File**: `eslint.config.js` (ESLint 9 flat config format)

**Plugins Used**:
- `@eslint/js` - Core ESLint rules
- `typescript-eslint` - TypeScript support
- `eslint-plugin-react-hooks` - React hooks rules
- `eslint-plugin-react-refresh` - Fast Refresh compatibility

**Configuration Pattern**:
```javascript
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    // ...
  },
)
```

**Analysis**:
- Uses ESLint 9's new flat config format (correct for 2025)
- React hooks rules are spread manually (`...reactHooks.configs.recommended.rules`) because the plugin doesn't yet have full flat config support
- No `eslint-plugin-react` is included (JSX runtime rules) - this is optional but could be added

**Note**: The `ecmaVersion: 2020` in languageOptions is slightly older than the TypeScript target but doesn't cause issues.

---

### 5. Vitest Configuration

**File**: `vitest.config.ts` (separate from vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
})
```

**Analysis**:
- Separate config file is a valid approach (alternative to extending vite.config.ts)
- `globals: true` enables global test functions (`describe`, `it`, `expect`)
- Combined with `"types": ["vitest/globals"]` in tsconfig for type support
- jsdom environment for React component testing
- Setup file properly configures Testing Library and MSW

**Planning Doc Comparison**: The planning doc showed config in `vite.config.ts` with `/// <reference types="vitest" />`. The separate file approach is equally valid and keeps concerns separated.

---

### 6. Test Infrastructure

**Files**:
- `src/test/setup.ts` - Test lifecycle hooks
- `src/test/test-utils.tsx` - Custom render with providers
- `src/test/mocks/handlers.ts` - MSW request handlers
- `src/test/mocks/server.ts` - MSW server setup

**MSW v2 Setup**: Uses the correct v2 API:
```typescript
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
```

**Custom Render**: Wraps components with:
- `QueryClientProvider` (React Query)
- `BrowserRouter` (React Router)

This matches the planning document exactly.

---

### 7. Dependencies Analysis

**Production Dependencies**:
| Package | Version | Status |
|---------|---------|--------|
| react | ^18.3.1 | Current |
| react-dom | ^18.3.1 | Current |
| react-router-dom | ^7.11.0 | Current (v7) |
| @tanstack/react-query | ^5.90.12 | Current |
| react-hook-form | ^7.68.0 | Current |
| @hookform/resolvers | ^5.2.2 | Current |
| zod | ^4.2.1 | **Zod v4** (recently released) |
| clsx | ^2.1.1 | Current |
| tailwind-merge | ^3.4.0 | Current |

**Notable**:
- **Zod v4** is being used. This is a very recent release (2025). The `@hookform/resolvers` v5 added Zod v4 support.
- **React Router v7** is being used (not v6 as mentioned in CLAUDE.md)

**Dev Dependencies**:
| Package | Version | Status |
|---------|---------|--------|
| vite | ^5.4.10 | Current |
| typescript | ~5.6.2 | Current |
| vitest | ^4.0.16 | **Vitest v4** (very new) |
| tailwindcss | ^4.1.18 | **Tailwind v4** |
| eslint | ^9.13.0 | Current (v9 flat config) |
| msw | ^2.12.4 | Current (v2) |

---

### 8. Project Structure

**Current Structure**:
```
balance-frontend/
├── src/
│   ├── App.tsx
│   ├── App.test.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── assets/
│   │   └── react.svg
│   ├── lib/
│   │   └── utils.ts
│   └── test/
│       ├── setup.ts
│       ├── test-utils.tsx
│       └── mocks/
│           ├── handlers.ts
│           └── server.ts
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── eslint.config.js
```

**Missing from planned structure** (not yet implemented):
- `src/api/` - API client functions
- `src/components/` - UI components
- `src/hooks/` - Custom React Query hooks
- `src/pages/` - Route components

These will be created as features are implemented.

---

## Code References

- `vite.config.ts:1-14` - Vite configuration with Tailwind v4 plugin
- `tsconfig.app.json:1-35` - App TypeScript configuration
- `eslint.config.js:1-28` - ESLint flat config
- `vitest.config.ts:1-18` - Vitest configuration
- `src/test/setup.ts:1-16` - Test setup with MSW
- `src/index.css:1` - Tailwind v4 import directive
- `src/lib/utils.ts:1-6` - cn() utility function

## Architecture Documentation

### Configuration Pattern
The project uses a **split configuration** approach:
- Vite and Vitest have separate config files
- TypeScript uses project references (app vs node)
- ESLint uses the new flat config format

### Styling Approach
**Tailwind CSS v4** with:
- CSS-first configuration (no JS config file)
- Vite plugin integration (not PostCSS)
- `cn()` utility for conditional classes (clsx + tailwind-merge)

### Testing Approach
- Vitest as test runner (Jest-compatible API)
- React Testing Library for component tests
- MSW v2 for API mocking
- Custom render wrapper with providers

## Historical Context (from thoughts/)

The planning documents in `.claude/thoughts/plans/story-01-01-project-setup.md` were written for **Tailwind v3**, which explains the discrepancies:

| Aspect | Planning Doc (v3) | Actual Implementation (v4) |
|--------|-------------------|---------------------------|
| Config file | `tailwind.config.js` | None required |
| CSS directives | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Build integration | PostCSS | `@tailwindcss/vite` plugin |
| Content config | Manual `content` array | Automatic detection |

The actual implementation followed the **Tailwind v4 installation guide** rather than the planning docs.

## Related Documents

- `.claude/thoughts/plans/story-01-01-project-setup.md` - Original setup plan (v3 based)
- `.claude/thoughts/notes/TECH_STACK.md` - Technology decisions and rationale
- `CLAUDE.md` - Project coding guidelines

## Observations

### Documentation Updates Needed

The following documentation references outdated information:

1. **CLAUDE.md** mentions React Router v6, but v7 is installed
2. **story-01-01-project-setup.md** describes Tailwind v3 setup
3. **TECH_STACK.md** doesn't mention Tailwind v4 specifics

### Unused Dependencies

These packages are installed but not used with the current Tailwind v4 setup:
- `autoprefixer` - Vendor prefixing is handled by Lightning CSS in the Vite plugin
- `postcss` - Not used when using `@tailwindcss/vite`

### Build Script

The `package.json` build script is:
```json
"build": "tsc -b && vite build"
```

The `tsc -b` runs TypeScript in build mode (project references), which is correct for the split tsconfig setup.

## Open Questions

1. Should `autoprefixer` and `postcss` be removed from dependencies?
2. Should the planning docs be updated to reflect Tailwind v4?
3. Are there any Zod v4 breaking changes that affect the @hookform/resolvers integration?
