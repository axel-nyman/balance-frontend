# Balance — Project Overview

## What is Balance?

Balance is a personal budgeting web application designed to help couples manage their shared monthly finances. It provides a structured approach to monthly budgeting with clear workflows for tracking income, expenses, savings, and the resulting money movements between accounts.

## Target Users

- **Primary users:** A couple managing shared household finances
- **Technical context:** Self-hosted on a Raspberry Pi on the home network
- **Security model:** No authentication required (trusted local network)

## Core Concepts

### Bank Accounts
Representations of real bank accounts. Each tracks a current balance and maintains a history of balance changes (both manual updates and automatic updates from budget locks).

### Recurring Expenses
Templates for expenses that occur on a regular schedule (monthly, quarterly, biannually, yearly). These can be quickly added to monthly budgets and track when they were last used to help identify what's due.

### Budgets
Monthly financial plans consisting of:
- **Income** — Money expected to arrive in specific accounts
- **Expenses** — Money expected to leave specific accounts (can be linked to recurring expense templates)
- **Savings** — Money allocated to savings in specific accounts

Budgets have two states:
- **Unlocked** — Can be edited freely
- **Locked** — Finalized, generates a todo list, updates account balances

### Todo Lists
Auto-generated when a budget is locked. Contains:
- **Transfer items** — Money that needs to move between accounts to balance everything
- **Payment items** — Manual payments that need to be made (bills, etc.)

## Design Philosophy

### Simplicity Over Features
This is a personal tool, not a commercial product. Every feature should earn its place. When in doubt, leave it out.

### Explicit Over Automatic
Users explicitly save changes rather than relying on autosave (exception: todo item checkboxes). This reduces complexity and makes the system behavior predictable.

### Mobile-First, Desktop-Friendly
The app must work well on phones (for quick checks and updates) and desktops (for budget creation and review). Responsive design is not optional.

### Apple-Inspired Aesthetic
Clean, spacious, focused interfaces. Generous whitespace. Subtle animations that feel natural. Glass-effect overlays for modals and forms. Light mode only.

## Key User Flows

### Monthly Budget Creation (Wizard)
A multi-step guided flow for creating a new monthly budget:
1. Create budget for selected month/year
2. Add income entries
3. Add recurring expenses (with smart recommendations for what's due)
4. Add other expenses
5. Add savings allocations
6. Review summary
7. Lock budget (if balanced)

### Budget Management
- View list of all budgets (cards showing month, status, totals)
- View budget details (expandable sections for income/expenses/savings)
- Edit entries in unlocked budgets via modal forms
- Lock/unlock budgets

### Account Management
- View all accounts in a table with balances
- Create/edit accounts via modal forms
- Update account balances manually
- View balance history in a slide-out drawer

### Recurring Expense Management
- View all templates in a table
- See which are due based on their interval and last used date
- Create/edit templates via modal forms

### Todo List
- View todo items for a locked budget
- Toggle items between pending/completed with single click
- See progress summary

## Pages Structure

| Page | Path | Purpose |
|------|------|---------|
| Accounts | `/accounts` | List all bank accounts, CRUD operations |
| Recurring Expenses | `/recurring-expenses` | List all templates, CRUD operations |
| Budgets | `/budgets` | List all budgets as cards |
| Budget Detail | `/budgets/:id` | View/edit specific budget |
| Budget Wizard | `/budgets/new` | Multi-step budget creation |
| Todo List | `/budgets/:id/todo` | View and manage todo items |

## Non-Goals

Things explicitly out of scope:
- User authentication / multi-tenancy
- Bank integrations / automatic transaction import
- Investment tracking
- Debt payoff planning
- Reports / analytics / charts (may add later)
- Data export (may add later)
- Dark mode (may add later)

## Deployment Context

- **Host:** Raspberry Pi on local home network
- **Backend:** Spring Boot (Java) — REST API
- **Frontend:** React with TypeScript — SPA
- **Database:** (Defined in backend — likely PostgreSQL or H2)

---

*Last updated: December 2024*
