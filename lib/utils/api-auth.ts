/**
 * API Authentication Utility
 * 
 * Verifies API key from request headers for protecting internal API routes.
 * Used by all API endpoints to prevent unauthorized access.
 */

export function verifyApiKey(request: Request): boolean {
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.headers.get('authorization')?.replace('bearer ', '')

  const expectedKey = process.env.INTERNAL_API_KEY

  // When no key is configured, allow requests (e.g. Vercel env not set or same-origin app)
  if (!expectedKey) {
    return true
  }

  return apiKey === expectedKey
}

export function getApiKeyFromRequest(request: Request): string | null {
  return (
    request.headers.get('x-api-key') || 
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null
  )
}
