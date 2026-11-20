# AZiPA.github.io — Open-Source Documentation Hub

[![Live Site (EN)](https://img.shields.io/badge/Live_Site-EN-2563eb?style=flat-square)](https://azipa.github.io/)
[![Persian Site (FA)](https://img.shields.io/badge/Persian_Site-FA-059669?style=flat-square)](https://azipa.github.io/fa/)
[![Astro + Starlight](https://img.shields.io/badge/Built_with-Astro_%2B_Starlight-bc52ee?style=flat-square)](https://starlight.astro.build/)
![All Rights Reserved](https://img.shields.io/badge/License-All_Rights_Reserved-475569?style=flat-square)

Source repository for the bilingual English (`/`) and Persian (`/fa/`) documentation hub built with Astro, Starlight, Mermaid, and Pagefind. The site is published automatically to GitHub Pages at [azipa.github.io](https://azipa.github.io/).

## Documented Projects

| Project | English Docs | Persian Docs | GitHub Repo |
| :--- | :--- | :--- | :--- |
| Telegram Chat Automation | [English](https://azipa.github.io/projects/chat-automation/) | [فارسی](https://azipa.github.io/fa/projects/chat-automation/) | [AZiPA/telegram-chat-automation](https://github.com/AZiPA/telegram-chat-automation) |
| Telegram Uploader Bot — Telegram Serverless | [English](https://azipa.github.io/projects/telegram-uploader-bot/) | [فارسی](https://azipa.github.io/fa/projects/telegram-uploader-bot/) | [AZiPA/telegram-uploader-bot](https://github.com/AZiPA/telegram-uploader-bot) |
| Telegram Uploader Bot — Cloudflare Workers | [English](https://azipa.github.io/projects/telegram-uploader-bot-cloudflare/) | [فارسی](https://azipa.github.io/fa/projects/telegram-uploader-bot-cloudflare/) | [AZiPA/telegram-uploader-bot-cloudflare](https://github.com/AZiPA/telegram-uploader-bot-cloudflare) |
| Telegram Widget Bot | [English](https://azipa.github.io/projects/telegram-widget-bot/) | [فارسی](https://azipa.github.io/fa/projects/telegram-widget-bot/) | [AZiPA/telegram-widget-bot](https://github.com/AZiPA/telegram-widget-bot) |

## Local Development & Verification

Dependencies in `package.json` are exact-pinned; `package-lock.json` is kept local-only while GitHub Actions CI installs directly from `package.json`.

```bash
npm install                              # Install dependencies locally (Node >= 22.22.0 / .nvmrc: 26)
npm run dev                              # Start local Astro + Starlight dev server
npm run validate                         # Run frontmatter, parity, and Persian text checks
npm run build                            # Validate, run astro check, build, and verify all links
node scripts/audit-seo.mjs               # Audit dist/ PNGs, sitemap, head tags, and JSON-LD
node scripts/generate-brand-assets.mjs   # Regenerate PNG brand assets from SVG sources
```

## Copyright & Notice

© AZiPA. All rights reserved. This repository is public for transparency and hosting via GitHub Pages; no open-source license is granted for the website design, personal branding, or documentation content. Individual software projects linked above are licensed separately under their respective repositories (MPL-2.0).
