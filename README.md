# GitGuard AI

GitGuard AI is a production-grade external tool designed to automate code security and performance reviews on GitHub Pull Requests.

## Features
- **GitHub Webhook Integration**: Listens for PR events and automatically analyzes changed code (diffs).
- **AI-Powered Code Review**: Uses Gemini 1.5 Pro to identify bugs, security vulnerabilities, and performance bottlenecks.
- **Actionable Feedback**: Posts structured review comments back to GitHub with suggested code fixes.
- **Premium Dashboard**: Manage repository settings and review history via a high-fidelity glassmorphic React interface.
- **Tiered Subscriptions**: Secure monetization with Stripe (5 free reviews/month for individuals, unlimited for Pros).

## Tech Stack
- **Frontend**: React, Vite, Framer Motion, Lucide-React.
- **Backend**: Node.js, Express, Passport.js (GitHub OAuth), Octokit (GitHub API).
- **Service**: Google Gemini 1.5 Pro, Stripe.
- **Database**: MongoDB (Mongoose).

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB instance (Local or Atlas)
- GitHub App credentials (App ID, Private Key, Webhook Secret)
- Google AI (Gemini) API Key
- Stripe Secret Key & Webhook Secret

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/gitguard-ai.git
   cd gitguard-ai
   ```

2. **Backend Setup**:
   ```bash
   cd server
   cp .env.example .env
   # Fill in your .env secrets
   npm install
   npm start
   ```

3. **Frontend Setup**:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

## Environment Variables (.env)
- `MONGODB_URI`: Connection string for MongoDB.
- `LLM_API_KEY`: Google Gemini API Key.
- `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`: GitHub App credentials.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Stripe payment credentials.

## Deployment
A `Dockerfile` is provided in the `server/` directory for containerized deployment.
