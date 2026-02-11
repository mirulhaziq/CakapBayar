# Deployment (Vercel)

## Required environment variables

Set these in **Vercel** → your project → **Settings** → **Environment Variables**:

| Variable | Where | Purpose |
|----------|--------|--------|
| `INTERNAL_API_KEY` | Server | Used by API routes to verify requests (TTS, transcribe, parse-order). The app injects this into the page at **runtime**, so the browser can send it with requests. Set this and redeploy once; no need for `NEXT_PUBLIC_*` for the key. |

Optional: `NEXT_PUBLIC_INTERNAL_API_KEY` (same value) — used as fallback if the runtime-injected key is missing (e.g. old build). For new deploys, only `INTERNAL_API_KEY` is required.

### Optional (for AI features)

| Variable | Purpose |
|----------|--------|
| `ELEVENLABS_API_KEY` | Text-to-speech (ElevenLabs) |
| `ELEVENLABS_VOICE_ID` | Optional; override default voice |
| `GROQ_API_KEY` | Speech-to-text (transcription via Groq Whisper) |

After adding or changing environment variables, **redeploy** the project (Deployments → … → Redeploy).
