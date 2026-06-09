# Vercel Deployment Fix - Error Resolution

## Problem Analysis

**Error:** `500: INTERNAL_SERVER_ERROR` with `FUNCTION_INVOCATION_FAILED`

### Root Causes Identified & Fixed:

1. **Missing `vercel.json`** ❌ → ✅ **FIXED**
   - Vercel didn't know how to build or run the Express app
   - Created proper Vercel configuration for Node.js serverless

2. **Incorrect Server Export** ❌ → ✅ **FIXED**
   - Original code used `app.listen()` which doesn't work on Vercel's serverless platform
   - Changed to export the app for Vercel while keeping local development support

3. **Missing Environment Variables** ⚠️ → **REQUIRES ACTION**
   - MongoDB URI likely not set in Vercel dashboard
   - API keys not configured in Vercel environment

---

## What Was Changed

### 1. Created `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**What it does:**

- Tells Vercel to use the Node.js runtime
- Routes all requests to your Express app
- Sets production environment

### 2. Modified `src/index.js`

**OLD:**

```javascript
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**NEW:**

```javascript
if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
  module.exports = app; // Vercel serverless
} else {
  app.listen(PORT, () => {
    // Local development
    console.log(`Server running on port ${PORT}`);
  });
}
```

**Why:** Serverless environments don't use `app.listen()`. Instead, they export the handler function.

### 3. Updated Client `.env`

```
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Deployment Steps for Vercel

### Step 1: Set Environment Variables in Vercel Dashboard

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add **ALL** these variables:

```
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/gitguard-ai?retryWrites=true&w=majority

# Node Environment
NODE_ENV=production

# JWT & Session Secrets (generate new secure ones!)
JWT_SECRET=<generate-random-32-char-string>
SESSION_SECRET=<generate-random-32-char-string>

# URLs
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.vercel.app

# GitHub OAuth
GITHUB_CLIENT_ID=<from-github-settings>
GITHUB_CLIENT_SECRET=<from-github-settings>

# GitHub App (for webhooks)
GITHUB_APP_ID=<from-github-app>
GITHUB_PRIVATE_KEY=<actual-PEM-format-private-key>
GITHUB_WEBHOOK_SECRET=<your-webhook-secret>

# Stripe
STRIPE_SECRET_KEY=sk_live_<your-live-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>

# AI/LLM APIs
LLM_API_KEY=<your-gemini-api-key>
DEEPSEEK_API_KEY=<your-deepseek-api-key>
```

### Step 2: Fix MongoDB Connection (CRITICAL)

⚠️ **If using MongoDB Atlas:**

1. Go to MongoDB Atlas Dashboard → Network Access
2. Add Vercel's IP range: `0.0.0.0/0` (Allow from anywhere)
   - OR better: Add Vercel's specific IPs (contact Vercel support for list)
3. Ensure your connection string includes username:password
4. Connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/gitguard-ai?retryWrites=true&w=majority
   ```

### Step 3: Redeploy to Vercel

```bash
# Option 1: Push to GitHub (if connected)
git push origin main

# Option 2: Use Vercel CLI
npm install -g vercel
vercel --prod
```

### Step 4: Verify Deployment

Once deployed, test the endpoint:

```bash
curl https://your-backend-domain.vercel.app
# Should return: { "message": "GitGuard AI API is running" }
```

---

## 🔍 Troubleshooting Common Errors

### Still Getting 500 Error?

1. **Check Vercel Logs:**
   - Dashboard → Deployments → Select latest → **Logs** tab
   - Look for specific error messages

2. **Common Issues:**

   a) **MongoDB Connection Error**

   ```
   Error: ENOTFOUND mongodb+srv://...
   ```

   - ✓ Verify MONGODB_URI is set in Vercel env vars
   - ✓ Check MongoDB is accessible from anywhere
   - ✓ Test connection string locally first

   b) **Missing Environment Variables**

   ```
   Error: JWT_SECRET is not configured
   ```

   - ✓ Add all required env vars to Vercel dashboard
   - ✓ Redeploy after adding variables

   c) **GitHub Private Key Format Error**

   ```
   Error: Invalid private key
   ```

   - ✓ Ensure it's actual PEM format (starts with `-----BEGIN RSA PRIVATE KEY-----`)
   - ✓ NOT a SHA256 hash

   d) **Timeout Error**

   ```
   Error: Task timed out after 60 seconds
   ```

   - ✓ MongoDB connection taking too long
   - ✓ Check network connectivity in MongoDB Atlas

---

## 📋 Pre-Deployment Checklist

- [ ] `vercel.json` created in server root ✓
- [ ] `src/index.js` modified to export app ✓
- [ ] All environment variables added to Vercel dashboard
- [ ] MongoDB URI set and verified
- [ ] GitHub credentials validated
- [ ] Stripe keys are LIVE (not test keys)
- [ ] FRONTEND_URL points to correct domain
- [ ] GITHUB_PRIVATE_KEY is in PEM format (not hash)
- [ ] MongoDB Atlas allows connections from anywhere
- [ ] No hardcoded secrets in code
- [ ] Logs checked after deployment

---

## 🎯 Client-Side Configuration

Update your client `.env` (or `.env.production`):

```
# For Development
VITE_API_BASE_URL=http://localhost:5000

# For Production (update in .env.production)
VITE_API_BASE_URL=https://your-backend-domain.vercel.app
```

Then in your client code:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Usage
fetch(`${API_BASE_URL}/api/repositories`);
```

---

## 📚 Quick Reference

| Issue                | Solution                                                   |
| -------------------- | ---------------------------------------------------------- |
| 500 error            | Check Vercel logs, verify MongoDB connection               |
| Missing env var      | Add to Vercel dashboard → Settings → Environment Variables |
| CORS error           | Update FRONTEND_URL in env variables                       |
| MongoDB timeout      | Whitelist IP 0.0.0.0/0 in MongoDB Atlas                    |
| GitHub auth fails    | Verify GITHUB_CLIENT_ID/SECRET match OAuth app             |
| Stripe webhook fails | Check STRIPE_WEBHOOK_SECRET in Vercel env                  |

---

## 🚀 Next Steps

1. ✓ Files already updated
2. Add environment variables to Vercel dashboard
3. Whitelist MongoDB IP access
4. Deploy and monitor logs
5. Test API endpoints after deployment

**Your backend should now deploy successfully to Vercel!**

---

_Generated: April 18, 2026_
