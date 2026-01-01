# Story 5.5: Step 4 — Savings

**As a** user  
**I want to** allocate savings to my accounts  
**So that** I can plan how much to save this month

### Acceptance Criteria

- [x] Shows running balance (Income - Expenses - Savings so far)
- [x] Dropdown to select target account
- [x] Amount field for savings
- [x] "Add Savings" button
- [x] Shows total savings
- [x] Warning if savings would make balance negative
- [x] "Copy from Last Budget" feature (check out income implementation)

### Implementation

**Create `src/components/wizard/steps/StepSavings.tsx`:**

```typescript
import { useState } from "react";
import { Plus, Trash2, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWizard } from "../WizardContext";
import { useBudgets, useAccounts } from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SavingsItem } from "../types";

function generateId(): string {
  return crypto.randomUUID();
}

export function StepSavings() {
  const { state, dispatch } = useWizard();
  const { data: budgetsData } = useBudgets();
  const { data: accountsData } = useAccounts();
  const [isCopying, setIsCopying] = useState(false);

  const accounts = accountsData?.accounts ?? [];

  // Find last budget for copy feature
  const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
  const lastBudget = sortedBudgets[0];

  // Calculate totals
  const totalIncome = state.incomeItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const totalExpenses = state.expenseItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const totalSavings = state.savingsItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const remainingBalance = totalIncome - totalExpenses - totalSavings;

  const handleAddItem = () => {
    dispatch({
      type: "ADD_SAVINGS_ITEM",
      item: {
        id: generateId(),
        targetAccountId: "",
        targetAccountName: "",
        amount: 0,
      },
    });
  };

  const handleUpdateAccount = (id: string, accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    dispatch({
      type: "UPDATE_SAVINGS_ITEM",
      id,
      updates: {
        targetAccountId: accountId,
        targetAccountName: account?.name ?? "",
      },
    });
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    dispatch({
      type: "UPDATE_SAVINGS_ITEM",
      id,
      updates: { amount },
    });
  };

  const handleRemoveItem = (id: string) => {
    dispatch({ type: "REMOVE_SAVINGS_ITEM", id });
  };

  const handleCopyFromLast = async () => {
    if (!lastBudget) return;

    setIsCopying(true);
    try {
      const response = await fetch(`/api/budgets/${lastBudget.id}`);
      const budget = await response.json();

      if (budget.savingsItems && budget.savingsItems.length > 0) {
        const copiedItems: SavingsItem[] = budget.savingsItems
          .filter((item: { targetAccountId: string }) =>
            // Only copy if account still exists
            accounts.some((a) => a.id === item.targetAccountId)
          )
          .map(
            (item: {
              targetAccountId: string;
              targetAccountName: string;
              amount: number;
            }) => ({
              id: generateId(),
              targetAccountId: item.targetAccountId,
              targetAccountName: item.targetAccountName,
              amount: item.amount,
            })
          );
        dispatch({ type: "SET_SAVINGS_ITEMS", items: copiedItems });
      }
    } catch (error) {
      console.error("Failed to copy from last budget:", error);
    } finally {
      setIsCopying(false);
    }
  };

  // Get accounts not already used
  const getAvailableAccounts = (currentItemId: string) => {
    const usedAccountIds = state.savingsItems
      .filter((item) => item.id !== currentItemId)
      .map((item) => item.targetAccountId);
    return accounts.filter((account) => !usedAccountIds.includes(account.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Savings</h2>
          <p className="text-sm text-gray-500">
            Allocate money to your savings accounts.
          </p>
        </div>
        {lastBudget && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromLast}
            disabled={isCopying}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isCopying ? "Copying..." : "Copy from Last Budget"}
          </Button>
        )}
      </div>

      {/* Running balance display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 uppercase">Income</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Expenses</p>
          <p className="text-lg font-semibold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Savings</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatCurrency(totalSavings)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Remaining</p>
          <p
            className={cn(
              "text-lg font-semibold",
              remainingBalance >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {formatCurrency(remainingBalance)}
          </p>
        </div>
      </div>

      {remainingBalance < 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your planned savings exceed your remaining balance by{" "}
            {formatCurrency(Math.abs(remainingBalance))}. Consider reducing your
            savings or expenses.
          </AlertDescription>
        </Alert>
      )}

      {accounts.length === 0 ? (
        <Alert>
          <AlertDescription>
            No bank accounts found. Create accounts in the Accounts page to add
            savings.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Savings table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.savingsItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-gray-500 py-8"
                    >
                      No savings planned yet. Savings are optional.
                    </TableCell>
                  </TableRow>
                ) : (
                  state.savingsItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.targetAccountId}
                          onValueChange={(value) =>
                            handleUpdateAccount(item.id, value)
                          }
                        >
                          <SelectTrigger className="border-0 shadow-none">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableAccounts(item.id).map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                            {/* Also show current selection if it's set */}
                            {item.targetAccountId &&
                              !getAvailableAccounts(item.id).find(
                                (a) => a.id === item.targetAccountId
                              ) && (
                                <SelectItem value={item.targetAccountId}>
                                  {item.targetAccountName}
                                </SelectItem>
                              )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) =>
                            handleUpdateAmount(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="border-0 shadow-none focus-visible:ring-0 px-0 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {state.savingsItems.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {formatCurrency(totalSavings)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          <Button
            variant="outline"
            onClick={handleAddItem}
            disabled={getAvailableAccounts("").length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Savings
          </Button>

          {getAvailableAccounts("").length === 0 &&
            state.savingsItems.length > 0 && (
              <p className="text-sm text-gray-500">
                All accounts have been assigned savings.
              </p>
            )}
        </>
      )}
    </div>
  );
}
```

