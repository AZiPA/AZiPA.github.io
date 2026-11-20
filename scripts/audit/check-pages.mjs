import fs from 'node:fs/promises';
import path from 'node:path';

const OG_IMAGE_EXPECTED = 'https://azipa.github.io/og-default.png';

const AUDITED_PAGES = [
  { rel: 'index.html', is404: false, types: ['WebSite'] },
  { rel: 'fa/index.html', is404: false, types: ['WebSite'] },
  { rel: 'about/index.html', is404: false, types: ['Person'] },
  { rel: '404.html', is404: true, types: [] },
  { rel: 'fa/404/index.html', is404: true, types: [] },
  { rel: 'projects/chat-automation/index.html', is404: false, types: ['BreadcrumbList', 'SoftwareSourceCode'] },
  { rel: 'projects/telegram-uploader-bot/setup/index.html', is404: false, types: ['BreadcrumbList', 'TechArticle'] },
  {
    rel: 'fa/projects/telegram-uploader-bot-cloudflare/architecture/index.html',
    is404: false,
    types: ['BreadcrumbList', 'TechArticle'],
  },
  { rel: 'projects/telegram-widget-bot/index.html', is404: false, types: ['BreadcrumbList', 'SoftwareSourceCode'] },
  {
    rel: 'fa/projects/telegram-widget-bot/widget-engine/index.html',
    is404: false,
    types: ['BreadcrumbList', 'TechArticle'],
  },
];

function parseAttrs(raw) {
  const attrs = {};
  for (const m of raw.matchAll(/([a-zA-Z0-9:-]+)\s*=\s*"([^"]*)"/g)) attrs[m[1]] = m[2];
  return attrs;
}

function extractTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*?)\\/?>`, 'gi');
  return Array.from(html.matchAll(re), (m) => parseAttrs(m[1]));
}

function extractJsonLdTypes(html, rel, errors) {
  const types = [];
  const re = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(re)) {
    try {
      const parsed = JSON.parse(match[1]);
      for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
        if (item?.['@type']) types.push(String(item['@type']));
      }
    } catch (err) {
      errors.push(`${rel}: invalid JSON-LD (${err.message})`);
    }
  }
  return types.sort();
}

async function collectHtmlFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectHtmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

export async function auditPages(distDir, errors) {
  const checked = [];
  for (const page of AUDITED_PAGES) {
    const html = await fs.readFile(path.join(distDir, page.rel), 'utf8').catch(() => null);
    if (!html) {
      errors.push(`Missing audited page dist/${page.rel}`);
      continue;
    }
    const metas = extractTags(html, 'meta');
    const links = extractTags(html, 'link');
    const assertOne = (arr, label) => {
      if (arr.length !== 1) errors.push(`dist/${page.rel}: expected 1 ${label}, got ${arr.length}`);
    };

    assertOne(links.filter((l) => l.rel === 'canonical'), 'canonical');
    if (!page.is404) assertOne(links.filter((l) => l.rel === 'alternate' && l.hreflang === 'x-default'), 'x-default');
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:image:alt']) {
      assertOne(metas.filter((m) => m.property === prop), prop);
    }
    for (const name of ['twitter:card', 'twitter:image', 'twitter:image:alt']) {
      assertOne(metas.filter((m) => m.name === name), name);
    }

    const ogImg = metas.find((m) => m.property === 'og:image')?.content;
    const twImg = metas.find((m) => m.name === 'twitter:image')?.content;
    const twCard = metas.find((m) => m.name === 'twitter:card')?.content;
    if (ogImg !== OG_IMAGE_EXPECTED) errors.push(`dist/${page.rel}: og:image=${ogImg}`);
    if (twImg !== OG_IMAGE_EXPECTED) errors.push(`dist/${page.rel}: twitter:image=${twImg}`);
    if (twCard !== 'summary_large_image') errors.push(`dist/${page.rel}: twitter:card=${twCard}`);

    const themeColors = metas.filter((m) => m.name === 'theme-color');
    const medias = new Set(themeColors.map((m) => m.media).filter(Boolean));
    if (themeColors.length !== 2 || !medias.has('(prefers-color-scheme: light)') || !medias.has('(prefers-color-scheme: dark)')) {
      errors.push(`dist/${page.rel}: expected 2 theme-color tags (light & dark), got ${themeColors.length}`);
    }

    const robots = metas.filter((m) => m.name === 'robots');
    if (page.is404) {
      if (robots.length !== 1 || robots[0].content !== 'noindex, follow') {
        errors.push(`dist/${page.rel}: expected robots="noindex, follow"`);
      }
    } else if (robots.some((r) => r.content?.includes('noindex'))) {
      errors.push(`dist/${page.rel}: unexpected noindex on indexable page`);
    }

    const actualTypes = extractJsonLdTypes(html, page.rel, errors);
    const expectedTypes = [...page.types].sort();
    if (JSON.stringify(actualTypes) !== JSON.stringify(expectedTypes)) {
      errors.push(`dist/${page.rel}: JSON-LD types [${actualTypes.join(', ')}] !== [${expectedTypes.join(', ')}]`);
    }
    checked.push(`${page.rel} (LD=[${actualTypes.join(',') || 'none'}])`);
  }

  const allHtml = await collectHtmlFiles(distDir);
  for (const file of allHtml) {
    const rel = path.relative(distDir, file).replace(/\\/g, '/');
    const html = await fs.readFile(file, 'utf8');
    const metas = extractTags(html, 'meta');
    for (const vName of ['google-site-verification', 'msvalidate.01']) {
      if (metas.some((m) => m.name === vName && !(m.content ?? '').trim())) {
        errors.push(`dist/${rel}: empty ${vName} meta tag`);
      }
    }
    const is404 = rel === '404.html' || rel === 'fa/404/index.html';
    if (!is404 && metas.some((m) => m.name === 'robots' && m.content?.includes('noindex'))) {
      errors.push(`dist/${rel}: unexpected noindex on indexable page`);
    }
  }
  return { checked, totalHtmlScanned: allHtml.length };
}
