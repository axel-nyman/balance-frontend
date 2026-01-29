# Soft Finance Design Direction Implementation Plan

## Overview

Implement the "Soft Finance" design direction for Balance, transforming the visual identity from the current unified cream palette to a warmer, friendlier aesthetic inspired by Apple Journal, Lifesum, and 2025 finance app trends. The goal is to make finance feel approachable and encouraging rather than cold or intimidating.

## Current State Analysis

### Existing Design System
- **Color space**: OKLCH (perceptual uniformity)
- **Surface hue**: 85 (warm beige)
- **Text hue**: 60 (warm gray)
- **Primary**: Warm dark (`oklch(0.25 0.015 60)`)
- **Base radius**: 0.625rem (10px)
- **Typography**: System fonts (SF Pro)
- **Shadows**: Warm-tinted OKLCH shadows

### Key Files
- `src/index.css` - All CSS custom properties and theme configuration
- `index.html` - Font loading
- `components.json` - shadcn/ui configuration

## Desired End State

After implementation, Balance will have:
- **Warmer cream surfaces** (hue 70 instead of 85)
- **Softer, more pastel semantic colors** for income/expense/savings
- **Larger border radii** (20px base) for organic softness
- **Inter font** for friendly, readable typography
- **Extra-soft shadows** with warm peachy tint
- **Peachy accent** for hover states

### Visual Principles (from research)
1. **Approachable Warmth** - Finance doesn't have to feel cold
2. **Gentle Progress** - Celebrate wins without gamification
3. **Organic Softness** - Rounded corners, soft shadows, flowing layouts
4. **Breathing Room** - Extra generous spacing for calm experience

### Verification
```bash
# Build should succeed
npm run build

# Type checking should pass
npm run typecheck

# Tests should pass
npm test

# Dev server should start
npm run dev
```

Visual verification: All screens should display with warmer cream tones, larger radii, and Inter font.

## What We're NOT Doing

- Dark mode updates (light mode only per project requirements)
- Adding new components or features
- Changing component behavior or logic
- Adding illustrations or progress rings (future enhancement)
- Adding animations beyond existing ones
- Changing the semantic token variable names (preserving API)

## Implementation Approach

The changes are primarily CSS token updates in `src/index.css` plus font integration. This is a low-risk change that can be verified visually and reverted easily if needed.

---

## Phase 1: Font Integration

### Overview
Add Inter font from Google Fonts for the friendlier, more readable typography that defines Soft Finance.

### Changes Required

#### 1. Update index.html
**File**: `index.html`

Add Google Fonts preconnect and Inter font import in the `<head>`:

```html
<!-- Add after existing meta tags, before title -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### 2. Update CSS font-family
**File**: `src/index.css`

Add font-family to body in the base layer:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
}
```

### Success Criteria

#### Automated Verification:
- [x] `npm run build` succeeds
- [x] `npm run typecheck` passes (runs as part of `tsc -b` in build)

#### Manual Verification:
- [ ] Inter font loads and displays correctly
- [ ] Text appears slightly rounder/friendlier than SF Pro
- [ ] Font weights (400, 500, 600, 700) all work correctly
- [ ] No flash of unstyled text (FOUT) on page load

---

## Phase 2: Color Palette Update

### Overview
Update all OKLCH color tokens to the Soft Finance palette. This shifts surfaces from hue 85 to hue 70, creates warmer text colors, and softens the semantic budget colors.

### Changes Required

#### 1. Update :root CSS Variables
**File**: `src/index.css`

Replace the entire `:root` color section (lines 80-146) with the Soft Finance palette:

