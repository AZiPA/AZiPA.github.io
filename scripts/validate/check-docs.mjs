import { buildLineStarts, formatError, offsetToLine } from './fs-utils.mjs';
import {
  collectNonInlineCodeParts,
  parseFrontmatterStrict,
  splitBodyIntoFenceChunks,
} from './frontmatter.mjs';

const STARLIGHT_FRONTMATTER_ALLOWLIST = new Set([
  'title',
  'description',
  'slug',
  'editUrl',
  'head',
  'tableOfContents',
  'template',
  'hero',
  'banner',
  'lastUpdated',
  'prev',
  'next',
  'pagefind',
  'draft',
  'sidebar',
  'topic',
]);

const DIR_WRAPPER_RE = /<div\b[^>]*\bdir\s*=\s*["'](?:rtl|ltr)["'][^>]*>/gi;

function checkNoGithubDirWrappers(filePath, raw, split, errors) {
  const lineStarts = buildLineStarts(raw);
  const body = split ? split.body : raw;
  const bodyBaseOffset = split
    ? split.openFence.length + split.yamlText.length + split.closeFence.length
    : 0;

  for (const chunk of splitBodyIntoFenceChunks(body, bodyBaseOffset)) {
    if (chunk.isFenced) continue;
    for (const part of collectNonInlineCodeParts(chunk.text, chunk.start)) {
      DIR_WRAPPER_RE.lastIndex = 0;
      let match;
      while ((match = DIR_WRAPPER_RE.exec(part.text)) !== null) {
        const line = offsetToLine(lineStarts, part.start + match.index);
        errors.push(
          formatError(
            filePath,
            `Forbidden GitHub direction wrapper "${match[0]}" found on line ${line}. Starlight manages document direction automatically.`
          )
        );
      }
    }
  }
}

export function checkDocs(docFiles, rawMap, errors) {
  const allowedList = Array.from(STARLIGHT_FRONTMATTER_ALLOWLIST).join(', ');

  for (const file of docFiles) {
    const raw = rawMap.get(file);
    if (raw === undefined) continue;

    const parsed = parseFrontmatterStrict(file, raw, errors);
    if (!parsed) continue;

    const { data, split } = parsed;

    for (const key of Object.keys(data)) {
      if (!STARLIGHT_FRONTMATTER_ALLOWLIST.has(key)) {
        errors.push(
          formatError(
            file,
            `Unknown Starlight frontmatter key "${key}". Allowed keys: ${allowedList}.`
          )
        );
      }
    }

    if (typeof data.description !== 'string') {
      errors.push(
        formatError(
          file,
          'Missing or non-string "description" in frontmatter (required: 50–160 characters).'
        )
      );
    } else {
      const trimmedLen = data.description.trim().length;
      const rawLen = data.description.length;
      if (trimmedLen < 50 || rawLen > 160) {
        errors.push(
          formatError(
            file,
            `Frontmatter "description" length must be between 50 and 160 characters (got ${rawLen}).`
          )
        );
      }
    }

    checkNoGithubDirWrappers(file, raw, split, errors);
  }
}
