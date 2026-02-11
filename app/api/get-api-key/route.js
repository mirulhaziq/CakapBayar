import { NextResponse } from 'next/server'

/**
 * GET /api/get-api-key
 * Returns the internal API key for the client to use when calling other API routes.
 * No auth required (same-origin only). Used so the key is read at request time on the server.
 */
export async function GET() {
  const apiKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY || ''
  return NextResponse.json({ apiKey })
}
