# Replace Hardcoded Colors Implementation Plan

## Overview

Replace hardcoded Tailwind color classes with semantic design tokens in the wizard components. This ensures consistent theming and removes technical debt identified in the visual-redesign branch quality review.

## Current State Analysis

The visual-redesign branch introduces a comprehensive two-layer design token system, but four hardcoded color values bypass it:

**Hardcoded amber colors (can be fixed now):**
- `WizardItemCard.tsx:114` - `text-amber-500` on manual payment icon
- `StepIncome.tsx:415` - `text-amber-600` on validation warning message

**Hardcoded overlay colors (optional, requires new token):**
- `dialog.tsx:39` - `bg-black/50` on modal overlay
- `sheet.tsx:39` - `bg-black/50` on sheet overlay

### Key Discoveries:
- The `--warning` token exists at `src/index.css:130` and resolves to amber (`oklch(0.72 0.15 70)`)
- No `--overlay` token currently exists in the system
- Both amber usages are warning/validation contexts, making `text-warning` semantically correct

## Desired End State

All color values in wizard components use semantic tokens from the design system. The overlay token is optional scope.

### Verification:
- No `text-amber-*` classes remain in wizard components
- Searching for `text-amber` returns no results in `src/components/wizard/`
- Visual appearance is unchanged (amber color maintained via token)

## What We're NOT Doing

- Adding the `--overlay` token (medium priority, can be a follow-up)
- Changing any other color values
- Refactoring other components

## Implementation Approach

Simple find-and-replace of two Tailwind classes. No logic changes required.

## Phase 1: Replace Amber Colors with Warning Token

### Overview
Replace two hardcoded amber color classes with the semantic `text-warning` class.

### Changes Required:

#### 1. WizardItemCard Manual Payment Icon
**File**: `src/components/wizard/WizardItemCard.tsx`
**Line**: 114
**Change**: Replace `text-amber-500` with `text-warning`

```tsx
// Before:
<HandCoins
  className="w-4 h-4 shrink-0 text-amber-500"
  aria-label="Manual payment"
/>

// After:
<HandCoins
  className="w-4 h-4 shrink-0 text-warning"
  aria-label="Manual payment"
/>
```

#### 2. StepIncome Validation Warning
**File**: `src/components/wizard/steps/StepIncome.tsx`
**Line**: 415
**Change**: Replace `text-amber-600` with `text-warning`

```tsx
// Before:
{state.incomeItems.length === 0 && (
  <p className="text-sm text-amber-600">
    Add at least one income source to continue.
  </p>
)}

// After:
{state.incomeItems.length === 0 && (
  <p className="text-sm text-warning">
    Add at least one income source to continue.
  </p>
)}
```

### Success Criteria:

#### Automated Verification:
- [x] No linting errors: `npm run lint`
- [x] Type checking passes: `npm run typecheck`
- [x] Build succeeds: `npm run build`
- [x] No `text-amber` in wizard: `grep -r "text-amber" src/components/wizard/` returns empty

#### Manual Verification:
- [x] Manual payment icon (HandCoins) in WizardItemCard still displays amber/warning color
- [x] Validation message in StepIncome still displays amber/warning color
- [x] Color matches the overall design system warning color

---

## Testing Strategy

### Automated Tests:
- Existing tests should continue to pass (no behavior changes)

### Manual Testing Steps:
1. Open budget wizard, navigate to Income step
2. Remove all income items to trigger validation warning - verify amber color displays
3. Add an expense with `isManual: true` - verify the HandCoins icon shows amber color
4. Compare colors to other warning elements in the app for consistency

## References

- Research document: `.claude/thoughts/research/2026-02-04-visual-redesign-branch-quality-review.md`
- Token definitions: `src/index.css:66-146`
- Warning token: `src/index.css:130` (`--warning: var(--color-warning)`)
