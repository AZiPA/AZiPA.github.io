import fs from 'node:fs';
import path from 'node:path';
import { formatError, relativeMap, toRelPosix } from './fs-utils.mjs';
import { parseFrontmatterStrict } from './frontmatter.mjs';

const PAIRED_METADATA_FIELDS = [
  ['hasDocs', false],
  ['docsSlug', undefined],
  ['repo', undefined],
  ['status', 'active'],
];

function checkDirParity(enMap, faMap, enDir, faDir, kindLabel, errors) {
  for (const [rel, enPath] of enMap.entries()) {
    if (!faMap.has(rel)) {
      errors.push(
        formatError(
          path.join(faDir, rel),
          `Missing Persian ${kindLabel} counterpart for "${toRelPosix(enPath)}".`
        )
      );
    }
  }
  for (const [rel, faPath] of faMap.entries()) {
    if (!enMap.has(rel)) {
      errors.push(
        formatError(
          path.join(enDir, rel),
          `Missing English ${kindLabel} counterpart for "${toRelPosix(faPath)}".`
        )
      );
    }
  }
}

function validateCatalogToDocs(absPath, data, docsProjectsEnDir, docsProjectsFaDir, errors) {
  if (data.hasDocs !== true) return;

  const expectedSlug = path.basename(absPath, '.md');
  if (typeof data.docsSlug !== 'string' || data.docsSlug !== expectedSlug) {
    errors.push(
      formatError(
        absPath,
        `When hasDocs is true, "docsSlug" must equal the filename without ".md" ("${expectedSlug}"), got ${JSON.stringify(data.docsSlug)}.`
      )
    );
    return;
  }

  for (const [dir, label] of [
    [docsProjectsEnDir, 'English'],
    [docsProjectsFaDir, 'Persian'],
  ]) {
    const docIndex = path.join(dir, data.docsSlug, 'index.md');
    if (!fs.existsSync(docIndex)) {
      errors.push(
        formatError(
          absPath,
          `hasDocs is true with docsSlug "${data.docsSlug}", but ${label} doc "${toRelPosix(docIndex)}" does not exist.`
        )
      );
    }
  }
}

function collectProjectsByLocale(projectMap, expectedLang, dirs, rawMap, errors) {
  /** @type {Map<string, Record<string, unknown>>} */
  const parsedMap = new Map();
  for (const [rel, absPath] of projectMap.entries()) {
    const parsed = parseFrontmatterStrict(absPath, rawMap.get(absPath), errors);
    if (!parsed) continue;
    parsedMap.set(rel, parsed.data);

    if (parsed.data.lang !== expectedLang) {
      errors.push(
        formatError(
          absPath,
          `Project entry under "projects/${expectedLang}/" must have lang: "${expectedLang}" (got ${JSON.stringify(parsed.data.lang)}).`
        )
      );
    }
    validateCatalogToDocs(
      absPath,
      parsed.data,
      dirs.docsProjectsEn,
      dirs.docsProjectsFa,
      errors
    );
  }
  return parsedMap;
}

export function checkParity({
  enProjectFiles,
  faProjectFiles,
  enDocProjectFiles,
  faDocProjectFiles,
  dirs,
  rawMap,
  errors,
}) {
  const enDocMap = relativeMap(dirs.docsProjectsEn, enDocProjectFiles);
  const faDocMap = relativeMap(dirs.docsProjectsFa, faDocProjectFiles);
  checkDirParity(enDocMap, faDocMap, dirs.docsProjectsEn, dirs.docsProjectsFa, 'docs', errors);

  const enProjectMap = relativeMap(dirs.projectsEn, enProjectFiles);
  const faProjectMap = relativeMap(dirs.projectsFa, faProjectFiles);

  const parsedEn = collectProjectsByLocale(enProjectMap, 'en', dirs, rawMap, errors);
  const parsedFa = collectProjectsByLocale(faProjectMap, 'fa', dirs, rawMap, errors);

  checkDirParity(enProjectMap, faProjectMap, dirs.projectsEn, dirs.projectsFa, 'project', errors);

  for (const [rel, enData] of parsedEn.entries()) {
    const faData = parsedFa.get(rel);
    if (!faData) continue;
    const enPath = enProjectMap.get(rel);
    const faPath = faProjectMap.get(rel);

    for (const [field, fallback] of PAIRED_METADATA_FIELDS) {
      const enVal = enData[field] ?? fallback;
      const faVal = faData[field] ?? fallback;
      if (enVal !== faVal) {
        errors.push(
          formatError(
            faPath,
            `Metadata mismatch with "${toRelPosix(enPath)}" for "${field}": en=${JSON.stringify(enVal)}, fa=${JSON.stringify(faVal)}.`
          )
        );
      }
    }
  }
}
