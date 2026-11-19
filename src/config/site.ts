import type { AstroUserConfig } from 'astro';
import type { StarlightUserConfig } from '@astrojs/starlight/types';

export const SITE_URL = 'https://azipa.github.io';

export const SITE_TITLE: StarlightUserConfig['title'] = {
  en: 'AZiPA',
  fa: 'AZiPA',
};

export const TRAILING_SLASH: NonNullable<AstroUserConfig['trailingSlash']> = 'ignore';

export const CUSTOM_CSS: NonNullable<StarlightUserConfig['customCss']> = [
  './src/styles/fonts.css',
  './src/styles/tokens.css',
  './src/styles/rtl.css',
  './src/styles/splash.css',
];

export const STARLIGHT_COMPONENTS: NonNullable<StarlightUserConfig['components']> = {
  Banner: './src/components/overrides/Banner.astro',
  Search: './src/components/overrides/Search.astro',
};

export const PAGEFIND_CONFIG: NonNullable<StarlightUserConfig['pagefind']> = {
  index: {
    includeCharacters: '\u200C',
  },
};

export const CUSTOM_PAGE_LINKS = [
  '/',
  '/fa',
  '/fa/',
  '/about',
  '/about/',
  '/fa/about',
  '/fa/about/',
];
