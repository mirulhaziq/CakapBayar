import { NextResponse } from 'next/server'

/**
 * GET /api/check-env
 * Public endpoint (no API key required) to diagnose deployment config.
 * Returns whether INTERNAL_API_KEY is set so the client can show a helpful message.
 */
export async function GET() {
  const apiKeyConfigured = !!process.env.INTERNAL_API_KEY
  return NextResponse.json({
    apiKeyConfigured,
    message: apiKeyConfigured
      ? 'Server has INTERNAL_API_KEY. If you still get 401, add NEXT_PUBLIC_INTERNAL_API_KEY in Vercel and redeploy (new build required).'
      : 'Set INTERNAL_API_KEY and NEXT_PUBLIC_INTERNAL_API_KEY in Vercel, then redeploy.',
  })
}
