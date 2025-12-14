# Story 1: Create Bank Account

**As a** user
**I want to** create a bank account representation
**So that** I can track my financial accounts in the app

## Acceptance Criteria

- Can create bank account with name, description, and initial balance
- Name is required and must be non-empty
- Initial balance defaults to 0 if not provided
- Initial balance creates first history entry
- Account names must be unique
- Created timestamp is set automatically

## API Specification

```
POST /api/bank-accounts
Request Body:
{
  "name": "string",
  "description": "string",
  "initialBalance": "decimal"
}

Success Response (201):
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "currentBalance": "decimal",
  "createdAt": "datetime"
}

Error Response (400):
{
  "error": "Bank account name already exists"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Create `BankAccount` entity: id, name, description, currentBalance, createdAt, deletedAt
   - Create `BalanceHistory` entity: id, bankAccountId, balance, changeAmount, changeDate, comment, source (MANUAL/AUTOMATIC), budgetId (nullable)

2. **Repository Implementation**

   - Create `BankAccountRepository` interface extending `JpaRepository`
   - Add custom query: `existsByName(String name)`
   - Create `BalanceHistoryRepository` interface extending `JpaRepository`

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to save bank account
     - Method to check if account name exists
     - Method to save balance history entry
   - Implement in `DataService` using repositories

4. **DTOs and Extensions**

   - Create `BankAccountDtos.java` with:
     - `CreateBankAccountRequest` record
     - `BankAccountResponse` record
   - Create `BankAccountExtensions.java` with mapping methods

5. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to create bank account (validates uniqueness, creates account, creates initial history)
   - Implement in `DomainService`:
     - Validate name uniqueness using IDataService
     - Create bank account entity with initial balance
     - Create initial balance history entry with source=MANUAL, budgetId=null
     - Return DTO
   - Add custom exception: `DuplicateBankAccountNameException`

6. **Controller Implementation**

   - Create `BankAccountController` with `@RestController`
   - Implement POST /api/bank-accounts endpoint
   - Delegate to IDomainService
   - Add OpenAPI annotations

7. **Integration Tests**
   - Test successful creation
   - Test duplicate name validation
   - Test default initial balance (0)
   - Test negative initial balance
   - Test balance history creation

## Definition of Done

- All acceptance criteria met
- Unit tests for domain service logic
- Integration tests passing
- API documentation updated
- Decimal precision handled correctly
- Code reviewed and approved

---

# Story 2: List Bank Accounts

**As a** user
**I want to** see all bank accounts
**So that** I can get a complete financial overview

## Acceptance Criteria

- Returns all active accounts
- Shows total balance across all accounts
- Excludes soft-deleted accounts

## API Specification

```
GET /api/bank-accounts

Success Response (200):
{
  "totalBalance": "decimal",
  "accountCount": "integer",
  "accounts": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "currentBalance": "decimal",
      "createdAt": "datetime"
    }
  ]
}
```

## Technical Implementation

1. **Repository Implementation**

   - Add to `BankAccountRepository`: `findAllByDeletedAtIsNull()` query

2. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get all active bank accounts
   - Implement in `DataService`

3. **DTOs**

   - Add to `BankAccountDtos.java`:
     - `BankAccountListResponse` record with totalBalance, accountCount, accounts

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to get all bank accounts with totals
   - Implement in `DomainService`:
     - Get all active accounts from IDataService
     - Calculate total balance
     - Sort by name or creation date
     - Return DTO with aggregated data

5. **Controller Implementation**

   - Add GET /api/bank-accounts endpoint to `BankAccountController`

6. **Integration Tests**
   - Test retrieval of all accounts
   - Test total balance calculation
   - Test exclusion of deleted accounts

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Performance optimized for large number of accounts
- Code reviewed and approved

---

# Story 3: Update Bank Account Balance

**As a** bank account owner
**I want to** manually update the account balance
**So that** I can keep it synchronized with my actual bank

## Acceptance Criteria

- User can update balance
- Must provide new balance, date and optional comment
- Creates balance history entry with MANUAL source
- Calculates and stores change amount
- Updates current balance on account
- Date cannot be in the future

## API Specification

```
POST /api/bank-accounts/{id}/balance
Request Body:
{
  "newBalance": "decimal",
  "date": "datetime",
  "comment": "string"
}

Success Response (200):
{
  "id": "uuid",
  "name": "string",
  "currentBalance": "decimal",
  "previousBalance": "decimal",
  "changeAmount": "decimal",
  "lastUpdated": "datetime"
}

Error Response (403):
{
  "error": "Date cannot be in the future"
}
```

## Technical Implementation

1. **DTOs**

   - Add to `BankAccountDtos.java`:
     - `UpdateBalanceRequest` record
     - `BalanceUpdateResponse` record

2. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get bank account by id
     - Method to save bank account
     - Method to save balance history
   - Implement in `DataService`

3. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update bank account balance
   - Implement in `DomainService`:
     - Validate date is not in future
     - Calculate change amount (new - current)
     - Update account currentBalance
     - Create balance history entry with source=MANUAL, budgetId=null
     - Return DTO with previous and new balance

4. **Controller Implementation**

   - Add POST /api/bank-accounts/{id}/balance endpoint

5. **Integration Tests**
   - Test successful update
   - Test negative balance
   - Test future date rejection
   - Test history creation
   - Test change calculation

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Decimal precision handled
- Code reviewed and approved

---

# Story 4: Update Bank Account Details

**As a** bank account owner
**I want to** update account name and description
**So that** I can keep account information current

## Acceptance Criteria

- User can update account details
- Can update name and/or description
- Name must remain unique
- Cannot update soft-deleted accounts
- Balance cannot be updated through this endpoint

## API Specification

```
PUT /api/bank-accounts/{id}
Request Body:
{
  "name": "string",
  "description": "string"
}

Success Response (200):
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "currentBalance": "decimal",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}

