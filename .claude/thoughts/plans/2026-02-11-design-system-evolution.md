# Design System Evolution — Revised Plan

**Date:** 2026-02-11
**Updated:** 2026-02-12 (v2 — scoped down after design review)
**Status:** Awaiting approval

---

## Summary

Five targeted improvements. All colors stay unchanged — the OKLCH token architecture, semantic budget colors, primary (near-black), and focus ring (blue) are all kept as-is.

### What stays

- All colors: primitives, semantic tokens, budget colors, primary, ring, destructive
- Component library (shadcn/ui primitives)
- Loading/error/empty state patterns

### What changes

1. Typography (Geist sans, self-hosted — no mono font)
2. Radius bump (20px → 24px base)
3. Depth strategy (soft-float: whisper shadows, remove structural borders)
4. Sidebar active state (weight + foreground icon, no background)
5. Financial data treatment (tabular-nums in Geist sans, light-weight heroes)

---

## 1. Typography — Geist Sans (Self-hosted)

### Problem

Inter is the default font for every shadcn/Tailwind app. It says nothing about this product. Heading typography has no tracking refinement.

### Direction

Replace Inter with **Geist** (Vercel's typeface). Tighter, more modern, excellent at small sizes. No monospace font — all numbers stay in Geist sans with `tabular-nums` for digit alignment.

### Installation — Self-hosted

The `geist` npm package exports JS (Next.js-only) and cannot be used in a Vite/React project. Instead, self-host the variable font file:

1. Extract `GeistVF.woff2` from `npm pack geist` (found in `dist/fonts/geist-sans/`)
2. Place in `src/assets/fonts/`
3. Add `@font-face` declaration in `src/index.css`

```css
@font-face {
  font-family: 'Geist';
  src: url('./assets/fonts/GeistVF.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

### CSS changes

```css
/* In @theme inline block */
--font-sans: 'Geist', system-ui, -apple-system, sans-serif;

/* Body font (in @layer base) */
body {
  font-family: var(--font-sans);
}
```

### Typography refinements

**Headings:**

- Page titles (`text-2xl`): Add `tracking-tight font-semibold`
- Card titles (`text-lg`): Add `tracking-tight`
- Geist's default tracking is already tighter than Inter, so this compounds nicely

**Body:**

- No changes needed — Geist at default tracking for body text is clean

### Type scale

- `text-2xl font-semibold tracking-tight` — Page titles
- `text-lg font-medium tracking-tight` — Card/section titles
- `text-sm` — Body, labels, descriptions
- `text-xs uppercase tracking-wide` — Category labels (BudgetSummary)
- `text-2xl tabular-nums font-light` — Hero amounts (see section 5)
- `text-lg tabular-nums font-normal` — Primary amounts (see section 5)
- `text-sm tabular-nums font-medium` — Secondary amounts (see section 5)

---

## 2. Radius — Bump to 24px

### Change

Increase base radius from 20px to 24px. Amplifies the organic, friendly feel — the logo has very generous squircle corners, and the reference designs all use large radii.

```css
:root {
  --radius: 1.5rem; /* 24px — was 20px */
}
```

All derived radii (`--radius-sm`, `--radius-md`, etc.) automatically adjust since they're calc-based on `--radius`.

---

## 3. Depth Strategy — Soft Float

### Problem

Current system mixes two depth strategies:

- Cards: shadows (`shadow-sm`, `hover:shadow-md`)
- Sidebar/Header: borders (`border-r border-border`, `border-b border-border`)

This creates inconsistent visual logic.

### Direction

**Soft float:** Very subtle shadows for structural separation. Cards gently float above the canvas. No structural borders for hierarchy — borders only for intra-surface dividers.

### Changes

**Sidebar:** Remove `border-r border-border` from the container (line 31). Keep the internal `border-b border-border` on the sidebar header (line 38) — it's an intra-surface divider separating the app title from the nav links. Add whisper-quiet shadow:

```tsx
// Sidebar container — replace border-r with shadow
className={cn(
  'fixed top-0 left-0 h-full w-64 bg-background z-50',
  'shadow-[1px_0_3px_oklch(0.2_0_0/0.04),0_0_1px_oklch(0.2_0_0/0.02)]',
  // ... rest of classes
)}
```

**Header (mobile):** Remove `border-b border-border`. Add bottom shadow:

```tsx
// Header — replace border-b with shadow
className="sticky top-0 z-10 h-16 bg-card shadow-[0_1px_2px_oklch(0.2_0_0/0.04)] lg:hidden"
```

**Cards:** Already use shadows. No changes needed — current `shadow-sm` / `hover:shadow-md` pattern is already consistent with soft-float.

### What borders still do

- Content dividers within cards (the `<hr>` in BudgetCard, etc.)
- Sidebar header divider (`border-b border-border`) — intra-surface
- Input field borders (interactive affordance, not depth)
- Table row separators

### Rule of thumb

> If two surfaces are at different elevation levels, use shadows + surface color.
> If content is separated within the same surface, use borders/dividers.

---

## 4. Sidebar Active State — Weight + Foreground Icon

### Problem

Active nav item uses `bg-accent` (surface-3) — a 3% lightness shift from background. You can barely tell where you are.

### Direction

Active item gets **semibold text** + **foreground-colored icon**. No background change. The weight bump from medium → semibold combined with the icon sharpening from muted → foreground provides clear wayfinding without noise.

### Implementation

```tsx
<NavLink
  className={({ isActive }) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150',
      isActive
        ? 'text-foreground font-semibold'
        : 'text-muted-foreground font-medium hover:bg-accent hover:text-foreground'
    )
  }
