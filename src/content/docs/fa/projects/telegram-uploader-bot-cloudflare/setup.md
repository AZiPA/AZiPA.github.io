---
title: راه‌اندازی و دیپلوی
description: راهنمای BotFather، مجوزهای کلادفلر D1 و توکن API، فهرست Secretها، دیپلوی با GitHub Actions و ثبت محلی wrangler و وبهوک.
---

برای استقرار **ربات آپلودر تلگرام (نسخه کلادفلر ورکرز)** به یک توکن ربات از `@BotFather`، یک حساب **کلادفلر** دارای **Workers** و **D1** و استفاده از **GitHub Actions CI** (روش پیشنهادی) یا ابزار محلی **`wrangler`** نیاز دارید.

## ۱. تنظیمات `@BotFather` و کانال‌های اختیاری

ربات خود را در `@BotFather` با تنظیمات استاندارد Bot API پیکربندی کنید:

1. **ساخت ربات و کپی توکن:** دستور `/newbot` را اجرا کرده و توکن HTTP استاندارد Bot API (`BOT_TOKEN`) را ذخیره کنید.
2. **بستن عضویت در گروه:** دستور `/setjoingroups` را زده و **Disable** را انتخاب کنید تا ربات فقط در چت خصوصی کار کند.
3. **خاموش کردن حالت اینلاین:** `/setinline` را اجرا کرده و **Turn off** را انتخاب نمایید.
4. **کانال‌های کمکی اختیاری:**
   - **کانال ذخیره خصوصی (`STORAGE_CHANNEL_ID`):** ربات را با دسترسی `can_post_messages` ادمین کنید تا فایل‌ها آینه‌سازی شده و ارسال یک‌جای `copyMessages()` با ۱ ساب‌ریکوئست فعال شود.
   - **کانال لاگ (`LOG_CHANNEL_ID`):** یک کانال خصوصی (`-100...`) با ادمین بودن ربات برای دریافت هشدارها و فایل پشتیبان JSON تنظیمات (یا هدایت لاگ به پیوی `owner`).
   - **کانال‌های عضویت اجباری:** ربات را در حداکثر `8` کانال عمومی یا خصوصی مورد نیاز پیش از دانلود ادمین کنید.

## ۲. حساب کلادفلر، مجوزهای توکن API و پیشنهاد WAF

1. شناسه ۳۲ کاراکتری حساب کلادفلر (`CLOUDFLARE_ACCOUNT_ID`) را از داشبورد کلادفلر کپی کنید.
2. یک توکن API (`CLOUDFLARE_API_TOKEN`) از الگوی **Edit Cloudflare Workers** با مجوزهای زیر بسازید:
   - `Workers Scripts:Write`
   - `D1:Write`
   - `Account Settings:Read`
   - `Workers Routes:Write`
   - `DNS:Write`

:::tip[دامنه اختصاصی و فیلتر IP در WAF کلادفلر]
در صورت استقرار پشت یک دامنه اختصاصی کلادفلر به جای `*.workers.dev`، می‌توانید یک قانون WAF در مسیر `/<WEBHOOK_PATH>` تعریف کنید تا در کنار `X-Telegram-Bot-Api-Secret-Token`، تنها درخواست‌های ارسالی از رنج‌های IP رسمی وبهوک تلگرام مجاز باشند.
:::

## ۳. مرجع Secretها و متغیرهای محیطی

| نام | محدوده | وضعیت | کاربرد |
| :--- | :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions CI | **اجباری** | توکن API کلادفلر با دسترسی نوشتن روی Workers و D1 |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions CI | **اجباری** | شناسه ۳۲ کاراکتری حساب کلادفلر |
| `BOT_TOKEN` | Worker Secret | **اجباری** | توکن HTTP استاندارد Bot API از `@BotFather` |
| `OWNER_ID` | Worker Secret | **اجباری** | شناسه عددی تلگرام (`۱ تا ۱۵` رقم) مالک ریشه ربات |
| `WEBHOOK_PATH` | Worker Secret | **اجباری** | بخش مخفی مسیر وبهوک (پاسخگویی روی `POST /<WEBHOOK_PATH>`) |
| `WEBHOOK_SECRET` | Worker Secret | **اجباری** | توکن محرمانه هدر `X-Telegram-Bot-Api-Secret-Token` (حداقل `16` کاراکتر) |
| `BOT_USERNAME` | Worker Secret / Var | **پیشنهادی** | نام کاربری ربات بدون `@` — حذف فراخوانی `getMe` در شروع سرد |
| `BOT_FIRST_NAME` | Worker Var | **اختیاری** | نام نمایشی جایگزین (پیش‌فرض `"File Store Bot"`) |
| `STORAGE_CHANNEL_ID` | Worker Secret / Var | **اختیاری** | شناسه کانال ذخیره خصوصی (`-100...`) برای آینه‌سازی و ارسال یک‌جا |
| `LOG_CHANNEL_ID` | Worker Secret / Var | **اختیاری** | شناسه کانال لاگ خصوصی (`-100...`) برای هشدارها و پشتیبان‌ها |
| `ENABLE_QUOTA_CACHE` | Worker Var | **اختیاری** | با مقدار `"false"` کش سهمیه ۵ دقیقه‌ای درون حافظه غیرفعال می‌شود |

