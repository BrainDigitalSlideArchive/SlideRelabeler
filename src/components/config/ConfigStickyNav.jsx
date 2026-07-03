import React, { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { id: 'config-overview', label: 'Overview' },
  { id: 'config-output-filename', label: 'Output name' },
  { id: 'config-output-delivery', label: 'Output delivery' },
  { id: 'config-slide-label', label: 'Slide label' },
  { id: 'config-audit-logging', label: 'Audit logging' },
  { id: 'config-data-loading', label: 'Data loading' },
  { id: 'config-advanced', label: 'Advanced' },
];

const SCROLL_BODY_SELECTOR = '.config-panel__body';

export function scrollConfigSectionIntoView(id) {
  const el = document.getElementById(id);
  const scrollRoot = document.querySelector(SCROLL_BODY_SELECTOR);
  if (!el || !scrollRoot) return;

  const rootRect = scrollRoot.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const targetTop = scrollRoot.scrollTop + (elRect.top - rootRect.top) - 4;
  scrollRoot.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
}

/** Last section whose heading has reached the top of the scroll area. */
function resolveActiveSectionId(scrollRoot) {
  const rootRect = scrollRoot.getBoundingClientRect();
  const anchorY = rootRect.top + 8;

  const atBottom =
    scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 8;

  if (atBottom) {
    for (let i = NAV_ITEMS.length - 1; i >= 0; i -= 1) {
      if (document.getElementById(NAV_ITEMS[i].id)) return NAV_ITEMS[i].id;
    }
  }

  let active = NAV_ITEMS[0].id;
  for (const item of NAV_ITEMS) {
    const el = document.getElementById(item.id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= anchorY) {
      active = item.id;
    } else {
      break;
    }
  }
  return active;
}

export default function ConfigStickyNav() {
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);

  useEffect(() => {
    const scrollRoot = document.querySelector(SCROLL_BODY_SELECTOR);
    if (!scrollRoot) return undefined;

    let frame = null;

    function update() {
      frame = null;
      const next = resolveActiveSectionId(scrollRoot);
      setActiveId((prev) => (prev === next ? prev : next));
    }

    function scheduleUpdate() {
      if (frame == null) {
        frame = requestAnimationFrame(update);
      }
    }

    scrollRoot.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    update();

    return () => {
      scrollRoot.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  function scrollTo(id) {
    scrollConfigSectionIntoView(id);
  }

  return (
    <nav className="config-sticky-nav" aria-label="Configuration sections">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`config-sticky-nav__link${activeId === item.id ? ' config-sticky-nav__link--active' : ''}`}
          aria-current={activeId === item.id ? 'true' : undefined}
          onClick={() => scrollTo(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
