# Story 6.9: Complete Budget Detail Page

**As a** user  
**I want to** see the fully integrated budget detail page  
**So that** I can manage my budget effectively

### Implementation

**Update `src/pages/BudgetDetailPage.tsx`:**

```typescript
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, LoadingState, ErrorState } from "@/components/shared";
import {
  BudgetSummary,
  BudgetSection,
  BudgetActions,
  IncomeItemModal,
  ExpenseItemModal,
  SavingsItemModal,
  DeleteItemDialog,
} from "@/components/budget-detail";
import { useBudgetDetail } from "@/hooks";
import { formatMonthYear } from "@/lib/utils";
import { BudgetStatus } from "@/api/types";
import type {
  BudgetIncomeItem,
  BudgetExpenseItem,
  BudgetSavingsItem,
} from "@/api/types";

type DeleteTarget = {
  id: string;
  name: string;
  type: "income" | "expense" | "savings";
} | null;

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: budget, isLoading, isError, refetch } = useBudgetDetail(id!);

  // Modal state
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [savingsModalOpen, setSavingsModalOpen] = useState(false);

  // Edit item state
  const [editingIncome, setEditingIncome] = useState<BudgetIncomeItem | null>(
    null
  );
  const [editingExpense, setEditingExpense] =
    useState<BudgetExpenseItem | null>(null);
  const [editingSavings, setEditingSavings] =
    useState<BudgetSavingsItem | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <LoadingState variant="detail" />
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div>
        <PageHeader title="Budget Not Found" />
        <ErrorState
          title="Budget not found"
          message="This budget doesn't exist or has been deleted."
          onRetry={refetch}
        />
      </div>
    );
  }

  const isLocked = budget.status === BudgetStatus.LOCKED;
  const isEditable = !isLocked;
  const title = formatMonthYear(budget.month, budget.year);

  // Transform items for BudgetSection
  const incomeItems = budget.incomeItems.map((item) => ({
    id: item.id,
    label: item.source,
    amount: item.amount,
  }));

  const expenseItems = budget.expenseItems.map((item) => ({
    id: item.id,
    label: item.name,
    amount: item.amount,
    sublabel: item.recurringExpenseId ? "From recurring" : undefined,
  }));

  const savingsItems = budget.savingsItems.map((item) => ({
    id: item.id,
    label: item.targetAccountName,
    amount: item.amount,
  }));

  // Calculate totals
  const totalIncome = budget.incomeItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalExpenses = budget.expenseItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalSavings = budget.savingsItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // Get existing account IDs for savings modal
  const existingSavingsAccountIds = budget.savingsItems
    .filter((item) => item.id !== editingSavings?.id)
    .map((item) => item.targetAccountId);

  // Handlers for income
  const handleAddIncome = () => {
    setEditingIncome(null);
    setIncomeModalOpen(true);
  };

  const handleEditIncome = (itemId: string) => {
    const item = budget.incomeItems.find((i) => i.id === itemId);
    if (item) {
      setEditingIncome(item);
      setIncomeModalOpen(true);
    }
  };

  const handleDeleteIncome = (itemId: string) => {
    const item = budget.incomeItems.find((i) => i.id === itemId);
    if (item) {
      setDeleteTarget({ id: itemId, name: item.source, type: "income" });
    }
  };

  // Handlers for expenses
  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (itemId: string) => {
    const item = budget.expenseItems.find((i) => i.id === itemId);
    if (item) {
      setEditingExpense(item);
      setExpenseModalOpen(true);
    }
  };

  const handleDeleteExpense = (itemId: string) => {
    const item = budget.expenseItems.find((i) => i.id === itemId);
    if (item) {
      setDeleteTarget({ id: itemId, name: item.name, type: "expense" });
    }
  };

  // Handlers for savings
  const handleAddSavings = () => {
    setEditingSavings(null);
    setSavingsModalOpen(true);
  };

  const handleEditSavings = (itemId: string) => {
    const item = budget.savingsItems.find((i) => i.id === itemId);
    if (item) {
      setEditingSavings(item);
      setSavingsModalOpen(true);
    }
  };

  const handleDeleteSavings = (itemId: string) => {
    const item = budget.savingsItems.find((i) => i.id === itemId);
    if (item) {
      setDeleteTarget({
        id: itemId,
        name: item.targetAccountName,
        type: "savings",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={
          <Badge variant={isLocked ? "default" : "secondary"} className="mt-1">
            {isLocked ? (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </>
            ) : (
              "Draft"
            )}
          </Badge>
        }
        action={
          isLocked && (
            <Button
              variant="outline"
              onClick={() => navigate(`/budgets/${id}/todo`)}
            >
              <ListTodo className="w-4 h-4 mr-2" />
              Todo List
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <BudgetSummary
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          totalSavings={totalSavings}
        />

        <BudgetSection
          title="Income"
          items={incomeItems}
          total={totalIncome}
          totalColor="green"
          isEditable={isEditable}
          onAdd={handleAddIncome}
          onEdit={handleEditIncome}
          onDelete={handleDeleteIncome}
          emptyMessage="No income items"
        />

        <BudgetSection
          title="Expenses"
          items={expenseItems}
          total={totalExpenses}
          totalColor="red"
          isEditable={isEditable}
          onAdd={handleAddExpense}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          emptyMessage="No expense items"
        />

        <BudgetSection
          title="Savings"
          items={savingsItems}
          total={totalSavings}
          totalColor="blue"
          isEditable={isEditable}
          onAdd={handleAddSavings}
          onEdit={handleEditSavings}
          onDelete={handleDeleteSavings}
          emptyMessage="No savings planned"
        />

        <BudgetActions budgetId={id!} status={budget.status} />
      </div>

      {/* Income Modal */}
      <IncomeItemModal
        budgetId={id!}
        item={editingIncome}
        open={incomeModalOpen}
        onOpenChange={(open) => {
          setIncomeModalOpen(open);
          if (!open) setEditingIncome(null);
        }}
      />

      {/* Expense Modal */}
      <ExpenseItemModal
        budgetId={id!}
        item={editingExpense}
        open={expenseModalOpen}
        onOpenChange={(open) => {
          setExpenseModalOpen(open);
          if (!open) setEditingExpense(null);
        }}
      />

      {/* Savings Modal */}
      <SavingsItemModal
        budgetId={id!}
        item={editingSavings}
        existingAccountIds={existingSavingsAccountIds}
        open={savingsModalOpen}
        onOpenChange={(open) => {
          setSavingsModalOpen(open);
          if (!open) setEditingSavings(null);
        }}
      />

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteItemDialog
          budgetId={id!}
          itemId={deleteTarget.id}
          itemName={deleteTarget.name}
          itemType={deleteTarget.type}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
```

