# Design Direction Demo Implementation Plan

## Overview

Implement a live theme switcher that allows toggling between 5 design directions (Current + 4 new proposals) to evaluate visual options for the Balance app redesign. This is a temporary demo implementation - the user will restore via git after review.

## Current State Analysis

- All colors defined as CSS custom properties in `src/index.css` (lines 80-147)
- Components use Tailwind classes that reference semantic tokens (`bg-background`, `text-income`, etc.)
- No font loading - relies on system fonts
- App entry point: `src/App.tsx` with `QueryClientProvider` wrapper
- Layout: `src/components/layout/AppLayout.tsx` contains header and sidebar

### Key Discoveries:
- Button uses `rounded-xl` hardcoded in `button.tsx:8` - we'll use CSS variable for border-radius
- Current base radius is `0.625rem` (10px)
- Shadow scale already exists: `--shadow-xs` through `--shadow-lg`
- OKLCH color space used throughout - all new themes will use OKLCH

## Desired End State

After implementation:
1. A floating theme switcher button appears in the bottom-right corner
2. Clicking it opens a panel with 5 theme options: Current, Nordic Clarity, Soft Finance, Bold Modern, Pure Apple
3. Selecting a theme instantly updates all colors, typography, border radii, and shadows
4. Theme selection persists via localStorage during the review session
5. Each theme has its distinctive personality as defined in the design proposals

### Verification:
- Navigate to `/budgets` - cards should reflect theme colors
- Check BudgetCard semantic colors (income green, expense red, savings blue vary per theme)
- Verify border radius changes on buttons and cards
- Confirm shadow intensity matches theme personality
- Test font changes on headings and body text

## What We're NOT Doing

- Component-level changes (progress rings, iOS navigation, custom icons)
- Animation changes per theme
- Dark mode variants
- Persistent theme selection beyond demo (localStorage only for session)
- Mobile-specific theme switcher styling (functional but basic)

## Implementation Approach

1. **Create theme context** - React context for theme state with localStorage persistence
2. **Define theme CSS files** - One file per direction with complete token overrides
3. **Load fonts** - Add Google Fonts for Inter (Soft Finance, Bold Modern)
4. **Build theme switcher UI** - Floating button + panel with theme previews
5. **Integrate** - Wrap app in theme provider, add switcher to layout

---

## Phase 1: Theme Infrastructure

### Overview
Create the React context and provider for theme state management.

### Changes Required:

#### 1. Create Theme Context
**File**: `src/contexts/ThemeContext.tsx` (new file)

```tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type ThemeDirection = 'current' | 'nordic-clarity' | 'soft-finance' | 'bold-modern' | 'pure-apple'

interface ThemeContextValue {
  theme: ThemeDirection
  setTheme: (theme: ThemeDirection) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'balance-theme-direction'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeDirection>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && isValidTheme(stored)) {
        return stored
      }
    }
    return 'current'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)

    // Remove all theme classes, then add current
    document.documentElement.classList.remove(
      'theme-current',
      'theme-nordic-clarity',
      'theme-soft-finance',
      'theme-bold-modern',
      'theme-pure-apple'
    )
    document.documentElement.classList.add(`theme-${theme}`)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

function isValidTheme(value: string): value is ThemeDirection {
  return ['current', 'nordic-clarity', 'soft-finance', 'bold-modern', 'pure-apple'].includes(value)
}
```

#### 2. Create contexts index
**File**: `src/contexts/index.ts` (new file)

```ts
export { ThemeProvider, useTheme, type ThemeDirection } from './ThemeContext'
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] No lint errors: `npm run lint`

#### Manual Verification:
- [ ] N/A - infrastructure only, tested in Phase 3

---

## Phase 2: Theme CSS Definitions

### Overview
Add CSS custom property overrides for each design direction, including colors, typography, border radius, and shadows.

### Changes Required:

#### 1. Add Google Fonts to index.html
**File**: `index.html`
**Changes**: Add font preconnect and stylesheet links in `<head>`

```html
<!-- Add after existing <link> tags, before </head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### 2. Add theme CSS variables to index.css
**File**: `src/index.css`
**Changes**: Add theme class definitions after the `:root` block (after line 147, before `.dark`)

