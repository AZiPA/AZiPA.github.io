---
title: Setup & Deployment
description: BotFather setup, Cloudflare D1 and API token permissions, secrets reference, GitHub Actions CI, and local wrangler and webhook registration.
---

Deploying **Telegram Uploader Bot (Cloudflare Workers)** requires a bot token from `@BotFather`, a **Cloudflare** account with **Workers** and **D1** enabled, and either **GitHub Actions CI** (recommended) or local **`wrangler`** tooling.

## 1. `@BotFather` & Optional Channels

Configure your bot in `@BotFather` with standard Bot API settings:

1. **Create Bot & Copy Token:** Run `/newbot` and record the standard HTTP Bot API token (`BOT_TOKEN`).
2. **Disable Group Access:** Run `/setjoingroups` and select **Disable** so the bot operates strictly in private chats.
3. **Disable Inline Mode:** Run `/setinline` and select **Turn off**.
4. **Optional Supporting Channels:**
   - **Private Storage Channel (`STORAGE_CHANNEL_ID`):** Add the bot as Administrator (`can_post_messages`) to mirror uploads and unlock 1-subrequest `copyMessages()` bulk delivery.
   - **Log Channel (`LOG_CHANNEL_ID`):** Private channel (`-100...`) with the bot as Admin for alerts and JSON config backups (or route logs to `owner` DM).
   - **Force-Join Channels:** Add the bot as Admin to up to `8` public or private channels required before downloads.

## 2. Cloudflare Account, API Token & WAF Recommendation

1. Copy your 32-character **Account ID** (`CLOUDFLARE_ACCOUNT_ID`) from the Cloudflare Dashboard.
2. Create an API Token (`CLOUDFLARE_API_TOKEN`) from the **Edit Cloudflare Workers** template containing these permissions:
   - `Workers Scripts:Write`
   - `D1:Write`
   - `Account Settings:Read`
   - `Workers Routes:Write`
   - `DNS:Write`

:::tip[Custom Domain & WAF IP Filtering]
When deploying behind a custom Cloudflare domain rather than `*.workers.dev`, you can configure a Cloudflare WAF rule on `/<WEBHOOK_PATH>` to allow incoming requests exclusively from Telegram's official webhook IP ranges alongside `X-Telegram-Bot-Api-Secret-Token`.
:::

## 3. Secrets & Variables Reference

| Name | Scope | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions CI | **Required** | Cloudflare API token with Workers & D1 write access |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions CI | **Required** | 32-character Cloudflare Account ID |
| `BOT_TOKEN` | Worker Secret | **Required** | Standard Bot API HTTP token from `@BotFather` |
| `OWNER_ID` | Worker Secret | **Required** | Numeric Telegram user ID (`1–15` digits) of the root Owner |
| `WEBHOOK_PATH` | Worker Secret | **Required** | Secret webhook route segment (matched on `POST /<WEBHOOK_PATH>`) |
| `WEBHOOK_SECRET` | Worker Secret | **Required** | Secret token header (`X-Telegram-Bot-Api-Secret-Token`, minimum `16` chars) |
| `BOT_USERNAME` | Worker Secret / Var | **Recommended** | Bot username without `@` — skips cold-start `getMe` API call |
| `BOT_FIRST_NAME` | Worker Var | **Optional** | Display name fallback (defaults to `"File Store Bot"`) |
| `STORAGE_CHANNEL_ID` | Worker Secret / Var | **Optional** | Private channel ID (`-100...`) for mirroring and bulk copy |
| `LOG_CHANNEL_ID` | Worker Secret / Var | **Optional** | Private log channel ID (`-100...`) for operational alerts and backups |
| `ENABLE_QUOTA_CACHE` | Worker Var | **Optional** | Set to `"false"` to disable the 5-minute in-memory quota cache |

## 4. Deployment Methods

### Option 1 — GitHub Actions CI (Recommended)