**Create barrel export `src/components/budget-detail/index.ts`:**

```typescript
export { BudgetSummary } from "./BudgetSummary";
export { BudgetSection } from "./BudgetSection";
export { BudgetActions } from "./BudgetActions";
export { IncomeItemModal } from "./IncomeItemModal";
export { ExpenseItemModal } from "./ExpenseItemModal";
export { SavingsItemModal } from "./SavingsItemModal";
export { DeleteItemDialog } from "./DeleteItemDialog";
export * from "./schemas";
```

### Definition of Done

- [x] All tests pass
- [x] Page loads and displays budget
- [x] All sections render with items
- [x] Add/Edit/Delete modals work
- [x] Lock/Unlock actions work
- [x] Delete budget works

---

## Epic 6 Complete File Structure

```
src/
├── components/
│   └── budget-detail/
│       ├── BudgetActions.tsx
│       ├── BudgetSection.tsx
│       ├── BudgetSummary.tsx
│       ├── DeleteItemDialog.tsx
│       ├── ExpenseItemModal.tsx
│       ├── IncomeItemModal.tsx
│       ├── index.ts
│       ├── SavingsItemModal.tsx
│       └── schemas.ts
└── pages/
    └── BudgetDetailPage.tsx
```

---

## Test Summary

| Component        | Test File                 | Tests (approx) |
| ---------------- | ------------------------- | -------------- |
| BudgetDetailPage | BudgetDetailPage.test.tsx | 6              |
| BudgetSummary    | BudgetSummary.test.tsx    | 4              |
| BudgetSection    | BudgetSection.test.tsx    | 14             |
| IncomeItemModal  | IncomeItemModal.test.tsx  | 8              |
| ExpenseItemModal | ExpenseItemModal.test.tsx | 5              |
| SavingsItemModal | SavingsItemModal.test.tsx | 6              |
| DeleteItemDialog | DeleteItemDialog.test.tsx | 6              |
| BudgetActions    | BudgetActions.test.tsx    | 9              |

**Total: ~58 tests for Epic 6**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Lock budget
http.put('/api/budgets/:id/lock', ({ params }) => {
  return HttpResponse.json({
    id: params.id,
    month: 3,
    year: 2025,
    status: 'LOCKED',
    lockedAt: new Date().toISOString(),
    totals: { income: 50000, expenses: 30000, savings: 20000, balance: 0 },
  })
}),

// Unlock budget
http.put('/api/budgets/:id/unlock', ({ params }) => {
  return HttpResponse.json({
    id: params.id,
    month: 3,
    year: 2025,
    status: 'UNLOCKED',
    lockedAt: null,
    totals: { income: 50000, expenses: 30000, savings: 20000, balance: 0 },
  })
}),

// Delete budget
http.delete('/api/budgets/:id', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Income CRUD
http.post('/api/budgets/:id/income', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 })
}),

http.put('/api/budgets/:budgetId/income/:itemId', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json(body)
}),

http.delete('/api/budgets/:budgetId/income/:itemId', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Expense CRUD
http.post('/api/budgets/:id/expenses', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 })
}),

http.put('/api/budgets/:budgetId/expenses/:itemId', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json(body)
}),

http.delete('/api/budgets/:budgetId/expenses/:itemId', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Savings CRUD
http.post('/api/budgets/:id/savings', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 })
}),

http.put('/api/budgets/:budgetId/savings/:itemId', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json(body)
}),

http.delete('/api/budgets/:budgetId/savings/:itemId', () => {
  return new HttpResponse(null, { status: 204 })
}),
```

---

## Next Steps

After completing Epic 6:

1. Run all tests: `npm test`
2. Test manually in browser
3. Verify lock/unlock behavior
4. Verify item CRUD operations
5. Proceed to Epic 7: Todo List

---

## Progress Summary

| Epic                       | Stories | Tests    |
| -------------------------- | ------- | -------- |
| Epic 1: Infrastructure     | 6       | ~50      |
| Epic 2: Accounts           | 7       | ~46      |
| Epic 3: Recurring Expenses | 5       | ~42      |
| Epic 4: Budget List        | 3       | ~24      |
| Epic 5: Budget Wizard      | 7       | ~83      |
| **Epic 6: Budget Detail**  | **9**   | **~58**  |
| **Total**                  | **37**  | **~303** |

---

_Last updated: December 2024_
