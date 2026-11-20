---
title: پیکربندی، دیتابیس و API مینی‌اپ
description: مرجع ثابت‌های WIDGET_CONFIG، سه هندلر آپدیت، مسیریاب موقت widget_query، دو جدول SQLite، سه اندپوینت مینی‌اپ با امنیت fail-closed و مجوز MPL-2.0.
---

**ربات ویجت تلگرام** به طور کامل درون ایزوله‌های V8 تلگرام سرورلس همراه با `2` جدول SQLite (`tgcloud/schema.js`)، `3` هندلر آپدیت (`tgcloud/handlers/`) و `3` اندپوینت API مینی‌اپ با امنیت fail-closed (`tgcloud/endpoints/`) اجرا می‌شود. در `tgcloud.jsonc` هیچ فرانت‌اند `"static"` برای مینی‌اپ تعریف نشده است.

## ۱. پیکربندی زمان اجرا (`tgcloud/lib/widgets/config.js`)

پرچم‌ها و محدودیت‌های زمان اجرا در `WIDGET_CONFIG` (`tgcloud/lib/widgets/config.js`) در کنار محدوده `cache_time` در `state-mutator.js` و `sender.js` تعریف شده‌اند:

| تنظیم / ثابت | مقدار پیش‌فرض | عملکرد |
| :--- | :--- | :--- |
| `ALLOW_SHARED_WIDGETS` | `false` | هنگام `false` بودن، مقدار `is_shared: false` را روی نظرسنجی‌ها اجباری کرده و فیلدهای اشتراکی را در `/api/widgetQuery` حذف می‌کند. |
| `ALLOW_GROUP_WIDGETS` | `false` | هنگام `false` بودن، اجرای ویجت‌ها و لینک‌های عمیق `/start` را به چت‌های خصوصی محدود می‌کند. |
| `INSTANCE_TTL_SECONDS` | `604800` (`7` روز) | سن مجاز ردیف‌های جدول `widget_instances` پیش از پاک‌سازی خودکار هنگام ارسال‌های ردیابی‌شده. |
| `ALLOW_CUSTOM_HTML_UPLOAD` | `true` | امکان اعتبارسنجی و اجرای فایل‌های `.html`، `.htm` و `text/html` را در چت خصوصی فعال می‌کند. |
| `MAX_UPLOAD_FILE_BYTES` | `65536` (`64 KB`) | سقف حجم پیش از دانلود برای محافظت از محدودیت ۳ ثانیه‌ای CPU ایزوله V8. |
| `CUSTOM_UPLOAD_ADMIN_IDS` | `[]` | فهرست اختیاری شناسه‌های کاربری تلگرام مجاز برای آپلود `.html` سفارشی؛ آرایه خالی `[]` دسترسی را برای همه کاربران چت خصوصی باز می‌گذارد. |
| بازه `cache_time` | `0` یا `5`–`3600` ثانیه (مقدار جایگزین `10` ثانیه در `sender.js`) | ماژول `state-mutator.js` مقدار `cache_time` ویجت را پیش از ارسال یا ویرایش به `0` یا بازه `[5, 3600]` ثانیه محدود می‌کند. |

## ۲. سه هندلر آپدیت و مسیریابی `widget_query` (`tgcloud/handlers/`)

| فایل هندلر | نوع آپدیت | مسئولیت |
| :--- | :--- | :--- |
| `message.js` | `message` | پردازش دستورات `/start`، `/help`، `/share`، `/timer`، `/poll`، `/duel`، آپلود فایل‌های `.html` در چت خصوصی (`upload-widget.js`) و رهگیری `widget_query` / `shared_widget_query` با `widget-query-router.js`. |
| `callback_query.js` | `callback_query` | پردازش دکمه‌های `share_new:<type>`، پل‌های جایگزین `wg:<data>` و رهگیری `widget_query` / `shared_widget_query` از طریق `widget-query-router.js`. |
| `inline_query.js` | `inline_query` | فیلتر ویجت‌های ثبت‌شده بر اساس `type`، `title` یا `description` و برگرداندن کارت‌های `article` (`cache_time: 1`، `is_personal: true`) با لینک عمیق `https://t.me/<bot>?start=launch_<type>`. |

:::note[چرا `widget-query-router.js` کوئری‌ها را در دو هندلر رهگیری می‌کند]
دستور `npx tgcloud webhook sync` فهرست `allowed_updates` تلگرام را مستقیماً از نام فایل‌های درون `tgcloud/handlers/` (`message`، `callback_query`، `inline_query`) می‌سازد. از آن‌جا که `@tgcloud/cli 0.2.0` هنوز از `handlers/widget_query.js` یا `handlers/shared_widget_query.js` پشتیبانی نمی‌کند، `widget-query-router.js` آپدیت‌های ورودی را درون `message.js` و `callback_query.js` بررسی کرده و با پل‌های کیبورد `wg:<data>` و مسیر `POST /api/widgetQuery` تکمیل می‌نماید.
:::