### Test File: `src/components/wizard/steps/StepSavings.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { WizardProvider, useWizard } from "../WizardContext";
import { StepSavings } from "./StepSavings";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { useEffect } from "react";

// Helper to set up wizard state with income/expenses
function WizardWithState({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard();

  useEffect(() => {
    dispatch({
      type: "SET_INCOME_ITEMS",
      items: [{ id: "1", source: "Salary", amount: 50000 }],
    });
    dispatch({
      type: "SET_EXPENSE_ITEMS",
      items: [{ id: "1", name: "Rent", amount: 20000 }],
    });
  }, [dispatch]);

  return <>{children}</>;
}

function renderWithWizard(withState = false) {
  if (withState) {
    return render(
      <WizardProvider>
        <WizardWithState>
          <StepSavings />
        </WizardWithState>
      </WizardProvider>
    );
  }
  return render(
    <WizardProvider>
      <StepSavings />
    </WizardProvider>
  );
}

describe("StepSavings", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/budgets", () => {
        return HttpResponse.json({ budgets: [] });
      }),
      http.get("/api/bank-accounts", () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 2,
          accounts: [
            { id: "1", name: "Savings Account", currentBalance: 5000 },
            { id: "2", name: "Emergency Fund", currentBalance: 5000 },
          ],
        });
      })
    );
  });

  it("renders savings table", async () => {
    renderWithWizard();

    await waitFor(() => {
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
    });
  });

  it("shows running balance summary", async () => {
    renderWithWizard(true);

    await waitFor(() => {
      expect(screen.getByText("Income")).toBeInTheDocument();
      expect(screen.getByText("Expenses")).toBeInTheDocument();
      expect(screen.getByText("Savings")).toBeInTheDocument();
      expect(screen.getByText("Remaining")).toBeInTheDocument();
    });
  });

  it("calculates remaining balance correctly", async () => {
    renderWithWizard(true);

    await waitFor(() => {
      // Income 50000 - Expenses 20000 - Savings 0 = 30000 remaining
      expect(screen.getByText(/30 000,00 kr/)).toBeInTheDocument();
    });
  });

  it("adds savings item when button clicked", async () => {
    renderWithWizard();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add savings/i })
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /add savings/i }));

    expect(screen.getByText(/select account/i)).toBeInTheDocument();
  });

  it("shows account dropdown with available accounts", async () => {
    renderWithWizard();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add savings/i })
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /add savings/i }));
    await userEvent.click(screen.getByText(/select account/i));

    expect(screen.getByText("Savings Account")).toBeInTheDocument();
    expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
  });

  it("removes savings item when delete clicked", async () => {
    renderWithWizard();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add savings/i })
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /add savings/i }));
    expect(screen.getByText(/select account/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(screen.queryByText(/select account/i)).not.toBeInTheDocument();
  });

  it("shows warning when no accounts exist", async () => {
    server.use(
      http.get("/api/bank-accounts", () => {
        return HttpResponse.json({
          totalBalance: 0,
          accountCount: 0,
          accounts: [],
        });
      })
    );

    renderWithWizard();

    await waitFor(() => {
      expect(screen.getByText(/no bank accounts found/i)).toBeInTheDocument();
    });
  });

  it("shows empty state message", async () => {
    renderWithWizard();

    await waitFor(() => {
      expect(screen.getByText(/no savings planned/i)).toBeInTheDocument();
    });
  });

  it("shows warning when balance goes negative", async () => {
    // Set up with more expenses than income
    server.use(
      http.get("/api/bank-accounts", () => {
        return HttpResponse.json({
          totalBalance: 5000,
          accountCount: 1,
          accounts: [{ id: "1", name: "Savings", currentBalance: 5000 }],
        });
      })
    );

    render(
      <WizardProvider>
        <WizardWithState>
          <StepSavings />
        </WizardWithState>
      </WizardProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add savings/i })
      ).toBeInTheDocument();
    });

    // Add savings that exceeds remaining balance
    await userEvent.click(screen.getByRole("button", { name: /add savings/i }));
    await userEvent.click(screen.getByText(/select account/i));
    await userEvent.click(screen.getByText("Savings"));

    const amountInput = screen.getByPlaceholderText("0");
    await userEvent.type(amountInput, "40000"); // More than 30000 remaining

    await waitFor(() => {
      expect(screen.getByText(/exceed/i)).toBeInTheDocument();
    });
  });
});
```

### Definition of Done

- [x] All tests pass
- [x] Running balance displays correctly
- [x] Can add/edit/remove savings items
- [x] Account dropdown works
- [x] Warning shows for negative balance
- [x] Multiple savings items per account allowed

---