```css
:root {
  --radius: 1.25rem; /* 20px - increased for organic softness */

  /*
   * Soft Finance Palette
   * Warmer cream family (hue 70) with approachable, friendly feel.
   * Inspired by Apple Journal, Lifesum, and 2025 wellness finance trends.
   */

  /* Surface elevation scale (all hue 70) */
  --background: oklch(0.97 0.012 70);            /* Warm cream canvas */
  --foreground: oklch(0.25 0.02 50);             /* Warm near-black */
  --card: oklch(0.985 0.008 70);                 /* Soft cream - lifted */
  --card-foreground: oklch(0.25 0.02 50);
  --popover: oklch(0.99 0.006 70);               /* Lightest cream - floating */
  --popover-foreground: oklch(0.25 0.02 50);
  --muted: oklch(0.955 0.015 70);                /* Deeper cream - recessed */
  --muted-foreground: oklch(0.5 0.02 50);        /* Warm gray */
  --accent: oklch(0.94 0.03 60);                 /* Peachy warmth - hover states */
  --accent-foreground: oklch(0.25 0.02 50);
  --secondary: oklch(0.96 0.012 70);             /* Secondary surfaces */
  --secondary-foreground: oklch(0.30 0.02 50);

  /* Interactive elements - keeping warm dark primary per user request */
  --primary: oklch(0.25 0.02 50);                /* Warm dark primary */
  --primary-foreground: oklch(0.98 0.01 70);     /* Cream white */
  --destructive: oklch(0.6 0.14 20);             /* Soft coral (not alarming red) */

  /* Borders - subtle warm separation */
  --border: oklch(0.92 0.015 70);                /* Default border */
  --input: oklch(0.94 0.012 70);                 /* Input borders */
  --ring: oklch(0.6 0.12 150);                   /* Sage green focus ring */

  /* Semantic colors - softer, more pastel versions */
  --income: oklch(0.6 0.14 150);                 /* Soft green - money in */
  --income-muted: oklch(0.95 0.05 150);          /* Pale green background */
  --expense: oklch(0.6 0.14 20);                 /* Soft coral - money out */
  --expense-muted: oklch(0.95 0.05 20);          /* Pale coral background */
  --savings: oklch(0.6 0.12 260);                /* Soft lavender-blue - money aside */
  --savings-muted: oklch(0.95 0.05 260);         /* Pale lavender background */
  --balanced: oklch(0.6 0.14 150);               /* Soft green - balanced */
  --balanced-muted: oklch(0.95 0.05 150);        /* Pale green background */
  --warning: oklch(0.65 0.14 85);                /* Soft amber - caution */
  --warning-muted: oklch(0.95 0.05 85);          /* Pale amber background */

  /* Charts - softer to match palette */
  --chart-1: oklch(0.65 0.14 45);                /* Soft orange */
  --chart-2: oklch(0.6 0.10 180);                /* Soft teal */
  --chart-3: oklch(0.55 0.08 220);               /* Soft slate blue */
  --chart-4: oklch(0.75 0.12 85);                /* Soft amber */
  --chart-5: oklch(0.70 0.12 70);                /* Soft peach */

  /* Sidebar - matches canvas */
  --sidebar: oklch(0.97 0.012 70);
  --sidebar-foreground: oklch(0.25 0.02 50);
  --sidebar-primary: oklch(0.25 0.02 50);
  --sidebar-primary-foreground: oklch(0.98 0.01 70);
  --sidebar-accent: oklch(0.94 0.03 60);
  --sidebar-accent-foreground: oklch(0.25 0.02 50);
  --sidebar-border: oklch(0.92 0.015 70);
  --sidebar-ring: oklch(0.6 0.12 150);

  /* Shadows - extra-soft with peachy warmth */
  --shadow-xs: 0 1px 2px oklch(0.3 0.02 50 / 0.04);
  --shadow-sm: 0 1px 3px oklch(0.3 0.02 50 / 0.05), 0 1px 2px oklch(0.3 0.02 50 / 0.03);
  --shadow-md: 0 4px 6px oklch(0.3 0.02 50 / 0.04), 0 2px 4px oklch(0.3 0.02 50 / 0.03);
  --shadow-lg: 0 10px 15px oklch(0.3 0.02 50 / 0.06), 0 4px 6px oklch(0.3 0.02 50 / 0.03);
}
```

### Key Changes Summary

| Token | Current Value | New Value | Change |
|-------|---------------|-----------|--------|
| `--radius` | `0.625rem` (10px) | `1.25rem` (20px) | Doubled for organic softness |
| `--background` | `oklch(0.965 0.015 85)` | `oklch(0.97 0.012 70)` | Hue 85→70, slightly lighter |
| `--foreground` | `oklch(0.25 0.015 60)` | `oklch(0.25 0.02 50)` | Hue 60→50, slightly more chroma |
| `--accent` | `oklch(0.955 0.016 85)` | `oklch(0.94 0.03 60)` | Peachy warmth (hue 60) |
| `--destructive` | `oklch(0.55 0.18 25)` | `oklch(0.6 0.14 20)` | Softer coral |
| `--ring` | `oklch(0.60 0.015 60)` | `oklch(0.6 0.12 150)` | Sage green focus |
| `--income` | `oklch(0.50 0.14 145)` | `oklch(0.6 0.14 150)` | Lighter, slightly different hue |
| `--expense` | `oklch(0.50 0.16 25)` | `oklch(0.6 0.14 20)` | Lighter, less saturated |
| `--savings` | `oklch(0.50 0.14 250)` | `oklch(0.6 0.12 260)` | Lighter, lavender shift |
| Shadows | 0.05-0.08 alpha | 0.03-0.06 alpha | Extra soft |

