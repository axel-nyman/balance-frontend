# Update #003: Change Currency to SEK in UX Flow Documents

**Purpose:** Update all currency examples from USD ($) to SEK (kr)  
**Files Affected:** All `*_FLOW.md` files  
**Priority:** Medium (affects documentation accuracy, not code functionality)

---

## Problem Summary

All UX flow documents currently show US dollar formatting (`$5,000.00`) but the application uses Swedish Kronor (SEK) formatting (`5 000,00 kr`).

The frontend code in Epic 1 correctly implements SEK formatting, but the UX documentation needs to be updated to match.

---

## Currency Format Reference

**Swedish Kronor (SEK) formatting rules:**
- Symbol: `kr` (placed after the number)
- Thousands separator: space (` `)
- Decimal separator: comma (`,`)
- Decimal places: 2

**Examples:**
| Amount | USD (Wrong) | SEK (Correct) |
|--------|-------------|---------------|
| 5000 | $5,000.00 | 5 000,00 kr |
| 1500.50 | $1,500.50 | 1 500,50 kr |
| 120 | $120.00 | 120,00 kr |
| 0 | $0.00 | 0,00 kr |
| -500 | -$500.00 | −500,00 kr |

---

## Files to Update

### 1. ACCOUNTS_FLOW.md

**Search & Replace patterns:**
- `$12,450.00` → `12 450,00 kr`
- `$3,200.00` → `3 200,00 kr`
- `$8,500.00` → `8 500,00 kr`
- `$750.00` → `750,00 kr`
- `$500.00` → `500,00 kr`
- `$2,500.00` → `2 500,00 kr`
- `$2,700.00` → `2 700,00 kr`
- All other `$X,XXX.XX` patterns

**Example update in ASCII diagram:**
```
Before:
│ Checking    │ Main account    │  $3,200.00 │

After:
│ Checking    │ Main account    │  3 200,00 kr │
```

---

### 2. BUDGET_LIST_FLOW.md

**Search & Replace patterns:**
- `$5,000` → `5 000 kr`
- `$3,200` → `3 200 kr`
- `$1,800` → `1 800 kr`
- `$5,200` → `5 200 kr`
- `$3,100` → `3 100 kr`
- `$2,100` → `2 100 kr`
- `$4,800` → `4 800 kr`
- `$2,900` → `2 900 kr`
- `$1,900` → `1 900 kr`
- `$4,500` → `4 500 kr`
- `$2,800` → `2 800 kr`
- `$1,700` → `1 700 kr`
- `$3,000` → `3 000 kr`
- `$1,500` → `1 500 kr`
- `$0.00` → `0,00 kr`
- All other `$X,XXX.XX` patterns

**Update balance indicator table:**
```
Before:
| $0.00 | Green checkmark ✓ |

After:
| 0,00 kr | Green checkmark ✓ |
```

---

### 3. BUDGET_DETAIL_FLOW.md

**Search & Replace patterns:**
- `$5,000` → `5 000 kr`
- `$4,500` → `4 500 kr`
- `$500` → `500 kr`
- `$3,200` → `3 200 kr`
- `$1,800` → `1 800 kr`
- `$5,000.00` → `5 000,00 kr`
- `$3,200.00` → `3 200,00 kr`
- `$1,800.00` → `1 800,00 kr`
- `$0.00` → `0,00 kr`
- All other `$X,XXX.XX` patterns

---

### 4. BUDGET_WIZARD_FLOW.md

**Search & Replace patterns:**
- `$X,XXX.XX` → `X XXX,XX kr`
- `$1,500` → `1 500 kr`
- `$120` → `120 kr`
- `$600` → `600 kr`
- `$140` → `140 kr`
- `$400` → `400 kr`
- `$2,020.00` → `2 020,00 kr`
- `$5,000.00` → `5 000,00 kr`
- `$3,200.00` → `3 200,00 kr`
- `$1,500.00` → `1 500,00 kr`
- `$300.00` → `300,00 kr`
- `$0.00` → `0,00 kr`
- All other dollar amounts

**Update format strings:**
```
Before:
"Total Income: $X,XXX.XX"

After:
"Total Income: X XXX,XX kr"
```

---

### 5. RECURRING_EXPENSES_FLOW.md

**Search & Replace patterns:**
- `$1,500` → `1 500 kr`
- `$120` → `120 kr`
- `$600` → `600 kr`
- `$140` → `140 kr`
- `$1,500.00` → `1 500,00 kr`
- `$600.00` → `600,00 kr`
- All other dollar amounts

---

### 6. TODO_LIST_FLOW.md

**Search & Replace patterns:**
- `$800` → `800 kr`
- `$200` → `200 kr`
- `$150` → `150 kr`
- `$1,500` → `1 500 kr`
- `$120` → `120 kr`
- All other dollar amounts

**Example update:**
```
Before:
│  ☑  Transfer $800 from Checking to Savings                │

After:
│  ☑  Transfer 800 kr from Checking to Savings              │
```

---

## Global Search & Replace Commands

For bulk updates, use these regex patterns:

```bash
# Match dollar amounts with commas and decimals
# Pattern: \$([0-9]{1,3}(,[0-9]{3})*(\.[0-9]{2})?)
# Will need manual formatting to SEK standard

# Simpler approach: search for "$" and manually update each occurrence
```

**Recommended approach:** Manually review each occurrence to ensure proper Swedish number formatting.

---

## Verification Checklist

After updates, verify:
- [ ] No `$` symbols remain in any flow document
- [ ] All amounts use space as thousands separator
- [ ] All amounts use comma as decimal separator
- [ ] `kr` appears after the number (not before)
- [ ] ASCII diagrams still align properly (column widths may need adjustment)

---

*Created: [Current Date]*