Error Response (400):
{
  "error": "Bank account name already exists"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Add `updatedAt` field to BankAccount (with @LastModifiedDate annotation)

2. **DTOs**

   - Add to `BankAccountDtos.java`:
     - `UpdateBankAccountRequest` record

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to check name uniqueness excluding specific account id
   - Implement in `DataService`

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update bank account details
   - Implement in `DomainService`:
     - Validate account exists and not deleted
     - Validate name uniqueness if changed
     - Update only provided fields
     - Return updated DTO

5. **Controller Implementation**

   - Add PUT /api/bank-accounts/{id} endpoint

6. **Integration Tests**
   - Test successful update
   - Test duplicate name rejection
   - Test partial updates
   - Test deleted account update rejection

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 5: Delete Bank Account

**As a** bank account owner
**I want to** delete an account I no longer use
**So that** it doesn't clutter my account list

## Acceptance Criteria

- Users can delete accounts
- Sets deletedAt timestamp (soft delete)
- Deleted accounts excluded from GET all accounts
- Balance history preserved
- Cannot delete account if used in an unlocked budget

## API Specification

```
DELETE /api/bank-accounts/{id}

Success Response (204): No Content

Error Response (400):
{
  "error": "Cannot delete account used in unlocked budget"
}
```

## Technical Implementation

1. **Repository Implementation**

   - Add to `BudgetRepository` (created later): method to check if account is used in unlocked budget

2. **Data Service Layer**

   - Add to `IDataService`:
     - Method to check if account is used in unlocked budget
     - Method to soft delete account (set deletedAt)
   - Implement in `DataService`

3. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to delete bank account
   - Implement in `DomainService`:
     - Check account exists
     - Check no unlocked budgets use this account
     - Set deletedAt timestamp
     - Preserve all related data
   - Add custom exception: `AccountLinkedToBudgetException`

4. **Controller Implementation**

   - Add DELETE /api/bank-accounts/{id} endpoint

5. **Integration Tests**
   - Test successful deletion
   - Test unlocked budget constraint
   - Test data preservation
   - Test exclusion from get all endpoints

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Cascade rules documented
- Code reviewed and approved

---

# Story 6: Create Recurring Expense Template

**As a** user
**I want to** create recurring expense templates
**So that** I can easily add regular expenses to monthly budgets

## Acceptance Criteria

- Can create template with name, amount, and interval
- Intervals: MONTHLY, QUARTERLY, BIANNUALLY, YEARLY
- Can be marked as requiring manual payment
- Amount must be positive
- Name must be unique (excluding soft-deleted templates)
- Tracks last used date for interval calculation

## API Specification

```
POST /api/recurring-expenses
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "recurrenceInterval": "MONTHLY|QUARTERLY|BIANNUALLY|YEARLY",
  "isManual": "boolean"
}

Success Response (201):
{
  "id": "uuid",
  "name": "string",
  "amount": "decimal",
  "recurrenceInterval": "string",
  "isManual": "boolean",
  "lastUsedDate": null,
  "createdAt": "datetime"
}

Error Response (400):
{
  "error": "Recurring expense with this name already exists"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Create `RecurringExpense` entity: id, name, amount, recurrenceInterval (enum), isManual, lastUsedDate, createdAt, deletedAt
   - Create `RecurrenceInterval` enum: MONTHLY, QUARTERLY, BIANNUALLY, YEARLY

2. **Repository Implementation**

   - Create `RecurringExpenseRepository` extending JpaRepository
   - Add query: `existsByNameAndDeletedAtIsNull(String name)`

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to save recurring expense
     - Method to check name uniqueness
   - Implement in `DataService`

4. **DTOs and Extensions**

   - Create `RecurringExpenseDtos.java` with:
     - `CreateRecurringExpenseRequest` record
     - `RecurringExpenseResponse` record
   - Create `RecurringExpenseExtensions.java` with mapping methods

5. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to create recurring expense template
   - Implement in `DomainService`:
     - Validate name uniqueness
     - Validate amount is positive
     - Validate recurrence interval enum
     - Create template with null lastUsedDate
     - Return DTO
   - Add custom exception: `DuplicateRecurringExpenseException`

6. **Controller Implementation**

   - Create `RecurringExpenseController`
   - Add POST /api/recurring-expenses endpoint

7. **Integration Tests**
   - Test successful creation
   - Test duplicate name rejection
   - Test enum validation
   - Test amount validation

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Enum validation implemented
- Code reviewed and approved

---

# Story 7: List Recurring Expenses

**As a** user
**I want to** see all active recurring expenses
**So that** I can manage regular expenses

## Acceptance Criteria

- Returns all active (non-deleted) recurring expenses
- Shows last used date for each
- Indicates if/when it's due based on interval
- Sorted by name alphabetically
- Excludes soft-deleted templates

## API Specification

```
GET /api/recurring-expenses

Success Response (200):
{
  "expenses": [
    {
      "id": "uuid",
      "name": "string",
      "amount": "decimal",
      "recurrenceInterval": "string",
      "isManual": "boolean",
      "lastUsedDate": "date",
      "nextDueDate": "date",
      "isDue": "boolean",
      "createdAt": "datetime"
    }
  ]
}
```

## Technical Implementation

1. **Repository Implementation**

   - Add to `RecurringExpenseRepository`: `findAllByDeletedAtIsNull()` query

2. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get all active recurring expenses
   - Implement in `DataService`

3. **DTOs**

   - Add to `RecurringExpenseDtos.java`:
     - `RecurringExpenseListItemResponse` record with nextDueDate, isDue fields

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to get all recurring expenses with due date calculations
   - Implement in `DomainService`:
     - Get all active templates from IDataService
     - Calculate next due date based on interval
     - Determine if currently due
     - Sort by name
     - Return list of DTOs

5. **Controller Implementation**

   - Add GET /api/recurring-expenses endpoint

6. **Integration Tests**
   - Test retrieval
   - Test due date calculation
   - Test soft-delete exclusion
   - Test sorting

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Due date logic tested
- Code reviewed and approved

---

# Story 8: Update Recurring Expense Template

**As a** user
**I want to** update recurring expense templates
**So that** I can adjust for price changes

## Acceptance Criteria

- Can update name, amount, interval, and auto-pay flag
- Name must remain unique among non-deleted templates
- Does not affect existing budget expenses
- Amount must be positive
- Cannot update deleted templates

## API Specification

```
PUT /api/recurring-expenses/{id}
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "recurrenceInterval": "MONTHLY|QUARTERLY|BIANNUALLY|YEARLY",
  "isManual": "boolean"
}