### Success Criteria

#### Automated Verification:
- [x] `npm run build` succeeds
- [x] `npm run typecheck` passes (runs as part of `tsc -b` in build)
- [x] `npm test` passes (3 pre-existing flaky tests fail unrelated to CSS changes)

#### Manual Verification:
- [ ] Background has warmer cream tone (less beige, more cream)
- [ ] Cards feel softer with larger border radius
- [ ] Income amounts display in soft green
- [ ] Expense amounts display in soft coral (not alarming red)
- [ ] Savings amounts display in soft lavender-blue
- [ ] Focus rings show sage green color
- [ ] Shadows appear softer and less prominent
- [ ] Overall feel is "friendly and approachable"

---

## Phase 3: Visual Verification & Fine-Tuning

### Overview
Walk through all screens to verify the design direction looks correct and make any fine-tuning adjustments needed.

### Verification Checklist

#### Accounts Page
- [ ] Account cards have warm cream background
- [ ] Card shadows are soft and subtle
- [ ] Border radius feels organic (not sharp)
- [ ] Balance amounts readable

#### Recurring Expenses Page
- [ ] Cards display correctly
- [ ] Due status indicators use semantic colors

#### Budgets Page
- [ ] Budget cards show income (green), expense (coral), savings (lavender)
- [ ] Balance indicator colors are correct
- [ ] Cards have proper shadow and radius

#### Budget Detail Page
- [ ] Summary section colors correct
- [ ] Section headers use appropriate colors
- [ ] Item modals display correctly

#### Create Budget Wizard
- [ ] Step 1 (Month/Year): Clean display
- [ ] Step 2 (Income): Green semantic colors
- [ ] Step 3 (Expenses): Coral semantic colors
- [ ] Step 4 (Savings): Lavender semantic colors
- [ ] Step 5 (Review): All colors harmonize

#### Todo List
- [ ] Progress indicator uses income green
- [ ] Completed items properly muted

#### Forms & Inputs
- [ ] Input borders visible but subtle
- [ ] Focus rings show sage green
- [ ] Validation errors show soft coral
- [ ] Buttons have correct styling

#### Empty & Error States
- [ ] Empty states display with warm tones
- [ ] Error states use destructive coral

### Potential Adjustments

If any values need fine-tuning during verification, document them here:

| Token | Issue | Adjustment |
|-------|-------|------------|
| | | |

---

## Testing Strategy

### Automated Tests
- All existing tests should pass without modification
- Tests check behavior, not specific color values
- Run full test suite: `npm test`

### Manual Testing Steps
1. Start dev server: `npm run dev`
2. Clear browser cache to ensure fresh styles
3. Walk through each page systematically
4. Check both desktop and mobile viewports
5. Verify hover states and focus rings
6. Test form validation error states

### Regression Checks
- No component layout shifts
- No text readability issues
- No contrast accessibility problems
- All interactive elements remain usable

## Performance Considerations

- **Font loading**: Inter is loaded via Google Fonts with `display=swap` to prevent blocking
- **No bundle size change**: Only CSS variable values change
- **No runtime performance impact**: OKLCH is calculated at build time

## Migration Notes

- All changes are in CSS custom properties
- No component code changes required
- Fully reversible by restoring previous `src/index.css` values
- Dark mode section preserved but not updated (out of scope)

## Rollback Plan

If the new design direction needs to be reverted:
1. Restore `src/index.css` from git: `git checkout HEAD -- src/index.css`
2. Remove font imports from `index.html`
3. Run `npm run build` to verify

## References

- Design direction research: `.claude/thoughts/research/2026-01-28-design-direction-proposals.md`
- Current design system: `.claude/thoughts/research/2026-01-25-ui-design-patterns-and-color-variables.md`
- Design system adoption plan: `.claude/thoughts/plans/2026-01-23-design-system-full-adoption.md`
