---
title: راه‌اندازی و دیپلوی
description: راهنمای تنظیم BotFather، دیپلوی با GitHub Actions CI یا CLI محلی tgcloud و ثبت مالکیت در شل‌های Bash، CMD و PowerShell.
---

برای راه‌اندازی **ربات آپلودر تلگرام (نسخه تلگرام سرورلس)** به یک ربات پیکربندی‌شده در `@BotFather` با قابلیت فعال **تلگرام سرورلس (Telegram Serverless)** و یکی از دو روش **GitHub Actions CI** (پیشنهادی) یا ابزار محلی **`@tgcloud/cli`** نیاز دارید.

## ۱. پیش‌نیازهای `@BotFather` و کانال‌ها

در تلگرام وارد `@BotFather` شوید و ربات و کانال‌های کمکی اختیاری را آماده کنید:

1. **ساخت ربات:** دستور `/newbot` را در `@BotFather` اجرا کرده و نام و نام کاربری ربات را انتخاب کنید.
2. **فعال‌سازی Serverless:** به مسیر `@BotFather → Your Bot → Serverless` بروید و میزبانی تلگرام سرورلس را روشن کنید.
3. **کپی کردن CLI Access Token:** وارد `Serverless → CLI Access → Access token` شوید و توکن با قالب `` `app<id>:<secret>` `` را کپی کنید.
4. **کانال‌های کمکی اختیاری:**
   - **کانال ذخیره خصوصی (Storage Channel):** یک کانال خصوصی بسازید، ربات را با دسترسی `can_post_messages: true` ادمین کنید و مطمئن شوید **محافظت از محتوا (`has_protected_content`) خاموش است**. در صورت فعال بودن محافظت محتوا روی کانال ذخیره، آینه‌سازی و بازیابی با `api.copyMessages()` شکست می‌خورد.
   - **کانال لاگ (Log Channel):** یک کانال خصوصی (`-100...`) با ادمین بودن ربات برای دریافت هشدارهای عملیاتی ایجاد کنید یا لاگ‌ها را با `/setlogchannel owner` مستقیماً به چت خصوصی مالک بفرستید.
   - **کانال‌های عضویت اجباری (Force-Join):** ربات را در حداکثر `8` کانال عمومی یا خصوصی که قصد دارید پیش از تحویل فایل بررسی شوند، ادمین کنید.

:::caution[حتماً از توکن CLI Access سرورلس استفاده کنید]
مقدار `TGCLOUD_TOKEN` باید **CLI Access Token** سرورلس (`` `app<id>:<secret>` ``) از مسیر `Serverless → CLI Access → Access token` باشد—**نه** توکن HTTP عادی Bot API (`123456789:AAH...`). با توکن استاندارد ربات امکان ارسال کد یا اجرای مایگریشن از طریق `@tgcloud/cli` وجود ندارد.
:::

## ۲. انتخاب روش دیپلوی

### روش اول — GitHub Actions CI (پیشنهادی)

مخزن شامل فایل `.github/workflows/deploy.yml` است که با هر `push` یا به صورت دستی از طریق `workflow_dispatch` با گروه هم‌زمانی `tgcloud-deploy` (`cancel-in-progress: false`) اجرا می‌شود. اجراکننده روی `ubuntu-latest` و **Node.js `24`** (`actions/checkout@v7` با `persist-credentials: false` و `actions/setup-node@v4`) تنظیم شده است.

در مسیر **Settings → Secrets and variables → Actions** متغیرهای محرمانه زیر (**Repository Secrets**) را تنظیم کنید:

| Secret | وضعیت | کاربرد |
| :--- | :--- | :--- |
| `TGCLOUD_TOKEN` | **اجباری** | توکن دسترسی CLI تلگرام سرورلس با قالب `` `app<id>:<secret>` `` |
| `OWNER_ID` | **اختیاری** | شناسه عددی تلگرام برای ثبت خودکار و بی‌نیاز از دخالت دست مالک اولیه |

در هر اجرا، گردش‌کار CI دقیقاً توالی زیر را اجرا می‌کند (که در آن `$CLI` فراخوانی `@tgcloud/cli` است):