```css
/*
 * ===========================================
 * DESIGN DIRECTION THEMES
 * ===========================================
 */

/* Current theme (default) - no overrides needed, uses :root values */
.theme-current {
  /* Explicitly set to ensure clean state */
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --font-heading: ui-sans-serif, system-ui, sans-serif;
}

/*
 * Nordic Clarity
 * Cool, professional, data-first (Avanza-inspired)
 */
.theme-nordic-clarity {
  /* Typography - System fonts, weight-based hierarchy */
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-heading: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;

  /* Border radius - Medium, professional */
  --radius: 0.75rem; /* 12px base */

  /* Surfaces - Cool gray-white family */
  --background: oklch(0.975 0.005 240);
  --foreground: oklch(0.2 0.01 240);
  --card: oklch(0.985 0.003 240);
  --card-foreground: oklch(0.2 0.01 240);
  --popover: oklch(0.99 0.002 240);
  --popover-foreground: oklch(0.2 0.01 240);
  --muted: oklch(0.96 0.008 240);
  --muted-foreground: oklch(0.5 0.008 240);
  --accent: oklch(0.92 0.02 200);
  --accent-foreground: oklch(0.2 0.01 240);
  --secondary: oklch(0.965 0.006 240);
  --secondary-foreground: oklch(0.25 0.01 240);

  /* Interactive - Forest green primary (Avanza-inspired) */
  --primary: oklch(0.55 0.18 145);
  --primary-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.55 0.18 25);

  /* Borders - Cool subtle */
  --border: oklch(0.92 0.006 240);
  --input: oklch(0.94 0.004 240);
  --ring: oklch(0.55 0.12 145);

  /* Semantic budget colors */
  --income: oklch(0.55 0.18 145);
  --income-muted: oklch(0.95 0.04 145);
  --expense: oklch(0.55 0.18 25);
  --expense-muted: oklch(0.95 0.04 25);
  --savings: oklch(0.55 0.14 250);
  --savings-muted: oklch(0.95 0.04 250);
  --balanced: oklch(0.55 0.18 145);
  --balanced-muted: oklch(0.95 0.04 145);
  --warning: oklch(0.55 0.14 85);
  --warning-muted: oklch(0.95 0.04 85);

  /* Charts */
  --chart-1: oklch(0.55 0.18 145);
  --chart-2: oklch(0.55 0.14 250);
  --chart-3: oklch(0.55 0.18 25);
  --chart-4: oklch(0.60 0.12 200);
  --chart-5: oklch(0.65 0.10 280);

  /* Sidebar */
  --sidebar: oklch(0.975 0.005 240);
  --sidebar-foreground: oklch(0.2 0.01 240);
  --sidebar-primary: oklch(0.55 0.18 145);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.92 0.02 200);
  --sidebar-accent-foreground: oklch(0.2 0.01 240);
  --sidebar-border: oklch(0.92 0.006 240);
  --sidebar-ring: oklch(0.55 0.12 145);

  /* Shadows - Cool, subtle */
  --shadow-xs: 0 1px 2px oklch(0.2 0.01 240 / 0.04);
  --shadow-sm: 0 1px 3px oklch(0.2 0.01 240 / 0.06), 0 1px 2px oklch(0.2 0.01 240 / 0.03);
  --shadow-md: 0 4px 6px oklch(0.2 0.01 240 / 0.05), 0 2px 4px oklch(0.2 0.01 240 / 0.03);
  --shadow-lg: 0 10px 15px oklch(0.2 0.01 240 / 0.07), 0 4px 6px oklch(0.2 0.01 240 / 0.03);
}

/*
 * Soft Finance
 * Warm, friendly, approachable (Apple Journal/Lifesum-inspired)
 */
.theme-soft-finance {
  /* Typography - Inter for friendly readability */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-heading: 'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Border radius - Large, organic */
  --radius: 1.25rem; /* 20px base */

  /* Surfaces - Warm cream family */
  --background: oklch(0.97 0.012 70);
  --foreground: oklch(0.25 0.02 50);
  --card: oklch(0.985 0.008 70);
  --card-foreground: oklch(0.25 0.02 50);
  --popover: oklch(0.99 0.006 70);
  --popover-foreground: oklch(0.25 0.02 50);
  --muted: oklch(0.955 0.015 70);
  --muted-foreground: oklch(0.5 0.02 50);
  --accent: oklch(0.94 0.03 60);
  --accent-foreground: oklch(0.25 0.02 50);
  --secondary: oklch(0.965 0.012 70);
  --secondary-foreground: oklch(0.3 0.02 50);

  /* Interactive - Soft sage green */
  --primary: oklch(0.6 0.12 150);
  --primary-foreground: oklch(0.98 0.01 70);
  --destructive: oklch(0.6 0.14 20);

  /* Borders - Warm subtle */
  --border: oklch(0.93 0.01 70);
  --input: oklch(0.95 0.008 70);
  --ring: oklch(0.6 0.10 150);

  /* Semantic budget colors - Softer, pastel */
  --income: oklch(0.6 0.14 150);
  --income-muted: oklch(0.95 0.05 150);
  --expense: oklch(0.6 0.14 20);
  --expense-muted: oklch(0.95 0.05 20);
  --savings: oklch(0.6 0.12 260);
  --savings-muted: oklch(0.95 0.05 260);
  --balanced: oklch(0.6 0.14 150);
  --balanced-muted: oklch(0.95 0.05 150);
  --warning: oklch(0.6 0.12 80);
  --warning-muted: oklch(0.95 0.05 80);

  /* Charts */
  --chart-1: oklch(0.6 0.14 150);
  --chart-2: oklch(0.6 0.12 260);
  --chart-3: oklch(0.6 0.14 20);
  --chart-4: oklch(0.65 0.10 80);
  --chart-5: oklch(0.55 0.08 200);

  /* Sidebar */
  --sidebar: oklch(0.97 0.012 70);
  --sidebar-foreground: oklch(0.25 0.02 50);
  --sidebar-primary: oklch(0.6 0.12 150);
  --sidebar-primary-foreground: oklch(0.98 0.01 70);
  --sidebar-accent: oklch(0.94 0.03 60);
  --sidebar-accent-foreground: oklch(0.25 0.02 50);
  --sidebar-border: oklch(0.93 0.01 70);
  --sidebar-ring: oklch(0.6 0.10 150);

  /* Shadows - Warm, soft, diffuse */
  --shadow-xs: 0 1px 3px oklch(0.3 0.02 50 / 0.04);
  --shadow-sm: 0 2px 6px oklch(0.3 0.02 50 / 0.06), 0 1px 3px oklch(0.3 0.02 50 / 0.03);
  --shadow-md: 0 6px 12px oklch(0.3 0.02 50 / 0.06), 0 3px 6px oklch(0.3 0.02 50 / 0.03);
  --shadow-lg: 0 12px 24px oklch(0.3 0.02 50 / 0.08), 0 6px 12px oklch(0.3 0.02 50 / 0.04);
}

/*
 * Bold Modern
 * Confident, contemporary, playful (Klarna-inspired)
 */
.theme-bold-modern {
  /* Typography - Inter with more weight */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-heading: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Border radius - Mixed: sharp cards, pill buttons */
  --radius: 0.5rem; /* 8px base - sharper */

  /* Surfaces - Clean whites with subtle depth */
  --background: oklch(0.985 0 0);
  --foreground: oklch(0.18 0.03 280);
  --card: oklch(0.995 0 0);
  --card-foreground: oklch(0.18 0.03 280);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.03 280);
  --muted: oklch(0.96 0.01 280);
  --muted-foreground: oklch(0.5 0.02 280);
  --accent: oklch(0.96 0.03 280);
  --accent-foreground: oklch(0.18 0.03 280);
  --secondary: oklch(0.97 0.005 280);
  --secondary-foreground: oklch(0.25 0.02 280);

  /* Interactive - Bold magenta (Klarna-inspired) */
  --primary: oklch(0.6 0.22 340);
  --primary-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.6 0.22 15);

  /* Borders - Clean, minimal */
  --border: oklch(0.92 0.005 280);
  --input: oklch(0.94 0.003 280);
  --ring: oklch(0.6 0.18 340);

  /* Semantic budget colors - Vibrant */
  --income: oklch(0.6 0.2 155);
  --income-muted: oklch(0.95 0.06 155);
  --expense: oklch(0.6 0.22 15);
  --expense-muted: oklch(0.95 0.06 15);
  --savings: oklch(0.6 0.18 260);
  --savings-muted: oklch(0.95 0.06 260);
  --balanced: oklch(0.6 0.2 155);
  --balanced-muted: oklch(0.95 0.06 155);
  --warning: oklch(0.6 0.16 80);
  --warning-muted: oklch(0.95 0.06 80);

  /* Charts */
  --chart-1: oklch(0.6 0.22 340);
  --chart-2: oklch(0.6 0.2 155);
  --chart-3: oklch(0.6 0.18 260);
  --chart-4: oklch(0.65 0.16 80);
  --chart-5: oklch(0.55 0.14 200);

  /* Sidebar */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.18 0.03 280);
  --sidebar-primary: oklch(0.6 0.22 340);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.96 0.03 280);
  --sidebar-accent-foreground: oklch(0.18 0.03 280);
  --sidebar-border: oklch(0.92 0.005 280);
  --sidebar-ring: oklch(0.6 0.18 340);

  /* Shadows - Crisp, defined */
  --shadow-xs: 0 1px 2px oklch(0.2 0.02 280 / 0.06);
  --shadow-sm: 0 1px 3px oklch(0.2 0.02 280 / 0.08), 0 1px 2px oklch(0.2 0.02 280 / 0.04);
  --shadow-md: 0 4px 8px oklch(0.2 0.02 280 / 0.08), 0 2px 4px oklch(0.2 0.02 280 / 0.04);
  --shadow-lg: 0 12px 20px oklch(0.2 0.02 280 / 0.10), 0 4px 8px oklch(0.2 0.02 280 / 0.05);
}

/*
 * Pure Apple
 * Native iOS feel, invisible design (Apple Health-inspired)
 */
.theme-pure-apple {
  /* Typography - SF Pro (system fonts on Apple devices) */
  --font-sans: -apple-system, BlinkMacSystemFont, ui-sans-serif, system-ui, sans-serif;
  --font-heading: -apple-system, BlinkMacSystemFont, ui-sans-serif, system-ui, sans-serif;

  /* Border radius - iOS standard */
  --radius: 0.625rem; /* 10px - iOS default */

  /* Surfaces - iOS system backgrounds */
  --background: oklch(0.97 0.005 60);
  --foreground: oklch(0 0 0);
  --card: oklch(0.995 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0 0 0);
  --muted: oklch(0.955 0.005 60);
  --muted-foreground: oklch(0.45 0.01 60);
  --accent: oklch(0.97 0.01 60);
  --accent-foreground: oklch(0 0 0);
  --secondary: oklch(0.96 0.005 60);
  --secondary-foreground: oklch(0.2 0 0);

  /* Interactive - iOS system blue */
  --primary: oklch(0.55 0.2 255);
  --primary-foreground: oklch(1 0 0);
  --destructive: oklch(0.55 0.22 25);

  /* Borders - iOS style */
  --border: oklch(0.90 0.005 60);
  --input: oklch(0.92 0.003 60);
  --ring: oklch(0.55 0.15 255);

  /* Semantic budget colors - iOS tinted */
  --income: oklch(0.55 0.2 145);
  --income-muted: oklch(0.95 0.04 145);
  --expense: oklch(0.55 0.22 25);
  --expense-muted: oklch(0.95 0.04 25);
  --savings: oklch(0.55 0.18 255);
  --savings-muted: oklch(0.95 0.04 255);
  --balanced: oklch(0.55 0.2 145);
  --balanced-muted: oklch(0.95 0.04 145);
  --warning: oklch(0.6 0.16 80);
  --warning-muted: oklch(0.95 0.04 80);

  /* Charts */
  --chart-1: oklch(0.55 0.2 255);
  --chart-2: oklch(0.55 0.2 145);
  --chart-3: oklch(0.55 0.22 25);
  --chart-4: oklch(0.6 0.16 80);
  --chart-5: oklch(0.5 0.12 280);

  /* Sidebar */
  --sidebar: oklch(0.97 0.005 60);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.55 0.2 255);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.97 0.01 60);
  --sidebar-accent-foreground: oklch(0 0 0);
  --sidebar-border: oklch(0.90 0.005 60);
  --sidebar-ring: oklch(0.55 0.15 255);

  /* Shadows - iOS subtle */
  --shadow-xs: 0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-sm: 0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.03);
  --shadow-md: 0 4px 6px oklch(0 0 0 / 0.05), 0 2px 4px oklch(0 0 0 / 0.03);
  --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.07), 0 4px 6px oklch(0 0 0 / 0.03);
}

/* Font family application */
html {
  font-family: var(--font-sans);
}

h1, h2, h3, h4, h5, h6,
.font-heading {
  font-family: var(--font-heading);
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Build succeeds: `npm run build`
- [ ] No CSS syntax errors (build would fail)

#### Manual Verification:
- [ ] Add `class="theme-nordic-clarity"` to `<html>` manually and verify colors change
- [ ] Repeat for other theme classes to verify all load correctly

---

## Phase 3: Theme Switcher Component

### Overview
Create a floating theme switcher UI that allows live toggling between design directions.

### Changes Required:

#### 1. Create ThemeSwitcher Component
**File**: `src/components/ThemeSwitcher.tsx` (new file)

```tsx
import { useState } from 'react'
import { Palette, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme, type ThemeDirection } from '@/contexts'

