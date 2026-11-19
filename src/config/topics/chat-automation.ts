import type { StarlightSidebarTopicsUserConfig } from 'starlight-sidebar-topics';

export const chatAutomationTopic: StarlightSidebarTopicsUserConfig[number] = {
  id: 'chat-automation',
  label: {
    en: 'Telegram Business Assistant',
    fa: 'دستیار هوشمند تلگرام بیزینس',
  },
  link: '/projects/chat-automation/',
  items: [
    {
      label: 'Overview',
      translations: {
        fa: 'معرفی',
      },
      link: '/projects/chat-automation/',
    },
    {
      label: 'Setup & Deployment',
      translations: {
        fa: 'راه‌اندازی و دیپلوی',
      },
      link: '/projects/chat-automation/setup/',
    },
    {
      label: 'Commands & Configuration',
      translations: {
        fa: 'دستورات و پیکربندی',
      },
      link: '/projects/chat-automation/commands-config/',
    },
    {
      label: 'Architecture & Schema',
      translations: {
        fa: 'معماری، دیتابیس و نگهداری',
      },
      link: '/projects/chat-automation/architecture/',
    },
  ],
};
