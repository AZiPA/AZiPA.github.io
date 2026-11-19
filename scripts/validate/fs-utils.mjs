import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const ROOT_DIR = process.cwd();

export function toRelPosix(absPath) {
  return path.relative(ROOT_DIR, absPath).split(path.sep).join('/');
}

export function formatError(absOrRelPath, message) {
  const rel = path.isAbsolute(absOrRelPath)
    ? toRelPosix(absOrRelPath)
    : absOrRelPath.split(path.sep).join('/');
  return `[${rel}]: ${message}`;
}

export function collectFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  results.sort();
  return results;
}

export function relativeMap(baseDir, files) {
  const map = new Map();
  for (const absPath of files) {
    const rel = path.relative(baseDir, absPath).split(path.sep).join('/');
    map.set(rel, absPath);
  }
  return map;
}

export function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

export function writeUtf8PreserveEol(filePath, content, originalRaw = content) {
  const eol = detectEol(originalRaw);
  const output = content.replace(/\r?\n/g, eol);
  fs.writeFileSync(filePath, output, 'utf8');
  return output;
}

export function buildLineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

export function offsetToLine(lineStarts, offset) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= offset) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return hi + 1;
}
