---
title: Commands & Configuration
description: Complete role-grouped command reference, persistent system_config keys, runtime constants, and JSON config export/import for Telegram Uploader Bot.
---

All bot interactions run inside private chats. Commands are strictly gated by the 5-level role hierarchy, while runtime behavior combines persistent `system_config` rows in SQLite with compile-time constants in `tgcloud/lib/`.

## Role-Grouped Command Reference

### Public Commands (Level 0 — User)

| Command | Description |
| :--- | :--- |
| `/start [code]` | Displays the bot greeting or resolves a deep-link bundle code (`<code>`) for delivery. |
| `/help` | Shows role-appropriate command usage instructions. |
| `/cancel` | Cancels an active upload session, batch, or interactive FSM prompt. |

### Admin Commands (Level 2 — Admin & Higher)

#### Uploads, Bundles & Publishing

| Command | Description |
| :--- | :--- |
| `/upload` | Starts a single-file upload flow. |
| `/batch` | Starts a multi-file upload session (up to `25` items). |
| `/done` | Commits the active upload session and generates the bundle link. |
| `/manage <code>` *(alias `/edit`)* | Opens the interactive Bundle Hub to modify items, protection, expiry, and flags. |
| `/review <code>` | Previews bundle items and metadata without consuming download quota. |
| `/del_<idx>` | Removes item `<idx>` during an active upload or edit session. |
| `` `/setname <code> <title\|clear\|off>` `` | Sets, clears, or disables a custom display title on a bundle. |
| `/search <query>` | Searches bundles by access code or title. |
| `` `/setexpiry <code> <duration\|0\|off>` `` | Sets per-bundle expiration (`1h`, `6h`, `24h`, `7d`) or disables TTL (`0`/`off`). |
| `/postbundle <code> [channel_id]` | Publishes a bundle card and deep-link button to `[channel_id]` or the default `pub_channel_id`. |
| `/rotatelink <code> [hours]` | Rotates a bundle link immediately or sets automatic rotation hours (syncs `/postbundle` buttons). |
| `/delete <code>` | Permanently deletes a bundle and invalidates its deep-link code. |

#### Users, VIPs & Lists

| Command | Description |
| :--- | :--- |
| `/admins` | Lists configured SuperAdmins and regular Admins. |
| `/vips` | Lists active VIP users and remaining durations. |
| `/addvip <user_id> [days]` | Grants VIP status for `[days]` days (omit `[days]` for lifetime VIP). |
| `` `/delvip <user_id\|all>` `` | Revokes VIP status for a specific user or clears all VIPs. |
| `/clearvips` | Removes every record from `vips`. |
| `/ban <user_id> [days]` | Bans a user permanently or for `[days]` days. |
| `/unban <user_id>` | Removes an active ban for `<user_id>`. |

#### Global Settings, Analytics & Force-Join

| Command | Description |
| :--- | :--- |
| `/settings` | Opens the interactive settings dashboard. |
| `/setdailylimit <number>` | Updates the global daily bundle download cap (`daily_download_cap`). |
| `/setfilelimit <number>` | Updates the per-file daily download limit (`file_daily_limit`). |
| `/setautodel <seconds>` | Sets global ephemeral auto-delete delay (`0`, `600`, `3600`, `86400`, or custom seconds). |
| `/setbundlettl <hours>` | Sets the default expiration TTL for newly created bundles (`0`, `24`, `72`, `168`, or custom hours). |
| `` `/setpubchannel <-100...\|off\|clear>` `` | Sets or clears the default public channel used by `/postbundle`. |
| `` `/setlang <en\|fa>` `` | Switches the bot interface language (`en` or `fa`). |
| `/stats` | Displays total downloads, users, bundles, and system usage metrics. |
| `/top` | Ranks the most downloaded bundles. |
| `/channels` | Opens the Force-Join channel management panel. |
| `` `/addchannel <chId\|fwd> [limit] [label]` `` | Adds a Force-Join channel (via channel ID or forwarded post) with optional member cap and label. |
| `/delchannel <channel_id>` | Removes a Force-Join channel. |
| `/setchannelbtn <channel_id> <label>` | Renames the join button label for an existing Force-Join channel. |
| `/setverifybtn <label>` | Customizes the Force-Join verify button text (`fj_verify_btn_text`). |

### SuperAdmin Commands (Level 3 — SuperAdmin & Owner)

| Command | Description |
| :--- | :--- |
| `` `/addadmin <user_id> [admin\|super_admin]` `` | Promotes `<user_id>` to regular `admin` or `super_admin`. |
| `/deladmin <user_id>` | Demotes an admin or super-admin back to standard user. |
| `` `/setlogchannel <-100...\|owner\|off>` `` | Routes system alerts to a channel (`-100...`), Owner DM (`owner`), or disables logging (`off`). |
| `/botprofile` | Opens bot profile management helpers. |

### Owner Commands (Level 4 — Owner Only)

