---
title: Roles, Security & Operations
description: 5-level RBAC and quota matrix, secret-only OWNER_ID auth, maintenance mode, 3-req/5s rate limiter, and atomic JSON backup and /restore.
---

**Telegram Uploader Bot (Cloudflare Workers)** enforces a five-rank RBAC model backed by D1 SQL quota triggers, Worker-secret owner verification, sliding-window isolate rate limiting, and atomic JSON configuration restore.

## 1. Five-Level Role & Quota Matrix

| Rank | Role | Daily / Per-Link Download Quota | Active Bundle Caps & Privileges |
| :--- | :--- | :--- | :--- |
| **Rank 4** | **Owner** | **Unlimited** *(exempt from `user_downloads`)* | Full system control (`/maintenance`, `/setfilelimit`, `/setautodel`, `/setbundlettl`, `/setlogchannel`, `/factoryreset confirm`, `/restore`), appoints/revokes Super Admins, overrides bundle locks, advisory warnings at `20` passcode / `20` rotating bundles. Cannot be banned or demoted. |
| **Rank 3** | **Super Admin** | **150** daily / **20** per-link | Up to **15** passcode & **10** rotating bundles; manages `/settings`, `/setdailylimit`, `/setpubchannel`, `/botprofile`, regular Admins (up to `MAX_ADMINS = 10`), user bans (`/ban` `1–3650` days, `/unban`), and VIPs (`/addvip`, `/vips`, `/delvip`, `/clearvips`). |
| **Rank 2** | **Admin** | **150** daily / **20** per-link | Up to **5** passcode & **3** rotating bundles; runs `/upload`, `/batch`, `/edit`, `/review`, `/setname`, `/search` *(Arabic/Persian normalized)*, `/stats` *(5-min cache)*, `/top`, `/postbundle`, `/rotatelink`, `/setexpiry`, `/setpass`, and Force-Join `/channels`. |
| **Rank 1** | **VIP** | **5× standard daily (`50`)** / **3× standard per-link (`9`)** | Recorded in `vips` with finite days or lifetime (`expires_at = 0`); receives multiplied quotas with zero admin privileges. |
| **Rank 0** | **User** | **10** daily / **3** per-link *(default, enforced by D1 SQL triggers)* | Standard public user via `/start` and `/help`; subject to Force-Join gates, D1 quota triggers, and rate limiting. |

## 2. Secret-Only Owner Authentication (`OWNER_ID`)

Root ownership is verified exclusively against the mandatory Worker secret:

- `ctx.isOwner = userId === Number(ctx.env.OWNER_ID)`
- During deployment, `OWNER_ID` is seeded into the D1 `admins` table as `'owner'`.
- Ownership cannot be claimed or transferred interactively inside Telegram—rotating the Owner requires updating the `OWNER_ID` Worker secret and re-seeding the database.

## 3. Fail-Closed Edge Guards & Rate Limiting

- **Webhook Secret Authentication:** Incoming requests to `POST /<WEBHOOK_PATH>` must supply the matching `X-Telegram-Bot-Api-Secret-Token` header; mismatched paths/methods return `404 Not Found` and invalid tokens return `403 Forbidden`.
- **Private Chat Enforcement:** All updates strictly require `ctx.chat.type === "private"`.
- **Zero-Write Maintenance Mode (`/maintenance`):** When enabled, non-admin requests receive a maintenance response immediately with **0 D1 writes**.
- **Pre-Routing Command Guard:** `commandGuardMiddleware` drops unauthorized or out-of-rank commands before any handler logic runs.
- **Sliding-Window Rate Limiter & Ban Pre-Filter:** `rateLimitMiddleware` enforces **3 requests per 5 seconds**, triggering a **60-second in-memory isolate ban** on bursts. Globally banned users (`user_quotas`) are dropped directly inside `fetch` before invoking grammY middleware.

## 4. Backup, Factory Reset & Atomic `/restore`

- **Factory Reset with Automatic Backup (`/factoryreset confirm`):** Before wiping runtime tables, the bot exports a JSON configuration backup containing `system_config` and `force_channels` to the configured log channel or Owner DM.
- **Atomic Configuration Restore (`/restore`):** Reply directly to a `.json` backup document (up to **256 KB**) with `/restore` to atomically overwrite `system_config` and `force_channels` in D1.

:::caution[Backup Scope]
`/factoryreset confirm` exports and `/restore` restores portable configuration (`system_config` and `force_channels`)—not uploaded `bundles` or user download histories.
:::

## Next Steps

- [Commands & Configuration](/projects/telegram-uploader-bot-cloudflare/commands-config/) — View the full primary command reference, `Env` bindings, and `src/config.ts` defaults.
- [Architecture, D1 Schema & Cron](/projects/telegram-uploader-bot-cloudflare/architecture/) — Inspect the 10 D1 tables, 2 SQL quota triggers, and Analytics Engine integration.
- [Setup & Deployment](/projects/telegram-uploader-bot-cloudflare/setup/) — Review required Worker secrets and D1 seeding commands.
