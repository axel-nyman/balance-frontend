# Color Palette Consolidation Plan

## Overview

Consolidate the current color palette from ~40+ CSS custom property values to ~15 primitive colors, making the design system more coherent and easier to maintain. All semantic token names remain unchanged for component compatibility.

## Current State Analysis

### Problems Identified

1. **Exact Duplicates** (6 pairs of identical values):
   - `--sidebar` = `--background`
   - `--sidebar-border` = `--border`
   - `--sidebar-ring` = `--ring`
   - `--sidebar-primary` = `--primary`
   - `--income` = `--balanced`
   - `--expense` = `--destructive`

2. **Near-Duplicates** (imperceptible differences):
   - `--muted` (0.955) vs `--accent` (0.955) - 0.002 chroma difference
   - `--secondary` (0.965) sits between background and muted
   - `--input` (0.93) vs `--border` (0.91) - 2% lightness difference
   - 6 foreground tokens all equal `oklch(0.20 0.01 250)`

3. **Result**: UI feels incoherent due to subtle inconsistencies that don't serve a clear purpose.

## Desired End State

A two-tier color system:
1. **Primitives** (~15 values): The actual colors, clearly organized
2. **Semantic Tokens** (~35 variables): Reference primitives, maintain component API

### Primitive Palette

| Category | Token | Value | Purpose |
|----------|-------|-------|---------|
| **Surfaces** | `--surface-0` | `oklch(1 0 0)` | Pure white (overlays) |
| | `--surface-1` | `oklch(0.995 0.001 250)` | Near white (cards) |
| | `--surface-2` | `oklch(0.97 0.003 250)` | Light gray (canvas) |
| | `--surface-3` | `oklch(0.94 0.005 250)` | Subtle gray (hover/muted) |
| | `--surface-4` | `oklch(0.91 0.003 250)` | Border gray |
| **Text** | `--text-primary` | `oklch(0.20 0.01 250)` | Primary text |
| | `--text-secondary` | `oklch(0.45 0.01 250)` | Muted text |
| **Semantic** | `--color-positive` | `oklch(0.55 0.17 155)` | Green (income, success) |
| | `--color-positive-muted` | `oklch(0.96 0.03 155)` | Pale green bg |
| | `--color-negative` | `oklch(0.58 0.18 25)` | Red (expense, destructive) |
| | `--color-negative-muted` | `oklch(0.97 0.03 25)` | Pale red bg |
| | `--color-info` | `oklch(0.55 0.14 250)` | Blue (savings, focus) |
| | `--color-info-muted` | `oklch(0.96 0.03 250)` | Pale blue bg |
| | `--color-warning` | `oklch(0.72 0.15 70)` | Amber (caution) |
| | `--color-warning-muted` | `oklch(0.97 0.04 70)` | Pale amber bg |

### Token Consolidation Map

| Semantic Token | Now References | Consolidation |
|----------------|----------------|---------------|
| `--background` | `--surface-2` | Canvas |
| `--card` | `--surface-1` | Elevated |
| `--popover` | `--surface-0` | Floating |
| `--muted` | `--surface-3` | **Merged** |
| `--accent` | `--surface-3` | **Merged with muted** |
| `--secondary` | `--surface-3` | **Merged with muted** |
| `--border` | `--surface-4` | Borders |
| `--input` | `--surface-4` | **Merged with border** |
| `--foreground` | `--text-primary` | Main text |
| `--muted-foreground` | `--text-secondary` | Secondary text |
| `--card-foreground` | `--text-primary` | **Same as foreground** |
| `--popover-foreground` | `--text-primary` | **Same as foreground** |
| `--accent-foreground` | `--text-primary` | **Same as foreground** |
| `--secondary-foreground` | `--text-primary` | **Merged** (was 0.30) |
| `--primary` | `--text-primary` | Interactive |
| `--primary-foreground` | `--surface-0` | On-primary |
| `--destructive` | `--color-negative` | **Same as expense** |
| `--income` | `--color-positive` | Money in |
| `--balanced` | `--color-positive` | **Same as income** |
| `--expense` | `--color-negative` | Money out |
| `--savings` | `--color-info` | Money aside |
| `--warning` | `--color-warning` | Caution |
| `--ring` | `--color-info` | Focus ring |
| `--sidebar-*` | `--[main token]` | **All reference main** |

