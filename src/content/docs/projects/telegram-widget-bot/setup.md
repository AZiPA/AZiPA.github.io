---
title: Setup & Deployment
description: BotFather setup, Telegram Test Server caveat, single-secret GitHub Actions CI deployment, and local @tgcloud/cli commands across Bash, PowerShell, and CMD.
---

Deploying **Telegram Widget Bot** ([AZiPA/telegram-widget-bot](https://github.com/AZiPA/telegram-widget-bot)) requires a bot configured in `@BotFather` with **Telegram Serverless** and **Inline Mode** enabled, plus either **GitHub Actions CI** (recommended) or the local **`@tgcloud/cli`** tool. The bot's in-Telegram interface runs in **English (`en-US`)** only.

:::caution[Chat Widgets Currently Require Telegram's Test Server]
Telegram currently has Chat Widgets disabled globally on public Production servers. Live in-chat widget rendering currently works **only on Telegram's Test Server** until Telegram enables Chat Widgets on production servers. Under default configuration (`ALLOW_SHARED_WIDGETS: false`, `ALLOW_GROUP_WIDGETS: false`), private-chat widgets (`/timer`, custom `.html` uploads, and Mini App APIs) run immediately on the Test Server, while **Tap Duel (`/duel`)** requires enabling group/shared widget flags for a second opponent to join.
:::

## 1. `@BotFather` Requirements

Open `@BotFather` in Telegram and apply only the required settings for your bot:

1. **Create or Select Your Bot:** Run `/newbot` (or pick an existing bot) in `@BotFather`.
2. **Enable Serverless & Copy CLI Access Token:** Open `@BotFather → Your Bot → Serverless`, activate Telegram Serverless, then navigate to `Serverless → CLI Access → Access token` and copy the credential formatted as `app<id>:<secret>`.
3. **Enable Inline Mode:** Run `/setinline` in `@BotFather` and choose your bot so `handlers/inline_query.js` receives inline `@bot [query]` searches.
4. **Skip Unneeded Features:** No Mini App URL, Group Mode, Threaded Mode, or Business Mode configuration is required under the default private-chat setup.

:::caution[Use the Serverless CLI Access Token]
`TGCLOUD_TOKEN` MUST be the Serverless **CLI Access Token** (`app<id>:<secret>`) from `Serverless → CLI Access → Access token`—**not** the standard HTTP Bot API token (`123456789:AAH...`). Standard HTTP bot tokens cannot validate or push code via `@tgcloud/cli`.
:::

## 2. Choose a Deployment Method

### Option 1 — Zero-Touch GitHub Actions CI (Recommended)

The repository ships with `.github/workflows/deploy.yml`, triggered automatically on `push` or manually via `workflow_dispatch` (with no workflow inputs). Jobs run on `ubuntu-latest` under **Node.js `26`** (`actions/checkout@v7` and `actions/setup-node@v7`), concurrency group `tgcloud-deploy` (`cancel-in-progress: false`), and `permissions: contents: read`.

Add **one single Repository Secret** under **Settings → Secrets and variables → Actions**:

| Secret | Requirement | Format & Purpose |
| :--- | :--- | :--- |
| `TGCLOUD_TOKEN` | **Required (Only Secret)** | Telegram Serverless CLI Access Token formatted as `app<id>:<secret>` |

Zero other secrets are needed. Every CI run executes this exact 9-step sequence:

1. **Checkout Repository:** Runs `actions/checkout@v7`.
2. **Verify Secret:** Confirms `TGCLOUD_TOKEN` is non-empty before proceeding.
3. **Setup Node.js `26`:** Provisions Node.js `26` via `actions/setup-node@v7`.
4. **Install Dependencies:** Installs `@tgcloud/cli` using `npm install --no-audit --no-fund`.
5. **Validate Widgets:** Runs `node scripts/validate-widgets.js` to enforce Profile 1 and `<= 4,096` B zlib-9 compressed size limits across every widget definition.
6. **Check App Status:** Runs `npx tgcloud status` to verify connectivity and current serverless state.
7. **Push Runtime Bundle:** Uploads the pure JavaScript bundle via `npx tgcloud push --force`.
8. **Apply Safe Migrations:** Applies additive SQLite changes via `npx tgcloud migrate --safe`.
9. **Sync Webhook Updates:** Reconciles Telegram `allowed_updates` via `npx tgcloud webhook sync`.

### Option 2 — Local `@tgcloud/cli` Workflow

Run these commands from the repository root to validate widget budgets locally, authenticate, deploy code, apply safe migrations, and sync webhook update types:

```bash
npm install
npm run validate          # Runs node scripts/validate-widgets.js
npx tgcloud login
npm run deploy            # Runs node scripts/validate-widgets.js && tgcloud push
npx tgcloud status
npx tgcloud migrate --safe
npx tgcloud webhook sync
```

:::note[`push` Never Alters SQLite & `webhook sync` Scope]
`npx tgcloud push` (and `npm run deploy`) uploads runtime code only and never modifies SQLite tables; always run `npx tgcloud migrate --safe` after schema edits. In addition, `@tgcloud/cli 0.2.0` derives `allowed_updates` from filenames in `tgcloud/handlers/` (`message`, `callback_query`, `inline_query`) and does not yet support `handlers/widget_query.js` or `handlers/shared_widget_query.js`; `widget-query-router.js` bridges those queries automatically inside `message.js` and `callback_query.js`.
:::

### Environment Token & `npx tgcloud run` Across Shells

When setting `TGCLOUD_TOKEN` manually or invoking a handler/endpoint via `npx tgcloud run`, use quoting rules matching your shell. In particular, **Windows CMD requires outer double quotes `"` and escaped inner `\"`** because CMD does not strip single quotes `'`:

- **Bash / macOS / Linux:**

  ```bash
  export TGCLOUD_TOKEN="app12345:your_secret"
  npx tgcloud run endpoints/listWidgets '{}' --ctx '{"initData":{"user":{"id":123456789}}}'
  ```

- **Windows PowerShell:**

  ```powershell
  $env:TGCLOUD_TOKEN = "app12345:your_secret"
  npx tgcloud run endpoints/listWidgets '{}' --ctx '{\"initData\":{\"user\":{\"id\":123456789}}}'
  ```

- **Windows CMD:**

  ```cmd
  set "TGCLOUD_TOKEN=app12345:your_secret"
  npx tgcloud run endpoints/listWidgets "{}" --ctx "{\"initData\":{\"user\":{\"id\":123456789}}}"
  ```

## Next Steps

- [Widgets, Commands & Uploads](/projects/telegram-widget-bot/widgets-commands/) — Try Stopwatch, Poll, Tap Duel, inline search, and live `.html` widget uploads.
- [Widget Engine & Authoring](/projects/telegram-widget-bot/widget-engine/) — Author new Profile 1 widgets and run automated `validate-widgets.js` checks.
- [Configuration, Schema & API](/projects/telegram-widget-bot/config-schema-api/) — Tune `WIDGET_CONFIG` flags, inspect SQLite tables, and call Mini App endpoints.
