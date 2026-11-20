---
title: Widgets, Commands & Uploads
description: Guide to the 3 built-in widgets (Stopwatch, Poll, Tap Duel), bot commands, inline deep links, and live custom .html widget validation and sandbox.
---

**Telegram Widget Bot** ships with `3` built-in **Profile 1 Mini-HTML Chat Widgets**, dynamic launch menus, inline deep-link cards, and a live custom `.html` widget validator and sandbox. All bot messages, widget labels, and validation diagnostics render in **English (`en-US`)**.

## 1. Built-In Interactive Widgets (`tgcloud/lib/widgets/definitions/`)

### Stopwatch (`timer` — `/timer [title]`, Order `10`)

An offline client-only stopwatch engineered for maximum responsiveness with zero server round-trips (`isShared: false`, `allowQueries: false`, `width: 0`, `height: 550`):

- **Zero SQLite Overhead:** `sender.js` skips SQLite `widget_instances` row insertion entirely for `timer` because all runtime state runs locally inside the Telegram widget WebView.
- **Optional Caption:** Any `[title]` argument passed to `/timer [title]` is clamped to `40` characters.
- **Dual Swipeable / Tabbed Views:** Switch between **Analog** and **Digital** pages using the top tabs (`#d0` / `#d1`) or a horizontal pointer swipe (`|dx| > 35` px).
- **Analog Page:** Renders an inline SVG dial (`analog-svg.js`) with dual hands (`#hb` primary elapsed hand and `#hw` lap-split shadow hand), live digital readout, and the top `4` laps.
- **Digital Page:** Displays a tabular `HH:MM:SS.d` clock and a paginated lap table (`8` laps per page).
- **Haptics & Local Persistence:** `Start`/`Stop`/`Resume` and `Lap`/`Reset` buttons trigger `HapticFeedback.impactOccurred('light')`. Per-message timer state persists in `localStorage['tw_sw_v1']` (capped at `100` laps), while the active tab persists in `sessionStorage['tw_sw_pg']`.

### Live Shared Poll (`poll` — `/poll Question | Option 1 | Option 2 ...`, Order `20`)

A compact interactive voting widget supporting `2`–`5` pipe-separated options:

- **Defaults & Normalization:** Running `/poll` with no arguments creates `'Which feature should we ship next?'` with options `['Widgets v1', 'Mini App Sync', 'Inline Mode']`. Supplying 1 option automatically pads `'Option 2'`; options beyond `5` are truncated.
- **Dual-Mode Persistence:** When `ALLOW_SHARED_WIDGETS` is `false` (default), `poll` forces `is_shared: false` and stores per-message counts in `widget_instances` (`publicData` for vote counts and `chatData.voters` server-side). When `ALLOW_SHARED_WIDGETS` is enabled, it persists in `shared_widgets` and broadcasts updates via `editSharedWidgetData` (`cacheTime: 15` s).
- **Commit-After-Edit & Voter Highlight:** Uses **Commit-After-Edit** (Telegram Bot API edit succeeds before writing SQLite) and monotonic revision `r` to prevent stale UI regressions, while highlighting the viewer's selected option locally via `localStorage['vote']`.

### Tap Duel (`duel` — `/duel [target]`, Order `30`)

A turn-based 2-player tap game with target score clamped to `3`–`15` (default `5`):

- **Turn & Player State:** Stored in `chatData` (`p1`, `p2`, `turn`, `target`, `winner`, `r`), paired with a forwarded summary snapshot in `publicData.summary`.
- **Actions & Validation:** Handles `duel:join:1` (requires `2` distinct `user.id` values) and `duel:hit:1` (enforces `turn === user.id`).
- **Forwarded Snapshot View:** Automatically renders a read-only snapshot summary whenever `TW.isForward` is true or `chatData` is absent.

:::caution[Default Private-Only Mode & Tap Duel]
By default, `ALLOW_GROUP_WIDGETS` and `ALLOW_SHARED_WIDGETS` are `false`, restricting widget commands and deep links to private chats. While `/timer`, custom `.html` validation, and Mini App endpoints work immediately in private chat, **Tap Duel (`/duel`)** requires enabling group/shared widget flags in `config.js` so a second opponent can join.
:::

## 2. Bot Commands, Callbacks & Inline Deep Links