Success Response (200):
{
  "id": "uuid",
  "name": "string",
  "amount": "decimal",
  "recurrenceInterval": "string",
  "isManual": "boolean",
  "lastUsedDate": "date",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Add `updatedAt` field to RecurringExpense

2. **DTOs**

   - Add to `RecurringExpenseDtos.java`:
     - `UpdateRecurringExpenseRequest` record

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to check name uniqueness excluding specific id
   - Implement in `DataService`

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update recurring expense
   - Implement in `DomainService`:
     - Validate template exists and not deleted
     - Validate name uniqueness if changed
     - Validate amount is positive
     - Update fields
     - Do not modify lastUsedDate
     - Return DTO

5. **Controller Implementation**

   - Add PUT /api/recurring-expenses/{id} endpoint

6. **Integration Tests**
   - Test successful update
   - Test duplicate name rejection
   - Test deleted template rejection
   - Test existing expenses unaffected

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 9: Delete Recurring Expense Template

**As a** user
**I want to** delete unused recurring expense templates
**So that** I can keep my templates organized

## Acceptance Criteria

- Soft delete (sets deletedAt timestamp)
- Does not affect existing budget expenses
- Deleted templates excluded from lists
- Cannot be reactivated

## API Specification

```
DELETE /api/recurring-expenses/{id}

Success Response (204): No Content

Error Response (404):
{
  "error": "Recurring expense not found"
}
```

## Technical Implementation

1. **Data Service Layer**

   - Add to `IDataService`:
     - Method to soft delete recurring expense
   - Implement in `DataService`

2. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to delete recurring expense
   - Implement in `DomainService`:
     - Validate template exists
     - Set deletedAt timestamp
     - Return success

3. **Controller Implementation**

   - Add DELETE /api/recurring-expenses/{id} endpoint

4. **Integration Tests**
   - Test successful deletion
   - Test exclusion from lists
   - Test existing expenses unaffected

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 10: Create Budget

**As a** user
**I want to** create a monthly budget
**So that** I can plan my finances for a specific month

## Acceptance Criteria

- Can create budget for any month/year combination
- Only one budget allowed per month/year
- Budget starts in UNLOCKED status
- Cannot create duplicate budget for same month/year
- Month must be valid (1-12)
- Year must be reasonable (e.g., 2000-2100)
- Only one budget in UNLOCKED status allowed at a time

## API Specification

```
POST /api/budgets
Request Body:
{
  "month": "integer",
  "year": "integer"
}

Success Response (201):
{
  "id": "uuid",
  "month": "integer",
  "year": "integer",
  "status": "UNLOCKED",
  "createdAt": "datetime",
  "totals": {
    "income": "decimal",
    "expenses": "decimal",
    "savings": "decimal",
    "balance": "decimal"
  }
}

Error Response (400):
{
  "error": "Budget already exists for this month"
}

Error Response (400):
{
  "error": "Invalid month value. Must be between 1 and 12"
}

Error Response (400):
{
  "error": "Another budget is currently unlocked. Lock or delete it before creating a new budget."
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Create `Budget` entity: id, month, year, status (enum: UNLOCKED/LOCKED), createdAt, lockedAt
   - Create `BudgetStatus` enum: UNLOCKED, LOCKED
   - Add unique constraint on (month, year)

2. **Repository Implementation**

   - Create `BudgetRepository` extending JpaRepository
   - Add queries:
     - `existsByMonthAndYear(int month, int year)`
     - `existsByStatus(BudgetStatus status)`

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to save budget
     - Method to check if budget exists for month/year
     - Method to check if unlocked budget exists
   - Implement in `DataService`

4. **DTOs and Extensions**

   - Create `BudgetDtos.java` with:
     - `CreateBudgetRequest` record
     - `BudgetResponse` record
     - `BudgetTotalsResponse` record
   - Create `BudgetExtensions.java` with mapping methods

5. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to create budget
   - Implement in `DomainService`:
     - Validate month (1-12)
     - Validate year (reasonable range)
     - Check no other unlocked budget exists
     - Check for existing budget for this month/year
     - Create budget with UNLOCKED status
     - Initialize totals to zero
     - Return DTO
   - Add custom exceptions: `DuplicateBudgetException`, `InvalidMonthException`, `InvalidYearException`, `UnlockedBudgetExistsException`

6. **Controller Implementation**

   - Create `BudgetController` with `@RestController`
   - Implement POST /api/budgets endpoint

7. **Integration Tests**
   - Test successful creation
   - Test duplicate budget prevention
   - Test invalid month values
   - Test invalid year values
   - Test unlocked budget constraint
   - Test initial status and totals

## Definition of Done

- All acceptance criteria met
- Unit tests for validation logic
- Integration tests passing
- API documentation updated
- Database constraints in place
- Code reviewed and approved

---

# Story 11: List Budgets

**As a** user
**I want to** see all budgets
**So that** I can access historical and current budget data

## Acceptance Criteria

- Returns all budgets
- Includes both locked and unlocked budgets
- Shows calculated totals for each budget
- Shows lock status
- Sorted by year and month descending (newest first)
- Includes basic metadata but not detailed items

## API Specification

```
GET /api/budgets

Success Response (200):
{
  "budgets": [
    {
      "id": "uuid",
      "month": "integer",
      "year": "integer",
      "status": "UNLOCKED|LOCKED",
      "createdAt": "datetime",
      "lockedAt": "datetime",
      "totals": {
        "income": "decimal",
        "expenses": "decimal",
        "savings": "decimal",
        "balance": "decimal"
      }
    }
  ]
}
```

## Technical Implementation

1. **Repository Implementation**

   - Add to `BudgetRepository`: method with custom query for sorting by year DESC, month DESC

2. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get all budgets sorted by year/month DESC
     - Methods to calculate totals (sum income, expenses, savings for a budget)
   - Implement in `DataService`

3. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to get all budgets with totals
   - Implement in `DomainService`:
     - Get all budgets from IDataService
     - Calculate totals for each budget
     - Return list of DTOs

4. **Controller Implementation**

   - Add GET /api/budgets endpoint

5. **Integration Tests**
   - Test retrieval of multiple budgets
   - Test sorting order
   - Test totals calculation
   - Test empty list scenario

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Query performance optimized
- Code reviewed and approved

---

# Story 12: Add Income to Budget

**As a** user
**I want to** add income items to my monthly budget
**So that** I can track expected income

## Acceptance Criteria

- Can add income to unlocked budgets only
- Must specify name, amount, and bank account
- Amount must be positive
- Bank account must exist and not be deleted
- Name cannot be empty
- Updates budget totals immediately

## API Specification

```
POST /api/budgets/{budgetId}/income
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "bankAccountId": "uuid"
}

Success Response (201):
{
  "id": "uuid",
  "budgetId": "uuid",
  "name": "string",
  "amount": "decimal",
  "bankAccount": {
    "id": "uuid",
    "name": "string",
    "currentBalance": "decimal"
  },
  "createdAt": "datetime"
}

Error Response (400):
{
  "error": "Cannot modify locked budget"
}

Error Response (400):
{
  "error": "Bank account not found or deleted"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Create `BudgetIncome` entity: id, budgetId, bankAccountId, name, amount, createdAt

2. **Repository Implementation**

   - Create `BudgetIncomeRepository` extending JpaRepository
   - Add query: `findAllByBudgetId(UUID budgetId)`

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to save budget income
     - Method to get budget by id
     - Method to get bank account by id
   - Implement in `DataService`
   - **Update `isAccountLinkedToUnlockedBudget` method:**
     - Remove TODO comment from Story 5
     - Implement check: query if account is used in any BudgetIncome where budget.status = UNLOCKED
     - Add to `BudgetIncomeRepository`: query to check if account is used in income for unlocked budgets
     - This method will be further updated in Stories 15 and 18 to also check expenses and savings

4. **DTOs and Extensions**

   - Add to `BudgetDtos.java`:
     - `CreateBudgetIncomeRequest` record
     - `BudgetIncomeResponse` record (with nested bank account)
   - Update `BudgetExtensions.java` with income mapping methods

5. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to add income to budget
   - Implement in `DomainService`:
     - Validate budget exists and is unlocked
     - Validate bank account exists and not deleted
     - Validate amount is positive
     - Validate name not empty
     - Create income item
     - Return DTO
   - Add custom exceptions: `BudgetLockedException`, `InvalidBankAccountException`

6. **Controller Implementation**

   - Add POST /api/budgets/{budgetId}/income endpoint to `BudgetController`

7. **Integration Tests**
   - Test successful creation
   - Test locked budget rejection
   - Test invalid bank account
   - Test deleted bank account rejection
   - Test negative amount rejection
   - Test empty name rejection
   - Test that bank account used in unlocked budget income cannot be deleted (verifies Story 5 constraint now works)

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Validation comprehensive
- Code reviewed and approved

---

# Story 13: Update Income in Budget

**As a** user
**I want to** update income items in my budget
**So that** I can correct amounts or details

## Acceptance Criteria

- Can update income in unlocked budgets only
- Can update name, amount, and bank account
- Amount must remain positive
- Updates budget totals immediately

## API Specification

```
PUT /api/budgets/{budgetId}/income/{id}
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "bankAccountId": "uuid"
}

Success Response (200):
{
  "id": "uuid",
  "budgetId": "uuid",
  "name": "string",
  "amount": "decimal",
  "bankAccount": {
    "id": "uuid",
    "name": "string"
  },
  "createdAt": "datetime",
  "updatedAt": "datetime"
}

Error Response (400):
{
  "error": "Cannot modify items in locked budget"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Add `updatedAt` field to BudgetIncome

2. **DTOs**

   - Add to `BudgetDtos.java`:
     - `UpdateBudgetIncomeRequest` record

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get budget income by id
   - Implement in `DataService`

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update budget income
   - Implement in `DomainService`:
     - Validate income item exists
     - Validate budget is unlocked
     - Validate bank account if changed
     - Update only provided fields
     - Return DTO

5. **Controller Implementation**

   - Add PUT /api/budgets/{budgetId}/income/{id} endpoint

6. **Integration Tests**
   - Test successful update
   - Test locked budget rejection
   - Test partial updates
   - Test validation

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 14: Delete Income from Budget

**As a** user
**I want to** delete income items from my budget
**So that** I can remove incorrect entries

## Acceptance Criteria

- Can delete from unlocked budgets only
- Hard delete (immediate removal)
- Updates budget totals immediately

## API Specification

```
DELETE /api/budgets/{budgetId}/income/{id}

Success Response (204): No Content

Error Response (400):
{
  "error": "Cannot modify items in locked budget"
}
```

## Technical Implementation

1. **Data Service Layer**

   - Add to `IDataService`:
     - Method to delete budget income by id
   - Implement in `DataService`

2. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to delete budget income
   - Implement in `DomainService`:
     - Validate income exists
     - Validate budget is unlocked
     - Delete income record

3. **Controller Implementation**

   - Add DELETE /api/budgets/{budgetId}/income/{id} endpoint

4. **Integration Tests**
   - Test successful deletion
   - Test locked budget rejection

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 15: Add Expense to Budget

**As a** user
**I want to** add expense items to my monthly budget
**So that** I can track planned expenditures and bills

## Acceptance Criteria

- Can add expenses to unlocked budgets only
- Must specify name, amount, and bank account
- Can mark as needing manual payment
- Can set optional deduction date
- Can link to recurring expense template
- Amount must be positive
- Bank account must exist and not be deleted

## API Specification

```
POST /api/budgets/{budgetId}/expenses
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "bankAccountId": "uuid",
  "recurringExpenseId": "uuid" (optional),
  "deductedAt": "date" (optional),
  "isManual": "boolean"
}

