---
title: Roles, Security & Operations
description: 5-level RBAC hierarchy, fail-closed guards, sliding-window rate limiter, two-step ownership transfer, SQLite console, and factory reset.
---

**Telegram Uploader Bot (Telegram Serverless)** enforces strict, fail-closed access control across a five-level role hierarchy, protecting administrative commands, user quotas, and SQLite data integrity.

## 1. Five-Level Role Hierarchy (RBAC)

| Level | Role | Privileges & Capabilities | Quotas & Restrictions |
| :--- | :--- | :--- | :--- |
| **Level 4** | **Owner (`owner`)** | Root superuser. Full control over `/setbotowner`, `/transfer_ownership`, `/maintenance`, `/factoryreset`, `/setstoragechannel`, `/export_config`, `/import_config`, `/sql`, `/terminal` (`/console`), promoting/demoting SuperAdmins and Admins, unlocking `owner_locked` bundles, and toggling custom emojis. | Bypasses maintenance mode, download quotas, rate limits, and Force-Join checks. |
| **Level 3** | **SuperAdmin (`super_admin`)** | Promotes and demotes regular Admins (`/addadmin`, `/deladmin`), configures log channels (`/setlogchannel`), edits bot profile settings (`/botprofile`), and manages `owner_locked` flags. | Bypasses quotas and Force-Join; capped at `10` rotating bundles (`MAX_ROTATING_SUPERADMIN`). |
| **Level 2** | **Admin (`admin`)** | Uploads and edits bundles, configures Force-Join channels, adjusts general settings, manages VIPs and bans, and views analytics (`/stats`, `/top`). | Bypasses quotas and Force-Join; capped at `MAX_ADMINS = 10` regular admins and `3` rotating bundles (`MAX_ROTATING_ADMIN`). |
| **Level 1** | **VIP (`vip`)** | Recorded in `vips` with either a finite duration (days) or lifetime status. | Unlimited downloads and bypasses Force-Join gates; zero administrative privileges. |
| **Level 0** | **User (`user`)** | Public recipient using `/start [code]`, `/help`, and `/cancel`. | Subject to daily download limits, sliding-window rate limits, and Force-Join gates. |

## 2. Fail-Closed Guards & Session Safety

- **Zero-State Uninitialized Lock (`bot_uninitialized`):** If deployed without `OWNER_ID` (`system_config.owner_id = 0`), all normal interactions fail closed until an operator claims ownership via `/setbotowner` in private chat or runs CI bootstrap.
- **Private Chat Only (`private_only`):** Commands and admin workflows operate strictly inside private chats; group and channel messages do not trigger bot commands.
- **Maintenance Mode (`/maintenance`):** When enabled, all non-owners are blocked from downloading or interacting with the bot while the Owner retains full diagnostic and management access.
- **Session TTL & Command Breakout:** Interactive admin prompts stored in `admin_sessions` expire automatically after **300 seconds** (`5` minutes). Sending any message beginning with `/` triggers an immediate **Command Breakout**, exiting the active prompt cleanly so an admin never gets stuck in an input loop.

## 3. Sliding-Window Rate Limiter & Lockouts

To prevent spam and webhook flooding, the sliding-window rate limiter enforces a **20 messages/minute** baseline (`rateLimitMessagesPerMin = 20`) with strike escalation:

- Repeated rate-limit violations increment user strikes up to **`MAX_STRIKES = 5`**.
- Reaching 5 strikes imposes an automatic **30-minute lockout** (`LOCKOUT_DURATION_SEC = 1800`).

## 4. Two-Step Ownership Transfer

Transferring root ownership requires explicit confirmation and leaves zero residual permissions for the outgoing owner:

1. **Initiate Transfer:** The current Owner runs `/transfer_ownership <target_id>`, generating a cryptographically random 8-character Base62 token stored in `pending_owner_transfer` with a **60-second TTL** (`transferTokenTtlSec = 60`).
2. **Confirm Transfer:** Clicking the confirmation button (`confirm_xfer:<token>`) within 60 seconds atomically promotes `<target_id>` to Owner, reassigns existing child admins and VIPs to the new owner, and **completely deletes** the former owner's row from `admins`—guaranteeing **zero residual privileges**.

## 5. SQLite Console, Factory Reset & Restore Status

### Owner SQLite Console (`/sql` & `/terminal`)

The Owner can inspect and query the live SQLite database directly inside Telegram:

- **One-Off Queries:** `/sql <query>` executes a statement immediately and formats results up to a **40-row preview cap** (`sqlConsoleMaxRows = 40`).
- **Interactive Terminal:** `/terminal` (alias `/console`) opens an interactive SQL REPL session with an automatic **10-minute inactivity timeout**.

### Factory Reset (`/factoryreset`)

Running `/factoryreset` prompts for confirmation and wipes all runtime data (bundles, admins, VIPs, quotas, Force-Join channels, sessions, and delivery ledgers) back to factory defaults while **preserving the current Owner record**.

:::note[`/restore` Currently Not Available]
The `/restore` command is present as a guarded stub that returns `restore_not_available` because full database backup restore is not active in this Telegram Serverless edition. Use `/export_config` and `/import_config` to back up and migrate `system_config` settings, and `/sql` for direct inspection.
:::

## Next Steps

- [Commands & Configuration](/projects/telegram-uploader-bot/commands-config/) — Complete reference of every command, `system_config` field, and constant.
- [Architecture & SQLite Schema](/projects/telegram-uploader-bot/architecture/) — Review the 3 update handlers and 21 SQLite tables behind these guards.
- [Setup & Deployment](/projects/telegram-uploader-bot/setup/) — Revisit CI `OWNER_ID` bootstrapping and Zero-State initialization.
