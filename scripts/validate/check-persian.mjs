import { parseDocument, visit } from 'yaml';
import {
  buildLineStarts,
  formatError,
  offsetToLine,
  toRelPosix,
  writeUtf8PreserveEol,
} from './fs-utils.mjs';
import { splitBodyIntoFenceChunks, splitFrontmatter } from './frontmatter.mjs';
import { scanAndNormalizeSegment } from './persian-text.mjs';

function normalizeYamlValues(yamlText, yamlBaseOffset, lineStarts, hitLines) {
  if (!yamlText) return yamlText;
  const doc = parseDocument(yamlText);
  // Every replacement is 1-to-1 UTF-16 code unit, so subsequent node.range indices remain valid.
  let patched = yamlText;

  visit(doc, {
    Scalar(key, node) {
      if (key === 'key' || typeof node.value !== 'string' || !Array.isArray(node.range)) return;
      const [start, valueEnd] = node.range;
      if (typeof start !== 'number' || typeof valueEnd !== 'number' || valueEnd <= start) return;

      const { normalized, hitOffsets } = scanAndNormalizeSegment(
        patched.slice(start, valueEnd),
        yamlBaseOffset + start
      );
      if (hitOffsets.length > 0) {
        for (const off of hitOffsets) hitLines.add(offsetToLine(lineStarts, off));
        patched = patched.slice(0, start) + normalized + patched.slice(valueEnd);
      }
    },
  });
  return patched;
}

function normalizeMarkdownBody(body, bodyBaseOffset, lineStarts, hitLines) {
  let rebuilt = '';
  for (const chunk of splitBodyIntoFenceChunks(body, bodyBaseOffset)) {
    if (chunk.isFenced) {
      rebuilt += chunk.text;
      continue;
    }
    const { normalized, hitOffsets } = scanAndNormalizeSegment(chunk.text, chunk.start);
    for (const off of hitOffsets) hitLines.add(offsetToLine(lineStarts, off));
    rebuilt += normalized;
  }
  return rebuilt;
}

function recordPersianResult(filePath, raw, updated, hitLines, rawMap, { fix, errors, fixedFiles }) {
  if (hitLines.size === 0) return;
  const sortedLines = Array.from(hitLines).sort((a, b) => a - b);
  if (fix) {
    rawMap.set(filePath, writeUtf8PreserveEol(filePath, updated, raw));
    const rel = toRelPosix(filePath);
    fixedFiles.push(rel);
    console.log(`[fix] Normalized Persian characters in ${rel} (line(s): ${sortedLines.join(', ')})`);
  } else {
    errors.push(
      formatError(
        filePath,
        `Contains non-normalized Arabic characters (ي/ى/ك) on line(s): ${sortedLines.join(', ')}. Run "npm run validate:fix" to auto-normalize.`
      )
    );
  }
}

export function checkPersianFiles(faFiles, rawMap, { fix, errors }) {
  const fixedFiles = [];
  for (const filePath of faFiles) {
    const raw = rawMap.get(filePath);
    if (raw === undefined) continue;

    const split = splitFrontmatter(raw);
    const lineStarts = buildLineStarts(raw);
    const hitLines = new Set();
    const yamlBase = split ? split.openFence.length : 0;
    const bodyBase = split
      ? split.openFence.length + split.yamlText.length + split.closeFence.length
      : 0;

    const newYaml = split ? normalizeYamlValues(split.yamlText, yamlBase, lineStarts, hitLines) : '';
    const newBody = normalizeMarkdownBody(split ? split.body : raw, bodyBase, lineStarts, hitLines);
    const updated = split ? split.openFence + newYaml + split.closeFence + newBody : newBody;
    recordPersianResult(filePath, raw, updated, hitLines, rawMap, { fix, errors, fixedFiles });
  }
  return { fixedFiles };
}

export function checkPersianPlainFiles(plainFiles, rawMap, { fix, errors }) {
  const fixedFiles = [];
  for (const filePath of plainFiles) {
    const raw = rawMap.get(filePath);
    if (raw === undefined) continue;
    const lineStarts = buildLineStarts(raw);
    const hitLines = new Set();
    const { normalized, hitOffsets } = scanAndNormalizeSegment(raw, 0, {
      preserveInlineCode: false,
    });
    for (const off of hitOffsets) hitLines.add(offsetToLine(lineStarts, off));
    recordPersianResult(filePath, raw, normalized, hitLines, rawMap, { fix, errors, fixedFiles });
  }
  return { fixedFiles };
}
