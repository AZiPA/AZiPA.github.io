import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const ICON_TARGETS = [
  { filename: 'favicon-96x96.png', size: 96, rounded: true },
  { filename: 'apple-touch-icon.png', size: 180, rounded: false },
  { filename: 'icon-192.png', size: 192, rounded: true },
  { filename: 'icon-512.png', size: 512, rounded: true },
];

function buildIconSvg(rounded) {
  const rect = rounded
    ? '<rect x="2" y="2" width="60" height="60" rx="14" fill="#0B1120" stroke="#1E293B" stroke-width="2" />'
    : '<rect x="0" y="0" width="64" height="64" fill="#0B1120" />';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64" fill="none">
  ${rect}
  <path d="M12 44 L20 20 L28 44 M15 36 H25" stroke="#F8FAFC" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M36 20 H52 L36 44 H52" stroke="#38BDF8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}

function buildOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <radialGradient id="glow" cx="980" cy="140" r="420" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2AABEE" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#0B1120" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" stroke="#1E293B" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.55" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect x="44" y="44" width="1112" height="542" rx="24" fill="#0F172A" fill-opacity="0.72" stroke="#1E293B" stroke-width="2" />
  <rect x="96" y="104" width="302" height="40" rx="20" fill="#082F49" stroke="#38BDF8" stroke-opacity="0.45" />
  <text x="247" y="130" text-anchor="middle" fill="#38BDF8" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="1.6">CANONICAL BILINGUAL HUB</text>
  <text x="96" y="254" fill="#F8FAFC" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-size="92" font-weight="800">AZiPA</text>
  <text x="96" y="324" fill="#E2E8F0" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="600">Open-Source Documentation Hub</text>
  <text x="96" y="400" fill="#7DD3FC" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-size="25" font-weight="500">Telegram Serverless  ·  Cloudflare Workers  ·  Bilingual EN / FA</text>
  <line x1="96" y1="474" x2="1104" y2="474" stroke="#1E293B" stroke-width="2" />
  <text x="96" y="528" fill="#94A3B8" font-family="Consolas, DejaVu Sans Mono, monospace" font-size="26" font-weight="600">azipa.github.io</text>
  <text x="1104" y="528" text-anchor="end" fill="#64748B" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="500">Engineering Manuals &amp; Tools</text>
  <g transform="translate(888, 128)">
    <rect x="0" y="0" width="216" height="216" rx="44" fill="#0B1120" stroke="#2AABEE" stroke-opacity="0.55" stroke-width="3" />
    <path d="M40 148 L67 68 L94 148 M50 122 H84" stroke="#F8FAFC" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M122 68 H176 L122 148 H176" stroke="#38BDF8" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`;
}

async function generateBrandAssets() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  for (const target of ICON_TARGETS) {
    const svgBuffer = Buffer.from(buildIconSvg(target.rounded), 'utf8');
    const outPath = path.join(PUBLIC_DIR, target.filename);
    await sharp(svgBuffer, { density: 300 })
      .resize(target.size, target.size)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`Generated ${target.filename} (${target.size}x${target.size})`);
  }

  const ogPath = path.join(PUBLIC_DIR, 'og-default.png');
  await sharp(Buffer.from(buildOgSvg(), 'utf8'), { density: 144 })
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(ogPath);
  console.log('Generated og-default.png (1200x630)');
}

generateBrandAssets().catch((err) => {
  console.error('Failed to generate brand assets:', err);
  process.exit(1);
});
