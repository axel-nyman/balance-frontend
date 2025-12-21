import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import { ApiClientError, apiGet, apiPost, apiPut, apiDelete } from './client'

describe('ApiClientError', () => {
  it('stores original and user-friendly messages', () => {
    const error = new ApiClientError(
      'Bank account name already exists',
      'An account with this name already exists. Please choose a different name.',
      400
    )

    expect(error.originalMessage).toBe('Bank account name already exists')
    expect(error.userMessage).toBe('An account with this name already exists. Please choose a different name.')
    expect(error.status).toBe(400)
    expect(error.message).toBe(error.userMessage)
  })
})

describe('apiGet', () => {
  it('returns parsed JSON on success', async () => {
    server.use(
      http.get('/api/test', () => {
        return HttpResponse.json({ data: 'test' })
      })
    )

    const result = await apiGet('/test')
    expect(result).toEqual({ data: 'test' })
  })

  it('throws ApiClientError on error response', async () => {
    server.use(
      http.get('/api/test', () => {
        return HttpResponse.json(
          { error: 'Bank account name already exists' },
          { status: 400 }
        )
      })
    )

    await expect(apiGet('/test')).rejects.toThrow(ApiClientError)

    server.use(
      http.get('/api/test', () => {
        return HttpResponse.json(
          { error: 'Bank account name already exists' },
          { status: 400 }
        )
      })
    )

    try {
      await apiGet('/test')
    } catch (e) {
      const error = e as ApiClientError
      expect(error.userMessage).toContain('already exists')
    }
  })
})

describe('apiPost', () => {
  it('sends JSON body and returns response', async () => {
    server.use(
      http.post('/api/test', async ({ request }) => {
        const body = await request.json()
        expect(body).toEqual({ name: 'Test' })
        return HttpResponse.json({ id: '123' }, { status: 201 })
      })
    )

    const result = await apiPost('/test', { name: 'Test' })
    expect(result).toEqual({ id: '123' })
  })
})

describe('apiPut', () => {
  it('sends PUT request with body', async () => {
    server.use(
      http.put('/api/test/1', async ({ request }) => {
        const body = await request.json()
        expect(body).toEqual({ name: 'Updated' })
        return HttpResponse.json({ updated: true })
      })
    )

    const result = await apiPut('/test/1', { name: 'Updated' })
    expect(result).toEqual({ updated: true })
  })
})

describe('apiDelete', () => {
  it('handles 204 No Content response', async () => {
    server.use(
      http.delete('/api/test/1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const result = await apiDelete('/test/1')
    expect(result).toBeUndefined()
  })
})

describe('error message mapping', () => {
  const errorCases = [
    {
      apiError: 'Bank account name already exists',
      expectedContains: 'already exists',
    },
    {
      apiError: 'Cannot delete account used in unlocked budget',
      expectedContains: 'used in a budget',
    },
    {
      apiError: 'Budget already exists for this month',
      expectedContains: 'already exists for this month',
    },
    {
      apiError: 'Cannot modify locked budget',
      expectedContains: 'locked',
    },
    {
      apiError: 'Unknown error from API',
      expectedContains: 'Unknown error from API', // Falls through unchanged
    },
  ]

  it.each(errorCases)('maps "$apiError" to user-friendly message', async ({ apiError, expectedContains }) => {
    server.use(
      http.get('/api/test', () => {
        return HttpResponse.json({ error: apiError }, { status: 400 })
      })
    )

    try {
      await apiGet('/test')
      // Should not reach here
      expect.fail('Expected apiGet to throw')
    } catch (e) {
      const error = e as ApiClientError
      expect(error.userMessage.toLowerCase()).toContain(expectedContains.toLowerCase())
    }
  })
})
