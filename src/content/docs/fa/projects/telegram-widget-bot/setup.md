---
title: راه‌اندازی و دیپلوی
description: تنظیمات BotFather، محدودیت سرور تست تلگرام، دیپلوی تک‌سکرت با GitHub Actions CI و دستورات محلی @tgcloud/cli در Bash، PowerShell و Windows CMD.
---

برای راه‌اندازی **ربات ویجت تلگرام** ([AZiPA/telegram-widget-bot](https://github.com/AZiPA/telegram-widget-bot)) به یک ربات پیکربندی‌شده در `@BotFather` با قابلیت‌های فعال **تلگرام سرورلس (Telegram Serverless)** و **حالت درون‌خطی (Inline Mode)** و یکی از دو روش **GitHub Actions CI** (پیشنهادی) یا ابزار محلی **`@tgcloud/cli`** نیاز دارید. رابط کاربری ربات درون تلگرام فقط به زبان **انگلیسی (`en-US`)** است.

:::caution[ویجت‌های چت فعلاً فقط روی سرور تست تلگرام فعال هستند]
تلگرام در حال حاضر قابلیت ویجت‌های چت (Chat Widgets) را به صورت سراسری روی سرورهای عمومی پروداکشن غیرفعال کرده است؛ رندر زنده ویجت درون چت اکنون **فقط روی سرور تست تلگرام (Test Server)** کار می‌کند تا زمانی که تلگرام این قابلیت را در سرورهای اصلی فعال کند. در پیکربندی پیش‌فرض (`ALLOW_SHARED_WIDGETS: false` و `ALLOW_GROUP_WIDGETS: false`)، ویجت‌های چت خصوصی (`/timer`، آپلود `.html` سفارشی و APIهای مینی‌اپ) بلافاصله روی سرور تست اجرا می‌شوند، در حالی که **دوئل ضربه (`/duel`)** برای پیوستن حریف دوم نیازمند فعال‌سازی پرچم‌های گروهی یا اشتراکی است.
:::

## ۱. پیش‌نیازهای `@BotFather`

وارد `@BotFather` در تلگرام شوید و فقط تنظیمات ضروری زیر را انجام دهید:

1. **ساخت یا انتخاب ربات:** دستور `/newbot` را اجرا کنید (یا یکی از ربات‌های موجود را انتخاب نمایید).
2. **فعال‌سازی Serverless و دریافت توکن CLI:** به مسیر `@BotFather → Your Bot → Serverless` بروید، میزبانی تلگرام سرورلس را فعال کنید و از بخش `Serverless → CLI Access → Access token` توکن دسترسی با قالب `app<id>:<secret>` را کپی نمایید.
3. **فعال‌سازی حالت درون‌خطی (Inline Mode):** دستور `/setinline` را در `@BotFather` اجرا کرده و ربات خود را انتخاب کنید تا هندلر `handlers/inline_query.js` جست‌وجوهای `@bot [query]` را دریافت کند.
4. **موارد غیرضروری در حالت پیش‌فرض:** در پیکربندی پیش‌فرض چت خصوصی نیازی به ثبت نشانی Mini App، فعال‌سازی Group Mode، Threaded Mode یا Business Mode نیست.

:::caution[حتماً از توکن CLI Access سرورلس استفاده کنید]
مقدار `TGCLOUD_TOKEN` باید **CLI Access Token** سرورلس (`app<id>:<secret>`) از مسیر `Serverless → CLI Access → Access token` باشد—**نه** توکن HTTP عادی Bot API (`123456789:AAH...`). توکن‌های استاندارد ربات قابلیت اعتبارسنجی یا ارسال کد با `@tgcloud/cli` را ندارند.
:::

## ۲. انتخاب روش دیپلوی

### روش اول — GitHub Actions CI بدون تنظیمات محلی (پیشنهادی)

مخزن دارای فایل `.github/workflows/deploy.yml` است که با هر `push` یا اجرای دستی `workflow_dispatch` (بدون ورودی اضافی) روی `ubuntu-latest` و **Node.js `26`** (`actions/checkout@v7` و `actions/setup-node@v7`)، با گروه هم‌زمانی `tgcloud-deploy` (`cancel-in-progress: false`) و سطح دسترسی `permissions: contents: read` اجرا می‌شود.

در مسیر **Settings → Secrets and variables → Actions** تنها **یک Repository Secret** تعریف کنید:

| Secret | وضعیت | قالب و کاربرد |
| :--- | :--- | :--- |
| `TGCLOUD_TOKEN` | **اجباری (تنها سکرت لازم)** | توکن دسترسی CLI تلگرام سرورلس با قالب `app<id>:<secret>` |

هیچ سکرت دیگری نیاز نیست. هر اجرای CI دقیقاً توالی ۹ مرحله‌ای زیر را طی می‌کند:

1. **دریافت کد مخزن:** اجرای `actions/checkout@v7`.
2. **بررسی وجود سکرت:** اطمینان از غیرخالی بودن `TGCLOUD_TOKEN` پیش از ادامه مراحل.
3. **راه‌اندازی Node.js `26`:** نصب Node.js نسخه `26` با `actions/setup-node@v7`.
4. **نصب وابستگی‌های CLI:** اجرای `npm install --no-audit --no-fund`.
5. **اعتبارسنجی ویجت‌ها:** اجرای `node scripts/validate-widgets.js` برای بررسی سقف‌های پروفایل ۱ و محدودیت فشرده‌سازی zlib-9 (`<= 4,096` B) روی تمام ویجت‌ها.
6. **بررسی وضعیت برنامه:** اجرای `npx tgcloud status` برای تایید اتصال و وضعیت فعلی برنامه سرورلس.
7. **بارگذاری کد زمان اجرا:** آپلود بسته کد جاوااسکریپت با `npx tgcloud push --force`.
8. **اعمال مایگریشن امن:** اجرای تغییرات افزایشی SQLite با `npx tgcloud migrate --safe`.
9. **همگام‌سازی وبهوک:** تنظیم `allowed_updates` با `npx tgcloud webhook sync`.

### روش دوم — گردش‌کار محلی با `@tgcloud/cli`

برای اعتبارسنجی محلی سقف‌های ویجت، احراز هویت، استقرار کد، اجرای مایگریشن امن و همگام‌سازی وبهوک، دستورات زیر را در ریشه مخزن اجرا کنید:

```bash
npm install
npm run validate          # اجرای node scripts/validate-widgets.js
npx tgcloud login
npm run deploy            # اجرای node scripts/validate-widgets.js && tgcloud push
npx tgcloud status
npx tgcloud migrate --safe
npx tgcloud webhook sync
```

:::note[دستور `push` دیتابیس را تغییر نمی‌دهد و محدوده `webhook sync`]
دستور `npx tgcloud push` (و `npm run deploy`) فقط کد زمان اجرا را بارگذاری می‌کند و هرگز جدول‌های SQLite را تغییر نمی‌دهد؛ پس از تغییر اسکیما همیشه `npx tgcloud migrate --safe` را اجرا کنید. افزون بر این، `@tgcloud/cli 0.2.0` فهرست `allowed_updates` را از نام فایل‌های داخل `tgcloud/handlers/` (`message`، `callback_query`، `inline_query`) می‌سازد و هنوز از `handlers/widget_query.js` یا `handlers/shared_widget_query.js` پشتیبانی نمی‌کند؛ به همین دلیل `widget-query-router.js` کوئری‌ها را به صورت خودکار درون `message.js` و `callback_query.js` مسیریابی می‌نماید.
:::

### تنظیم توکن در محیط و نقل‌قول در `npx tgcloud run`

هنگام تنظیم دستی `TGCLOUD_TOKEN` یا فراخوانی هندلرها/اندپوینت‌ها با `npx tgcloud run` از قوانین نقل‌قول شل خود پیروی کنید. به طور خاص، **در Windows CMD حتماً از دبل‌کوتیشن بیرونی `"` و اسکیپ کردن دبل‌کوتیشن‌های درونی به صورت `\"` استفاده کنید**، زیرا CMD تک‌کوتیشن `'` را به عنوان جداکننده آرگومان نمی‌شناسد:

- **Bash / macOS / Linux:**

  ```bash
  export TGCLOUD_TOKEN="app12345:your_secret"
  npx tgcloud run endpoints/listWidgets '{}' --ctx '{"initData":{"user":{"id":123456789}}}'
  ```

- **Windows PowerShell:**

  ```powershell
  $env:TGCLOUD_TOKEN = "app12345:your_secret"
  npx tgcloud run endpoints/listWidgets '{}' --ctx '{\"initData\":{\"user\":{\"id\":123456789}}}'
  ```

- **Windows CMD:**

  ```cmd
  set "TGCLOUD_TOKEN=app12345:your_secret"
  npx tgcloud run endpoints/listWidgets "{}" --ctx "{\"initData\":{\"user\":{\"id\":123456789}}}"
  ```

## گام‌های بعدی

- [ویجت‌ها، دستورات و آپلود سفارشی](/fa/projects/telegram-widget-bot/widgets-commands/) — آشنایی با کرنومتر، نظرسنجی، دوئل ضربه، جست‌وجوی درون‌خطی و آپلود `.html`.
- [موتور ویجت و راهنمای ساخت ویجت](/fa/projects/telegram-widget-bot/widget-engine/) — ساخت ویجت‌های پروفایل ۱ و بررسی خودکار با `validate-widgets.js`.
- [پیکربندی، دیتابیس و API مینی‌اپ](/fa/projects/telegram-widget-bot/config-schema-api/) — تنظیم پرچم‌های `WIDGET_CONFIG`، بررسی جدول‌های SQLite و API مینی‌اپ.