Success Response (201):
{
  "id": "uuid",
  "budgetId": "uuid",
  "name": "string",
  "amount": "decimal",
  "bankAccount": {
    "id": "uuid",
    "name": "string",
    "currentBalance": "decimal"
  },
  "recurringExpenseId": "uuid",
  "deductedAt": "date",
  "isManual": "boolean",
  "createdAt": "datetime"
}

Error Response (400):
{
  "error": "Cannot modify locked budget"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Create `BudgetExpense` entity: id, budgetId, name, amount, bankAccountId, recurringExpenseId, deductedAt, isManual, createdAt

2. **Repository Implementation**

   - Create `BudgetExpenseRepository` extending JpaRepository
   - Add query: `findAllByBudgetId(UUID budgetId)`

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to save budget expense
     - Method to get recurring expense by id (for validation)
   - Implement in `DataService`
   - **Update `isAccountLinkedToUnlockedBudget` method:**
     - Extend existing implementation from Story 12
     - Also check if account is used in any BudgetExpense where budget.status = UNLOCKED
     - Add to `BudgetExpenseRepository`: query to check if account is used in expenses for unlocked budgets
     - Method should now return true if account is in either income OR expenses for unlocked budgets

4. **DTOs and Extensions**

   - Add to `BudgetDtos.java`:
     - `CreateBudgetExpenseRequest` record
     - `BudgetExpenseResponse` record
   - Update `BudgetExtensions.java` with expense mapping methods

5. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to add expense to budget
   - Implement in `DomainService`:
     - Validate budget exists and is unlocked
     - Validate bank account exists and not deleted
     - Validate recurring expense exists if provided
     - Validate amount is positive
     - Create expense item
     - Return DTO

6. **Controller Implementation**

   - Add POST /api/budgets/{budgetId}/expenses endpoint

7. **Integration Tests**
   - Test successful creation
   - Test locked budget rejection
   - Test invalid bank account
   - Test recurring expense link
   - Test optional date handling
   - Test that bank account used in unlocked budget expense cannot be deleted (verifies Story 5 constraint)

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Date handling implemented
- Code reviewed and approved

---

# Story 16: Update Expense in Budget

**As a** user
**I want to** update expense items in my budget
**So that** I can adjust amounts or payment details

## Acceptance Criteria

- Can update expenses in unlocked budgets only
- Can update name, amount, bank account, payment flags, and date
- Amount must remain positive
- Updates budget totals immediately

## API Specification

```
PUT /api/budgets/{budgetId}/expenses/{id}
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "bankAccountId": "uuid",
  "deductedAt": "date",
  "isManual": "boolean"
}

Success Response (200):
{
  "id": "uuid",
  "budgetId": "uuid",
  "name": "string",
  "amount": "decimal",
  "bankAccount": {
    "id": "uuid",
    "name": "string"
  },
  "recurringExpenseId": "uuid",
  "deductedAt": "date",
  "isManual": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}

Error Response (400):
{
  "error": "Cannot modify items in locked budget"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Add `updatedAt` field to BudgetExpense

2. **DTOs**

   - Add to `BudgetDtos.java`:
     - `UpdateBudgetExpenseRequest` record

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get budget expense by id
   - Implement in `DataService`

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update budget expense
   - Implement in `DomainService`:
     - Validate expense exists
     - Validate budget is unlocked
     - Validate new bank account if changed
     - Update fields
     - Return DTO

5. **Controller Implementation**

   - Add PUT /api/budgets/{budgetId}/expenses/{id} endpoint

6. **Integration Tests**
   - Test successful update
   - Test locked budget rejection
   - Test bank account validation
   - Test partial updates

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 17: Delete Expense from Budget

**As a** user
**I want to** delete expense items from my budget
**So that** I can remove unnecessary expenses

## Acceptance Criteria

- Can delete from unlocked budgets only
- Hard delete (immediate removal)
- Does not affect recurring expense template
- Updates budget totals immediately

## API Specification

```
DELETE /api/budgets/{budgetId}/expenses/{id}

Success Response (204): No Content

Error Response (400):
{
  "error": "Cannot modify items in locked budget"
}
```

## Technical Implementation

1. **Data Service Layer**

   - Add to `IDataService`:
     - Method to delete budget expense by id
   - Implement in `DataService`

2. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to delete budget expense
   - Implement in `DomainService`:
     - Validate expense exists
     - Validate budget is unlocked
     - Delete expense record

3. **Controller Implementation**

   - Add DELETE /api/budgets/{budgetId}/expenses/{id} endpoint

4. **Integration Tests**
   - Test successful deletion
   - Test locked budget rejection
   - Test recurring expense unaffected

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 18: Add Savings to Budget

**As a** user
**I want to** allocate money to savings in my budget
**So that** I can plan for future financial goals

## Acceptance Criteria

- Can add savings to unlocked budgets only
- Must specify name, amount, and bank account
- Amount must be positive
- Bank account must exist and not be deleted
- Updates budget totals immediately

## API Specification

```
POST /api/budgets/{budgetId}/savings
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "bankAccountId": "uuid"
}

Success Response (201):
{
  "id": "uuid",
  "budgetId": "uuid",
  "name": "string",
  "amount": "decimal",
  "bankAccount": {
    "id": "uuid",
    "name": "string",
    "currentBalance": "decimal"
  },
  "createdAt": "datetime"
}

