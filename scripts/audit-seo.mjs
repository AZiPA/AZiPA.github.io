import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { auditAssets } from './audit/check-assets.mjs';
import { auditPages } from './audit/check-pages.mjs';
import { auditRepoHygiene } from './audit/check-hygiene.mjs';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

async function main() {
  const errors = [];
  const assetSummary = await auditAssets(DIST_DIR, errors);
  const pageSummary = await auditPages(DIST_DIR, errors);
  const lineCounts = await auditRepoHygiene(ROOT_DIR, errors);

  console.log('=== Phase 5 Technical SEO Audit ===');
  console.log(`PNG assets verified: ${assetSummary.pngs.join(' | ')}`);
  console.log(
    `Sitemap verified: ${assetSummary.sitemapUrls} URL(s), 0 404 URLs, ${assetSummary.hreflangLinks} xhtml:link hreflang annotations (en/fa)`
  );
  console.log(`Audited HTML pages (${pageSummary.totalHtmlScanned} total scanned):`);
  for (const entry of pageSummary.checked) console.log(`  - ${entry}`);
  console.log('File line counts (<= 150 ceiling):');
  for (const { rel, lines } of lineCounts) console.log(`  - ${rel}: ${lines} lines`);

  if (errors.length > 0) {
    console.error(`\nSEO audit failed with ${errors.length} error(s):`);
    for (const err of errors) console.error(`  [FAIL] ${err}`);
    process.exit(1);
  }
  console.log('\nSEO audit PASSED: 0 errors, exact zero-duplicate head/JSON-LD, lockfile & line budgets intact.');
}

main().catch((err) => {
  console.error('SEO audit crashed:', err);
  process.exit(1);
});
