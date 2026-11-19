# AGENTS.md — Repository Governance & Architecture Contract

This is the single source of truth for all humans and AI agents working on this repository. Do **not** create `.agents/` or duplicate governance files.

---

## 1. Site Identity & Domain

- **Purpose:** Standalone, self-contained bilingual (`en` / `fa`) project showcase and canonical documentation hub for AZiPA. Keeping full manuals here allows individual GitHub repository READMEs to stay concise and SEO-focused.
- **Deployment Target:** GitHub Pages root at `https://azipa.github.io/` (`base: '/'`).
- **Self-Contained Guarantee:** This repository MUST remain 100% self-contained. Never introduce external workspace coupling (`docs:sync`, `docs:link`, `projects.config.json`, Windows NTFS junctions, or cross-repository checkout logic).

---

## 2. Tech Stack & Dependency / Upgrade Policy

- **Core Stack:**
  - **Astro `7.4.x`** (Sätteri Markdown engine) + **`@astrojs/starlight` `0.43.x`**
  - **TypeScript** in strict mode (`astro/tsconfigs/strict`) with `@astrojs/check`
  - **`astro-mermaid`** — MUST always be registered **before** `starlight()` inside `integrations` in `astro.config.mjs`
  - **`starlight-sidebar-topics`** — isolated per-project documentation sidebars
  - **`starlight-links-validator`** — build-time verification of all internal links and anchors
  - **`yaml`** — strict frontmatter parsing in `scripts/validate/`
- **Exact Pinning & Lockfile Discipline:**
  - `.npmrc` enforces `save-exact=true`. Never manually strip `^` or `~` in `package.json` after installation (manual edits create `package-lock.json` drift that breaks `npm ci`).
  - `package-lock.json` MUST stay synchronized with `package.json` and committed/uploaded with every dependency change.
  - CI pins Node.js `26` via `.nvmrc` and MUST install exclusively with `npm ci`.
- **Upgrade Policy:**
  - Never use `--force` or `--legacy-peer-deps`. If any `ERESOLVE` peer-dependency conflict or runtime incompatibility arises, stop and resolve it cleanly without downgrading Astro or bypassing peer checks.
  - Perform upgrades deliberately on a local machine via `npx @astrojs/upgrade` **only after** reviewing the `@astrojs/starlight` changelog (Starlight is `0.x`, so minor versions can introduce breaking changes), followed by a full `npm run build` verification.

---

## 3. Modularity & Single-Responsibility Architecture

- **Single-Responsibility Rule:** Every script, config module, schema, utility, component, and stylesheet MUST serve one focused domain responsibility.
- **File Size Budget:** Target **80–150 lines max** per code, config, schema, component, and CSS file. Proactively split growing logic into focused domain folders rather than allowing monolithic files.
- **Canonical Directory Map:**
  - `scripts/validate-content.mjs` (thin CLI entrypoint) + `scripts/validate/*.mjs` (individual check modules: `fs-utils.mjs`, `frontmatter.mjs`, `persian-text.mjs`, `check-persian.mjs`, `check-docs.mjs`, `check-parity.mjs`).
  - `src/config/*.ts` (`site.ts`, `locales.ts`, `topics.ts`, `redirects.ts`, `ui.ts`) imported by a thin `astro.config.mjs` and UI pages/components.
  - `src/schemas/*.ts` (`project.ts`) imported by a thin `src/content.config.ts`.
  - UI & routing layers: `src/components/{layout,catalog,i18n,seo,overrides}/`, `src/lib/`, `src/styles/`, and `src/pages/` (for `/`, `/fa/`, `/about/`, `/fa/about/` via `EmptyPage`).
  - `src/content/i18n/{en,fa}.json` for Starlight UI localization strings.

---

## 4. URL, Locale & Anti-Collision Contract

- **Scenario A (SEO-First Bilingual Routing):**
  - English (`en`) is the default locale at the site root (`/`).
  - Persian (`fa`, `dir: 'rtl'`) lives at `/fa/`.
  - **Never** add client-side auto-redirects (e.g., `navigator.language` redirects) on `/` or any subpage.
- **Anti-Collision Prefix (`/projects/<slug>/`):**
  - All project documentation MUST live under `/projects/<slug>/` (English) and `/fa/projects/<slug>/` (Persian).
  - **Never** mount project docs directly at `/<slug>/`, because sibling repositories deployed under `azipa.github.io/<repo>/` share the same origin and would collide with top-level routes.
- **URL Permanence:**
  - Never rename or delete a published `/projects/<slug>/...` or `/fa/projects/<slug>/...` route without adding an explicit redirect entry in `src/config/redirects.ts`, wired into the top-level `redirects` property of `defineConfig` in `astro.config.mjs` (**never** inside `starlight()`).