Error Response (400):
{
  "error": "Cannot modify locked budget"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Create `BudgetSavings` entity: id, budgetId, bankAccountId, name, amount, createdAt

2. **Repository Implementation**

   - Create `BudgetSavingsRepository` extending JpaRepository
   - Add query: `findAllByBudgetId(UUID budgetId)`

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to save budget savings
   - Implement in `DataService`
   - **Update `isAccountLinkedToUnlockedBudget` method:**
     - Extend existing implementation from Stories 12 and 15
     - Also check if account is used in any BudgetSavings where budget.status = UNLOCKED
     - Add to `BudgetSavingsRepository`: query to check if account is used in savings for unlocked budgets
     - Method should now return true if account is in income OR expenses OR savings for unlocked budgets
     - This completes the implementation started in Story 5

4. **DTOs and Extensions**

   - Add to `BudgetDtos.java`:
     - `CreateBudgetSavingsRequest` record
     - `BudgetSavingsResponse` record
   - Update `BudgetExtensions.java` with savings mapping methods

5. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to add savings to budget
   - Implement in `DomainService`:
     - Validate budget exists and is unlocked
     - Validate bank account exists and not deleted
     - Validate amount is positive
     - Create savings item
     - Return DTO

6. **Controller Implementation**

   - Add POST /api/budgets/{budgetId}/savings endpoint

7. **Integration Tests**
   - Test successful creation
   - Test locked budget rejection
   - Test invalid bank account
   - Test negative amount rejection
   - Test that bank account used in unlocked budget savings cannot be deleted (verifies Story 5 constraint)
   - Test that locked budget does not prevent account deletion (only unlocked budgets should prevent deletion)

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 19: Update Savings in Budget

**As a** user
**I want to** update savings allocations in my budget
**So that** I can adjust my savings goals

## Acceptance Criteria

- Can update savings in unlocked budgets only
- Can update name, amount, and bank account
- Amount must remain positive
- Updates budget totals immediately

## API Specification

```
PUT /api/budgets/{budgetId}/savings/{id}
Request Body:
{
  "name": "string",
  "amount": "decimal",
  "bankAccountId": "uuid"
}

Success Response (200):
{
  "id": "uuid",
  "budgetId": "uuid",
  "name": "string",
  "amount": "decimal",
  "bankAccount": {
    "id": "uuid",
    "name": "string"
  },
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Add `updatedAt` field to BudgetSavings

2. **DTOs**

   - Add to `BudgetDtos.java`:
     - `UpdateBudgetSavingsRequest` record

3. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get budget savings by id
   - Implement in `DataService`

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update budget savings
   - Implement in `DomainService`:
     - Validate savings exists
     - Validate budget is unlocked
     - Update only provided fields
     - Return DTO

5. **Controller Implementation**

   - Add PUT /api/budgets/{budgetId}/savings/{id} endpoint

6. **Integration Tests**
   - Test successful update
   - Test locked budget rejection
   - Test partial updates
   - Test validation

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 20: Delete Savings from Budget

**As a** user
**I want to** delete savings items from my budget
**So that** I can remove unnecessary allocations

## Acceptance Criteria

- Can delete from unlocked budgets only
- Hard delete (immediate removal)
- Updates budget totals immediately

## API Specification

```
DELETE /api/budgets/{budgetId}/savings/{id}

Success Response (204): No Content

Error Response (400):
{
  "error": "Cannot modify items in locked budget"
}
```

## Technical Implementation

1. **Data Service Layer**

   - Add to `IDataService`:
     - Method to delete budget savings by id
   - Implement in `DataService`

2. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to delete budget savings
   - Implement in `DomainService`:
     - Validate savings exists
     - Validate budget is unlocked
     - Delete savings record

3. **Controller Implementation**

   - Add DELETE /api/budgets/{budgetId}/savings/{id} endpoint

4. **Integration Tests**
   - Test successful deletion
   - Test locked budget rejection

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 21: View Budget Details

**As a** user
**I want to** view complete details of a specific budget
**So that** I can see all income, expenses, and savings items

## Acceptance Criteria

- Returns full budget details including all items
- Groups items by type (income, expenses, savings)
- Shows running totals and final balance
- Includes metadata about creation and locking
- Shows linked bank accounts for each item

## API Specification

```
GET /api/budgets/{id}

Success Response (200):
{
  "id": "uuid",
  "month": "integer",
  "year": "integer",
  "status": "UNLOCKED|LOCKED",
  "createdAt": "datetime",
  "lockedAt": "datetime",
  "income": [
    {
      "id": "uuid",
      "name": "string",
      "amount": "decimal",
      "bankAccount": {
        "id": "uuid",
        "name": "string"
      }
    }
  ],
  "expenses": [
    {
      "id": "uuid",
      "name": "string",
      "amount": "decimal",
      "bankAccount": {
        "id": "uuid",
        "name": "string"
      },
      "recurringExpenseId": "uuid",
      "deductedAt": "date",
      "isManual": "boolean"
    }
  ],
  "savings": [
    {
      "id": "uuid",
      "name": "string",
      "amount": "decimal",
      "bankAccount": {
        "id": "uuid",
        "name": "string"
      }
    }
  ],
  "totals": {
    "income": "decimal",
    "expenses": "decimal",
    "savings": "decimal",
    "balance": "decimal"
  }
}

Error Response (404):
{
  "error": "Budget not found"
}
```

## Technical Implementation

1. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get budget by id with all related items
     - Methods to load income, expenses, savings for a budget
   - Implement in `DataService` (optimize to avoid N+1 queries)

2. **DTOs**

   - Add to `BudgetDtos.java`:
     - `BudgetDetailResponse` record with nested lists
     - Item response records with nested bank account info

3. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to get budget details
   - Implement in `DomainService`:
     - Validate budget exists
     - Load all related items efficiently from IDataService
     - Calculate totals
     - Group items by type
     - Return comprehensive DTO

4. **Controller Implementation**

   - Add GET /api/budgets/{id} endpoint

5. **Integration Tests**
   - Test successful retrieval
   - Test complete data loading
   - Test totals calculation
   - Test non-existent budget

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- N+1 queries avoided
- Code reviewed and approved

---

# Story 22: Delete Unlocked Budget

**As a** user
**I want to** delete an unlocked budget
**So that** I can remove budgets created by mistake

## Acceptance Criteria

- Can only delete unlocked budgets
- Hard delete (immediate removal)
- Cascades to delete all budget items (income, expenses, savings)
- Cannot delete locked budgets

## API Specification

```
DELETE /api/budgets/{id}

Success Response (204): No Content

Error Response (400):
{
  "error": "Cannot delete locked budget. Unlock it first."
}

Error Response (404):
{
  "error": "Budget not found"
}
```

## Technical Implementation

1. **Data Service Layer**

   - Add to `IDataService`:
     - Method to delete budget by id (with cascade)
   - Implement in `DataService`

2. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to delete budget
   - Implement in `DomainService`:
     - Validate budget exists
     - Validate budget is unlocked
     - Delete budget (cascade handled by JPA)
   - Add custom exception: `CannotDeleteLockedBudgetException`

3. **Controller Implementation**

   - Add DELETE /api/budgets/{id} endpoint

4. **Integration Tests**
   - Test successful deletion
   - Test locked budget rejection
   - Test cascade deletion of income/expenses/savings
   - Test ability to create new budget for same month/year

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Cascade rules documented
- Code reviewed and approved

---

# Story 23: Transfer Calculation Utility (NEW)

**As a** system
**I want to** calculate optimal money transfers between accounts
**So that** todo generation and balance updates use identical logic

## Acceptance Criteria

- Given a budget with income/expenses/savings, calculates net position per account
- Identifies deficit accounts (need money) and surplus accounts (have money)
- Generates minimum number of transfers to balance all accounts
- Returns structured transfer plan (from_account, to_account, amount)
- Pure utility functions with no side effects or database access
- Handles edge cases: single account, zero transfers, negative balances

## Data Structure

```java
public class TransferPlan {
    private UUID fromAccountId;
    private UUID toAccountId;
    private BigDecimal amount;

    // constructor, getters
}

public class AccountNetPosition {
    private UUID accountId;
    private BigDecimal netAmount; // positive = surplus, negative = deficit

    // constructor, getters
}
```

## Algorithm Overview

```
1. Calculate net position per account:
   For each account:
     netPosition = income_to_account
                   - expenses_from_account
                   - savings_from_account

2. Separate accounts into:
   - Surplus accounts (netPosition > 0)
   - Deficit accounts (netPosition < 0)

3. Generate transfers:
   While deficit accounts exist:
     - Pick largest deficit account
     - Pick largest surplus account
     - Transfer min(surplus, deficit) between them
     - Update both accounts' positions
     - Remove accounts with 0 position

4. Return List<TransferPlan>
```

## Technical Implementation

1. **Utility Class**

   - Create `TransferCalculationUtils` final class in `domain/utils/` package
   - Make constructor private to prevent instantiation
   - Implement static methods:
     - `calculateTransfers(Budget budget, List<BudgetIncome> income, List<BudgetExpense> expenses, List<BudgetSavings> savings)` returns `List<TransferPlan>`
     - `calculateAccountNetPositions(...)` returns `List<AccountNetPosition>` (helper method)
   - Pure functions - take all needed data as parameters, no database access

2. **Unit Tests (CRITICAL)**

   - Test Case 1: Simple two-account transfer
     - Account A: +$1000, Account B: -$1000
     - Expected: 1 transfer, A→B, $1000

   - Test Case 2: Three accounts with multiple transfers
     - Account A: +$1500, Account B: -$800, Account C: -$700
     - Expected: 2 transfers (A→B $800, A→C $700)

   - Test Case 3: Complex example
     - Account A: $500 income, $100 expenses = +$400 net
     - Account B: $0 income, $200 savings = -$200 net
     - Account C: $0 income, $200 expenses = -$200 net
     - Expected: A→B $200, A→C $200

   - Test Case 4: Zero transfers needed
     - Account A: +$1000 income, -$1000 expenses = $0 net
     - Expected: Empty transfer list

   - Test Case 5: Single account
     - Account A: +$1000, -$1000 (balanced on same account)
     - Expected: Empty transfer list

   - Test Case 6: Multiple accounts with complex balancing
     - Test with 5+ accounts to ensure algorithm scales

3. **Domain Service Integration**
   - DomainService will call `TransferCalculationUtils.calculateTransfers(...)` when needed
   - Pass in budget data loaded from IDataService
   - Use results for todo generation and balance updates

## Definition of Done

- All acceptance criteria met
- Minimum 6 unit test cases passing
- Algorithm documented with comments explaining logic
- Pure functions (no side effects, no database access)
- Code reviewed and approved
- **THIS MUST BE COMPLETED BEFORE STORIES 24-26**

---

# Story 24: Lock Budget

**As a** user
**I want to** lock a completed budget
**So that** it's finalized and prohibits accidental changes

## Acceptance Criteria

- Budget must have zero balance (income - expenses - savings = 0)
- Cannot lock already locked budget
- Sets status to LOCKED and records lockedAt timestamp
- Updates `lastUsedDate` and `lastUsedBudgetId` on recurring expense templates referenced by budget expenses
- Locking is atomic (all-or-nothing transaction)

## API Specification

```
PUT /api/budgets/{id}/lock

Success Response (200):
{
  "id": "uuid",
  "month": "integer",
  "year": "integer",
  "status": "LOCKED",
  "lockedAt": "datetime",
  "totals": {
    "income": "decimal",
    "expenses": "decimal",
    "savings": "decimal",
    "balance": "decimal"
  }
}

Error Response (400):
{
  "error": "Budget must have zero balance. Current balance: 250.00"
}

Error Response (400):
{
  "error": "Budget is already locked"
}
```

## Domain Model Changes

- Add `lastUsedBudgetId` field to `RecurringExpense` entity (UUID, nullable)
  - Tracks which budget last used this recurring expense template
  - Used during unlock to restore previous lastUsedDate

## Technical Implementation

1. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to lock budget
   - Implement in `DomainService`:
     - Validate budget exists and is unlocked
     - Calculate total balance using IDataService
     - Verify balance equals zero (use BigDecimal.ZERO.compareTo())
     - Begin transaction
     - Update budget status to LOCKED
     - Set lockedAt timestamp
     - Save budget via IDataService
     - Commit transaction
     - Return DTO
   - Add custom exceptions: `BudgetNotBalancedException`, `BudgetAlreadyLockedException`

2. **Data Service Layer**

   - Add to `IDataService`:
     - Methods to calculate budget totals (sum income, expenses, savings)
     - Method to get all budget expenses for a budget
     - Method to get recurring expense by id
     - Method to save recurring expense
   - Implement in `DataService`

3. **Recurring Expense Update Logic**

   - Add to `IDomainService`:
     - Method to update recurring expenses for budget (called during lock)
   - Implement in `DomainService`:
     - **updateRecurringExpensesForBudget(UUID budgetId, LocalDateTime lockedAt)**:
       - Load all budget expenses for this budget from IDataService
       - Filter to only those with non-null `recurringExpenseId`
       - Get unique set of recurring expense IDs
       - For each unique recurring expense:
         - Load recurring expense from IDataService
         - Update `lastUsedDate` to budget's `lockedAt` timestamp
         - Update `lastUsedBudgetId` to this budget's id
         - Save recurring expense via IDataService
   - Integration with `lockBudget()` method:
     - After todo list generation (Story 25)
     - After balance updates (Story 26)
     - Before committing transaction
     - Call `updateRecurringExpensesForBudget(budgetId, lockedAt)`
     - If update fails, rollback entire transaction

4. **Controller Implementation**

   - Add PUT /api/budgets/{id}/lock endpoint

5. **Integration Tests**
   - Test successful locking (balanced budget)
   - Test non-zero balance rejection
   - Test already locked budget rejection
   - Test transaction rollback on failure
   - Test lockedAt timestamp is set correctly
   - Test recurring expense lastUsedDate and lastUsedBudgetId are updated when budget with linked expenses is locked
   - Test multiple budgets locking with same recurring expense (latest lock wins)

## Definition of Done

- All acceptance criteria met
- Transaction handling tested
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 25: Generate Todo List on Lock

**As a** system process
**I want to** automatically generate a todo list when a budget is locked
**So that** users have clear action items for the month

## Acceptance Criteria

- Triggered automatically during budget lock (part of lock transaction)
- Creates TRANSFER todos for money movements between accounts
- Creates PAYMENT todos for manually paid expenses
- Uses TransferCalculationUtils for transfer logic
- A todo list is linked to exactly one budget
- Deletes existing todo list before generating new one (if relocking after unlock)

## Todo Generation Logic

1. Use `TransferCalculationUtils.calculateTransfers(...)` to get transfers
2. For each transfer, create TRANSFER todo item
3. For each expense where `isManual = true`, create PAYMENT todo item

## API Specification

```
GET /api/budgets/{budgetId}/todo-list

Success Response (200):
{
  "id": "uuid",
  "budgetId": "uuid",
  "createdAt": "datetime",
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "status": "PENDING|COMPLETED",
      "type": "PAYMENT|TRANSFER",
      "amount": "decimal",
      "fromAccount": {
        "id": "uuid",
        "name": "string"
      },
      "toAccount": {
        "id": "uuid",
        "name": "string"
      },
      "createdAt": "datetime",
      "completedAt": "datetime"
    }
  ],
  "summary": {
    "totalItems": "integer",
    "pendingItems": "integer",
    "completedItems": "integer"
  }
}