The repository ships `.github/workflows/deploy.yml`, triggered automatically on `push` to `main` (ignoring `docs/**` and `README*.md`), on `release` (`published`), or manually via `workflow_dispatch`. It runs on `ubuntu-latest` with **Node.js `24`** and executes:

1. `npm install --legacy-peer-deps`
2. `npx tsc --noEmit` (strict TypeScript typecheck)
3. `node scripts/verify.mjs` (runs the 8-check localization, HTML, and 64-byte callback suite)
4. Validate required CI and Worker secrets upfront
5. Auto-provision the D1 database `filestore-db` in region `weur` if absent
6. Apply schema & compatibility updates:
   ```bash
   npx wrangler d1 execute filestore-db --remote --file=./schema.sql -y
   ```
   *(followed by idempotent compatibility `ALTER TABLE` statements)*
7. Seed `OWNER_ID` directly into the D1 `admins` table
8. Deploy the Worker (`npx wrangler deploy`) and sync Worker secrets (`npx wrangler secret bulk`)

### Option 2 — Local `wrangler` Setup & Webhook Registration

Provision D1, apply `schema.sql`, seed your Owner record, upload Worker secrets, and deploy locally:

```bash
npm install --legacy-peer-deps
npx wrangler d1 create filestore-db --location=weur
# Copy the returned database_id into wrangler.toml before migrating:
npx wrangler d1 execute filestore-db --remote --file=./schema.sql -y
npx wrangler d1 execute filestore-db --remote --command "INSERT OR IGNORE INTO admins (user_id, role, added_by) VALUES (<OWNER_ID>, 'owner', <OWNER_ID>);"
npx wrangler secret put BOT_TOKEN
npx wrangler secret put OWNER_ID
npx wrangler secret put WEBHOOK_PATH
npx wrangler secret put WEBHOOK_SECRET
npx wrangler deploy
```

#### Webhook Registration (`scripts/webhook.mjs` or Bot API)

Manage the Telegram webhook using the built-in helper script (`info`, `set`, `drop`, or `delete`):

```bash
node scripts/webhook.mjs set
node scripts/webhook.mjs info
```

Or invoke Telegram's `setWebhook` directly (`max_connections=8`, `allowed_updates=["message","callback_query"]`, `drop_pending_updates=true`, `secret_token=<WEBHOOK_SECRET>`) in your shell:

- **Bash / macOS / Linux:**

  ```bash
  curl -sS -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://<WORKER_HOST>/<WEBHOOK_PATH>","secret_token":"<WEBHOOK_SECRET>","max_connections":8,"allowed_updates":["message","callback_query"],"drop_pending_updates":true}'
  ```

- **Windows CMD:**

  ```cmd
  curl -sS -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d "{\"url\":\"https://<WORKER_HOST>/<WEBHOOK_PATH>\",\"secret_token\":\"<WEBHOOK_SECRET>\",\"max_connections\":8,\"allowed_updates\":[\"message\",\"callback_query\"],\"drop_pending_updates\":true}"
  ```

- **Windows PowerShell:**

  ```powershell
  curl.exe -sS -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d '{\"url\":\"https://<WORKER_HOST>/<WEBHOOK_PATH>\",\"secret_token\":\"<WEBHOOK_SECRET>\",\"max_connections\":8,\"allowed_updates\":[\"message\",\"callback_query\"],\"drop_pending_updates\":true}'
  ```

## Next Steps

- [Uploads, Delivery & Protection](/projects/telegram-uploader-bot-cloudflare/features-delivery/) — Explore 1-subrequest bulk delivery, SHA-256 passcodes, and cron sweeps.
- [Roles, Security & Operations](/projects/telegram-uploader-bot-cloudflare/roles-security/) — Review the 5-level RBAC matrix, rate limits, and `/restore` JSON backups.
- [Architecture, D1 Schema & Cron](/projects/telegram-uploader-bot-cloudflare/architecture/) — Inspect the D1 schema, SQL triggers, and cron schedule.
