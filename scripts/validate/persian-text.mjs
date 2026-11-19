import { findInlineCodeClose } from './frontmatter.mjs';

const ARABIC_CHAR_MAP = new Map([
  ['\u064A', '\u06CC'], // ي -> ی
  ['\u0649', '\u06CC'], // ى -> ی
  ['\u0643', '\u06A9'], // ك -> ک
]);
const URL_AT_START_RE = /^https?:\/\/[^\s<>"'`)\]}]+/i;

export function scanAndNormalizeSegment(text, baseOffset, { preserveInlineCode = true } = {}) {
  let out = '';
  const hitOffsets = [];
  for (let i = 0; i < text.length; ) {
    if (preserveInlineCode && text[i] === '`') {
      let runEnd = i;
      while (runEnd < text.length && text[runEnd] === '`') runEnd++;
      const tickLen = runEnd - i;
      const closeIdx = findInlineCodeClose(text, runEnd, tickLen);
      const spanEnd = closeIdx !== -1 ? closeIdx + tickLen : runEnd;
      out += text.slice(i, spanEnd);
      i = spanEnd;
      continue;
    }
    if ((text[i] === 'h' || text[i] === 'H') && /^https?:\/\//i.test(text.slice(i, i + 8))) {
      const urlMatch = text.slice(i).match(URL_AT_START_RE);
      if (urlMatch) {
        out += urlMatch[0];
        i += urlMatch[0].length;
        continue;
      }
    }
    const replacement = ARABIC_CHAR_MAP.get(text[i]);
    if (replacement !== undefined) {
      hitOffsets.push(baseOffset + i);
      out += replacement;
    } else {
      out += text[i];
    }
    i++;
  }
  return { normalized: out, hitOffsets };
}
