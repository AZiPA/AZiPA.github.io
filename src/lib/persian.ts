const ARABIC_TO_PERSIAN_RE = /[\u064A\u0649\u0643]/g;

const ARABIC_TO_PERSIAN_MAP: Record<string, string> = {
  '\u064A': '\u06CC',
  '\u0649': '\u06CC',
  '\u0643': '\u06A9',
};

/** Normalize Arabic Yeh/Kaf characters to canonical Persian glyphs. */
export function normalizePersian(input: string): string {
  return input.replace(ARABIC_TO_PERSIAN_RE, (char) => ARABIC_TO_PERSIAN_MAP[char] ?? char);
}
