import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Lock, ListTodo } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, LoadingState, ErrorState, ConfirmDialog } from '@/components/shared'
import { BudgetSummary } from '@/components/budget-detail/BudgetSummary'
import { BudgetSection } from '@/components/budget-detail/BudgetSection'
import { IncomeItemModal } from '@/components/budget-detail/IncomeItemModal'
import { ExpenseItemModal } from '@/components/budget-detail/ExpenseItemModal'
import { SavingsItemModal } from '@/components/budget-detail/SavingsItemModal'
import { BudgetActions } from '@/components/budget-detail/BudgetActions'
import { useBudget, useDeleteIncome, useDeleteExpense, useDeleteSavings } from '@/hooks'
import { formatMonthYear } from '@/lib/utils'
import type { BudgetIncome, BudgetExpense, BudgetSavings } from '@/api/types'

function mapIncomeToSectionItems(income: BudgetIncome[]) {
  return income.map((item) => ({
    id: item.id,
    label: item.name,
    amount: item.amount,
    sublabel: item.bankAccount.name,
  }))
}

function mapExpensesToSectionItems(expenses: BudgetExpense[]) {
  return expenses.map((item) => ({
    id: item.id,
    label: item.name,
    amount: item.amount,
    sublabel: item.bankAccount.name,
  }))
}

