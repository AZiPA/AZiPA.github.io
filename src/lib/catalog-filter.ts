function installRovingTabindex(toolbar: HTMLElement, buttons: HTMLButtonElement[]): void {
  if ('focusGroup' in HTMLElement.prototype || buttons.length === 0) return;

  buttons.forEach((btn, idx) => {
    btn.tabIndex = idx === 0 ? 0 : -1;
  });

  toolbar.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !buttons.includes(target)) return;
    buttons.forEach((btn) => {
      btn.tabIndex = btn === target ? 0 : -1;
    });
  });

  toolbar.addEventListener('keydown', (event) => {
    const active = document.activeElement;
    if (!(active instanceof HTMLButtonElement)) return;
    const index = buttons.indexOf(active);
    if (index === -1) return;

    const isRtl = getComputedStyle(toolbar).direction === 'rtl';
    let nextIndex = -1;

    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    else if (event.key === 'ArrowRight') nextIndex = (index + (isRtl ? -1 : 1) + buttons.length) % buttons.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index + (isRtl ? 1 : -1) + buttons.length) % buttons.length;

    if (nextIndex === -1) return;
    event.preventDefault();
    const target = buttons[nextIndex];
    if (!target) return;
    buttons.forEach((btn) => {
      btn.tabIndex = btn === target ? 0 : -1;
    });
    target.focus();
  });
}

function formatStatus(statusEl: HTMLElement, shown: number, total: number, tag: string): string {
  const tpl = tag === 'all' ? statusEl.dataset.tplAll : statusEl.dataset.tplTag;
  if (!tpl) return `${shown} / ${total}`;
  return tpl
    .replace('{shown}', String(shown))
    .replace('{total}', String(total))
    .replace('{tag}', tag);
}

export function initCatalogFilters(): void {
  document.querySelectorAll<HTMLElement>('[data-az-catalog]').forEach((root) => {
    const toolbar = root.querySelector<HTMLElement>('[data-az-filter-toolbar]');
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-tags]'));
    const statusEl = root.querySelector<HTMLElement>('[data-az-catalog-status]');
    const emptyEl = root.querySelector<HTMLElement>('[data-az-catalog-empty]');
    if (!toolbar || cards.length === 0) return;

    const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button[data-tag]'));
    installRovingTabindex(toolbar, buttons);

    toolbar.addEventListener('click', (event) => {
      const target = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-tag]');
      if (!target) return;
      const selectedTag = target.dataset.tag ?? 'all';

      buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn === target)));

      let shown = 0;
      cards.forEach((card) => {
        const cardTags = (card.dataset.tags ?? '').split(',').filter(Boolean);
        const visible = selectedTag === 'all' || cardTags.includes(selectedTag);
        card.hidden = !visible;
        if (visible) shown++;
      });

      if (emptyEl) emptyEl.hidden = shown > 0;
      if (statusEl) statusEl.textContent = formatStatus(statusEl, shown, cards.length, selectedTag);
    });
  });
}
