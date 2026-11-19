---
title: Commands & Configuration
description: Role-grouped primary commands, Cloudflare Worker Env bindings, dynamic system_config keys, and runtime constants for the Cloudflare edition.
---

All administrative commands execute exclusively inside private chats (`ctx.chat.type === "private"`), protected by `commandGuardMiddleware` according to the 5-level role rank.

## Primary Commands (Grouped by Role)

### Public Commands (Rank 0 — User)

| Command | Description |
| :--- | :--- |
| `` `/start [code\|code_pin]` `` | Greets the user, delivers a bundle by `code`, or directly unlocks a PIN-locked bundle via `code_pin`. |
| `/help` | Displays role-appropriate help and usage guidance. |

### Admin Commands (Rank 2 — Admin & Higher)

| Command | Description |
| :--- | :--- |
| `/upload` | Starts a single-file upload session. |
| `/batch` | Starts a multi-file upload session (up to `20` items per session, `25` max per bundle). |
| `/done` | Commits an active upload or edit session and returns the bundle deep link. |
| `/cancel` | Cancels an active upload, edit, or interactive prompt session. |
| `/edit <code>` | Opens an existing bundle to append items or edit settings via atomic Compare-And-Swap. |
| `/review <code>` | Inspects bundle metadata and items (supports inline `/del_<index>` removal helpers during active review/edit). |
| `` `/setname <code> <title\|clear>` `` | Sets or clears a display title on an existing bundle. |
| `/search <query>` | Searches bundles with Arabic/Persian character normalization. |
| `/stats` | Shows system download, user, and bundle statistics (cached in memory for `5` minutes). |
| `/top` | Lists the highest-downloaded bundles. |
| `/channels` | Opens the Force-Join channel management view. |
| `` `/addchannel <id\|forward> [limit] [btn]` `` | Adds a Force-Join channel by ID or forwarded post with optional target join limit and button label. |
| `/delchannel <channel_id>` | Removes a Force-Join channel from gatekeeping. |
| `/setchannelbtn <id> <label>` | Updates the inline join button label for a Force-Join channel. |
| `/setverifybtn <label>` | Customizes the Force-Join verification button text. |
| `/setexpiry <code> <duration>` | Sets or updates a bundle's expiration duration. |
| `` `/setpass <code> <pin\|off\|clear>` `` | Sets a 4–32 character SHA-256 PIN on a bundle or removes password protection. |
| `/postbundle <code> [channel_id]` | Publishes or updates a bundle download post in `[channel_id]` or `pub_channel_id`. |
| `/rotatelink <code>` | Rotates a bundle's access link to a new UUID and syncs any published channel post button. |

### Super Admin Commands (Rank 3 — Super Admin & Owner)

| Command | Description |
| :--- | :--- |
| `/botprofile` | Opens bot profile configuration controls. |
| `/settings` | Displays and updates global bot configuration settings. |
| `/setdailylimit <count>` | Configures the standard daily user download quota (`daily_limit`). |
| `` `/setpubchannel <-100...\|off\|clear>` `` | Sets, disables, or clears the default public channel for `/postbundle`. |
| `/admins` | Lists configured Admins and Super Admins. |
| `/addadmin <user_id> [role]` | Promotes `<user_id>` to `admin` or `super_admin` (regular admins capped at `MAX_ADMINS = 10`). |
| `/deladmin <user_id>` | Revokes Admin or Super Admin privileges from `<user_id>`. |
| `/ban <user_id> [days]` | Bans a user for `1–3650` days (or permanently if omitted). |
| `/unban <user_id>` | Lifts an active user ban. |
| `/addvip <user_id> [days]` | Grants VIP status for `[days]` days or lifetime (`expires_at = 0`). |
| `/vips` | Lists active VIP users and expiration dates. |
| `` `/delvip <user_id\|all>` `` | Removes VIP status from `<user_id>` or clears all VIP records. |
| `/clearvips` | Clears every entry in the `vips` table. |

### Owner Commands (Rank 4 — Owner Only)

| Command | Description |
| :--- | :--- |
| `/maintenance` | Toggles zero-write maintenance mode on or off for non-admins. |
| `/setfilelimit <count>` | Sets the per-link download limit (`file_daily_limit`). |
| `/setautodel <seconds>` | Sets ephemeral auto-delete delay (`0` for off, or `10`–`172800` seconds). |
| `/setbundlettl <duration>` | Sets the default expiration TTL for newly created bundles. |
| `` `/setlogchannel <id\|owner\|off>` `` | Routes operational alerts and backups to a channel (`-100...`), Owner DM (`owner`), or disables logging (`off`). |
| `/factoryreset confirm` | Exports a JSON backup of `system_config` and `force_channels`, then wipes runtime D1 data. |
| `/restore` | Reply to a `.json` backup file (up to `256 KB`) to atomically restore `system_config` and `force_channels`. |

## Cloudflare Worker `Env` Bindings & Secrets