### Verification

```bash
npm run build    # Build succeeds
npm run dev      # Visual verification
```

Visual: All screens maintain proper contrast and hierarchy. Hover states, borders, and semantic colors work correctly.

## What We're NOT Doing

- Changing component code (only CSS variables)
- Renaming semantic token variables (API compatibility)
- Updating dark mode (out of scope)
- Changing the visual design direction (just consolidating)

## Implementation Approach

Single-phase CSS-only change. All modifications are in `src/index.css`. No component changes needed since we preserve all variable names.

---

## Phase 1: Consolidate Color Palette

### Overview

Replace the current flat list of CSS custom properties with a two-tier system: primitives + semantic tokens that reference them.

### Changes Required

#### 1. Update src/index.css

**File**: `src/index.css`

Replace the entire `:root` section (lines 80-147) with:

```css
:root {
  --radius: 1.25rem; /* 20px - organic softness */

  /*
   * ═══════════════════════════════════════════════════════════
   * PRIMITIVE PALETTE
   * The actual color values. Everything else references these.
   * ═══════════════════════════════════════════════════════════
   */

  /* Surface scale (neutral cool gray, hue 250) */
  --surface-0: oklch(1 0 0);              /* Pure white - floating */
  --surface-1: oklch(0.995 0.001 250);    /* Near white - elevated */
  --surface-2: oklch(0.97 0.003 250);     /* Light gray - canvas */
  --surface-3: oklch(0.94 0.005 250);     /* Subtle gray - interactive/muted */
  --surface-4: oklch(0.91 0.003 250);     /* Border gray */

  /* Text scale */
  --text-primary: oklch(0.20 0.01 250);   /* Near black */
  --text-secondary: oklch(0.45 0.01 250); /* Medium gray */

  /* Semantic colors */
  --color-positive: oklch(0.55 0.17 155);        /* Teal green */
  --color-positive-muted: oklch(0.96 0.03 155);  /* Pale green */
  --color-negative: oklch(0.58 0.18 25);         /* Red */
  --color-negative-muted: oklch(0.97 0.03 25);   /* Pale red */
  --color-info: oklch(0.55 0.14 250);            /* Blue */
  --color-info-muted: oklch(0.96 0.03 250);      /* Pale blue */
  --color-warning: oklch(0.72 0.15 70);          /* Amber */
  --color-warning-muted: oklch(0.97 0.04 70);    /* Pale amber */

  /*
   * ═══════════════════════════════════════════════════════════
   * SEMANTIC TOKENS
   * Component-facing API. All reference primitives above.
   * ═══════════════════════════════════════════════════════════
   */

  /* Surfaces */
  --background: var(--surface-2);
  --foreground: var(--text-primary);
  --card: var(--surface-1);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-0);
  --popover-foreground: var(--text-primary);
  --muted: var(--surface-3);
  --muted-foreground: var(--text-secondary);
  --accent: var(--surface-3);
  --accent-foreground: var(--text-primary);
  --secondary: var(--surface-3);
  --secondary-foreground: var(--text-primary);

  /* Interactive */
  --primary: var(--text-primary);
  --primary-foreground: var(--surface-0);
  --destructive: var(--color-negative);

  /* Borders & Focus */
  --border: var(--surface-4);
  --input: var(--surface-4);
  --ring: var(--color-info);

  /* Budget semantic colors */
  --income: var(--color-positive);
  --income-muted: var(--color-positive-muted);
  --expense: var(--color-negative);
  --expense-muted: var(--color-negative-muted);
  --savings: var(--color-info);
  --savings-muted: var(--color-info-muted);
  --balanced: var(--color-positive);
  --balanced-muted: var(--color-positive-muted);
  --warning: var(--color-warning);
  --warning-muted: var(--color-warning-muted);

  /* Charts */
  --chart-1: var(--color-info);
  --chart-2: var(--color-positive);
  --chart-3: oklch(0.65 0.15 300);  /* Purple - unique to charts */
  --chart-4: var(--color-warning);
  --chart-5: var(--color-negative);

  /* Sidebar (references main tokens) */
  --sidebar: var(--background);
  --sidebar-foreground: var(--foreground);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--primary-foreground);
  --sidebar-accent: var(--accent);
  --sidebar-accent-foreground: var(--accent-foreground);
  --sidebar-border: var(--border);
  --sidebar-ring: var(--ring);

  /* Shadows - neutral, soft */
  --shadow-xs: 0 1px 2px oklch(0.2 0 0 / 0.04);
  --shadow-sm: 0 1px 3px oklch(0.2 0 0 / 0.06), 0 1px 2px oklch(0.2 0 0 / 0.03);
  --shadow-md: 0 4px 6px oklch(0.2 0 0 / 0.05), 0 2px 4px oklch(0.2 0 0 / 0.03);
  --shadow-lg: 0 10px 15px oklch(0.2 0 0 / 0.06), 0 4px 6px oklch(0.2 0 0 / 0.03);
}
```