Error Response (404):
{
  "error": "Todo list not found for this budget"
}
```

## Technical Implementation

1. **Domain Model Changes**

   - Create `TodoList` entity: id, budgetId, createdAt
   - Create `TodoItem` entity: id, todoListId, name, status (enum: PENDING/COMPLETED), type (enum: PAYMENT/TRANSFER), fromAccountId, toAccountId (nullable for PAYMENT), amount, createdAt, completedAt
   - Create `TodoItemStatus` enum: PENDING, COMPLETED
   - Create `TodoItemType` enum: PAYMENT, TRANSFER

2. **Repository Implementation**

   - Create `TodoListRepository` extending JpaRepository
   - Add queries: `findByBudgetId(UUID budgetId)`, `deleteByBudgetId(UUID budgetId)`
   - Create `TodoItemRepository` extending JpaRepository
   - Add query: `findAllByTodoListId(UUID todoListId)`

3. **Data Service Layer**

   - Add to `IDataService`:
     - Methods to save/delete todo list
     - Methods to save todo items
     - Method to get todo list by budget id
     - Method to get all items for a todo list
   - Implement in `DataService`

4. **DTOs and Extensions**

   - Create `TodoDtos.java` with:
     - `TodoListResponse` record
     - `TodoItemResponse` record with nested account details
     - `TodoSummaryResponse` record
   - Create `TodoExtensions.java` with mapping methods

5. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to generate todo list (called during lock)
     - Method to get todo list for budget
   - Implement in `DomainService`:
     - **generateTodoList(UUID budgetId)**:
       - Delete existing todo list for budget if exists (via IDataService)
       - Create new TodoList entity
       - Load budget income, expenses, savings from IDataService
       - Call `TransferCalculationUtils.calculateTransfers(...)` to get transfers
       - For each transfer: create TRANSFER todo item
       - For each manual expense: create PAYMENT todo item
       - Save all entities via IDataService
     - **getTodoList(UUID budgetId)**:
       - Load todo list and items from IDataService
       - Calculate summary statistics
       - Return DTO

6. **Integration with Budget Lock**

   - Modify `DomainService.lockBudget()`:
     - After validating balance = 0
     - Before committing transaction
     - Call internal `generateTodoList(budgetId)` method
     - If todo generation fails, rollback entire lock transaction

7. **Controller Implementation**

   - Add GET /api/budgets/{budgetId}/todo-list endpoint to `BudgetController`

8. **Integration Tests**
   - Test todo list generation on budget lock
   - Test PAYMENT items for manual expenses
   - Test TRANSFER items match TransferCalculationUtils output
   - Test summary calculations
   - Test deletion of existing todo list on relock

## Definition of Done

- All acceptance criteria met
- Unit tests for todo generation logic
- Integration tests passing
- API documentation updated
- Transaction handling verified
- Code reviewed and approved

---

# Story 26: Update Account Balances on Lock

**As a** system process
**I want to** automatically update bank account balances when a budget is locked
**So that** account balances reflect savings allocations

## Acceptance Criteria

- Triggered automatically during budget lock (part of same transaction)
- Updates `currentBalance` on each affected bank account
- Creates `BalanceHistory` entries with source='AUTOMATIC' and budgetId set
- Account balances increase by savings allocated to that account
- Updates are atomic (all succeed or all fail)
- Can be reversed when budget is unlocked
- Income and expenses do NOT affect account balances (they cancel out in the budget)

## Balance Update Logic

```
For each bank account that has savings allocated:
  1. Get current balance
  2. Calculate total savings for this account: SUM(savings where bankAccountId = account.id)
  3. new_balance = current_balance + total_savings
  4. Update account's currentBalance
  5. Create BalanceHistory entry with:
     - source = AUTOMATIC
     - budgetId = {budgetId}
     - changeAmount = total_savings
     - balance = new_balance
     - comment = "Budget lock for {Month Year}"