---

## 5. Content Architecture & 3-Tier Project Model

- **Collections (`src/content.config.ts`):**
  - `docs`: Starlight `docsLoader()` + `docsSchema({ extend: topicSchema })`.
  - `i18n`: Starlight `i18nLoader()` + `i18nSchema()` backed by `src/content/i18n/{en,fa}.json`.
  - `projects`: Astro 7 `glob({ pattern: '**/*.md', base: './src/content/projects' })` validated with `projectSchema` (`z.strictObject(...)` + `.superRefine(...)` from `astro/zod` in `src/schemas/project.ts`).
- **3-Tier Project Model (`src/content/projects/{en,fa}/<slug>.md`):**
  1. **Multi-Page Docs:** `hasDocs: true`, `docsSlug: '<slug>'`, backed by a multi-page Starlight topic under `src/content/docs/projects/<slug>/` and `src/content/docs/fa/projects/<slug>/`.
  2. **Single-Page Doc:** `hasDocs: true`, `docsSlug: '<slug>'`, backed by a single `index.md` under `src/content/docs/projects/<slug>/index.md` and `src/content/docs/fa/projects/<slug>/index.md`.
  3. **Card-Only External Project:** `hasDocs: false`, and `docsSlug` **MUST be omitted** (enforced by `superRefine`).
- **Parity & Integrity Rules:**
  - 100% EN/FA relative file-path parity is mandatory across both `src/content/projects/{en,fa}/` and `src/content/docs/{,fa/}projects/`.
  - Each EN/FA project pair MUST have identical `hasDocs`, `docsSlug`, `repo`, and `status` values.
  - Every `projects/en/*.md` entry must set `lang: en`; every `projects/fa/*.md` entry must set `lang: fa`.
  - When `hasDocs: true`, `docsSlug` MUST match the project filename (without `.md`), and both `src/content/docs/projects/<docsSlug>/index.md` and `src/content/docs/fa/projects/<docsSlug>/index.md` MUST exist.
  - Every docs page in `src/content/docs/` (including `404.md`) MUST use only allowlisted Starlight frontmatter keys and MUST include a `description` string between `50` and `160` characters.

---

## 6. Styling, RTL & Theme Guardrails (Phase 2.2+)

- **Typography:**
  - English (`en`): `IBM Plex Sans` for prose/UI and `IBM Plex Mono` for code.
  - Persian (`fa`): `Vazirmatn`.
- **Theme Variables:**
  - All custom components MUST use Starlight CSS custom properties (`--sl-color-*`) and `[data-theme]` selectors.
  - **Never** use raw CSS `light-dark()`, which tracks OS preference instead of Starlight's manual theme switcher.
- **Logical Layout for LTR/RTL:**
  - All custom styles MUST use CSS Logical Properties (`margin-inline`, `padding-inline`, `border-inline-start`, `inset-inline`, `text-align: start`, etc.) rather than physical `left`/`right` properties.
- **Unified Shell:**
  - Portfolio and catalog pages will use a unified `EmptyPage` wrapper built on `StarlightPage` (`template: 'splash'`) so the entire site shares one header, theme switcher, language switcher, and RTL engine.
- **Markdown Authoring Hygiene:**
  - **Never** embed raw GitHub `<div dir="rtl">` or `<div dir="ltr">` wrappers inside Starlight Markdown files; Starlight manages document direction via locale configuration.
  - Escape literal pipe characters (`|`) inside Markdown table inline code as `\|` to keep Sätteri table parsing deterministic.

---

## 7. Mandatory Build Gate & Workflow Rules

- **Build Gate:** Every change MUST pass `npm run build` — which runs `node scripts/validate-content.mjs && astro check && astro build` (including `starlight-links-validator`) — with **0 errors and 0 dead links**.
- **Persian Character Normalization:**
  - Persian content (`src/content/projects/fa/**/*.md`, `src/content/docs/fa/**/*.{md,mdx}`, `src/content/i18n/fa.json`, and `src/config/ui.ts`) MUST use Persian `ی` (`\u06CC`) and `ک` (`\u06A9`), never Arabic `ي` (`\u064A`), `ى` (`\u0649`), or `ك` (`\u0643`) outside code blocks, inline code, and URLs.
  - Run `npm run validate:fix` to auto-normalize Arabic characters cleanly across frontmatter, Markdown bodies, and localized UI strings.
- **Git Restriction:** Never execute `git` CLI commands (`git init`, `git status`, `git commit`, etc.) from automation/agent workflows in this workspace.