interface ThemeOption {
  id: ThemeDirection
  name: string
  description: string
  primaryColor: string
  bgColor: string
}

const themes: ThemeOption[] = [
  {
    id: 'current',
    name: 'Current',
    description: 'Warm cream palette',
    primaryColor: 'oklch(0.25 0.015 60)',
    bgColor: 'oklch(0.965 0.015 85)',
  },
  {
    id: 'nordic-clarity',
    name: 'Nordic Clarity',
    description: 'Cool, professional, data-first',
    primaryColor: 'oklch(0.55 0.18 145)',
    bgColor: 'oklch(0.975 0.005 240)',
  },
  {
    id: 'soft-finance',
    name: 'Soft Finance',
    description: 'Warm, friendly, approachable',
    primaryColor: 'oklch(0.6 0.12 150)',
    bgColor: 'oklch(0.97 0.012 70)',
  },
  {
    id: 'bold-modern',
    name: 'Bold Modern',
    description: 'Confident, contemporary',
    primaryColor: 'oklch(0.6 0.22 340)',
    bgColor: 'oklch(0.985 0 0)',
  },
  {
    id: 'pure-apple',
    name: 'Pure Apple',
    description: 'Native iOS feel',
    primaryColor: 'oklch(0.55 0.2 255)',
    bgColor: 'oklch(0.97 0.005 60)',
  },
]

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 bg-card border border-border rounded-xl shadow-lg p-3 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">Design Direction</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id)
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                  'hover:bg-accent',
                  theme === t.id && 'bg-accent'
                )}
              >
                {/* Color preview */}
                <div
                  className="w-10 h-10 rounded-lg border border-border flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: t.bgColor }}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: t.primaryColor }}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                </div>

                {/* Check */}
                {theme === t.id && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Demo only. Changes are temporary.
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        variant={isOpen ? 'default' : 'outline'}
      >
        <Palette className="w-5 h-5" />
      </Button>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] No lint errors: `npm run lint`

