# Nissan AI Command Center

A Next.js dashboard that routes tasks to OpenAI, Anthropic Claude, and Qwen, with Gmail OAuth for reading the inbox and an approval-gated send endpoint.

## Features

- Multi-provider AI task runner
- Server-side API keys; secrets are never placed in client code
- Gmail OAuth 2.0
- Read latest inbox messages
- Email sending requires `approved: true` on the server
- Render deployment configuration via the connected GitHub repository

## Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local` or real API keys.

Required for AI providers:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `QWEN_API_KEY`

Optional model settings:

- `OPENAI_MODEL` (default `gpt-5.4`)
- `ANTHROPIC_MODEL` (default `claude-sonnet-5`)
- `QWEN_BASE_URL`
- `QWEN_MODEL`

Required for Gmail OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SESSION_SECRET` — use a long random value

For local development, set the redirect URI to `http://localhost:3000/api/gmail/callback`. For Render, use the deployed service URL plus `/api/gmail/callback`.

## Google setup

Enable the Gmail API and create an OAuth 2.0 web application client in Google Cloud. Add the exact redirect URI used by this app. The app requests Gmail read-only and send permissions.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deployment

The `main` branch is configured for automatic deployment on the connected Render service. Add the environment variables in the Render service settings before using AI or Gmail.
