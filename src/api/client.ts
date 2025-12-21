const API_BASE = '/api'

// Error message mapping for user-friendly display
const ERROR_MESSAGES: Record<string, string> = {
  'Bank account name already exists': 'An account with this name already exists. Please choose a different name.',
  'Bank account not found': 'This account could not be found. It may have been deleted.',
  'Cannot delete account used in unlocked budget': 'This account is used in a budget that is not locked. Remove it from the budget first, or lock the budget.',
  'Recurring expense with this name already exists': 'A recurring expense with this name already exists. Please choose a different name.',
  'Recurring expense not found': 'This recurring expense could not be found. It may have been deleted.',
  'Budget already exists for this month': 'A budget already exists for this month. You can only have one budget per month.',
  'Another budget is currently unlocked': 'You already have an unlocked budget. Lock or delete it before creating a new one.',
  'Cannot modify locked budget': 'This budget is locked and cannot be modified. Unlock it first if you need to make changes.',
  'Cannot delete locked budget': 'This budget is locked and cannot be deleted. Unlock it first.',
  'Budget must be balanced to lock': 'Your budget must balance to zero before it can be locked. Adjust your income, expenses, or savings.',
  'Cannot unlock - not the most recent budget': 'Only the most recent budget can be unlocked.',
  'Date cannot be in the future': 'The date cannot be in the future. Please select today or an earlier date.',
}

export class ApiClientError extends Error {
  constructor(
    public originalMessage: string,
    public userMessage: string,
    public status: number
  ) {
    super(userMessage)
    this.name = 'ApiClientError'
  }
}

function mapErrorMessage(apiError: string): string {
  return ERROR_MESSAGES[apiError] || apiError
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred'

    try {
      const errorBody = await response.json()
      if (errorBody.error) {
        errorMessage = errorBody.error
      }
    } catch {
      // Response wasn't JSON, use status text
      errorMessage = response.statusText
    }

    throw new ApiClientError(
      errorMessage,
      mapErrorMessage(errorMessage),
      response.status
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  return handleResponse<T>(response)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  })
  return handleResponse<T>(response)
}
