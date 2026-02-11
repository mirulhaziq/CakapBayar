/**
 * Authenticated API Client
 * 
 * Helper functions for making authenticated API calls to your own API routes.
 * Automatically includes the x-api-key header for authentication.
 */

// Get API key from environment variable
// In production, this will be set in Vercel environment variables
const API_KEY = 
  process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 
  'cakapbayar_secure_key_change_in_production_abc123xyz789'

/**
 * Make an authenticated fetch request to your API
 * 
 * Usage:
 * ```typescript
 * const response = await authenticatedFetch('/api/transcribe', {
 *   method: 'POST',
 *   body: formData
 * })
 * ```
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'x-api-key': API_KEY
    }
  })
}

/**
 * Make an authenticated POST request with JSON body
 * 
 * Usage:
 * ```typescript
 * const data = await authenticatedPost('/api/parse-order', {
 *   transcript: 'order nasi lemak',
 *   menuItems: [...]
 * })
 * ```
 */
export async function authenticatedPost<T = any>(url: string, body: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * Make an authenticated POST request with FormData
 * 
 * Usage:
 * ```typescript
 * const formData = new FormData()
 * formData.append('file', audioBlob)
 * 
 * const data = await authenticatedFormPost('/api/transcribe', formData)
 * ```
 */
export async function authenticatedFormPost<T = any>(url: string, formData: FormData): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * Handle rate limit errors with retry logic
 * 
 * Usage:
 * ```typescript
 * const data = await withRetry(() => 
 *   authenticatedPost('/api/parse-order', { ... })
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, i)
        console.log(`Rate limited. Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // For other errors, throw immediately
      throw error
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
