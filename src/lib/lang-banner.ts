const STORAGE_KEY = 'azipa-lang-banner-dismissed';

/** Compute the Persian route counterpart for any English pathname. */
export function getPersianCounterpartPath(pathname: string): string {
  const cleaned = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (cleaned === '/' || cleaned === '/404') return '/fa/';
  if (cleaned === '/fa' || cleaned.startsWith('/fa/')) return cleaned;
  const withSlash = cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
  return `/fa${withSlash}`;
}

/** Reveal the Persian banner only for non-dismissed Persian browser locales. */
export function initLanguageBanner(): void {
  const banner = document.querySelector<HTMLElement>('[data-az-lang-banner]');
  if (!banner) return;

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {}

  const langs =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  const prefersPersian = langs.some(
    (entry) => typeof entry === 'string' && entry.toLowerCase().startsWith('fa')
  );

  if (!dismissed && prefersPersian) {
    banner.hidden = false;
  }

  banner
    .querySelector<HTMLButtonElement>('[data-az-lang-dismiss]')
    ?.addEventListener('click', () => {
      banner.hidden = true;
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {}
    });
}
