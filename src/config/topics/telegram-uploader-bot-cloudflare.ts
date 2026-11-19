import type { StarlightSidebarTopicsUserConfig } from 'starlight-sidebar-topics';

export const telegramUploaderBotCloudflareTopic: StarlightSidebarTopicsUserConfig[number] = {
  id: 'telegram-uploader-bot-cloudflare',
  label: {
    en: 'Telegram Uploader Bot (Cloudflare)',
    fa: 'ربات آپلودر تلگرام (کلادفلر)',
  },
  link: '/projects/telegram-uploader-bot-cloudflare/',
  items: [
    {
      label: 'Overview',
      translations: {
        fa: 'معرفی',
      },
      link: '/projects/telegram-uploader-bot-cloudflare/',
    },
    {
      label: 'Setup & Deployment',
      translations: {
        fa: 'راه‌اندازی و دیپلوی',
      },
      link: '/projects/telegram-uploader-bot-cloudflare/setup/',
    },
    {
      label: 'Uploads, Delivery & Protection',
      translations: {
        fa: 'آپلود، تحویل و امنیت محتوا',
      },
      link: '/projects/telegram-uploader-bot-cloudflare/features-delivery/',
    },
    {
      label: 'Roles, Security & Operations',
      translations: {
        fa: 'نقش‌ها، امنیت و مدیریت',
      },
      link: '/projects/telegram-uploader-bot-cloudflare/roles-security/',
    },
    {
      label: 'Commands & Configuration',
      translations: {
        fa: 'دستورات و پیکربندی',
      },
      link: '/projects/telegram-uploader-bot-cloudflare/commands-config/',
    },
    {
      label: 'Architecture, D1 Schema & Cron',
      translations: {
        fa: 'معماری، دیتابیس D1 و کرون',
      },
      link: '/projects/telegram-uploader-bot-cloudflare/architecture/',
    },
  ],
};