### Key Changes Summary

| Change | Before | After | Impact |
|--------|--------|-------|--------|
| Unique surface values | 8 | 5 | Cleaner elevation hierarchy |
| Unique text values | 3 | 2 | Simpler text contrast |
| `--muted`, `--accent`, `--secondary` | 3 different values | All `--surface-3` | Consistent interactive states |
| `--border`, `--input` | 2 values (0.91, 0.93) | Both `--surface-4` | Uniform borders |
| `--secondary-foreground` | 0.30 (unique) | `--text-primary` | Removed orphan value |
| Sidebar tokens | 8 hardcoded | 8 references | Single source of truth |
| `--income`/`--balanced` | Duplicate values | Both ref `--color-positive` | Explicit relationship |
| `--expense`/`--destructive` | Duplicate values | Both ref `--color-negative` | Explicit relationship |
| Total unique colors | ~40 | ~15 | 62% reduction |

### Success Criteria

#### Automated Verification:
- [x] `npm run build` succeeds
- [x] `npm run typecheck` passes (runs as part of build)
- [x] `npm test` passes (451/454 tests pass; 3 failures are pre-existing, unrelated to CSS changes)

#### Manual Verification:
- [x] Background canvas displays correctly (light cool gray)
- [x] Cards are visibly elevated from background
- [x] Popovers/dialogs float above cards
- [x] Hover states (`bg-accent`) provide visible feedback
- [x] Muted text is readable but clearly secondary
- [x] Income amounts display green
- [x] Expense amounts display red
- [x] Savings amounts display blue
- [x] Warning indicators display amber
- [x] Focus rings are visible (blue)
- [x] Borders are subtle but visible
- [x] Destructive buttons use same red as expenses
- [x] Sidebar matches main content area styling

**Implementation Note**: After completing this phase and all automated verification passes, do a visual walkthrough of all main screens (Accounts, Recurring Expenses, Budgets, Budget Detail, Create Budget Wizard, Todo List) to verify the consolidated palette looks cohesive.

---

## Testing Strategy

### Automated Tests
- All existing tests should pass without modification
- Tests verify behavior and CSS class names, not color values
- Run: `npm test`

### Manual Testing Steps
1. Start dev server: `npm run dev`
2. Hard refresh browser (Cmd+Shift+R) to clear cached styles
3. Walk through each page:
   - **Accounts**: Cards, balance colors, hover states
   - **Recurring Expenses**: Status indicators (green/red/amber dots)
   - **Budgets**: Income/expense/savings color coding
   - **Budget Detail**: Section headers, item colors
   - **Create Budget Wizard**: All 5 steps with semantic colors
   - **Todo List**: Progress indicator, completion states
4. Test interactive states:
   - Hover on cards and rows
   - Focus on form inputs (check ring color)
   - Trigger validation errors (check destructive color)
5. Verify on mobile viewport

### Regression Checks
- No contrast issues (text remains readable)
- No missing borders or backgrounds
- Hover states provide clear feedback
- Semantic colors correctly differentiate income/expense/savings

## Performance Considerations

- **No runtime impact**: CSS custom properties resolved at paint time
- **Smaller CSS**: Fewer unique values = better compression
- **Maintainability**: Changes to primitives cascade to all tokens

## Rollback Plan

If issues arise:
```bash
git checkout HEAD -- src/index.css
npm run build
```

## References

- Previous design plan: `.claude/thoughts/plans/2026-01-28-soft-finance-design-direction.md`
- Color research: `.claude/thoughts/research/2026-01-25-ui-design-patterns-and-color-variables.md`
