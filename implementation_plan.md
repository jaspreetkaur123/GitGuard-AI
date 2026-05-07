# GitGuard AI - Implementation Plan

GitGuard AI is a production-ready internal tool designed to automate code reviews on GitHub Pull Requests. It analyzes code diffs for bugs, security vulnerabilities, and performance issues using an LLM, then posts structured feedback directly to the PR.

## User Review Required

> [!IMPORTANT]
> **GitHub App vs Webhook**: I recommend building this as a **GitHub App**. It provides better security (private keys vs secrets), finer-grained permissions, and a better user experience (installing on repos/orgs).
> **LLM Provider**: Which LLM would you prefer? I suggest **Gemini 1.5 Pro** or **GPT-4o** for high-quality code reasoning.
> **Payment Provider**: I will assume **Stripe** for the subscription flow unless otherwise specified.

## Phased Implementation Roadmap

### Phase 1: Foundation & Backend Setup
**Goal**: Establish the project structure and core server functionality.
- [ ] Initialize monorepo structure (`/server` and `/client`).
- [ ] Setup Express server with security middleware (Helmet, CORS).
- [ ] Configure MongoDB connection via Mongoose.
- [ ] Setup Environment Variable management (`.env` template).
- [ ] Define Mongoose schemas for Users, Repos, and Audit Logs.

### Phase 2: GitHub Webhook Integration
**Goal**: Securely receive and parse events from GitHub.
- [ ] Implement Webhook endpoint (`POST /webhooks/github`).
- [ ] Implement GitHub Signature Validation (X-Hub-Signature-256).
- [ ] Parse `pull_request` events (specifically `opened` and `synchronize`).
- [ ] Setup `Octokit` client with GitHub App authentication.

### Phase 3: Diff Analysis & AI Integration
**Goal**: Fetch changed code and process it with an LLM.
- [ ] Implement `fetchDiff` service using Octokit to get `.diff` data.
- [ ] Logic to extract changed lines and context.
- [ ] **AI Prompt Engineering**: Create a specialized system prompt for code analysis.
- [ ] Integrate LLM (Gemini/OpenAI) to analyze the diff.
- [ ] **Security Audit**: Implement regex-based sanitization for AI-generated code blocks.

### Phase 4: Comment Bot (The Feedback Loop)
**Goal**: Post review comments back to the PR.
- [ ] Format LLM output into GitHub-flavored Markdown.
- [ ] Implement `postReview` service using Octokit.
- [ ] Handle error states (e.g., rate limits, invalid diffs).
- [ ] Add "Bot" badge/signature to comments for transparency.

### Phase 5: Dashboard & Settings (Frontend)
**Goal**: Build the UI for users to manage their bot instances.
- [ ] Initialize React frontend with a premium, glassmorphic design system.
- [ ] Implement Dashboard showing active repos and recent review logs.
- [ ] Build Settings page to toggle specific checks (e.g., "Performance only").
- [ ] Implement JWT-based authentication for the dashboard.

### Phase 6: Subscription Flow & Deployment
**Goal**: Finalize monetization and production readiness.
- [ ] Integrate Stripe for subscription management.
- [ ] Create "Free" vs "Pro" logic in the backend.
- [ ] Finalize the deployment configuration (e.g., Dockerfile, Vercel/Render).
- [ ] Comprehensive verification of the end-to-end flow.

---

## Open Questions

> [!IMPORTANT]
> 1. **LLM Provider**: Which LLM would you prefer (Gemini 1.5 Pro, GPT-4o, or Claude)?
> 2. **GitHub Auth**: Shall we proceed with a **GitHub App** setup (recommended for production)?
> 3. **Payment**: Is **Stripe** the definitive choice for subscriptions?


## Verification Plan

### Automated Tests
- Mock GitHub webhook payloads to test the analysis pipeline.
- Unit tests for AI response sanitization.

### Manual Verification
- Deploy backend using a tunneling service (like `ngrok` or `smee.io`).
- Open a PR in a test repository and verify the bot posts a comment.
- Navigate the Dashboard and test the subscription redirect.
