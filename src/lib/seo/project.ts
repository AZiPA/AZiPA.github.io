import { getCollection } from 'astro:content';
import type { StarlightRouteData } from '@astrojs/starlight/route-data';
import { SITE_URL } from '../../config/site.ts';
import { UI_COPY, type Locale } from '../../config/ui.ts';
import {
  AUTHOR_PERSON_LD,
  DEFAULT_PROJECT_LICENSE,
  type JsonLdObject,
} from './site.ts';

interface ParsedProjectRoute {
  lang: Locale;
  slug: string;
  isOverview: boolean;
}

/** Normalize a URL pathname to its canonical trailing-slash directory URL. */
export function resolveCanonicalUrl(pathname: string): string {
  const clean = pathname.replace(/\.html$/i, '').replace(/\/+$/, '');
  return clean ? `${SITE_URL}${clean}/` : `${SITE_URL}/`;
}

/** Parse `/projects/<slug>/...` or `/fa/projects/<slug>/...` into locale, slug, and page kind. */
export function parseProjectDocPath(pathname: string): ParsedProjectRoute | undefined {
  const segments = pathname
    .replace(/\.html$/i, '')
    .split('/')
    .filter(Boolean);

  if (segments[0] === 'projects' && segments[1]) {
    return { lang: 'en', slug: segments[1], isOverview: segments.length === 2 };
  }
  if (segments[0] === 'fa' && segments[1] === 'projects' && segments[2]) {
    return { lang: 'fa', slug: segments[2], isOverview: segments.length === 3 };
  }
  return undefined;
}

/** Build BreadcrumbList + SoftwareSourceCode (overview) or TechArticle (subpage) JSON-LD. */
export async function buildProjectJsonLdList(
  route: StarlightRouteData,
  url: URL
): Promise<JsonLdObject[]> {
  const parsed = parseProjectDocPath(url.pathname);
  if (!parsed) return [];

  const matches = await getCollection(
    'projects',
    ({ data }) => data.lang === parsed.lang && data.hasDocs && data.docsSlug === parsed.slug
  );
  const project = matches[0];
  if (!project) return [];

  const homeUrl = parsed.lang === 'fa' ? `${SITE_URL}/fa/` : `${SITE_URL}/`;
  const overviewUrl =
    parsed.lang === 'fa'
      ? `${SITE_URL}/fa/projects/${parsed.slug}/`
      : `${SITE_URL}/projects/${parsed.slug}/`;
  const currentUrl = resolveCanonicalUrl(url.pathname);
  const pageTitle = route.entry.data.title;
  const pageDescription = route.entry.data.description || project.data.description;

  const breadcrumbItems: JsonLdObject[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: UI_COPY[parsed.lang].seo.homeLabel,
      item: homeUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: project.data.title,
      item: overviewUrl,
    },
  ];
  if (!parsed.isOverview) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: pageTitle,
      item: currentUrl,
    });
  }

  const breadcrumbList: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  if (parsed.isOverview) {
    const sourceCode: JsonLdObject = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: project.data.title,
      description: pageDescription,
      ...(project.data.repo ? { codeRepository: project.data.repo } : {}),
      license: DEFAULT_PROJECT_LICENSE,
      author: AUTHOR_PERSON_LD,
      inLanguage: parsed.lang,
      url: overviewUrl,
    };
    return [breadcrumbList, sourceCode];
  }

  const techArticle: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: pageTitle,
    description: pageDescription,
    inLanguage: parsed.lang,
    author: AUTHOR_PERSON_LD,
    mainEntityOfPage: currentUrl,
    isPartOf: {
      '@type': 'SoftwareSourceCode',
      name: project.data.title,
      url: overviewUrl,
    },
  };
  return [breadcrumbList, techArticle];
}