| Binding / Secret | Type | Purpose |
| :--- | :--- | :--- |
| `DB` | D1 Database | Binding to Cloudflare D1 (`filestore-db`). |
| `FILESTORE_ANALYTICS` | Analytics Engine | Binding to `filestore_analytics` dataset for edge telemetry and alerts. |
| `BOT_TOKEN` | Secret *(Required)* | Telegram Bot API HTTP token. |
| `OWNER_ID` | Secret *(Required)* | Numeric Telegram ID (`1–15` digits) identifying Rank 4 Owner. |
| `WEBHOOK_PATH` | Secret *(Required)* | Secret HTTP route suffix for `POST /<WEBHOOK_PATH>`. |
| `WEBHOOK_SECRET` | Secret *(Required)* | Secret token (`>= 16` chars) verified against `X-Telegram-Bot-Api-Secret-Token`. |
| `BOT_USERNAME` | Secret / Var *(Recommended)* | Skips cold-start `getMe` call when generating deep links. |
| `BOT_FIRST_NAME` | Var *(Optional)* | Fallback bot display name (`"File Store Bot"`). |
| `STORAGE_CHANNEL_ID` | Secret / Var *(Optional)* | Private channel ID (`-100...`) enabling upload mirroring and 1-subrequest `copyMessages()`. |
| `LOG_CHANNEL_ID` | Secret / Var *(Optional)* | Private log channel ID (`-100...`) for alerts and backup exports. |
| `ENABLE_QUOTA_CACHE` | Var *(Optional)* | Set to `"false"` to bypass the 5-minute in-memory quota cache. |

## Dynamic `system_config` Keys

| Key | Purpose |
| :--- | :--- |
| `maintenance_mode` | Enables zero-write maintenance lock for non-admins. |
| `daily_limit` | Standard Rank 0 daily download limit (default `10`; VIPs receive `5×`). |
| `file_daily_limit` | Standard Rank 0 per-link download limit (default `3`; VIPs receive `3×`). |
| `auto_delete_seconds` | Default auto-delete timer (`0` or `10`–`172800`s) queued into `deletion_queue`. |
| `bundle_ttl_seconds` | Default expiration window applied to newly created bundles. |
| `global_protect_content` | Enforces `protect_content` globally across new bundles. |
| `log_channel_id` | Runtime override for operational alerts and `/factoryreset` JSON exports. |
| `pub_channel_id` | Default channel targeted by `/postbundle`. |
| `fj_verify_btn_text` | Custom label for the Force-Join verification inline button. |
| `bot_lang` | Default interface language (`en` or `fa`). |

## Hardcoded Runtime Constants (`src/config.ts`)

Defined across `LIMITS`, `UI_CONFIG`, `QUOTA_CACHE_CONFIG`, and `LOGGING_CONFIG` in `src/config.ts`:

| Group / Constant | Value | Role |
| :--- | :--- | :--- |
| `LIMITS.MAX_PER_SESSION_UPLOAD` | `20` | Maximum items uploaded in one `/batch` session. |
| `LIMITS.MAX_BUNDLE_ITEMS` | `25` | Absolute ceiling of items per bundle. |
| `LIMITS.CHUNK_DELIVERY_SIZE` | `10` | Items delivered per chunk (`dl:p:<code>:<offset>`). |
| `LIMITS.SESSION_TIMEOUT_SEC` | `600` | Inactivity timeout (`10` minutes) for open upload/edit sessions. |
| `LIMITS.MAX_FORCE_JOIN_CHANNELS` | `8` | Maximum configured Force-Join channels. |
| `LIMITS.MEMBERSHIP_CONCURRENCY` | `6` | Maximum simultaneous outgoing sockets for Force-Join verification. |
| `LIMITS.FORCE_JOIN_THROTTLE_SEC` | `3` | Cooldown between Force-Join check clicks. |
| `LIMITS.MAX_ADMINS` | `10` | Maximum regular Admins manageable by Super Admins. |
| `LIMITS.PASSCODE_MAX_ATTEMPTS` | `5` / `1800`s | Brute-force lockout threshold (`5` failures → `30`-minute block). |
| `UI_CONFIG.coloredButtons` | `true` | Enables Bot API 9.4 `primary`, `success`, and `danger` button colors. |
| `UI_CONFIG.customEmojiIconsEnabled` | `false` | Disabled by default to avoid Telegram HTTP 400 errors on missing custom emojis. |
| `QUOTA_CACHE_CONFIG` | `300`s (`5` min) | In-memory `CappedMap` quota & stats cache window (toggleable via `ENABLE_QUOTA_CACHE`). |
| `LOGGING_CONFIG` | `3600`s cooldown | Deduplicates `isD1FreeTierError()` alerts with a 1-hour alert cooldown. |

## Next Steps

- [Roles, Security & Operations](/projects/telegram-uploader-bot-cloudflare/roles-security/) — Review role permissions, rate limits, and `/restore` backup rules.
- [Architecture, D1 Schema & Cron](/projects/telegram-uploader-bot-cloudflare/architecture/) — Examine the 10 D1 tables, 2 SQL triggers, and cron schedule.
- [Uploads, Delivery & Protection](/projects/telegram-uploader-bot-cloudflare/features-delivery/) — See how `protect_content`, `/setpass`, and Force-Join work together.
