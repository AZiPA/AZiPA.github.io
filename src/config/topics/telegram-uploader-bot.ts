import type { StarlightSidebarTopicsUserConfig } from 'starlight-sidebar-topics';

export const telegramUploaderBotTopic: StarlightSidebarTopicsUserConfig[number] = {
  id: 'telegram-uploader-bot',
  label: {
    en: 'Telegram Uploader Bot (Serverless)',
    fa: 'ربات آپلودر تلگرام (سرورلس)',
  },
  link: '/projects/telegram-uploader-bot/',
  items: [
    {
      label: 'Overview',
      translations: {
        fa: 'معرفی',
      },
      link: '/projects/telegram-uploader-bot/',
    },
    {
      label: 'Setup & Deployment',
      translations: {
        fa: 'راه‌اندازی و دیپلوی',
      },
      link: '/projects/telegram-uploader-bot/setup/',
    },
    {
      label: 'Uploads, Delivery & Protection',
      translations: {
        fa: 'آپلود، تحویل و امنیت محتوا',
      },
      link: '/projects/telegram-uploader-bot/features-delivery/',
    },
    {
      label: 'Roles, Security & Operations',
      translations: {
        fa: 'نقش‌ها، امنیت و مدیریت',
      },
      link: '/projects/telegram-uploader-bot/roles-security/',
    },
    {
      label: 'Commands & Configuration',
      translations: {
        fa: 'دستورات و پیکربندی',
      },
      link: '/projects/telegram-uploader-bot/commands-config/',
    },
    {
      label: 'Architecture & SQLite Schema',
      translations: {
        fa: 'معماری و دیتابیس',
      },
      link: '/projects/telegram-uploader-bot/architecture/',
    },
  ],
};