```

## Example

```
Starting State:
- Account A: balance = $500
- Account B: balance = $300
- Account C: balance = $1000

Budget (balanced):
Income:
- Account A: $500
Total Income: $500

Expenses:
- Account B: $100
- Account C: $100
Total Expenses: $200

Savings:
- Account A: $100
- Account B: $100
- Account C: $100
Total Savings: $300

Budget Balance Check: $500 - $200 - $300 = $0 ✓

Balance Updates (ONLY savings affect balances):
- Account A: $500 + $100 = $600
- Account B: $300 + $100 = $400
- Account C: $1000 + $100 = $1100
```

## Technical Implementation

1. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update balances for budget (called during lock)
   - Implement in `DomainService`:
     - **updateBalancesForBudget(UUID budgetId)**:
       - Load budget from IDataService
       - Load all savings items for this budget from IDataService
       - Group savings by bankAccountId and sum amounts
       - For each account with savings:
         - Load bank account from IDataService
         - Calculate change amount: SUM(savings for this account)
         - Calculate new balance: current_balance + change_amount
         - Update account.currentBalance
         - Create BalanceHistory entry:
           - source = AUTOMATIC
           - budgetId = {budgetId}
           - changeAmount = total savings for account
           - balance = new balance after savings
           - changeDate = now
           - comment = "Budget lock for {Month}/{Year}"
         - Save account and history via IDataService

2. **Data Service Layer**

   - Methods already exist from previous stories:
     - Get budget by id
     - Get all savings for budget
     - Get bank account by id
     - Save bank account
     - Save balance history

3. **Integration with Budget Lock**

   - Modify `DomainService.lockBudget()` method:
     - After todo list generation (Story 25)
     - Before committing transaction
     - Call internal `updateBalancesForBudget(budgetId)` method
     - If balance update fails, rollback entire transaction

4. **Integration Tests**
   - Test balance updates on budget lock
   - Test BalanceHistory entries created with correct source and budgetId
   - Test final balances match: old_balance + savings
   - Test accounts without savings are not affected
   - Test transaction rollback on failure
   - Test the example scenario above
   - Test with multiple savings items to same account (should sum correctly)

## Definition of Done

- All acceptance criteria met
- Balance calculation logic is simple: current + savings only
- Integration tests passing with example scenario
- Transaction handling verified
- budgetId properly set on history entries
- Code reviewed and approved

---

# Story 27: Unlock Budget

**As a** user
**I want to** unlock a previously locked budget
**So that** I can make corrections if needed

## Acceptance Criteria

- Can only unlock the most recent budget (by year DESC, month DESC)
- Unlocking reverses all automatic balance updates for this budget
- Reversal simply subtracts savings that were added during lock
- Restores `lastUsedDate` and `lastUsedBudgetId` on recurring expense templates to previous locked budget state
- Deletes associated todo list
- Clears lockedAt timestamp
- Sets status back to UNLOCKED
- All reversals in single transaction

## API Specification

```
PUT /api/budgets/{id}/unlock

Success Response (200):
{
  "id": "uuid",
  "month": "integer",
  "year": "integer",
  "status": "UNLOCKED",
  "lockedAt": null
}

Error Response (400):
{
  "error": "Only the most recent budget can be unlocked"
}