| Trigger | Scope | Behavior |
| :--- | :--- | :--- |
| `/start` / `/help` | Private (or allowed group) | Lists registered widget commands, `/share`, `/help`, and private-chat `.html` upload instructions. |
| `/start launch_<type>` or `/start <type>` | Private-guarded (`ALLOW_GROUP_WIDGETS`) | Deep-links directly into launching `timer`, `poll`, or `duel`. |
| `/timer [title]` | Private-guarded | Sends the offline Stopwatch widget with an optional title (max `40` chars). |
| `/poll [Question \| Opt 1 \| Opt 2 ...]` | Private-guarded | Sends a `2`–`5` option Poll widget (or default poll when omitted). |
| `/duel [target]` | Private-guarded | Sends a Tap Duel widget with target score clamped to `3`–`15` (default `5`). |
| `/share` | Private chat only | Dynamically builds an inline keyboard from `catalog.js` with `share_new:<type>` buttons. |
| Inline `@bot [query]` | Inline mode | Filters registered widgets by `type`, `title`, or `description` and returns `article` cards (`cache_time: 1`, `is_personal: true`) with `https://t.me/<bot>?start=launch_<type>` buttons. |
| Callback `share_new:<type>` | Inline keyboard | Launches the selected widget type from the `/share` menu. |
| Callback `wg:<data>` | Inline keyboard bridge | Fallback callback bridge routed through `widget-query-router.js` when webhook `widget_query` delivery is unavailable. |

## 3. Live Custom `.html` Widget Uploader & Sandbox

`upload-widget.js` and `html-inspector.js` let developers test live HTML widgets directly inside a private chat with the bot:

- **Access & Pre-Download Guard:** Private-chat only, optionally restricted by `CUSTOM_UPLOAD_ADMIN_IDS` (empty array `[]` allows all private-chat users). Accepts `.html`, `.htm`, or `text/html` documents up to **`65,536` B (`64 KB`)** checked **before** file download to protect the V8 isolate's 3-second CPU budget, followed by strict UTF-8 decoding.
- **Leading Comment Directive:** Start your HTML file with an optional directive comment to configure widget options:

  ```html
  <!-- @tg-widget { "width": 360, "height": 420, "allowQueries": true, "caption": "My Demo", "chatData": {}, "publicData": {}, "strict": false } -->
  ```

- **Caption Override Flags:** Pass flags in the upload message caption to override defaults:

| Caption Flag | Accepted Values | Effect |
| :--- | :--- | :--- |
| `--strict` | Flag | Upgrades Profile 1 warnings to blocking validation failures. |
| `width=<n>` | `0` or `200`–`600` | Sets widget width in pixels (`0` lets Telegram choose). |
| `height=<n>` | `0` or `50`–`600` | Sets widget height in pixels (`0` lets Telegram choose). |
| `queries=<val>` | `queries=on\|off\|true\|false\|1\|0` | Enables or disables `allowQueries` for the uploaded sandbox widget. |

- **Minification, Profile 1 Inspection & Launch:** Minifies HTML, strips optional shell tags if the payload exceeds `28,000` B, enforces Profile 1 blocking rules (`<= 32,768` B raw, `<= 4,096` B zlib/deflate, DOM depth `<= 1,024`, tags `<= 2,000`, attribute length `<= 8,192`, zero network APIs), reports warnings, and sends the widget via `api.sendWidget` (`is_shared: false`).
- **Sandbox Query Responder (`dispatcher.js`):** Queries from unregistered custom widgets route automatically to the sandbox responder: payloads prefixed with `chat:<json>` or `state:<json>` persist JSON into `chatData` via `editMessageWidgetData`, and every query returns `{ ok: true, echo, ts }`.

## Next Steps

- [Widget Engine & Authoring](/projects/telegram-widget-bot/widget-engine/) — Inspect engine components, Profile 1 limits, and how to register new built-in widgets.
- [Configuration, Schema & API](/projects/telegram-widget-bot/config-schema-api/) — Review `WIDGET_CONFIG` flags, handlers, SQLite tables, and Mini App endpoints.
- [Setup & Deployment](/projects/telegram-widget-bot/setup/) — Deploy updates via GitHub Actions CI or `@tgcloud/cli`.