## ۳. اسکیمای دیتابیس SQLite (`tgcloud/schema.js`)

SQLite در تلگرام سرورلس با `PRAGMA foreign_keys` غیرفعال اجرا می‌شود (فراخوانی `.references()` یا `foreignKey()` باعث خطا خواهد شد) و تغییرات اسکیما با مایگریشن‌های افزایشی امن `npx tgcloud migrate --safe` اعمال می‌شوند.

| نام جدول | کلید اصلی | ستون‌ها و اندیس‌ها | چرخه عمر داده |
| :--- | :--- | :--- | :--- |
| `shared_widgets` | `widget_id` (`TEXT`) | `type`، `public_data` (`JSON`)، `revision` (پیش‌فرض `1`)، `cache_time` (پیش‌فرض `30`)، `allow_queries` (پیش‌فرض `false`)، `created_by`، `created_at`، `updated_at`. اندیس: `idx_shared_widgets_type` (`type`). | برای ویجت‌های اشتراکی (مانند `poll` هنگام `ALLOW_SHARED_WIDGETS: true`) استفاده می‌شود. |
| `widget_instances` | `id` (`INT` خودافزا) | `type`، `chat_id`، `message_id`، `inline_message_id`، `widget_id`، `is_shared` (پیش‌فرض `false`)، `allow_queries` (پیش‌فرض `true`)، `chat_data` (`JSON`)، `public_data` (`JSON`)، `revision` (پیش‌فرض `1`)، `created_at`، `updated_at`. اندیس‌ها: `uidx_widget_chat_msg` (یکتای `chat_id, message_id`)، `uidx_widget_inline_msg` (یکتای `inline_message_id`)، `idx_widget_instances_wid` (`widget_id`). | پس از `7` روز (`INSTANCE_TTL_SECONDS`) به صورت خودکار روی ارسال‌های ردیابی‌شده پاک‌سازی می‌شود؛ برای ویجت‌های آفلاین (`timer`) اصلاً نوشته نمی‌شود. |

## ۴. اندپوینت‌های HTTP مینی‌اپ (`tgcloud/endpoints/`)

هر `3` مسیر `POST /api/*` مینی‌اپ به صورت **fail-closed** پیاده‌سازی شده‌اند: در نبود شیء احراز هویت‌شده کاربر در `ctx?.initData?.user`، بلافاصله خطای `EndpointError('Unauthorized', { code: 'UNAUTHORIZED' })` صادر می‌کنند.

| اندپوینت | بدنه درخواست | امنیت و عملکرد | پاسخ |
| :--- | :--- | :--- | :--- |
| `POST /api/listWidgets` | *(بدون ورودی)* | پس از تایید `initData.user`، رجیستری خودکار ویجت‌ها را برمی‌گرداند. | `{ definitions: [...] }` |
| `POST /api/sendWidget` | `{ type, params? }` | مقادیر `chatId` و `createdBy` را منحصراً به `user.id` (چت خصوصی کاربر) قفل می‌کند. | `{ messageId }` |
| `POST /api/widgetQuery` | `{ query, isSharedCopy? }` | مقدار `from: user` را اجباری کرده و در صورت `!ALLOW_SHARED_WIDGETS` فیلدهای اشتراکی را حذف می‌کند. | `{ result }` |

## ۵. مجوز انتشار و صفحات مرتبط

**ربات ویجت تلگرام** تحت مجوز **Mozilla Public License 2.0 (`MPL-2.0`)** منتشر شده است.

- [معرفی و ویژگی‌ها](/fa/projects/telegram-widget-bot/) — بازگشت به نمای کلی معماری و خلاصه قابلیت‌ها.
- [راه‌اندازی و دیپلوی](/fa/projects/telegram-widget-bot/setup/) — مرور تنظیمات `@BotFather` و استقرار تک‌سکرت با GitHub Actions.
- [ویجت‌ها، دستورات و آپلود سفارشی](/fa/projects/telegram-widget-bot/widgets-commands/) — بررسی تمام دستورات، ویجت‌های آماده و قوانین اعتبارسنجی `.html`.
- [موتور ویجت و راهنمای ساخت ویجت](/fa/projects/telegram-widget-bot/widget-engine/) — راهنمای ساخت ویجت جدید و سقف‌های پروفایل ۱.
