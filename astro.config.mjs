import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightLinksValidator from 'starlight-links-validator';

import {
  CUSTOM_CSS,
  CUSTOM_PAGE_LINKS,
  PAGEFIND_CONFIG,
  SITE_TITLE,
  SITE_URL,
  STARLIGHT_COMPONENTS,
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
      defaultLocale: DEFAULT_LOCALE,
      locales: LOCALES,
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
