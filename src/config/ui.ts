export type Locale = 'en' | 'fa';
export type ProjectStatus = 'active' | 'experimental' | 'archived';

const en = {
  home: {
    pageTitle: 'AZiPA Projects & Documentation',
    seoDescription:
      'Bilingual English and Persian project showcase and canonical documentation hub for AZiPA open-source tools and engineering manuals.',
    eyebrow: 'Open-Source Engineering Hub',
    heading: 'AZiPA',
    tagline:
      'Modular tools, automation engines, and canonical English & Persian documentation built for clarity and longevity.',
    browseCta: 'Explore Projects',
    aboutCta: 'About AZiPA',
  },
  catalog: {
    heading: 'Projects',
    filterLabel: 'Filter projects by tag',
    allTag: 'All',
    docsLink: 'Documentation',
    githubLink: 'GitHub',
    emptyState: 'No projects match the selected tag.',
    countLabel: (shown: number | string, total: number | string, activeTag: string): string =>
      activeTag === 'all'
        ? `Showing all ${total} project(s)`
        : `Showing ${shown} of ${total} project(s) tagged "${activeTag}"`,
    statuses: { active: 'Active', experimental: 'Experimental', archived: 'Archived' } as Record<ProjectStatus, string>,
  },
  about: {
    pageTitle: 'About AZiPA',
    seoDescription:
      'About AZiPA: open-source developer building automation workflows, developer utilities, and bilingual technical documentation.',
    eyebrow: 'Profile & Engineering Focus',
    heading: 'About AZiPA',
    lead: 'Independent software engineer building focused open-source automation tools, deterministic validation pipelines, and canonical bilingual documentation.',
    focusHeading: 'Core Focus Areas',
    focusItems: [
      'Workflow automation and bot orchestration in TypeScript and Node.js',
      'Self-contained, accessible bilingual (English / Persian RTL) documentation systems',
      'Build-time validation, schema safety, and zero-bloat web architecture',
    ] as readonly string[],
    githubCta: 'View GitHub Profile',
    projectsCta: 'Browse Projects',
  },
  banner: {
    regionLabel: 'Language suggestion',
    message: 'نسخه فارسی این صفحه در دسترس است.',
    actionLabel: 'مشاهده نسخه فارسی',
    dismissLabel: 'بستن اعلان زبان فارسی',
  },
  seo: {
    homeLabel: 'Home',
    ogImageAlt: 'AZiPA — Open-source documentation hub for Telegram Serverless and Cloudflare Workers bots',
  },
};

export type LocaleUiCopy = typeof en;

const fa: LocaleUiCopy = {
  home: {
    pageTitle: 'پروژه‌ها و مستندات AZiPA',
    seoDescription:
      'مرکز دوزبانه معرفی پروژه‌ها و مستندات فنی AZiPA شامل راهنماهای نصب، پیکربندی و معماری ابزارهای متن‌باز به زبان فارسی و انگلیسی.',
    eyebrow: 'مرکز مهندسی و پروژه‌های متن‌باز',
    heading: 'AZiPA',
    tagline: 'ابزارهای ماژولار، موتورهای خودکارسازی و مستندات جامع دوزبانه فارسی و انگلیسی با تمرکز بر شفافیت و پایداری.',
    browseCta: 'مشاهده پروژه‌ها',
    aboutCta: 'درباره AZiPA',
  },
  catalog: {
    heading: 'پروژه‌ها',
    filterLabel: 'فیلتر پروژه‌ها بر اساس برچسب',
    allTag: 'همه',
    docsLink: 'مستندات',
    githubLink: 'گیت‌هاب',
    emptyState: 'هیچ پروژه‌ای با برچسب انتخاب‌شده یافت نشد.',
    countLabel: (shown, total, activeTag) =>
      activeTag === 'all'
        ? `نمایش همه ${total} پروژه`
        : `نمایش ${shown} از ${total} پروژه با برچسب «${activeTag}»`,
    statuses: { active: 'فعال', experimental: 'آزمایشی', archived: 'بایگانی‌شده' },
  },
  about: {
    pageTitle: 'درباره AZiPA',
    seoDescription:
      'درباره AZiPA: توسعه‌دهنده متن‌باز ابزارهای خودکارسازی، نرم‌افزارهای کاربردی و مستندات فنی دوزبانه به فارسی و انگلیسی.',
    eyebrow: 'پروفایل و تمرکز مهندسی',
    heading: 'درباره AZiPA',
    lead: 'مهندس نرم‌افزار مستقل با تمرکز بر توسعه ابزارهای خودکارسازی متن‌باز، پایپ‌لاین‌های اعتبارسنجی دقیق و مستندسازی فنی دوزبانه.',
    focusHeading: 'حوزه‌های اصلی فعالیت',
    focusItems: [
      'خودکارسازی جریان‌های کاری و ربات‌های پیام‌رسان با TypeScript و Node.js',
      'طراحی سامانه‌های مستندات دوزبانه (انگلیسی و فارسی راست‌به‌چپ) مستقل و دسترس‌پذیر',
      'اعتبارسنجی زمان ساخت، امنیت اسکیما و معماری وب کم‌حجم بدون وابستگی اضافه',
    ],
    githubCta: 'مشاهده پروفایل گیت‌هاب',
    projectsCta: 'بازگشت به پروژه‌ها',
  },
  banner: en.banner,
  seo: {
    homeLabel: 'خانه',
    ogImageAlt: 'AZiPA — مرکز مستندات فارسی و انگلیسی پروژه‌های متن‌باز تلگرام سرورلس و کلادفلر ورکرز',
  },
};

export const UI_COPY: Record<Locale, LocaleUiCopy> = { en, fa };
