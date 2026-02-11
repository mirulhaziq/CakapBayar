# 🚀 Push to GitHub - Manual Steps

## ⚠️ Current Issue

Git authentication is failing with:
```
remote: Permission to mirulhaziq/CakapBayar.git denied to mirulhziq
```

This is a credential/authentication mismatch. Follow the steps below to fix and push.

---

## ✅ Option 1: Push Using GitHub Desktop (Easiest)

1. Open **GitHub Desktop**
2. Make sure you're on the `webapp` branch
3. Click **"Push origin"** button
4. If prompted, authenticate with your GitHub credentials
5. After webapp is pushed, switch to `main` branch
6. Merge `webapp` into `main`
7. Push `main` to GitHub

---

## ✅ Option 2: Push Using Git Command Line

### Step 1: Clear Git Credentials

```bash
# Remove cached credentials
git credential-cache exit

# Or if using Windows Credential Manager
# Go to: Control Panel > Credential Manager > Windows Credentials
# Remove any GitHub credentials
```

### Step 2: Push webapp branch

```bash
# Make sure you're on webapp branch
git branch

# Push webapp (will prompt for credentials)
git push origin webapp
```

When prompted:
- **Username**: `mirulhaziq` (your correct GitHub username)
- **Password**: Use a **Personal Access Token** (not your password!)

### Step 3: Push webapp to main branch

```bash
# Push webapp branch as main on GitHub
git push origin webapp:main --force
```

---

## 🔑 Create GitHub Personal Access Token (If Needed)

If Git asks for a password, you need a Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `CakapBayar Deployment`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

---

## ✅ Option 3: Use SSH Instead

### Step 1: Check if you have SSH key

```bash
# Check for existing SSH key
ls ~/.ssh/id_rsa.pub
```

If it doesn't exist, create one:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Press Enter to accept default location
# Enter a passphrase (or leave empty)
```

### Step 2: Add SSH key to GitHub

```bash
# Copy SSH public key (Windows)
Get-Content ~/.ssh/id_rsa.pub | Set-Clipboard

# Or manually copy from:
cat ~/.ssh/id_rsa.pub
```

1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Title: `My PC`
4. Paste the key
5. Click **"Add SSH key"**

### Step 3: Update Git remote to use SSH

```bash
# Change remote URL to SSH
git remote set-url origin git@github.com:mirulhaziq/CakapBayar.git

# Test SSH connection
ssh -T git@github.com

# Should see: "Hi mirulhaziq! You've successfully authenticated..."
```

### Step 4: Push

```bash
# Push webapp branch
git push origin webapp

# Push webapp as main
git push origin webapp:main --force
```

---

## 📋 What Needs to Be Pushed

**Current Status**:
- ✅ **Local commits**: 2 commits ahead
  1. `49a38cb` - Replace Convex with Prisma
  2. `1f49912` - Add critical security fixes
- ❌ **GitHub**: Not pushed yet

**Branches**:
- `webapp` branch: Has all the latest code with security fixes
- `main` branch: Needs to be updated with webapp code

---

## 🎯 Final Goal

After pushing, GitHub should have:
- `main` branch = All Prisma code + Security fixes (for Vercel deployment)
- `webapp` branch = Same as main (backup)

Vercel will automatically deploy from `main` branch.

---

## 🔧 Quick Commands Summary

```bash
# Option A: Push to both branches
git push origin webapp
git push origin webapp:main --force

# Option B: Push webapp, then update main separately
git push origin webapp
git checkout main
git merge webapp
git push origin main
```

---

## ⚠️ If You Still Can't Push

Try these solutions:

### Solution 1: Use VS Code Git
1. Open VS Code
2. Go to Source Control tab (Ctrl+Shift+G)
3. Click **"..."** → **"Push"**
4. Authenticate when prompted

### Solution 2: Use Git Credential Helper
```bash
# For Windows
git config --global credential.helper manager-core

# Try push again
git push origin webapp
```

### Solution 3: Clone Fresh and Copy
```bash
# Backup your work
cd ..
cp -r "cakapbayar - Copy" cakapbayar-backup

# Clone fresh from GitHub
git clone https://github.com/mirulhaziq/CakapBayar.git cakapbayar-fresh
cd cakapbayar-fresh

# Copy your new files
cp -r ../cakapbayar-backup/* .

# Commit and push
git add .
git commit -m "Add security fixes and Prisma migration"
git push origin main
```

---

## ✅ After Successful Push

Once pushed to GitHub, Vercel will automatically:
1. Detect the new commit on `main` branch
2. Start building your app
3. Deploy to production (https://jiku.my)

**Check Vercel deployment**: https://vercel.com/dashboard

---

## 📞 Need Help?

If you're still stuck, you can:
1. Share a screenshot of the error
2. Try GitHub Desktop (easiest option)
3. Use VS Code's built-in Git (second easiest)

The code is ready and committed locally - just need to push to GitHub! 🚀
