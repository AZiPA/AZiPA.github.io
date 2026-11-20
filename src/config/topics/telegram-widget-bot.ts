import type { StarlightSidebarTopicsUserConfig } from 'starlight-sidebar-topics';

export const telegramWidgetBotTopic: StarlightSidebarTopicsUserConfig[number] = {
  id: 'telegram-widget-bot',
  label: {
    en: 'Telegram Widget Bot',
    fa: 'ربات ویجت تلگرام',
  },
  link: '/projects/telegram-widget-bot/',
  items: [
    {
      label: 'Overview & Highlights',
      translations: {
        fa: 'معرفی و ویژگی‌ها',
      },
      link: '/projects/telegram-widget-bot/',
    },
    {
      label: 'Setup & Deployment',
      translations: {
        fa: 'راه‌اندازی و دیپلوی',
      },
      link: '/projects/telegram-widget-bot/setup/',
    },
    {
      label: 'Widgets, Commands & Uploads',
      translations: {
        fa: 'ویجت‌ها، دستورات و آپلود سفارشی',
      },
      link: '/projects/telegram-widget-bot/widgets-commands/',
    },
    {
      label: 'Widget Engine & Authoring',
      translations: {
        fa: 'موتور ویجت و راهنمای ساخت ویجت',
      },
      link: '/projects/telegram-widget-bot/widget-engine/',
    },
    {
      label: 'Configuration, Schema & API',
      translations: {
        fa: 'پیکربندی، دیتابیس و API مینی‌اپ',
      },
      link: '/projects/telegram-widget-bot/config-schema-api/',
    },
  ],
};
