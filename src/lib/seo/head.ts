import type { APIContext } from 'astro';
import type { StarlightRouteData } from '@astrojs/starlight/route-data';
import {
  SITE_URL,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
} from '../../config/site.ts';
import { UI_COPY, type Locale } from '../../config/ui.ts';
import { buildProjectJsonLdList, resolveCanonicalUrl } from './project.ts';
import type { JsonLdObject } from './site.ts';

type HeadEntry = StarlightRouteData['head'][number];

const THEME_COLOR_MEDIA_LIGHT = '(prefers-color-scheme: light)';
const THEME_COLOR_MEDIA_DARK = '(prefers-color-scheme: dark)';

function isNotFoundRoute(route: StarlightRouteData): boolean {
  return route.entry.id === '404' || route.id === '404' || route.id.endsWith('/404');
}

function upsertMeta(
  head: HeadEntry[],
  keyAttr: 'name' | 'property',
  keyValue: string,
  content: string,
  media?: string
): void {
  const entry: HeadEntry = {
    tag: 'meta',
    attrs: media
      ? { [keyAttr]: keyValue, media, content }
      : { [keyAttr]: keyValue, content },
  };
  const existingIndex = head.findIndex(
    (item) =>
      item.tag === 'meta' &&
      item.attrs?.[keyAttr] === keyValue &&
      (media === undefined ? item.attrs?.media === undefined : item.attrs?.media === media)
  );
  if (existingIndex !== -1) {
    head[existingIndex] = entry;
  } else {
    head.push(entry);
  }
}

function removeMetaByAttr(head: HeadEntry[], keyAttr: 'name' | 'property', keyValue: string): void {
  for (let i = head.length - 1; i >= 0; i--) {
    if (head[i]?.tag === 'meta' && head[i]?.attrs?.[keyAttr] === keyValue) {
      head.splice(i, 1);
    }
  }
}

function ensureAlternateXDefault(
  head: HeadEntry[],
  pathname: string
): void {
  const exists = head.some(
    (item) =>
      item.tag === 'link' &&
      item.attrs?.rel === 'alternate' &&
      item.attrs?.hreflang === 'x-default'
  );
  if (exists) return;

  const enPath = pathname.replace(/^\/fa(?=\/|$)/, '') || '/';
  const href = enPath === '/' ? `${SITE_URL}/` : resolveCanonicalUrl(enPath);
  head.push({
    tag: 'link',
    attrs: { rel: 'alternate', hreflang: 'x-default', href },
  });
}

function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function appendJsonLdScripts(head: HeadEntry[], schemas: JsonLdObject[]): void {
  for (const schema of schemas) {
    head.push({
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      content: serializeJsonLd(schema),
    });
  }
}

/** Enrich Starlight route head metadata and inject project JSON-LD without duplication. */
export async function applySeoRouteHead(context: APIContext): Promise<void> {
  const route = context.locals.starlightRoute;
  const head = route.head;
  const lang: Locale = route.lang === 'fa' ? 'fa' : 'en';
  const notFound = isNotFoundRoute(route);

  // Strip un-media-qualified theme-color entries, then upsert both light and dark tags.
  for (let i = head.length - 1; i >= 0; i--) {
    const item = head[i];
    if (item?.tag === 'meta' && item.attrs?.name === 'theme-color' && !item.attrs?.media) {
      head.splice(i, 1);
    }
  }
  upsertMeta(head, 'name', 'theme-color', THEME_COLOR_LIGHT, THEME_COLOR_MEDIA_LIGHT);
  upsertMeta(head, 'name', 'theme-color', THEME_COLOR_DARK, THEME_COLOR_MEDIA_DARK);

  if (notFound) {
    upsertMeta(head, 'name', 'robots', 'noindex, follow');
  } else {
    removeMetaByAttr(head, 'name', 'robots');
    ensureAlternateXDefault(head, context.url.pathname);
  }

  upsertMeta(head, 'name', 'twitter:card', 'summary_large_image');
  const altText = UI_COPY[lang].seo.ogImageAlt;
  upsertMeta(head, 'property', 'og:image:alt', altText);
  upsertMeta(head, 'name', 'twitter:image:alt', altText);

  if (!notFound) {
    const projectSchemas = await buildProjectJsonLdList(route, context.url);
    appendJsonLdScripts(head, projectSchemas);
  }
}
