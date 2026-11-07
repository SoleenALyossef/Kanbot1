# Kanbot AI emergency reliability patch

This patch changes the shared server-side AI layer.

## What changed
- All four AI operations (chat, generate todos, plan sprint, summarize sprint) now catch provider failures and return the project's existing local/mock implementation instead of failing the request.
- After the first provider failure, the server switches subsequent AI operations to local/mock mode until restart, avoiding repeated 60-second waits and repeated provider failures during the demo.
- Default provider timeout reduced from 60 seconds to 15 seconds.
- The timeout handler logs the underlying error name/message without logging API credentials.
- Removed the populated API key from `server/.env.example`. Keep real credentials only in your deployment secret settings or untracked `.env`.

## Apply / deploy
1. Replace your project files with this patched project (or copy the changed files listed below).
2. Redeploy/restart the backend service.
3. Confirm `GET /api/health` works.
4. Test chat, Generate todos, Plan sprint, and Summarize sprint.
5. If the external provider is still unavailable, the UI should receive local/mock results instead of `AI_ERROR`.

Changed files:
- `server/src/ai/assistant.service.ts`
- `server/src/ai/client.ts`
- `server/src/config/env.ts`
- `server/.env.example`

## Important
This is an emergency resilience fallback, not proof that the external AI provider is healthy. When the provider is unreachable, the app uses the deterministic local/mock logic already implemented in this project. To restore real model responses, configure a valid provider key, base URL, and model in the backend deployment environment.

The uploaded `.env.example` contained a populated API-key value. If that value was ever a real credential and the repository was public/shared, revoke it and create a new key immediately. Never commit API keys.
