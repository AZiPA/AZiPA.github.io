---
title: Setup & Deployment
description: Step-by-step BotFather setup, GitHub Actions CI or local tgcloud CLI deployment, mandatory owner bootstrap, and Telegram Business activation.
---

Deploying **Telegram Business Assistant** requires a Telegram account with **Telegram Business / Premium** access, a bot configured in `@BotFather`, and either **GitHub Actions CI** (recommended) or the local **`@tgcloud/cli`** tool.

## 1. Prerequisites & `@BotFather` Setup

Open `@BotFather` in Telegram and complete these steps for your bot:

1. **Enable Serverless:** Go to `@BotFather → Your Bot → Serverless` and activate Telegram Serverless hosting.
2. **Copy the CLI Access Token:** Open `Serverless → CLI Access → Access token` and copy the token formatted as `app<id>:<secret>`.
3. **Enable Business Mode:** Open `Bot Settings → Business Mode` and turn it **ON**.
4. **Disable Group Access:** Open `Bot Settings → Allow Groups` and turn it **OFF** for privacy.
5. **Enable Threaded Mode *(Optional)*:** Open `Bot Settings → Threads Settings → Threaded Mode` and turn it **ON** to organize alerts into per-contact topics.
6. **Find Your Numeric Telegram User ID (`OWNER_ID`):** Record your numeric user ID (positive integer digits only, such as `123456789`).

:::caution[Use the Serverless CLI Access Token]
`TGCLOUD_TOKEN` MUST be the Serverless **CLI Access Token** (`app<id>:<secret>`) from `Serverless → CLI Access → Access token`—**not** the regular Bot API HTTP token (`123456789:AAH...`). Standard HTTP bot tokens will fail upfront validation.
:::

## 2. Choose a Deployment Method

### Option 1 — GitHub Actions CI (Recommended, Zero Local Setup)

Fork or create a repository from [AZiPA/telegram-chat-automation](https://github.com/AZiPA/telegram-chat-automation), then add two **Repository Secrets** under **Settings → Secrets and variables → Actions**:

| Secret | Validation Pattern | Description |
| :--- | :--- | :--- |
| `TGCLOUD_TOKEN` | `^app[0-9]+:[^[:space:]]+$` | Telegram Serverless CLI Access Token |
| `OWNER_ID` | `^[1-9][0-9]*$` | Numeric Telegram user ID of the bot owner |

The deployment workflow runs automatically on every `push`, or manually via **Actions → ✈️ Deploy to Telegram → Run workflow** (`workflow_dispatch`) on Node.js `26`.

When triggering manually, you can pick a `migration_mode`:

| Mode | CLI Flag | Behavior |
| :--- | :--- | :--- |
| `safe` *(default)* | `--safe` | Additive safe schema changes only; skips warning-level drops *(always used on `push`)* |
| `dry-run` | `--dry-run` | Prints pending schema diffs without modifying the SQLite database |
| `skip` | — | Skips the migration step completely |
| `yes` | `--yes` | Applies safe changes **and** warning-level drops — use with caution |

Each CI run executes this 6-step sequence:

1. Validate `TGCLOUD_TOKEN` and `OWNER_ID` secret formats upfront.
2. Install CLI dependencies with `npm install --no-audit --no-fund`.
3. Push runtime code via `npx tgcloud push --force`.
4. Apply database migrations via `npx tgcloud migrate --<mode>` (unless `skip` is selected).
5. Seed ownership via `npx tgcloud run handlers/message "{owner_id: ${OWNER_ID}}" --ctx '{ci_bootstrap: true}'`.
6. Reconcile webhook status with `npx tgcloud webhook sync` and `npx tgcloud webhook`.

:::tip[Rotating `OWNER_ID` Safely]
To transfer the bot to a different Telegram account, update the `OWNER_ID` repository secret and re-run the deployment workflow. `setOwnerId()` clears stale `contact_topics`, `connections`, and `topics_disabled_until` for the previous owner while keeping archived `messages` intact.
:::

### Option 2 — Local Deployment via `@tgcloud/cli`

Local deployment requires **Node.js `18+`** (CI runs on Node.js `26`):

```bash
git clone https://github.com/AZiPA/telegram-chat-automation.git
cd telegram-chat-automation
npm install
npx tgcloud login
npx tgcloud push
npx tgcloud migrate
```

:::note[`push` Never Alters the Database]
`npx tgcloud push` (or `npm run deploy`) uploads your runtime code only and never modifies SQLite tables. Always run `npx tgcloud migrate` after schema updates.
:::

Next, run the **mandatory owner bootstrap** (replace `123456789` with your numeric Telegram user ID):

- **Bash / macOS / Linux:**

  ```bash
  npx tgcloud run handlers/message '{owner_id: 123456789}' --ctx '{ci_bootstrap: true}'
  ```

- **Windows CMD:**

  ```cmd
  npx tgcloud run handlers/message "{owner_id: 123456789}" --ctx "{ci_bootstrap: true}"
  ```

Verify the command output includes `{ ok: true }`, then inspect the webhook state:

```bash
npx tgcloud webhook
```

If the webhook state has drifted, synchronize it with `npx tgcloud webhook sync`.

## 3. Post-Deploy Activation in Telegram

:::caution[Follow This Exact Order]
Send `/start` in private chat **before** linking the bot in Telegram Business settings. Telegram prevents a bot from initiating private alerts until you message it first.
:::

1. **Initialize Private Chat:** Open your bot in Telegram and send `/start`. Confirm you receive the **🤖 Telegram Business Assistant Status** dashboard—this confirms `OWNER_ID` was seeded properly and unlocks private bot messages.
2. **Connect to Telegram Business:** Open **Settings → Telegram Business → Chatbots**, select your bot, and grant the required `BusinessBotRights`:

| Right | Purpose |
| :--- | :--- |
| `can_read_messages` | Read messages so incoming texts, media, edits, and deletions can be tracked |
| `can_reply` | Send and reply to Business chat messages when needed |
| `can_delete_sent_messages` | Delete messages sent by the bot |
| `can_delete_all_messages` | Auto-delete exact View-Once trigger replies *(may appear as **Delete Received Messages** in Telegram UI)* |

3. **Confirm Connection:** Wait for the bot's **🔗 Telegram Business Connected** confirmation message in your private chat.

### Pausing & Resuming Per Chat

To pause or resume automation in any specific conversation, use Telegram Business's native top-bar **Stop / Start** toggle inside that chat. Disabling the bot globally from Telegram Business settings updates `is_enabled = false` in the `connections` table.

## Next Steps

- [Commands & Configuration](/projects/chat-automation/commands-config/) — Learn all private-chat owner commands and runtime constants.
- [Architecture & Schema](/projects/chat-automation/architecture/) — Review handlers, SQLite tables, and ongoing maintenance commands.
