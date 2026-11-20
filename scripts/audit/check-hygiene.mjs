import fs from 'node:fs/promises';
import path from 'node:path';

const LINE_BUDGET_FILES = [
  'AGENTS.md',
  'astro.config.mjs',
  'src/config/site.ts',
  'src/config/ui.ts',
  'src/starlightRouteData.ts',
  'src/lib/seo/site.ts',
  'src/lib/seo/project.ts',
  'src/lib/seo/head.ts',
  'src/components/layout/EmptyPage.astro',
  'src/components/seo/JsonLd.astro',
  'src/pages/index.astro',
  'src/pages/fa/index.astro',
  'src/pages/about.astro',
  'src/pages/fa/about.astro',
  'scripts/generate-brand-assets.mjs',
  'scripts/audit-seo.mjs',
  'scripts/audit/check-assets.mjs',
  'scripts/audit/check-pages.mjs',
  'scripts/audit/check-hygiene.mjs',
];

const LINUX_OPTIONAL_PACKAGES = [
  '@astrojs/compiler-binding-linux-x64-gnu',
  '@bruits/satteri-linux-x64-gnu',
  '@img/sharp-linux-x64',
  '@img/sharp-libvips-linux-x64',
  '@pagefind/linux-x64',
  '@rolldown/binding-linux-x64-gnu',
  'lightningcss-linux-x64-gnu',
];

export async function auditRepoHygiene(rootDir, errors) {
  const lineCounts = [];
  for (const rel of LINE_BUDGET_FILES) {
    const raw = await fs.readFile(path.join(rootDir, rel), 'utf8');
    const lines = raw.split(/\r?\n/).length - (raw.endsWith('\n') ? 1 : 0);
    lineCounts.push({ rel, lines });
    if (lines > 150) errors.push(`${rel} exceeds 150-line limit (${lines} lines)`);
  }

  const pkg = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  for (const group of ['dependencies', 'devDependencies']) {
    for (const [name, ver] of Object.entries(pkg[group] ?? {})) {
      if (String(ver).startsWith('^') || String(ver).startsWith('~')) {
        errors.push(`package.json ${group}.${name} has non-exact version: ${ver}`);
      }
    }
  }

  const lock = await fs.readFile(path.join(rootDir, 'package-lock.json'), 'utf8');
  for (const linuxPkg of LINUX_OPTIONAL_PACKAGES) {
    if (!lock.includes(`"node_modules/${linuxPkg}"`) && !lock.includes(`"${linuxPkg}"`)) {
      errors.push(`package-lock.json missing Linux optional package: ${linuxPkg}`);
    }
  }
  return lineCounts;
}
