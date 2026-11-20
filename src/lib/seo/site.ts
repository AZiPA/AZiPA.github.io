import { SITE_URL } from '../../config/site.ts';
import { UI_COPY, type Locale } from '../../config/ui.ts';

export type JsonLdObject = Record<string, unknown>;

export const GITHUB_PROFILE_URL = 'https://github.com/AZiPA';
export const DEFAULT_PROJECT_LICENSE = 'https://opensource.org/licenses/MPL-2.0';

export const AUTHOR_PERSON_LD: JsonLdObject = {
  '@type': 'Person',
  name: 'AZiPA',
  url: GITHUB_PROFILE_URL,
};

/** Build Schema.org WebSite structured data for a localized homepage. */
export function buildWebSiteJsonLd(lang: Locale): JsonLdObject {
  const homeUrl = lang === 'fa' ? `${SITE_URL}/fa/` : `${SITE_URL}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AZiPA',
    url: homeUrl,
    inLanguage: lang,
    description: UI_COPY[lang].home.seoDescription,
    author: AUTHOR_PERSON_LD,
  };
}

/** Build Schema.org Person structured data for a localized About page. */
export function buildPersonJsonLd(lang: Locale): JsonLdObject {
  const aboutUrl = lang === 'fa' ? `${SITE_URL}/fa/about/` : `${SITE_URL}/about/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'AZiPA',
    url: aboutUrl,
    mainEntityOfPage: aboutUrl,
    sameAs: [GITHUB_PROFILE_URL],
    description: UI_COPY[lang].about.seoDescription,
    knowsLanguage: ['en', 'fa'],
  };
}
