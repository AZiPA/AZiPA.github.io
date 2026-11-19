---
title: Setup & Deployment
description: BotFather setup, GitHub Actions CI and local @tgcloud/cli deployment, and ownership bootstrapping across Bash, CMD, and PowerShell.
---

Deploying **Telegram Uploader Bot (Telegram Serverless)** requires a bot configured in `@BotFather` with **Telegram Serverless** enabled, plus either **GitHub Actions CI** (recommended) or the local **`@tgcloud/cli`** tool.

## 1. `@BotFather` & Channel Prerequisites

Open `@BotFather` in Telegram and prepare your bot and optional supporting channels:

1. **Create Your Bot:** Run `/newbot` in `@BotFather` and choose a display name and username.
2. **Enable Serverless:** Open `@BotFather → Your Bot → Serverless` and activate Telegram Serverless hosting.
3. **Copy the CLI Access Token:** Open `Serverless → CLI Access → Access token` and copy the credential formatted as `` `app<id>:<secret>` ``.
4. **Optional Supporting Channels:**
   - **Private Storage Channel:** Create a private channel, add your bot as Administrator with `can_post_messages: true`, and verify that **Content Protection (`has_protected_content`) is OFF**. If content protection is enabled on the storage channel, mirroring and `api.copyMessages()` fallback will fail.
   - **Log Channel:** Create a private channel (`-100...`) with the bot as Admin to receive operational alerts, or route logs directly to the Owner's private chat via `/setlogchannel owner`.
   - **Force-Join Channels:** Add the bot as Administrator to up to `8` public or private channels you plan to require before bundle downloads.

:::caution[Use the Serverless CLI Access Token]
`TGCLOUD_TOKEN` MUST be the Serverless **CLI Access Token** (`` `app<id>:<secret>` ``) copied from `Serverless → CLI Access → Access token`—**not** the regular HTTP Bot API token (`123456789:AAH...`). Standard HTTP bot tokens cannot push code or run migrations via `@tgcloud/cli`.
:::

## 2. Choose a Deployment Method

### Option 1 — GitHub Actions CI (Recommended)

The repository includes `.github/workflows/deploy.yml`, triggered automatically on `push` or manually via `workflow_dispatch` with concurrency group `tgcloud-deploy` (`cancel-in-progress: false`). Jobs run on `ubuntu-latest` with **Node.js `24`** (`actions/checkout@v7` with `persist-credentials: false`, `actions/setup-node@v4`).

Configure these **Repository Secrets** under **Settings → Secrets and variables → Actions**:

| Secret | Requirement | Purpose |
| :--- | :--- | :--- |
| `TGCLOUD_TOKEN` | **Required** | Serverless CLI Access Token formatted as `` `app<id>:<secret>` `` |
| `OWNER_ID` | **Optional** | Numeric Telegram user ID for automated Zero-Touch owner seeding |

Each CI workflow run executes this exact deployment sequence (where `$CLI` invokes `@tgcloud/cli`):

```bash
npm install --no-audit --no-fund
$CLI push --force
$CLI migrate --safe
$CLI webhook sync
# Executed automatically if the OWNER_ID secret is set:
$CLI run handlers/message "{\"owner_id\":$OWNER_ID}" --ctx "{\"ci_bootstrap\":true}"
```

### Option 2 — Local CLI Deployment (`@tgcloud/cli`)

Run the following sequence from the repository root to authenticate, deploy code, apply safe additive migrations, and synchronize the webhook:

```bash
npm install
npx @tgcloud/cli login
npx @tgcloud/cli push
npx @tgcloud/cli migrate --safe
npx @tgcloud/cli webhook sync
```

:::note[`push` Never Modifies the Database]
`npx @tgcloud/cli push` uploads your JavaScript runtime bundle only and never alters SQLite tables. Always run `npx @tgcloud/cli migrate --safe` whenever schema changes are introduced.
:::

To seed ownership locally instead of relying on interactive Zero-State claiming, replace `123456789` with your numeric Telegram user ID and run the syntax matching your shell:

- **Bash / macOS / Linux:**

  ```bash
  npx @tgcloud/cli run handlers/message '{"owner_id":123456789}' --ctx '{"ci_bootstrap":true}'
  ```

- **Windows CMD:**

  ```cmd
  npx @tgcloud/cli run handlers/message "{\"owner_id\":123456789}" --ctx "{\"ci_bootstrap\":true}"
  ```

- **Windows PowerShell:**

  ```powershell
  npx @tgcloud/cli run handlers/message '{\"owner_id\":123456789}' --ctx '{\"ci_bootstrap\":true}'
  ```

## 3. Ownership Initialization Paths

Telegram Uploader Bot supports two distinct ownership initialization flows:

| Path | How It Works | When to Use |
| :--- | :--- | :--- |
| **Zero-Touch CI/CD Seeding *(Recommended)*** | Setting `OWNER_ID` in CI (or running `--ctx '{"ci_bootstrap":true}'` locally) idempotently seeds `system_config.owner_id` before any Telegram user messages the bot. | Production and team deployments where ownership must be locked from second zero. |
| **Zero-State Interactive Claim** | When deployed without `OWNER_ID` (`system_config.owner_id = 0`), the bot enters a fail-closed Zero-State (`bot_uninitialized`) and blocks public use until the first user sends `/setbotowner` in private chat to atomically claim ownership. | Quick personal setups where CI secrets or local CLI `run` seeding were omitted. |

:::caution[Claim Ownership Immediately After Deploy]
Either configure `OWNER_ID` in GitHub Actions / local CLI before exposing your bot username, or open a private chat with the bot and send `/setbotowner` immediately after deployment. Leaving a live bot in Zero-State (`owner_id = 0`) allows the first private user who runs `/setbotowner` to claim root ownership.
:::

## Next Steps

- [Uploads, Delivery & Protection](/projects/telegram-uploader-bot/features-delivery/) — Configure storage mirroring, protection rules, rotation, and Force-Join gates.
- [Roles, Security & Operations](/projects/telegram-uploader-bot/roles-security/) — Understand RBAC permissions, rate limits, and two-step ownership transfer.
- [Commands & Configuration](/projects/telegram-uploader-bot/commands-config/) — Review every setup, bundle, and administration command.
