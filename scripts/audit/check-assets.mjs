import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const EXPECTED_SITEMAP_LINE = 'Sitemap: https://azipa.github.io/sitemap-index.xml';

const EXPECTED_PNGS = [
  { file: 'og-default.png', width: 1200, height: 630, allRgbNonBlank: true },
  { file: 'favicon-96x96.png', width: 96, height: 96, allRgbNonBlank: false },
  { file: 'apple-touch-icon.png', width: 180, height: 180, allRgbNonBlank: false },
  { file: 'icon-192.png', width: 192, height: 192, allRgbNonBlank: false },
  { file: 'icon-512.png', width: 512, height: 512, allRgbNonBlank: false },
];

export async function auditAssets(distDir, errors) {
  const summary = { pngs: [], sitemapUrls: 0, hreflangLinks: 0 };

  const robotsPath = path.join(distDir, 'robots.txt');
  const robots = await fs.readFile(robotsPath, 'utf8').catch(() => null);
  if (!robots) {
    errors.push('Missing dist/robots.txt');
  } else {
    if (!robots.includes(EXPECTED_SITEMAP_LINE)) {
      errors.push(`dist/robots.txt missing exact line: "${EXPECTED_SITEMAP_LINE}"`);
    }
    if (robots.includes('[') || robots.includes(']')) {
      errors.push('dist/robots.txt contains Markdown link brackets ([ or ])');
    }
  }

  const faviconPath = path.join(distDir, 'favicon.svg');
  const favicon = await fs.readFile(faviconPath, 'utf8').catch(() => '');
  if (!favicon.includes('<svg')) errors.push('Missing or invalid dist/favicon.svg');

  const gscPath = path.join(distDir, 'googlef71a71b2c3a3c446.html');
  const gscExists = await fs.access(gscPath).then(() => true, () => false);
  if (!gscExists) errors.push('Missing preserved dist/googlef71a71b2c3a3c446.html');

  const manifestPath = path.join(distDir, 'site.webmanifest');
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const iconSrcs = (manifest.icons ?? []).map((i) => i.src);
    if (!iconSrcs.includes('/icon-192.png') || !iconSrcs.includes('/icon-512.png')) {
      errors.push('dist/site.webmanifest missing /icon-192.png or /icon-512.png');
    }
  } catch {
    errors.push('Missing or invalid JSON in dist/site.webmanifest');
  }

  for (const spec of EXPECTED_PNGS) {
    const pngPath = path.join(distDir, spec.file);
    try {
      const img = sharp(pngPath);
      const [meta, stats] = await Promise.all([img.metadata(), img.stats()]);
      const rgbStdevs = stats.channels.slice(0, 3).map((c) => Number(c.stdev.toFixed(2)));
      if (meta.format !== 'png' || meta.width !== spec.width || meta.height !== spec.height) {
        errors.push(
          `dist/${spec.file} expected ${spec.width}x${spec.height} png, got ${meta.width}x${meta.height} ${meta.format}`
        );
      }
      const nonBlank = spec.allRgbNonBlank
        ? rgbStdevs.every((s) => s > 5)
        : rgbStdevs.some((s) => s > 5);
      if (!nonBlank) {
        errors.push(`dist/${spec.file} failed non-blank contrast check (RGB stdevs: ${rgbStdevs.join(', ')})`);
      }
      summary.pngs.push(`${spec.file} (${meta.width}x${meta.height}, stdev=[${rgbStdevs.join(',')}])`);
    } catch (err) {
      errors.push(`Failed inspecting dist/${spec.file}: ${err.message}`);
    }
  }

  const indexXml = await fs.readFile(path.join(distDir, 'sitemap-index.xml'), 'utf8').catch(() => '');
  if (!indexXml.includes('https://azipa.github.io/sitemap-0.xml')) {
    errors.push('dist/sitemap-index.xml missing sitemap-0.xml reference');
  }

  const sitemapXml = await fs.readFile(path.join(distDir, 'sitemap-0.xml'), 'utf8').catch(() => '');
  if (!sitemapXml) {
    errors.push('Missing dist/sitemap-0.xml');
    return summary;
  }

  const locs = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1]);
  const bad404 = locs.filter((u) => /\/404(?:\/|\.html)?$/i.test(new URL(u).pathname));
  if (bad404.length > 0) errors.push(`dist/sitemap-0.xml contains 404 URLs: ${bad404.join(', ')}`);

  const hreflangs = Array.from(
    sitemapXml.matchAll(/<xhtml:link\b[^>]*hreflang="([^"]+)"/g),
    (m) => m[1]
  );
  const unexpectedLangs = hreflangs.filter((l) => l !== 'en' && l !== 'fa');
  if (unexpectedLangs.length > 0) {
    errors.push(`dist/sitemap-0.xml has unexpected hreflang values: ${unexpectedLangs.join(', ')}`);
  }

  summary.sitemapUrls = locs.length;
  summary.hreflangLinks = hreflangs.length;
  if (locs.length < 46) errors.push(`dist/sitemap-0.xml expected >= 46 URLs, got ${locs.length}`);
  if (hreflangs.length !== locs.length * 2) {
    errors.push(
      `dist/sitemap-0.xml expected ${locs.length * 2} xhtml:link hreflang tags (2 per URL), got ${hreflangs.length}`
    );
  }
  return summary;
}
