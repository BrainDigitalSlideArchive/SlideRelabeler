import React from 'react';

const NAV_ITEMS = [
  { id: 'config-overview', label: 'Overview' },
  { id: 'config-output-filename', label: 'Output filename' },
  { id: 'config-slide-label', label: 'Slide label' },
  { id: 'config-import-csv', label: 'Import CSV' },
  { id: 'config-assembled-name', label: 'Assembled name' },
  { id: 'config-advanced', label: 'Advanced' },
];

export default function ConfigStickyNav() {
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="config-sticky-nav" aria-label="Configuration sections">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="config-sticky-nav__link"
          onClick={() => scrollTo(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
