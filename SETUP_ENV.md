# Environment Setup Instructions

## 🔑 How to Fix the "Missing credentials" Error

The error occurs because the `OPENAI_API_KEY` environment variable is not set. Follow these steps:

### Step 1: Create `.env.local` file

1. In your project root (`c:\Users\FTSM_13\cakapbayar`), create a new file named `.env.local`
2. **Important:** The file must be named exactly `.env.local` (with the dot at the beginning)

### Step 2: Add your API keys

Open `.env.local` and add these lines:

```env
# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-actual-key-here

# Anthropic API Key - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# Convex URL - Get this from running 'npx convex dev'
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Step 3: Get your API keys

#### OpenAI API Key:
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it in `.env.local` after `OPENAI_API_KEY=`

#### Anthropic API Key:
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new key (starts with `sk-ant-`)
5. Paste it in `.env.local` after `ANTHROPIC_API_KEY=`

#### Convex URL:
1. Run `npx convex dev` in your terminal
2. It will give you a URL like `https://xxxxx.convex.cloud`
3. Copy that URL and paste it in `.env.local` after `NEXT_PUBLIC_CONVEX_URL=`

### Step 4: Restart your dev server

**CRITICAL:** After creating/updating `.env.local`, you MUST restart your dev server:

1. Stop the current server (press `Ctrl+C` in the terminal)
2. Start it again: `npm run dev`

Environment variables are only loaded when the server starts!

### Step 5: Verify it's working

After restarting, try recording again. The error should be gone!

---

## 📝 Example `.env.local` file

```env
NEXT_PUBLIC_CONVEX_URL=https://happy-cat-123.convex.cloud
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890
ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890
```

**Important notes:**
- No spaces around the `=` sign
- No quotes around the values (unless the value itself contains spaces)
- Each key on its own line
- File must be named `.env.local` (not `env.local` or `.env.local.txt`)

---

## 🔍 Troubleshooting

### Still getting the error?

1. **Check file name:** Must be exactly `.env.local` (with dot at start)
2. **Check file location:** Must be in project root (same folder as `package.json`)
3. **Restart server:** Did you restart after creating the file?
4. **Check for typos:** `OPENAI_API_KEY` (not `OPENAI_API_KEY` or `OPENAI_API_KEY`)
5. **Check key format:** OpenAI keys start with `sk-`, Anthropic keys start with `sk-ant-`

### How to verify the file exists:

In PowerShell (Windows):
```powershell
Get-ChildItem -Force | Where-Object { $_.Name -eq ".env.local" }
```

If it shows the file, it exists. If not, create it!

---

## 🚨 Security Note

**NEVER commit `.env.local` to git!** It contains your secret API keys.

The file should already be in `.gitignore`, but double-check to make sure.

