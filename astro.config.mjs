import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightLinksValidator from 'starlight-links-validator';

import {
  CUSTOM_CSS,
  CUSTOM_PAGE_LINKS,
  FAVICON_PATH,
  PAGEFIND_CONFIG,
  SITE_TITLE,
  SITE_URL,
  STARLIGHT_COMPONENTS,
  STARLIGHT_HEAD,
  STARLIGHT_ROUTE_MIDDLEWARE,
  TRAILING_SLASH,
} from './src/config/site.ts';
import { DEFAULT_LOCALE, LOCALES } from './src/config/locales.ts';
import { SIDEBAR_TOPICS, TOPICS_EXCLUDE } from './src/config/topics.ts';
import { REDIRECTS } from './src/config/redirects.ts';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: TRAILING_SLASH,
  redirects: REDIRECTS,
  integrations: [
    mermaid(),
    starlight({
      title: SITE_TITLE,
      favicon: FAVICON_PATH,
      defaultLocale: DEFAULT_LOCALE,
      locales: LOCALES,
      head: STARLIGHT_HEAD,
      routeMiddleware: STARLIGHT_ROUTE_MIDDLEWARE,
      customCss: CUSTOM_CSS,
      components: STARLIGHT_COMPONENTS,
      pagefind: PAGEFIND_CONFIG,
      plugins: [
        starlightSidebarTopics(SIDEBAR_TOPICS, {
          exclude: TOPICS_EXCLUDE,
        }),
        starlightLinksValidator({
          exclude: CUSTOM_PAGE_LINKS,
        }),
      ],
    }),
  ],
});