## ۴. روش‌های استقرار (Deployment)

### روش اول — GitHub Actions CI (پیشنهادی)

مخزن دارای فایل `.github/workflows/deploy.yml` است که با هر `push` روی `main` (به جز `docs/**` و `README*.md`)، انتشار `release` (`published`) یا اجرای دستی `workflow_dispatch` روی `ubuntu-latest` با **Node.js `24`** اجرا می‌شود:

1. `npm install --legacy-peer-deps`
2. `npx tsc --noEmit` (بررسی سخت‌گیرانه تایپ‌های TypeScript)
3. `node scripts/verify.mjs` (اجرای آزمون ۸ مرحله‌ای کلیدهای ترجمه، HTML و سقف ۶۴ بایتی دکمه‌ها)
4. اعتبارسنجی اولیه Secretهای اجباری CI و ورکر
5. ساخت خودکار دیتابیس D1 با نام `filestore-db` در ناحیه `weur` در صورت نبود
6. اعمال اسکیما و تغییرات سازگاری:
   ```bash
   npx wrangler d1 execute filestore-db --remote --file=./schema.sql -y
   ```
   *(همراه با دستورات ایدمپوتنت `ALTER TABLE` جهت سازگاری)*
7. ثبت مستقیم `OWNER_ID` در جدول `admins` دیتابیس D1
8. دیپلوی ورکر (`npx wrangler deploy`) و همگام‌سازی Secretها (`npx wrangler secret bulk`)

### روش دوم — راه‌اندازی محلی با `wrangler` و ثبت وبهوک

دیتابیس D1 را بسازید، `schema.sql` را اجرا کنید، مالک را ثبت نمایید، Secretها را بارگذاری کرده و ورکر را مستقر کنید:

```bash
npm install --legacy-peer-deps
npx wrangler d1 create filestore-db --location=weur
# پیش از اجرا، database_id دریافت‌شده را در wrangler.toml قرار دهید:
npx wrangler d1 execute filestore-db --remote --file=./schema.sql -y
npx wrangler d1 execute filestore-db --remote --command "INSERT OR IGNORE INTO admins (user_id, role, added_by) VALUES (<OWNER_ID>, 'owner', <OWNER_ID>);"
npx wrangler secret put BOT_TOKEN
npx wrangler secret put OWNER_ID
npx wrangler secret put WEBHOOK_PATH
npx wrangler secret put WEBHOOK_SECRET
npx wrangler deploy
```

#### ثبت وبهوک (`scripts/webhook.mjs` یا Bot API)

می‌توانید وبهوک تلگرام را با اسکریپت داخلی (`info`، `set`، `drop` یا `delete`) مدیریت کنید:

```bash
node scripts/webhook.mjs set
node scripts/webhook.mjs info
```

یا به صورت مستقیم متد `setWebhook` را با `max_connections=8`، `allowed_updates=["message","callback_query"]`، `drop_pending_updates=true` و `secret_token=<WEBHOOK_SECRET>` اجرا نمایید:

- **Bash / macOS / Linux:**

  ```bash
  curl -sS -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://<WORKER_HOST>/<WEBHOOK_PATH>","secret_token":"<WEBHOOK_SECRET>","max_connections":8,"allowed_updates":["message","callback_query"],"drop_pending_updates":true}'
  ```

- **Windows CMD:**

  ```cmd
  curl -sS -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d "{\"url\":\"https://<WORKER_HOST>/<WEBHOOK_PATH>\",\"secret_token\":\"<WEBHOOK_SECRET>\",\"max_connections\":8,\"allowed_updates\":[\"message\",\"callback_query\"],\"drop_pending_updates\":true}"
  ```

- **Windows PowerShell:**

  ```powershell
  curl.exe -sS -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d '{\"url\":\"https://<WORKER_HOST>/<WEBHOOK_PATH>\",\"secret_token\":\"<WEBHOOK_SECRET>\",\"max_connections\":8,\"allowed_updates\":[\"message\",\"callback_query\"],\"drop_pending_updates\":true}'
  ```

## گام‌های بعدی

- [آپلود، تحویل و امنیت محتوا](/fa/projects/telegram-uploader-bot-cloudflare/features-delivery/) — بررسی ارسال یک‌جا از کانال ذخیره، رمز عبور SHA-256 و پاک‌سازی کرون.
- [نقش‌ها، امنیت و مدیریت](/fa/projects/telegram-uploader-bot-cloudflare/roles-security/) — آشنایی با ماتریس دسترسی ۵ سطحی، محدودکننده نرخ و بازیابی JSON با `/restore`.
- [معماری، دیتابیس D1 و کرون](/fa/projects/telegram-uploader-bot-cloudflare/architecture/) — مشاهده ساختار D1، تریگرهای SQL و جدول زمان‌بندی کرون.