```bash
npm install --no-audit --no-fund
$CLI push --force
$CLI migrate --safe
$CLI webhook sync
# در صورت تنظیم Secret مربوط به OWNER_ID به صورت خودکار اجرا می‌شود:
$CLI run handlers/message "{\"owner_id\":$OWNER_ID}" --ctx "{\"ci_bootstrap\":true}"
```

### روش دوم — دیپلوی محلی با `@tgcloud/cli`

در ریشه مخزن دستورات زیر را برای احراز هویت، استقرار کد، اعمال مایگریشن‌های امن افزایشی و همگام‌سازی وبهوک اجرا کنید:

```bash
npm install
npx @tgcloud/cli login
npx @tgcloud/cli push
npx @tgcloud/cli migrate --safe
npx @tgcloud/cli webhook sync
```

:::note[دستور `push` دیتابیس را تغییر نمی‌دهد]
دستور `npx @tgcloud/cli push` فقط بسته کد جاوااسکریپت زمان اجرا را آپلود می‌کند و هرگز جدول‌های SQLite را تغییر نمی‌دهد. پس از هر تغییر در اسکیما حتماً `npx @tgcloud/cli migrate --safe` را اجرا کنید.
:::

برای ثبت محلی مالکیت به جای تکیه بر ثبت تعاملی در وضعیت صفر، عدد `123456789` را با شناسه عددی تلگرام خود جایگزین کرده و دستور متناسب با شل خود را اجرا نمایید:

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

## ۳. مسیرهای ثبت مالکیت اولیه

ربات آپلودر تلگرام از دو مسیر مجزا برای مقداردهی اولیه مالکیت پشتیبانی می‌کند:

| مسیر | نحوه عملکرد | زمان استفاده مناسب |
| :--- | :--- | :--- |
| **ثبت بدون دخالت از طریق CI/CD *(پیشنهادی)*** | تنظیم `OWNER_ID` در CI (یا اجرای محلی `--ctx '{"ci_bootstrap":true}'`) به صورت ایدمپوتنت مقدار `system_config.owner_id` را پیش از دریافت هر پیامی ثبت می‌کند. | استقرارهای عملیاتی و تیمی که مالکیت باید از همان لحظه صفر قفل باشد. |
| **ثبت تعاملی از وضعیت صفر (Zero-State)** | در صورت استقرار بدون `OWNER_ID` (`system_config.owner_id = 0`)، ربات در وضعیت قفل‌شده Fail-Closed (`bot_uninitialized`) قرار می‌گیرد تا زمانی که اولین کاربر دستور `/setbotowner` را در چت خصوصی ارسال کرده و مالکیت را به صورت اتمیک ثبت کند. | راه‌اندازی‌های سریع شخصی که بدون Secretهای CI یا دستور `run` دیپلوی شده‌اند. |

:::caution[بلافاصله پس از دیپلوی مالکیت را ثبت کنید]
یا پیش از انتشار نام کاربری ربات مقدار `OWNER_ID` را در GitHub Actions یا CLI محلی تنظیم کنید، یا بلافاصله پس از استقرار وارد چت خصوصی ربات شده و دستور `/setbotowner` را بفرستید. رها کردن ربات در وضعیت صفر (`owner_id = 0`) باعث می‌شود اولین کاربر خصوصی که `/setbotowner` را اجرا کند مالک ربات شود.
:::

## گام‌های بعدی

- [آپلود، تحویل و امنیت محتوا](/fa/projects/telegram-uploader-bot/features-delivery/) — پیکربندی کانال ذخیره، قوانین محافظت، چرخش لینک و عضویت اجباری.
- [نقش‌ها، امنیت و مدیریت](/fa/projects/telegram-uploader-bot/roles-security/) — آشنایی با مجوزهای RBAC، محدودکننده نرخ و انتقال دومرحله‌ای مالکیت.
- [دستورات و پیکربندی](/fa/projects/telegram-uploader-bot/commands-config/) — بررسی فهرست کامل دستورات راه‌اندازی، مدیریت بسته و پیکربندی.