>
```

### Visual effect

- **Active:** Foreground text + semibold weight. Icon inherits `text-foreground` — sharp and present. The weight contrast against adjacent medium-weight items is the primary signal.
- **Inactive:** Muted text + medium weight + icon in muted color. Subtle hover background on interaction.
- No background shift, no left edge, no color accent. Just sharpening.

---

## 5. Financial Data Treatment — Light-weight Heroes

### Problem

Currency values all render at the same size and weight. Digits don't align vertically in lists. The Balance row in BudgetCard has no more visual weight than any other row. Numbers aren't treated as data.

### Direction

Treat money as first-class data. Hero amounts should be **large but light** — elegant and airy, inspired by the Zyric reference where the balance ($689.21) is big but thin. All currency values get `tabular-nums` for digit alignment. No monospace font — Geist sans throughout.

### Hierarchy

Three tiers:

1. **Hero amounts** — The number that answers "what's the bottom line?" Large (`text-2xl`), light weight (`font-light`). Examples: AccountsSummary total balance, BudgetCard balance.
2. **Primary amounts** — Supporting figures that build context. Sized up (`text-lg`), normal weight (`font-normal`). Examples: BudgetSummary income/expense/savings stats, BudgetCard income/expense/savings rows.
3. **Secondary amounts** — Detail-level data in lists and tables. Standard size (`text-sm`), medium weight (`font-medium`). Examples: RecurringExpenseRow amounts, AccountRow balances, BudgetSection line items.

All tiers get `tabular-nums` for vertical alignment.

### Specific changes

**AccountsSummary total:**

- Current: `text-2xl font-semibold text-foreground`
- After: `text-2xl tabular-nums font-light text-foreground`

**BudgetCard balance row — make it the hero:**

- Current: same `text-sm` as other rows (with `font-semibold` and conditional color)
- After: `text-2xl tabular-nums font-light` with conditional color. Visually separate from the rows above.
- **Layout:** Add spacing (`mt-3 pt-3`) between the income/expense/savings rows and the hero balance to give it breathing room.

**BudgetCard income/expense/savings rows:**

- Current: `text-sm font-medium` with semantic colors
- After: `text-lg tabular-nums font-normal` with semantic colors. These are primary amounts.
- The parent container's `text-sm` gets removed — each row controls its own size.

**BudgetSummary stat grid:**

- Current: `text-lg font-semibold`
- After: `text-lg tabular-nums font-normal`
- Add muted semantic backgrounds behind each stat for color-coded regions:
  - Income: `bg-income-muted rounded-xl p-3`
  - Expenses: `bg-expense-muted rounded-xl p-3`
  - Savings: `bg-savings-muted rounded-xl p-3`
  - Balance: no background (neutral)

**AccountCard balance:**

- Current: `text-lg font-semibold text-foreground`
- After: `text-lg tabular-nums font-normal text-foreground`

**Table data (AccountRow, RecurringExpenseRow):**

- Current: `font-medium`
- After: `tabular-nums font-medium text-right`

---

## Implementation Order

Each step is independently shippable:

1. **Typography (Geist sans)** — Foundation change. Do first so all subsequent work is seen in the final typeface.
2. **Radius bump** — One-line CSS change. Immediate visual impact.
3. **Financial data treatment** — Apply hero number hierarchy + tabular-nums. Benefits from step 1.
4. **Sidebar active state** — Small, contained change. One file.
5. **Depth strategy** — Remove structural borders, add shadows. Touches Sidebar + Header.

---

## Resolved Decisions

- **Font:** Geist sans only. No Geist Mono — numbers use Geist with `tabular-nums`.
- **Font loading:** Self-host woff2 variable font. The `geist` npm package is Next.js-only.
- **Colors:** No changes. Primary stays near-black. Income/expense/savings/warning unchanged.
- **Base radius:** 24px (up from 20px).
- **Number weight:** Light for heroes, normal for primary, medium for secondary. Elegant, not bold.
- **Depth approach:** Soft float (whisper shadows + surface color). Not borders.
- **Sidebar active:** Weight (semibold) + foreground icon. No background, no color accent.
- **BudgetSummary stat backgrounds:** Include with semantic muted colors. Can be removed if busy.
- **Dark mode:** Not addressed (non-goal per CLAUDE.md).

---

## Files Affected

### CSS/Tokens

- `src/index.css` — Font-face declaration, font-family, radius bump

### Fonts

- `src/assets/fonts/GeistVF.woff2` — New file (only sans, no mono)

### Layout

- `src/components/layout/Sidebar.tsx` — Remove border-r, add shadow, update active state
- `src/components/layout/Header.tsx` — Remove border-b, add shadow

### Components (financial data + typography)

- `src/components/budgets/BudgetCard.tsx` — Hero balance, primary amount rows, tabular-nums
- `src/components/budget-detail/BudgetSummary.tsx` — Tabular-nums, font weights, stat backgrounds
- `src/components/budget-detail/BudgetSection.tsx` — Tabular-nums on amounts
- `src/components/accounts/AccountCard.tsx` — Tabular-nums, font weight
- `src/components/accounts/AccountsSummary.tsx` — Hero total with font-light
- `src/components/accounts/AccountRow.tsx` — Tabular-nums
- `src/components/recurring-expenses/RecurringExpenseRow.tsx` — Tabular-nums
- `src/components/recurring-expenses/RecurringExpenseCard.tsx` — Tabular-nums

### Shared components (typography)

- `src/components/shared/PageHeader.tsx` — tracking-tight on page titles (if not already)
