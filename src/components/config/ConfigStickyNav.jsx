import React from 'react';

import * as modal_actions from '../../actions/modal';
import {
  scrollSectionIntoView,
} from '../../helpers/config_nav_scroll.js';
import { useConfigNavActiveSection } from '../../helpers/useConfigNavActiveSection.js';

const NAV_ITEMS = [
  { id: 'config-overview', label: 'Overview' },
  { id: 'config-output-filename', label: 'Output name' },
  { id: 'config-slide-label', label: 'Slide label' },
  { id: 'config-data-loading', label: 'Data loading' },
  { id: 'config-output-delivery', label: 'Output delivery' },
  { id: 'config-audit-logging', label: 'Audit logging' },
  { id: 'config-advanced', label: 'Advanced' },
];

const SCROLL_BODY_SELECTOR = '.config-panel__body';
const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

export function scrollConfigSectionIntoView(id) {
  const scrollRoot = document.querySelector(SCROLL_BODY_SELECTOR);
  scrollSectionIntoView(scrollRoot, id);
}

/** Open Configuration modal and scroll to a section id (e.g. config-dsa-upload). */
export function openConfigSettings(dispatch, sectionId) {
  dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'config' } });
  requestAnimationFrame(() => {
    setTimeout(() => scrollConfigSectionIntoView(sectionId), 50);
  });
}

export default function ConfigStickyNav() {
  const { activeId, activateSection } = useConfigNavActiveSection(
    SCROLL_BODY_SELECTOR,
    SECTION_IDS,
  );

  return (
    <nav className="config-sticky-nav" aria-label="Configuration sections">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`config-sticky-nav__link${activeId === item.id ? ' config-sticky-nav__link--active' : ''}`}
          aria-current={activeId === item.id ? 'true' : undefined}
          onClick={() => activateSection(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