| Command | Description |
| :--- | :--- |
| `/setbotowner [target_id]` | Claims ownership in Zero-State (`owner_id = 0`) or sets/inspects owner status. |
| `/transfer_ownership <target_id>` | Starts a 60-second two-step ownership transfer (`pending_owner_transfer`). |
| `` `/maintenance [on\|off\|1\|0]` `` | Enables or disables maintenance mode (blocks all non-owners). |
| `/factoryreset` | Wipes runtime tables back to factory state while keeping the Owner intact. |
| `/restore` | Unavailable in this edition; returns `restore_not_available`. |
| `` `/setstoragechannel <-100...\|off\|clear>` `` | Configures, disables, or clears the private storage mirror channel. |
| `/export_config` | Exports portable `system_config` overrides as JSON. |
| `/import_config <json_string>` | Applies JSON configuration overrides to `system_config`. |
| `/sql [query]` | Runs an ad-hoc SQLite query (capped at `40` preview rows) or displays SQL console help. |
| `/terminal` *(alias `/console`)* | Enters interactive SQLite terminal mode with a 10-minute inactivity timeout. |

## Persistent Runtime Configuration (`system_config`)

| Key | Default | Role / Behavior |
| :--- | :--- | :--- |
| `owner_id` | `0` | Numeric Telegram ID of the root Owner (`0` activates Zero-State lock). |
| `storage_channel_snapshot` | — | Cached storage channel metadata and `storage_channel_active` toggle. |
| `log_channel_id` / `log_channel_active` | — | Target channel (`-100...` or `owner`) and activation state for system alerts. |
| `maintenance` / `maintenance_mode` | `'off'` / `'0'` | Blocks non-owners when enabled. |
| `language` / `default_lang` | `'en'` | Active bot dictionary locale (`'en'` or `'fa'`). |
| `daily_download_cap` | `'0'` | Daily bundle download cap per standard user (`0` = unlimited). |
| `file_daily_limit` | `'3'` | Per-file daily download quota for standard users. |
| `auto_delete_seconds` | `'0'` | Ephemeral auto-delete delay in seconds (`0` = disabled). |
| `bundle_ttl_hours` | `'0'` | Default expiration window in hours for new bundles (`0` = no expiry). |
| `default_protect_content` | `'0'` | Default `protect_content` flag applied to newly created bundles. |
| `allowed_media_types` | `["photo","document","video","audio"]` | JSON array of permitted upload media types across the 8 supported formats. |
| `premium_emojis_enabled` | `'false'` | Enables Telegram Premium `<tg-emoji>` rendering (auto-disabled on invalid emoji errors). |
| `pub_channel_id` | — | Default public channel ID targeted by `/postbundle`. |
| `fj_verify_btn_text` | — | Custom label for the Force-Join **Verify** inline button. |
| `pending_owner_transfer` | — | Ephemeral JSON token payload for 60-second two-step ownership transfer. |
| `last_maint_at` | — | Timestamp enforcing a CAS `30`-second throttle between opportunistic maintenance passes. |
| `maintenance_lease` | — | `180`-second lease preventing concurrent opportunistic maintenance runs. |

## Hardcoded Runtime Constants

Constants defined in `constants.js`, `rate_limiter.js`, and `default_config.js`:

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| `MAX_BUNDLE_ITEMS` | `25` | Maximum media items permitted inside a single bundle. |
| `MAX_PER_SESSION_UPLOAD` | `25` | Maximum items accepted during a single `/batch` upload session. |
| `CHUNK_DELIVERY_SIZE` | `10` | Items delivered per pagination slice during bundle delivery. |
| `MAX_FORCE_JOIN_CHANNELS` | `8` | Maximum mandatory Force-Join channels configurable at once. |
| `MAX_OUTGOING_SOCKETS` | `6` | Maximum parallel Bot API membership checks per batch wave. |
| `FORCE_JOIN_THROTTLE_SEC` | `3` | Cooldown in seconds between Force-Join verify button clicks. |
| `MAX_ADMINS` | `10` | Maximum number of regular Admin accounts (`admin`). |
| `MAX_ROTATING_ADMIN` | `3` | Maximum active rotating bundles allowed per regular Admin. |
| `MAX_ROTATING_SUPERADMIN` | `10` | Maximum active rotating bundles allowed per SuperAdmin. |
| `MAX_ROTATING_PER_CHANNEL` | `10` | Maximum active rotating bundles posted to a single channel. |
| `MAX_STRIKES` | `5` | Rate-limit violations permitted before automatic lockout. |
| `LOCKOUT_DURATION_SEC` | `1800` | Temporary lockout duration (`30` minutes) after `MAX_STRIKES`. |
| `rateLimitMessagesPerMin` | `20` | Sliding-window per-user incoming message threshold per minute. |
| `maxUploadSizeMb` | `50` | Maximum single-file upload threshold in megabytes. |
| `sqlConsoleMaxRows` | `40` | Maximum rows rendered per `/sql` or `/terminal` output page. |
| `transferTokenTtlSec` | `60` | Validity window in seconds for `/transfer_ownership` tokens. |

## Configuration Portability (`/export_config` & `/import_config`)

Use `/export_config` as the Owner to serialize portable `system_config` overrides (quotas, TTLs, media allowlists, language, channel IDs) into a JSON payload, and apply them to another deployment via `/import_config <json_string>`:

```text
/export_config
/import_config {"language":"en","file_daily_limit":"5","auto_delete_seconds":"3600"}
```

## Next Steps

- [Roles, Security & Operations](/projects/telegram-uploader-bot/roles-security/) — Review permission levels and SQLite console safety limits.
- [Architecture & SQLite Schema](/projects/telegram-uploader-bot/architecture/) — Inspect how `system_config` and the other 20 tables fit together.
- [Uploads, Delivery & Protection](/projects/telegram-uploader-bot/features-delivery/) — See how settings affect runtime delivery and protection.
