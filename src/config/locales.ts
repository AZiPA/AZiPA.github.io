import type { StarlightUserConfig } from '@astrojs/starlight/types';

export const DEFAULT_LOCALE = 'root';

export const LOCALES: NonNullable<StarlightUserConfig['locales']> = {
  root: {
    label: 'English',
    lang: 'en',
  },
  fa: {
    label: 'فارسی',
    lang: 'fa',
    dir: 'rtl',
  },
};
