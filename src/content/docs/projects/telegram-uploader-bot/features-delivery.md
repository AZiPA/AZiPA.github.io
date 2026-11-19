---
title: Uploads, Delivery & Protection
description: Single and batch uploads, 8 media types, storage channel fallback, chunked delivery, content protection, link rotation, and Force-Join gates.
---

**Telegram Uploader Bot (Telegram Serverless)** manages media ingestion, durable storage mirroring, idempotent chunked delivery, ephemeral expiration, and Force-Join verification without external queues or servers.

## 1. Single & Batch Upload Sessions

- **Single Upload (`/upload`):** Prompts the admin for one file and immediately generates a shareable bundle deep link.
- **Batch Upload (`/batch`):** Starts a multi-item session allowing up to **25 items** per bundle (`MAX_BUNDLE_ITEMS = 25`, `MAX_PER_SESSION_UPLOAD = 25`).
- **Atomic Album Grouping:** Incoming media groups (albums) and multi-message batches are persisted atomically across `upload_sessions` and `upload_items`.
- **Commit or Abort:** Send `/done` to finalize the batch and receive the deep link, `/del_<idx>` to drop an uploaded item during staging, or `/cancel` to discard the active upload session.

## 2. Supported Media Types & Dynamic Allowlist

The bot handles **8 Telegram media types**:

`photo` · `document` · `video` · `audio` · `voice` · `video_note` · `animation` · `sticker`

By default, `system_config.allowed_media_types` permits `['photo', 'document', 'video', 'audio']`. The Owner can dynamically enable or restrict any of the 8 types at runtime through the **Owner Media GUI** without redeploying code.

## 3. Storage Channel Mirroring & Resilient Fallback

Configuring a private storage channel via `/setstoragechannel <-100...>` adds durable redundancy to bundle delivery:

1. **Channel Requirements:** The bot must be an Administrator with `can_post_messages: true`, and the channel must **not** have `has_protected_content` enabled.
2. **Write-Time Mirroring:** Every uploaded item is copied to the storage channel via `api.copyMessage()`.
3. **Self-Healing Read Fallback:** During user delivery, the bot attempts direct `file_id` delivery first. If Telegram rejects a stale reference with a `source_dead` error (`FILE_REFERENCE_EXPIRED` or `wrong remote file identifier`), the bot automatically falls back to `api.copyMessages()` from the storage channel.
4. **Automatic Deactivation Guard:** If the bot's admin rights are revoked or forwarding/protection restrictions are enabled on the storage channel, mirroring automatically turns off (`storage_channel_active = 'false'`) and notifies the configured log channel.

## 4. Link Formats & Deep Links

Every bundle is addressable via a Telegram deep link (`https://t.me/<bot_username>?start=<code>`):

| Bundle Mode | Code Format | Generation Mechanism |
| :--- | :--- | :--- |
| **Standard Bundle** | **8-character Base62** (`[0-9a-zA-Z]{8}`) | Cryptographically random Base62 generator |
| **Protected Bundle (`protect_content`)** | **36-character RFC 4122 UUID v4** | `crypto.randomUUID()` |

## 5. Chunked Delivery & Idempotency

- **10-Item Delivery Chunks:** Bundles larger than 10 items deliver in slices of **10 items** (`CHUNK_DELIVERY_SIZE = 10`) annotated with pagination headers (`Part 1/3`) and an inline continuation button (`dl:p:o:<operation_id>:<offset>`).
- **Webhook Retry Safety:** Atomic concurrency leases in `router_updates` combined with the delivery ledger (`delivery_operations`, `delivery_attempts`, `delivery_items`, `delivery_quota_accounts`) ensure retried Telegram webhooks never send duplicate messages or double-charge user quotas.

## 6. Content Protection (`protect_content`)

Enabling content protection sets Telegram's native `protect_content: true` flag on delivered messages, blocking users from saving media to their gallery, copying text, or forwarding messages.

:::tip[Automatic UUID Link Elevation]
Enabling content protection on an existing 8-character Base62 bundle automatically upgrades its bundle code to a 36-character UUID v4. This invalidates previously leaked short codes so recipients cannot access the bundle under old links.
:::

## 7. Auto-Delete, Expiration (TTL) & One-Time Burn

- **Ephemeral Auto-Delete (`/setautodel <seconds>`):** Presets include `0` (disabled), `600` (10 min), `3600` (1 hour), and `86400` (24 hours). Delivered message IDs are queued in `deletion_queue` and swept in batches of up to `100` via `api.deleteMessages()` during opportunistic maintenance passes.
- **Bundle Expiration (TTL):**
  - **Per-Bundle:** `/setexpiry <code> <duration>` (for example `1h`, `6h`, `24h`, `7d`, or `off`).
  - **Global Default:** `/setbundlettl <hours>` (presets `0`, `24`, `72`, `168`).
- **One-Time Burn Bundles (`is_one_time`):** Atomically claimed in `delivery_claims` and permanently deleted as soon as all items in the bundle finish delivering to the first recipient.

## 8. Opportunistic Link Rotation & Channel Sync

Bundles can rotate their access codes manually or on a schedule (`3600` seconds [1h], `21600` seconds [6h], or custom intervals via `/rotatelink <code> [hours]`):

- **Live Channel Post Sync:** When a rotating bundle is published to a channel with `/postbundle`, rotating its link automatically edits the published post's inline URL button in real time via `api.editMessageReplyMarkup()`.
- **Rotation Quotas:** Enforced per creator and channel—**3** active rotating bundles per Admin (`MAX_ROTATING_ADMIN`), **10** per SuperAdmin (`MAX_ROTATING_SUPERADMIN`), and **10** per public channel (`MAX_ROTATING_PER_CHANNEL`).

## 9. Force-Join Gatekeeping

Require users to join up to **8** channels (`MAX_FORCE_JOIN_CHANNELS = 8`) before receiving files:

- **Bounded Concurrency Waves:** Membership verification runs in parallel batches of at most **6** outgoing requests (`MAX_OUTGOING_SOCKETS = 6`) to avoid exhausting serverless isolate socket limits.
- **Caching & Throttling:** Results are cached in isolate memory for **15 seconds** (up to `2,000` entries), and the inline verify button enforces a **3-second** cooldown (`FORCE_JOIN_THROTTLE_SEC = 3`).
- **Invite Link Hygiene:** Private invite links are created or revoked strictly during admin configuration or renewal—never regenerated on user download requests.

## 10. Community Voting & Custom Emoji Circuit Breaker

- **Bundle Voting:** Recipients can submit per-user like/dislike feedback stored in `bundle_votes`.
- **Self-Healing Custom Emojis:** Optional Telegram Premium `<tg-emoji>` formatting includes an automatic circuit breaker. If Telegram returns `ENTITY_CUSTOM_EMOJI_INVALID` (for example, when Premium emoji status expires), the bot automatically sets `premium_emojis_enabled = 'false'` in `system_config`, strips `<tg-emoji>` tags to standard Unicode, and sends an alert to the log channel.

## Next Steps

- [Roles, Security & Operations](/projects/telegram-uploader-bot/roles-security/) — Inspect the 5-level permission model, rate limits, and SQLite console.
- [Commands & Configuration](/projects/telegram-uploader-bot/commands-config/) — Look up exact command syntax and `system_config` options.
- [Architecture & SQLite Schema](/projects/telegram-uploader-bot/architecture/) — Examine the upload state machine and delivery ledger tables.
