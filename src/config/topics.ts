import type {
  StarlightSidebarTopicsUserConfig,
  StarlightSidebarTopicsUserOptions,
} from 'starlight-sidebar-topics';

export const SIDEBAR_TOPICS: StarlightSidebarTopicsUserConfig = [
  {
    id: 'chat-automation',
    label: {
      en: 'Telegram Business Assistant',
      fa: 'دستیار تلگرام بیزینس',
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
    ],
  },
];

export const TOPICS_EXCLUDE: NonNullable<
  NonNullable<StarlightSidebarTopicsUserOptions>['exclude']
> = [
  '/',
  '/fa',
  '/fa/',
  '/about',
  '/about/',
  '/fa/about',
  '/fa/about/',
  '/404',
  '/404/',
  '/fa/404',
  '/fa/404/',
];