Error Response (400):
{
  "error": "Budget is not locked"
}
```

## Balance Reversal Logic

```
For each BalanceHistory entry with:
  - source = AUTOMATIC
  - budgetId = {this budget's id}

Do:
  1. Load the associated bank account
  2. Subtract the change amount that was added:
     account.currentBalance = account.currentBalance - history.changeAmount
  3. Save the account
  4. Delete the history entry
```

## Recurring Expense Reversal Logic

```
For each recurring expense where lastUsedBudgetId == this budget's id:
  1. Find all OTHER locked budgets that have expenses linking to this recurring expense
  2. Order by year DESC, month DESC (most recent first)
  3. Filter out the current budget being unlocked
  4. If a previous locked budget found:
     - Set lastUsedDate to that budget's lockedAt timestamp
     - Set lastUsedBudgetId to that budget's id
  5. If no previous locked budget found:
     - Set lastUsedDate to null
     - Set lastUsedBudgetId to null
  6. Save recurring expense
```

**Query Logic:**
```java
// Find previous locked budget that used this recurring expense
// Join: Budget -> BudgetExpense -> RecurringExpense
// Filter: budget.status = LOCKED AND budgetExpense.recurringExpenseId = {recurringExpenseId}
// Order: year DESC, month DESC
// Exclude: current budget being unlocked
// Take first result (most recent)
```

## Technical Implementation

1. **Repository Implementation**

   - Add to `BudgetRepository`:
     - Custom query to find most recent budget (ORDER BY year DESC, month DESC LIMIT 1)
     - Custom query to find locked budgets that use a specific recurring expense, ordered by year DESC, month DESC
   - Add to `BalanceHistoryRepository`:
     - `findAllByBudgetId(UUID budgetId)`
     - `deleteAllByBudgetId(UUID budgetId)`
   - Add to `BudgetExpenseRepository`:
     - Query to find all budget expenses with a specific recurringExpenseId

2. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get most recent budget
     - Method to get all balance history entries by budget id
     - Method to delete balance history entries by budget id
     - Method to delete todo list by budget id
     - Method to get all budget expenses for this budget
     - Method to find locked budgets using a specific recurring expense (ordered by year DESC, month DESC)
     - Method to get recurring expense by id
     - Method to save recurring expense
   - Implement in `DataService`

3. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to unlock budget
     - Method to restore recurring expenses for budget (called during unlock)
   - Implement in `DomainService`:
     - Validate budget exists and is locked
     - Get most recent budget from IDataService
     - Validate this is the most recent budget (compare ids)
     - Begin transaction:
       - **Reverse balance changes:**
         - Find all AUTOMATIC balance history entries with budgetId = {id}
         - For each history entry:
           - Load associated bank account from IDataService
           - Reverse the balance change:
             - account.currentBalance -= history.changeAmount
           - Save account via IDataService
         - Delete all balance history entries for this budget
       - **Restore recurring expenses:**
         - Load all budget expenses for this budget from IDataService
         - Get unique set of recurring expense IDs that have non-null recurringExpenseId
         - For each unique recurring expense ID:
           - Load recurring expense from IDataService
           - Check if lastUsedBudgetId == this budget's id (only restore if this budget was the last to use it)
           - If yes:
             - Find previous locked budget using this recurring expense (via IDataService query)
             - Filter out current budget being unlocked
             - If previous budget found:
               - Set lastUsedDate = previous budget's lockedAt
               - Set lastUsedBudgetId = previous budget's id
             - Else (no previous budget):
               - Set lastUsedDate = null
               - Set lastUsedBudgetId = null
             - Save recurring expense via IDataService
       - Delete todo list for this budget via IDataService
       - Update budget status to UNLOCKED
       - Set lockedAt = null
       - Save budget via IDataService
     - Commit transaction
     - Return DTO
   - Add custom exceptions: `NotMostRecentBudgetException`, `BudgetNotLockedException`

4. **Controller Implementation**

   - Add PUT /api/budgets/{id}/unlock endpoint

5. **Integration Tests**
   - Test successful unlocking of most recent budget
   - Test non-most-recent budget rejection (create 2 budgets, lock both, try to unlock older one)
   - Test already unlocked budget rejection
   - Test balance reversals restore exact original balances
   - Test todo list deletion
   - Test transaction rollback on failure
   - Test can lock again after unlock (and balances work correctly)
   - Test with the same example from Story 26:
     - Lock: A: 500→600, B: 300→400, C: 1000→1100
     - Unlock: A: 600→500, B: 400→300, C: 1100→1000
   - **Recurring expense restore tests:**
     - Test lastUsedDate restored to previous locked budget when unlocking
     - Test lastUsedDate set to null when no other locked budgets use the template
     - Test sequence: Lock Jan (using template X), Lock Feb (using template X), Lock Mar (using template X), Unlock Mar → verify lastUsedDate = Feb's lockedAt timestamp
     - Test that unlocking doesn't affect recurring expenses used by other locked budgets (lastUsedBudgetId mismatch)
     - Test can lock again after unlock and recurring expense lastUsedDate updates correctly

## Definition of Done

- All acceptance criteria met
- Transaction handling tested thoroughly
- Integration tests passing
- API documentation updated
- Reversal logic verified: simply subtracts the savings that were added
- Recurring expense restore logic verified: restores to previous locked budget or null
- Code reviewed and approved

---

# Story 28: Mark Todo Item Complete

**As a** user
**I want to** mark todo items as completed
**So that** I can track what has been done

## Acceptance Criteria

- Can toggle between PENDING and COMPLETED status
- Records completedAt timestamp when marked complete
- Clears completedAt when marked pending
- Can only update todos for locked budgets

## API Specification

```
PUT /api/budgets/{budgetId}/todo-list/items/{id}
Request Body:
{
  "status": "PENDING|COMPLETED"
}

Success Response (200):
{
  "id": "uuid",
  "name": "string",
  "status": "COMPLETED",
  "type": "PAYMENT|TRANSFER",
  "amount": "decimal",
  "fromAccount": {
    "id": "uuid",
    "name": "string"
  },
  "toAccount": {
    "id": "uuid",
    "name": "string"
  },
  "completedAt": "datetime",
  "createdAt": "datetime"
}

Error Response (404):
{
  "error": "Todo item not found"
}
```

## Technical Implementation

1. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get todo item by id
     - Method to save todo item
   - Implement in `DataService`

2. **DTOs**

   - Add to `TodoDtos.java`:
     - `UpdateTodoItemRequest` record

3. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to update todo item status
   - Implement in `DomainService`:
     - Validate todo item exists
     - Validate associated budget is locked
     - Update status
     - If status = COMPLETED: set completedAt = now
     - If status = PENDING: set completedAt = null
     - Save via IDataService
     - Return DTO

4. **Controller Implementation**

   - Add PUT /api/budgets/{budgetId}/todo-list/items/{id} endpoint

5. **Integration Tests**
   - Test marking item complete
   - Test marking item pending
   - Test completedAt timestamp handling
   - Test status toggle multiple times

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Code reviewed and approved

---

# Story 29: View Balance History

**As a** user
**I want to** view balance history for any account
**So that** I can track financial changes over time

## Acceptance Criteria

- Shows all balance changes chronologically
- Includes manual and automatic updates
- Differentiates between MANUAL and AUTOMATIC sources
- Paginated for performance (20 items per page default)
- Sorted by date descending (newest first)

## API Specification

```
GET /api/bank-accounts/{id}/balance-history?page=0&size=20

Success Response (200):
{
  "content": [
    {
      "id": "uuid",
      "balance": "decimal",
      "changeAmount": "decimal",
      "changeDate": "datetime",
      "comment": "string",
      "source": "MANUAL|AUTOMATIC",
      "budgetId": "uuid"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

## Technical Implementation

1. **Repository Implementation**

   - Add to `BalanceHistoryRepository`: method with Pageable parameter
     - `findAllByBankAccountIdOrderByChangeDateDesc(UUID accountId, Pageable pageable)`

2. **Data Service Layer**

   - Add to `IDataService`:
     - Method to get paginated balance history
   - Implement in `DataService`

3. **DTOs**

   - Create `BalanceHistoryDtos.java` with:
     - `BalanceHistoryResponse` record
     - Page metadata in response

4. **Domain Service Layer**

   - Add to `IDomainService`:
     - Method to get balance history with pagination
   - Implement in `DomainService`:
     - Validate account exists
     - Retrieve paginated history from IDataService
     - Return DTO with page metadata

5. **Controller Implementation**

   - Add GET /api/bank-accounts/{id}/balance-history endpoint
   - Support pagination parameters (page, size)

6. **Integration Tests**
   - Test successful retrieval
   - Test pagination works correctly
   - Test sorting order (newest first)
   - Test MANUAL vs AUTOMATIC differentiation
   - Test budgetId is present for AUTOMATIC entries

## Definition of Done

- All acceptance criteria met
- Integration tests passing
- API documentation updated
- Pagination implemented and tested
- Code reviewed and approved
