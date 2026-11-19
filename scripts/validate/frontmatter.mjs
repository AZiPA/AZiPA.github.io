import { parseDocument } from 'yaml';
import { formatError } from './fs-utils.mjs';

export function splitFrontmatter(raw) {
  const match = raw.match(
    /^(\uFEFF?---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n|$))([\s\S]*)$/
  );
  if (match) {
    return { openFence: match[1], yamlText: match[2], closeFence: match[3], body: match[4] };
  }
  const emptyMatch = raw.match(/^(\uFEFF?---[ \t]*\r?\n)(---[ \t]*(?:\r?\n|$))([\s\S]*)$/);
  if (emptyMatch) {
    return { openFence: emptyMatch[1], yamlText: '', closeFence: emptyMatch[2], body: emptyMatch[3] };
  }
  return null;
}

export function parseFrontmatterStrict(filePath, raw, errors) {
  const split = splitFrontmatter(raw);
  if (!split) {
    errors.push(formatError(filePath, 'Missing YAML frontmatter block delimited by "---".'));
    return null;
  }

  const doc = parseDocument(split.yamlText, { uniqueKeys: true });
  if (doc.errors.length > 0) {
    for (const err of doc.errors) {
      errors.push(formatError(filePath, `Invalid YAML frontmatter: ${err.message}`));
    }
    return null;
  }

  const data = doc.toJS();
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push(formatError(filePath, 'Frontmatter must be a YAML mapping object.'));
    return null;
  }
  return { data, split, doc };
}

function iterateLinesWithOffsets(text, baseOffset) {
  const lines = [];
  for (let i = 0; i < text.length; ) {
    const nl = text.indexOf('\n', i);
    const end = nl === -1 ? text.length : nl + 1;
    const contentEnd = nl > i && text[nl - 1] === '\r' ? nl - 1 : nl === -1 ? text.length : nl;
    lines.push({ start: baseOffset + i, raw: text.slice(i, end), content: text.slice(i, contentEnd) });
    i = end;
  }
  return lines;
}

/** Split Markdown body into contiguous chunks flagged as fenced code vs prose. */
export function splitBodyIntoFenceChunks(body, bodyBaseOffset) {
  const chunks = [];
  let activeFence = null;

  for (const line of iterateLinesWithOffsets(body, bodyBaseOffset)) {
    let isFenced = false;
    if (activeFence === null) {
      const openMatch = line.content.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (openMatch && !(openMatch[1][0] === '`' && openMatch[2].includes('`'))) {
        activeFence = { char: openMatch[1][0], len: openMatch[1].length };
        isFenced = true;
      }
    } else {
      isFenced = true;
      if (new RegExp(`^ {0,3}${activeFence.char}{${activeFence.len},}[ \\t]*$`).test(line.content)) {
        activeFence = null;
      }
    }

    const prev = chunks[chunks.length - 1];
    if (prev && prev.isFenced === isFenced) prev.text += line.raw;
    else chunks.push({ isFenced, start: line.start, text: line.raw });
  }
  return chunks;
}

export function findInlineCodeClose(text, fromIndex, tickLen) {
  for (let i = fromIndex; i < text.length; ) {
    if (text[i] === '\n' && /^[ \t]*\r?\n/.test(text.slice(i + 1))) return -1;
    if (text[i] === '`') {
      let runEnd = i;
      while (runEnd < text.length && text[runEnd] === '`') runEnd++;
      if (runEnd - i === tickLen) return i;
      i = runEnd;
      continue;
    }
    i++;
  }
  return -1;
}

export function collectNonInlineCodeParts(text, baseOffset) {
  const parts = [];
  let segStart = 0;
  for (let i = 0; i < text.length; ) {
    if (text[i] === '`') {
      let runEnd = i;
      while (runEnd < text.length && text[runEnd] === '`') runEnd++;
      const tickLen = runEnd - i;
      const closeIdx = findInlineCodeClose(text, runEnd, tickLen);
      if (closeIdx !== -1) {
        if (i > segStart) parts.push({ start: baseOffset + segStart, text: text.slice(segStart, i) });
        i = closeIdx + tickLen;
        segStart = i;
        continue;
      }
      i = runEnd;
      continue;
    }
    i++;
  }
  if (segStart < text.length) parts.push({ start: baseOffset + segStart, text: text.slice(segStart) });
  return parts;
}
