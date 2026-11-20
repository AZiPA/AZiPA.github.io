---
title: Configuration, Schema & API
description: Reference for WIDGET_CONFIG constants, 3 update handlers, widget_query router workaround, 2 SQLite tables, 3 fail-closed Mini App endpoints, and MPL-2.0.
---

**Telegram Widget Bot** runs entirely inside Telegram Serverless V8 isolates backed by `2` SQLite tables (`tgcloud/schema.js`), `3` update handlers (`tgcloud/handlers/`), and `3` fail-closed Mini App API endpoints (`tgcloud/endpoints/`). Note that `tgcloud.jsonc` configures **no** `"static"` Mini App frontend.

## 1. Runtime Configuration (`tgcloud/lib/widgets/config.js`)

Runtime flags and limits live in `WIDGET_CONFIG` (`tgcloud/lib/widgets/config.js`), alongside `cache_time` bounds enforced in `state-mutator.js` and `sender.js`:

| Setting / Constant | Default | Behavior |
| :--- | :--- | :--- |
| `ALLOW_SHARED_WIDGETS` | `false` | Forces `is_shared: false` on polls (storing per-message counts in `widget_instances`) and strips shared fields in `/api/widgetQuery` when `false`. |
| `ALLOW_GROUP_WIDGETS` | `false` | Restricts widget commands and `/start` deep links to private chats when `false`. |
| `INSTANCE_TTL_SECONDS` | `604800` (`7` days) | Age threshold after which tracked rows in `widget_instances` are automatically pruned during tracked sends. |
| `ALLOW_CUSTOM_HTML_UPLOAD` | `true` | Enables private-chat `.html`, `.htm`, and `text/html` document validation and widget launching. |
| `MAX_UPLOAD_FILE_BYTES` | `65536` (`64 KB`) | Pre-download file size limit protecting the V8 isolate's 3-second CPU execution budget. |
| `CUSTOM_UPLOAD_ADMIN_IDS` | `[]` | Optional Telegram user ID allowlist for custom `.html` uploads; an empty array `[]` allows all private-chat users. |
| `cache_time` bounds | `0` or `[5, 3600]` s (`sender.js` fallback `10` s) | `state-mutator.js` clamps widget `cache_time` values to `0` or `5`–`3600` seconds before sending or editing. |

## 2. Three Update Handlers & `widget_query` Routing (`tgcloud/handlers/`)

| Handler File | Update Type | Responsibility |
| :--- | :--- | :--- |
| `message.js` | `message` | Dispatches `/start`, `/help`, `/share`, `/timer`, `/poll`, `/duel`, private `.html` document uploads (`upload-widget.js`), and intercepts `widget_query` / `shared_widget_query` via `widget-query-router.js`. |
| `callback_query.js` | `callback_query` | Processes `share_new:<type>` launch buttons, `wg:<data>` fallback bridges, and intercepts `widget_query` / `shared_widget_query` via `widget-query-router.js`. |
| `inline_query.js` | `inline_query` | Filters registered widgets by `type`, `title`, or `description` and returns `article` cards (`cache_time: 1`, `is_personal: true`) with `https://t.me/<bot>?start=launch_<type>` deep links. |

:::note[Why `widget-query-router.js` Intercepts Queries in Two Handlers]
`npx tgcloud webhook sync` builds Telegram's `allowed_updates` list directly from filenames inside `tgcloud/handlers/` (`message`, `callback_query`, `inline_query`). Because `@tgcloud/cli 0.2.0` does not yet recognize `handlers/widget_query.js` or `handlers/shared_widget_query.js`, `widget-query-router.js` checks incoming updates inside `message.js` and `callback_query.js`, complemented by `wg:<data>` inline keyboard bridges and `POST /api/widgetQuery`.
:::

## 3. SQLite Database Schema (`tgcloud/schema.js`)

Telegram Serverless SQLite runs with `PRAGMA foreign_keys` disabled (calling `.references()` or `foreignKey()` throws), and schema updates use additive migrations via `npx tgcloud migrate --safe`.

| Table | Primary Key | Columns & Indexes | Lifecycle Notes |
| :--- | :--- | :--- | :--- |
| `shared_widgets` | `widget_id` (`TEXT`) | `type`, `public_data` (`JSON`), `revision` (def `1`), `cache_time` (def `30`), `allow_queries` (def `false`), `created_by`, `created_at`, `updated_at`. Index: `idx_shared_widgets_type` (`type`). | Used by shared widgets (e.g., `poll` when `ALLOW_SHARED_WIDGETS` is `true`). |
| `widget_instances` | `id` (`INT` auto-inc) | `type`, `chat_id`, `message_id`, `inline_message_id`, `widget_id`, `is_shared` (def `false`), `allow_queries` (def `true`), `chat_data` (`JSON`), `public_data` (`JSON`), `revision` (def `1`), `created_at`, `updated_at`. Indexes: `uidx_widget_chat_msg` (unique `chat_id, message_id`), `uidx_widget_inline_msg` (unique `inline_message_id`), `idx_widget_instances_wid` (`widget_id`). | Automatically pruned on tracked sends after `7` days (`INSTANCE_TTL_SECONDS`); skipped entirely for offline widgets (`timer`). |

## 4. Mini App HTTP Endpoints (`tgcloud/endpoints/`)

All `3` Mini App `POST /api/*` routes are **fail-closed**: each handler validates `ctx?.initData?.user` first and throws `EndpointError('Unauthorized', { code: 'UNAUTHORIZED' })` if the authenticated Telegram user object is missing.

| Endpoint | Request Payload | Security & Behavior | Response |
| :--- | :--- | :--- | :--- |
| `POST /api/listWidgets` | *(none)* | Reads the auto-generated registry after `initData.user` verification. | `{ definitions: [...] }` |
| `POST /api/sendWidget` | `{ type, params? }` | Pins `chatId` and `createdBy` strictly to `user.id` (private chat only). | `{ messageId }` |
| `POST /api/widgetQuery` | `{ query, isSharedCopy? }` | Forces `from: user` and strips shared widget fields when `!ALLOW_SHARED_WIDGETS`. | `{ result }` |

## 5. License & Next Steps

**Telegram Widget Bot** is released under the **Mozilla Public License 2.0 (`MPL-2.0`)**.

- [Overview & Highlights](/projects/telegram-widget-bot/) — Return to the high-level architecture and capabilities summary.
- [Setup & Deployment](/projects/telegram-widget-bot/setup/) — Review `@BotFather` settings and single-secret GitHub Actions deployment.
- [Widgets, Commands & Uploads](/projects/telegram-widget-bot/widgets-commands/) — Review all commands, built-in widgets, and custom `.html` validation rules.
- [Widget Engine & Authoring](/projects/telegram-widget-bot/widget-engine/) — Author new widgets and check Profile 1 budgets.