#### Manual Verification:
- [ ] Component renders (tested in Phase 4)

---

## Phase 4: Integration

### Overview
Wire up the theme provider and switcher into the application.

### Changes Required:

#### 1. Update App.tsx
**File**: `src/App.tsx`
**Changes**: Wrap app in ThemeProvider, add ThemeSwitcher

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/contexts'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { ROUTES } from './routes'
import { AppLayout } from './components/layout'
import {
  AccountsPage,
  RecurringExpensesPage,
  BudgetsPage,
  BudgetWizardPage,
  BudgetDetailPage,
  TodoListPage,
  NotFoundPage,
} from './pages'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BUDGETS} replace />} />
              <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
              <Route path={ROUTES.RECURRING_EXPENSES} element={<RecurringExpensesPage />} />
              <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
              <Route path={ROUTES.BUDGET_NEW} element={<BudgetWizardPage />} />
              <Route path={ROUTES.BUDGET_DETAIL} element={<BudgetDetailPage />} />
              <Route path={ROUTES.BUDGET_TODO} element={<TodoListPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
        <ThemeSwitcher />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
```

### Success Criteria:

#### Automated Verification:
- [ ] Application builds: `npm run build`
- [ ] Application starts: `npm run dev`
- [ ] No console errors on load

#### Manual Verification:
- [ ] Theme switcher button appears in bottom-right corner
- [ ] Clicking button opens theme panel
- [ ] Selecting each theme changes the app's appearance
- [ ] Theme persists after page refresh
- [ ] All 5 themes display their distinctive character:
  - Current: Warm cream backgrounds
  - Nordic Clarity: Cool gray-white, forest green primary
  - Soft Finance: Warm cream, sage green, larger radii
  - Bold Modern: Clean white, magenta primary, sharp corners
  - Pure Apple: iOS gray background, system blue primary

**Implementation Note**: After completing this phase and all automated verification passes, the demo is complete and ready for review.

---

## Testing Strategy

### Manual Testing Steps:
1. Navigate to `/budgets` and toggle through all 5 themes
2. Check that BudgetCard colors update correctly (income/expense/savings colors)
3. Navigate to `/accounts` to verify card styling consistency
4. Open the budget wizard (`/budgets/new`) to test form elements
5. Check sidebar styling updates with theme
6. Verify button primary color changes per theme
7. Test on mobile viewport - switcher should remain accessible
8. Refresh page - theme should persist

### Visual Comparison Checklist:
For each theme, verify:
- [ ] Background color matches design spec
- [ ] Card elevation is visible against background
- [ ] Primary button color is correct
- [ ] Income/Expense/Savings colors are distinct
- [ ] Border radius feels appropriate for theme personality
- [ ] Shadows match theme's visual weight

---

## References

- Design proposals: `.claude/thoughts/research/2026-01-28-design-direction-proposals.md`
- Current CSS: `src/index.css`
- UI patterns research: `.claude/thoughts/research/2026-01-25-ui-design-patterns-and-color-variables.md`
