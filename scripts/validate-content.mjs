import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT_DIR, collectFiles, readUtf8 } from './validate/fs-utils.mjs';
import { checkPersianFiles, checkPersianPlainFiles } from './validate/check-persian.mjs';
import { checkDocs } from './validate/check-docs.mjs';
import { checkParity } from './validate/check-parity.mjs';

const DOCS_DIR = path.join(ROOT_DIR, 'src', 'content', 'docs');
const DIRS = {
  docs: DOCS_DIR,
  docsFa: path.join(DOCS_DIR, 'fa'),
  docsProjectsEn: path.join(DOCS_DIR, 'projects'),
  docsProjectsFa: path.join(DOCS_DIR, 'fa', 'projects'),
  projectsEn: path.join(ROOT_DIR, 'src', 'content', 'projects', 'en'),
  projectsFa: path.join(ROOT_DIR, 'src', 'content', 'projects', 'fa'),
};
const PLAIN_PERSIAN_FILES = [
  path.join(ROOT_DIR, 'src', 'content', 'i18n', 'fa.json'),
  path.join(ROOT_DIR, 'src', 'config', 'ui.ts'),
];

function main() {
  const fix = process.argv.includes('--fix');
  /** @type {string[]} */
  const errors = [];

  const docFiles = collectFiles(DIRS.docs, ['.md', '.mdx']);
  const faDocFiles = collectFiles(DIRS.docsFa, ['.md', '.mdx']);
  const enDocProjectFiles = collectFiles(DIRS.docsProjectsEn, ['.md', '.mdx']);
  const faDocProjectFiles = collectFiles(DIRS.docsProjectsFa, ['.md', '.mdx']);
  const enProjectFiles = collectFiles(DIRS.projectsEn, ['.md']);
  const faProjectFiles = collectFiles(DIRS.projectsFa, ['.md']);
  const existingPlainFaFiles = PLAIN_PERSIAN_FILES.filter((file) => fs.existsSync(file));

  /** @type {Map<string, string>} */
  const rawMap = new Map();
  for (const file of new Set([
    ...docFiles,
    ...enProjectFiles,
    ...faProjectFiles,
    ...existingPlainFaFiles,
  ])) {
    rawMap.set(file, readUtf8(file));
  }

  const faTargetFiles = [...new Set([...faDocFiles, ...faProjectFiles])].sort();
  const { fixedFiles: fixedMd } = checkPersianFiles(faTargetFiles, rawMap, { fix, errors });
  const { fixedFiles: fixedPlain } = checkPersianPlainFiles(existingPlainFaFiles, rawMap, {
    fix,
    errors,
  });
  const fixedCount = fixedMd.length + fixedPlain.length;

  checkDocs(docFiles, rawMap, errors);
  checkParity({
    enProjectFiles,
    faProjectFiles,
    enDocProjectFiles,
    faDocProjectFiles,
    dirs: DIRS,
    rawMap,
    errors,
  });

  if (errors.length > 0) {
    console.error(`\nContent validation failed with ${errors.length} error(s):\n`);
    for (const err of errors) console.error(`  ${err}`);
    console.error('');
    process.exit(1);
  }

  const fixNote = fixedCount > 0 ? ` (normalized ${fixedCount} file(s))` : '';
  console.log(
    `Content validation passed: ${docFiles.length} docs page(s), ${enProjectFiles.length} EN/${faProjectFiles.length} FA project entry pair(s)${fixNote}.`
  );
}

main();
