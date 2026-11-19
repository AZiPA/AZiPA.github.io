---
title: Uploads, Delivery & Protection
description: Media uploads, 1-subrequest storage channel bulk copy, SHA-256 passcodes, Bot API 9.4 UI, cron auto-delete, link rotation, and Force-Join.
---

**Telegram Uploader Bot (Cloudflare Workers)** combines single-row JSON bundle persistence, 1-subrequest Telegram bulk copying, Web Crypto SHA-256 passcodes, and cron-driven lifecycles engineered for Cloudflare Workers' edge runtime.

## 1. Supported Media Types & Upload Sessions

- **6 Supported Media Types:** `document`, `video`, `audio`, `photo` (highest resolution selected automatically), `animation`, and `voice`.
- **Upload Flows & Limits:**
  - `/upload` starts a single-file upload session.
  - `/batch` starts a multi-file session accepting up to **20 items per session** (`MAX_PER_SESSION_UPLOAD = 20`), committed with `/done` or discarded with `/cancel`.
  - `/edit <code>` and `/review <code>` let authorized admins inspect or append files using atomic Compare-And-Swap mutations (with an inline `/del_<index>` helper inside review flows).
  - **Hard Ceilings & Timeout:** Each bundle holds up to **25 items** (`MAX_BUNDLE_ITEMS = 25`), and open upload sessions expire after **600 seconds (10 minutes)** of inactivity.

## 2. Storage Channel Mirroring & 1-Subrequest Bulk Delivery

When `STORAGE_CHANNEL_ID` is configured, uploaded items mirror immediately to the storage channel via `api.copyMessage()` and persist their `storage_message_id` inside the `bundles.items` JSON column:

- **1-Subrequest Bulk Copy:** Whenever every item in a 10-item delivery slice has a valid `storage_message_id`, the bot delivers all 10 items in **1 single Bot API subrequest** via `api.copyMessages()`.
- **Automatic Dual Fallback:** If `api.copyMessages()` hits HTTP 403 or a partial copy failure, the bot emits a `LoggerService.alert` and falls back to sequential `file_id` delivery. Conversely, if an individual `file_id` fails during sequential delivery, the bot falls back to copying from the storage channel mirror.

## 3. Link Formats & Direct PIN Deep Links

| Access Pattern | Link / Code Format | Generation & Upgrade Rule |
| :--- | :--- | :--- |
| **Standard Public Bundle** | **8-character Base62** (`https://t.me/<BOT_USERNAME>?start=<code>`) | Generated with `crypto.getRandomValues` |
| **Protected, Rotated, One-Time, or PIN-Locked** | **36-character RFC 4122 UUID v4** (`crypto.randomUUID()`) | Automatically upgrades existing Base62 codes on activation |
| **Direct PIN Unlock Link** | `https://t.me/<BOT_USERNAME>?start=<code>_<pin>` | Unlocks a passcode-protected bundle in one tap without prompting |

## 4. Chunked Delivery, Bot API 9.4 UI & Community Voting

- **10-Item Chunks:** Large bundles paginate in slices of **10 items** (`CHUNK_DELIVERY_SIZE = 10`) using callback `dl:p:<code>:<offset>`.
- **Bot API 9.4 Colored Buttons:** Supports native `primary`, `success`, and `danger` button styles (`coloredButtons: true`) alongside `Re-download`. Custom emoji button icons (`customEmojiIconsEnabled`) default to `false` to prevent Telegram HTTP 400 errors when emoji assets are unavailable.
- **Like / Dislike Voting (`bundle_votes`):** Displays `👍 / 👎` voting buttons on standard multi-user bundles; voting is automatically omitted on `protect_content`, `is_one_time`, and paginated bundles.

## 5. Content Protection, SHA-256 Passcodes, TTL & One-Time Burn

### Native Content Protection

Setting `protect_content` per bundle or globally (`global_protect_content`) blocks message forwarding and saving, and forces the bundle link to a 36-character UUID v4.

### SHA-256 PIN Password Protection (`/setpass`)

Protect sensitive bundles with `/setpass <code> <pin|off|clear>`:

- **Web Crypto Hashing:** Accepts **4–32 character PINs**, stored as a native **SHA-256** digest of `${code}:${pin}` and automatically enforces UUID links + `protect_content`.
- **Unlock & Anti-Brute-Force Lockout:** Recipients unlock via `/start <code>_<pin>` or an interactive force-reply prompt. **5 failed PIN attempts trigger a 30-minute block** (incurring 0 D1 writes during lockout) and send an alert to the log channel.
- **Active Passcode Quotas:** **5** active passcode bundles per Admin, **15** per Super Admin, and an advisory warning at **20** for the Owner.

### Cron Auto-Delete, Bundle TTL & One-Time Burn

- **Auto-Delete (`/setautodel <seconds>`):** Accepts `0` (off) or `10`–`172800` seconds. Delivered message IDs enter `deletion_queue` and are swept every minute by the Cloudflare Cron trigger (`LIMIT 25` queue items per tick, up to 100 messages per `api.deleteMessages` call).
- **Expiring Bundles (`/setexpiry` / `/setbundlettl`):** Expired links immediately return `bundle_expired` with **0 D1 writes**.
- **One-Time Burn Bundles (`is_one_time`):** Uses an atomic Compare-And-Swap reservation (`consumed_by = userId`) with a **15-minute claim window**, then permanently deletes the bundle and associated votes once the final chunk finishes delivering.

## 6. Link Rotation & Channel Publishing

- **Channel Publishing (`/postbundle <code> [channel_id]`):** Publishes or refreshes a bundle announcement card with deep-link buttons. Enforces publish cooldowns of **300 seconds** for Admins and an advisory **60 seconds** for the Owner.
- **Manual & Cron Link Rotation:** Manual `/rotatelink <code>` or the **15-minute cron** auto-rotator issues a fresh UUID and updates the published channel post's button via `api.editMessageReplyMarkup()` (auto-disables rotation on HTTP 400/403).
- **Rotation Quotas:** **3** rotating bundles per Admin, **10** per Super Admin, **10** per channel, and an advisory warning at **20** for the Owner.

## 7. Force-Join Gatekeeping

Require membership across up to **8 channels** (`MAX_FORCE_JOIN_CHANNELS = 8`) before delivering bundle contents:

- **6-Socket Waves (Fail-Closed):** Verifies memberships in concurrent waves of at most **6** outgoing connections (`MEMBERSHIP_CONCURRENCY = 6`) and fails closed on network or flood errors.
- **Cooldown & Target Join Limits:** Enforces a **3-second** verify button cooldown (`FORCE_JOIN_THROTTLE_SEC = 3`), supports custom verify button text via `/setverifybtn <label>`, and automatically deactivates a channel once its target join limit is reached.

## Next Steps

- [Roles, Security & Operations](/projects/telegram-uploader-bot-cloudflare/roles-security/) — Review the 5-level role quota matrix, `OWNER_ID` auth, and `/restore` backups.
- [Commands & Configuration](/projects/telegram-uploader-bot-cloudflare/commands-config/) — Browse every primary command, `Env` secret, and `src/config.ts` constant.
- [Architecture, D1 Schema & Cron](/projects/telegram-uploader-bot-cloudflare/architecture/) — Inspect the minute/15-minute/weekly cron pipeline and D1 tables.