function mapSavingsToSectionItems(savings: BudgetSavings[]) {
  return savings.map((item) => ({
    id: item.id,
    label: item.name,
    amount: item.amount,
    sublabel: item.bankAccount.name,
  }))
}

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: budget, isLoading, isError, refetch } = useBudget(id!)
  const deleteIncome = useDeleteIncome(id!)
  const deleteExpense = useDeleteExpense(id!)
  const deleteSavings = useDeleteSavings(id!)

  // Income modal state
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<BudgetIncome | null>(null)
  const [deleteIncomeDialogOpen, setDeleteIncomeDialogOpen] = useState(false)
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null)

  // Expense modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(null)
  const [deleteExpenseDialogOpen, setDeleteExpenseDialogOpen] = useState(false)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  // Savings modal state
  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  const [editingSavings, setEditingSavings] = useState<BudgetSavings | null>(null)
  const [deleteSavingsDialogOpen, setDeleteSavingsDialogOpen] = useState(false)
  const [deletingSavingsId, setDeletingSavingsId] = useState<string | null>(null)

  const handleAddIncome = () => {
    setEditingIncome(null)
    setIncomeModalOpen(true)
  }

  const handleEditIncome = (incomeId: string) => {
    const income = budget?.income.find((i) => i.id === incomeId)
    if (income) {
      setEditingIncome(income)
      setIncomeModalOpen(true)
    }
  }

  const handleDeleteIncomeClick = (incomeId: string) => {
    setDeletingIncomeId(incomeId)
    setDeleteIncomeDialogOpen(true)
  }

  const handleConfirmDeleteIncome = async () => {
    if (!deletingIncomeId) return
    try {
      await deleteIncome.mutateAsync(deletingIncomeId)
      toast.success('Income deleted')
      setDeleteIncomeDialogOpen(false)
      setDeletingIncomeId(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseModalOpen(true)
  }

  const handleEditExpense = (expenseId: string) => {
    const expense = budget?.expenses.find((e) => e.id === expenseId)
    if (expense) {
      setEditingExpense(expense)
      setExpenseModalOpen(true)
    }
  }

  const handleDeleteExpenseClick = (expenseId: string) => {
    setDeletingExpenseId(expenseId)
    setDeleteExpenseDialogOpen(true)
  }

  const handleConfirmDeleteExpense = async () => {
    if (!deletingExpenseId) return
    try {
      await deleteExpense.mutateAsync(deletingExpenseId)
      toast.success('Expense deleted')
      setDeleteExpenseDialogOpen(false)
      setDeletingExpenseId(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleAddSavings = () => {
    setEditingSavings(null)
    setSavingsModalOpen(true)
  }

  const handleEditSavings = (savingsId: string) => {
    const savings = budget?.savings.find((s) => s.id === savingsId)
    if (savings) {
      setEditingSavings(savings)
      setSavingsModalOpen(true)
    }
  }

  const handleDeleteSavingsClick = (savingsId: string) => {
    setDeletingSavingsId(savingsId)
    setDeleteSavingsDialogOpen(true)
  }

  const handleConfirmDeleteSavings = async () => {
    if (!deletingSavingsId) return
    try {
      await deleteSavings.mutateAsync(deletingSavingsId)
      toast.success('Savings deleted')
      setDeleteSavingsDialogOpen(false)
      setDeletingSavingsId(null)
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <LoadingState variant="detail" />
      </div>
    )
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
    )
  }

  const isLocked = budget.status === 'LOCKED'
  const title = formatMonthYear(budget.month, budget.year)

  return (
    <div>
      <PageHeader
        title={title}
        description={
          <Badge variant={isLocked ? 'default' : 'secondary'} className="mt-1">
            {isLocked ? (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </>
            ) : (
              'Draft'
            )}
          </Badge>
        }
        action={
          <div className="flex gap-2">
            {isLocked && (
              <Button
                variant="outline"
                onClick={() => navigate(`/budgets/${id}/todo`)}
              >
                <ListTodo className="w-4 h-4 mr-2" />
                Todo List
              </Button>
            )}
            <BudgetActions budgetId={id!} status={budget.status} />
          </div>
        }
      />

      <div className="space-y-6">
        <BudgetSummary budget={budget} />

        <BudgetSection
          title="Income"
          items={mapIncomeToSectionItems(budget.income)}
          total={budget.totals.income}
          totalColor="green"
          isEditable={!isLocked}
          emptyMessage="No income sources"
          onAdd={handleAddIncome}
          onEdit={handleEditIncome}
          onDelete={handleDeleteIncomeClick}
        />

        <BudgetSection
          title="Expenses"
          items={mapExpensesToSectionItems(budget.expenses)}
          total={budget.totals.expenses}
          totalColor="red"
          isEditable={!isLocked}
          emptyMessage="No expenses"
          onAdd={handleAddExpense}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpenseClick}
        />

        <BudgetSection
          title="Savings"
          items={mapSavingsToSectionItems(budget.savings)}
          total={budget.totals.savings}
          totalColor="blue"
          isEditable={!isLocked}
          emptyMessage="No savings planned"
          onAdd={handleAddSavings}
          onEdit={handleEditSavings}
          onDelete={handleDeleteSavingsClick}
        />
      </div>

      {/* Income Modal */}
      <IncomeItemModal
        budgetId={id!}
        item={editingIncome}
        open={incomeModalOpen}
        onOpenChange={setIncomeModalOpen}
      />

      {/* Delete Income Confirmation */}
      <ConfirmDialog
        open={deleteIncomeDialogOpen}
        onOpenChange={setDeleteIncomeDialogOpen}
        title="Delete Income"
        description="Are you sure you want to delete this income? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDeleteIncome}
        loading={deleteIncome.isPending}
      />

      {/* Expense Modal */}
      <ExpenseItemModal
        budgetId={id!}
        item={editingExpense}
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
      />

      {/* Delete Expense Confirmation */}
      <ConfirmDialog
        open={deleteExpenseDialogOpen}
        onOpenChange={setDeleteExpenseDialogOpen}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDeleteExpense}
        loading={deleteExpense.isPending}
      />

      {/* Savings Modal */}
      <SavingsItemModal
        budgetId={id!}
        item={editingSavings}
        open={savingsModalOpen}
        onOpenChange={setSavingsModalOpen}
      />

      {/* Delete Savings Confirmation */}
      <ConfirmDialog
        open={deleteSavingsDialogOpen}
        onOpenChange={setDeleteSavingsDialogOpen}
        title="Delete Savings"
        description="Are you sure you want to delete this savings? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDeleteSavings}
        loading={deleteSavings.isPending}
      />
    </div>
  )
}
