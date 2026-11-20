import type { AstroUserConfig } from 'astro';
import type { StarlightUserConfig } from '@astrojs/starlight/types';

export const SITE_URL = 'https://azipa.github.io';

export const SITE_TITLE: StarlightUserConfig['title'] = {
  en: 'AZiPA',
  fa: 'AZiPA',
};

export const FAVICON_PATH = '/favicon.svg';
export const OG_IMAGE_URL = `${SITE_URL}/og-default.png`;
export const OG_IMAGE_WIDTH = '1200';
export const OG_IMAGE_HEIGHT = '630';
export const OG_IMAGE_TYPE = 'image/png';
export const THEME_COLOR_LIGHT = '#f8fafc';
export const THEME_COLOR_DARK = '#0f172a';
export const STARLIGHT_ROUTE_MIDDLEWARE = './src/starlightRouteData.ts';

/**
 * Optional meta verification tokens (Google Search Console & Bing Webmaster Tools).
 * Leave empty when using file verification (e.g. `public/google*.html`).
 * Paste non-empty token strings here to emit verification meta tags automatically.
 */
export const SITE_VERIFICATION: { readonly google: string; readonly bing: string } = {
  google: '',
  bing: '',
};

const verificationHeadEntries: NonNullable<StarlightUserConfig['head']> = [
  ...(SITE_VERIFICATION.google.trim()
    ? [{ tag: 'meta' as const, attrs: { name: 'google-site-verification', content: SITE_VERIFICATION.google.trim() } }]
    : []),
  ...(SITE_VERIFICATION.bing.trim()
    ? [{ tag: 'meta' as const, attrs: { name: 'msvalidate.01', content: SITE_VERIFICATION.bing.trim() } }]
    : []),
];

export const STARLIGHT_HEAD: NonNullable<StarlightUserConfig['head']> = [
  { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' } },
  { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
  { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
  { tag: 'meta', attrs: { property: 'og:image', content: OG_IMAGE_URL } },
  { tag: 'meta', attrs: { property: 'og:image:width', content: OG_IMAGE_WIDTH } },
  { tag: 'meta', attrs: { property: 'og:image:height', content: OG_IMAGE_HEIGHT } },
  { tag: 'meta', attrs: { property: 'og:image:type', content: OG_IMAGE_TYPE } },
  { tag: 'meta', attrs: { name: 'twitter:image', content: OG_IMAGE_URL } },
  ...verificationHeadEntries,
];

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
