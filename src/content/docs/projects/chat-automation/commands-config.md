---
title: Commands & Configuration
description: Reference for private-chat owner commands, View-Once Hybrid Smart Trigger rules, and tgcloud/lib/config.js runtime constants.
---

All administrative commands run inside your **private chat** with the bot. Runtime behavior is controlled by constants in `tgcloud/lib/config.js` together with persisted settings in SQLite.

## Owner Commands

:::note[Fail-Closed Private Access]
Commands only respond to the bootstrapped `owner_id` inside a private chat. Messages from non-owners and group chats are silently ignored.
:::

| Command | Behavior |
| :--- | :--- |
| `/start` | Clears the 10-minute topic fallback cooldown (`topics_disabled_until`) and displays the **🤖 Telegram Business Assistant Status** dashboard. |
| `/start bizChat<chatId>` | Deep-link form of `/start` that displays the **Contact Archive Summary** for that Business chat. |
| `/trigger` | Displays the current View-Once trigger text (default `.`), `/autodelete` state, and command usage. |
| `/trigger <text>` | Sets a custom single-line trigger text (`1–32` characters, matched case-insensitively). |
| `/trigger reset` | Resets the View-Once trigger text back to the default `.`. |
| `/autodelete` | Shows the current auto-delete status (enabled by default) and warns if `can_delete_all_messages` is missing. |
| `/autodelete on` | Enables automatic deletion of exact View-Once trigger replies via `deleteBusinessMessages`. |
| `/autodelete off` | Disables automatic deletion so exact trigger replies remain in the Business chat. |

## Runtime Configuration (`tgcloud/lib/config.js`)

| Constant | Default | Behavior |
| :--- | :--- | :--- |
| `RETENTION_DAYS` | `30` | Days before archived records in `messages` become eligible for opportunistic pruning. |
| `RAW_UPDATES_RETENTION_DAYS` | `3` | Days before entries in `raw_updates` are pruned during opportunistic cleanup. |
| `DEFAULT_VIEW_ONCE_TRIGGER` | `'.'` | Default exact reply string (case-insensitive) that triggers reply auto-deletion. |
| `MAX_TRIGGER_LENGTH` | `32` | Maximum character length permitted by `/trigger <text>`. |
| `DELETE_TRIGGER_REPLY` | `true` | Default state for automatically deleting exact trigger replies. |
| `CAPTURE_UNARCHIVED_REPLIES` | `true` | Allows capturing View-Once media on reply even if the original message was not archived beforehand. |
| `NOTIFY_UNARCHIVED_DELETES` | `true` | Reports pre-connection or unarchived deleted messages as a summary alert. |
| `MAX_DELETE_BATCH` | `25` | Maximum number of archived incoming messages processed per deletion update (excess triggers an overflow notice). |
| `MAX_GETFILE_BYTES` | `20971520` (`20 MB`) | Maximum file size in bytes when falling back to Bot API download and `InputFile` re-upload. |
| `DEBUG_RAW_UPDATES` | `false` | Opt-in flag to persist raw Telegram updates into `raw_updates` for diagnostics. |

## Practical Usage Notes

### Hybrid Smart Trigger Behavior

View-Once capture supports `photo`, `video`, `voice`, and `video_note` messages when you reply **before opening** the media—even if Telegram initially delivered a `view_once_placeholder` without a `file_id`:

- **Natural reply (any text):** Captures and delivers the View-Once media privately to your bot chat (or the contact's Forum Topic), leaving your reply untouched in the Business chat.
- **Exact trigger reply (default `.`, case-insensitive):** Captures the View-Once media **and** immediately deletes your trigger reply using `deleteBusinessMessages`, provided `/autodelete` is `on` and `can_delete_all_messages` was granted.
- **Automatic retry safety:** If direct `file_id` delivery fails, the bot downloads up to `20 MB` (`MAX_GETFILE_BYTES`) and re-uploads via `InputFile`. If delivery still fails, the database capture claim rolls back so you can reply again to retry.

### Retention & Diagnostic Logging

- Opportunistic retention cleanup runs automatically on roughly `2%` of incoming `business_message` updates, pruning `messages` older than `30` days (`RETENTION_DAYS`) and `raw_updates` older than `3` days (`RAW_UPDATES_RETENTION_DAYS`).
- Leave `DEBUG_RAW_UPDATES` set to `false` for normal use so raw update JSON payloads are not retained.

## Next Steps

- [Setup & Deployment](/projects/chat-automation/setup/) — Review BotFather settings, deployment steps, and Telegram Business permissions.
- [Architecture & Schema](/projects/chat-automation/architecture/) — Explore the 5 update handlers, 5 SQLite tables, and maintenance workflows.
