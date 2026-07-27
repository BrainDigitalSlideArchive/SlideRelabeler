import React from 'react';

import * as modal_actions from '../../actions/modal';
import {
  scrollSectionIntoView,
} from '../../helpers/config_nav_scroll.js';
import { useConfigNavActiveSection } from '../../helpers/useConfigNavActiveSection.js';

export const CONFIG_NAV_ITEMS = [
  { id: 'config-overview', label: 'Overview' },
  { id: 'config-output-filename', label: 'Output name' },
  { id: 'config-slide-label', label: 'Slide label' },
  { id: 'config-data-loading', label: 'Data loading' },
  { id: 'config-output-delivery', label: 'Output delivery' },
  { id: 'config-audit-logging', label: 'Audit logging' },
  { id: 'config-advanced', label: 'Advanced' },
  { id: 'config-profiles', label: 'Profiles' },
];

/** @deprecated Use CONFIG_NAV_ITEMS */
export const CONFIG_V2_NAV_ITEMS = CONFIG_NAV_ITEMS;

const SCROLL_BODY_SELECTOR = '.config-v2__body';
const SECTION_IDS = CONFIG_NAV_ITEMS.map((item) => item.id);

export function scrollConfigSectionIntoView(id) {
  const scrollRoot = document.querySelector(SCROLL_BODY_SELECTOR);
  scrollSectionIntoView(scrollRoot, id);
}

/** @deprecated Use scrollConfigSectionIntoView */
export const scrollConfigV2SectionIntoView = scrollConfigSectionIntoView;

/** Open Configuration modal and scroll to a section id (e.g. config-dsa-upload). */
export function openConfigSettings(dispatch, sectionId) {
  dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'config' } });
  requestAnimationFrame(() => {
    setTimeout(() => scrollConfigSectionIntoView(sectionId), 50);
  });
}

export default function ConfigV2Nav() {
  const { activeId, activateSection } = useConfigNavActiveSection(
    SCROLL_BODY_SELECTOR,
    SECTION_IDS,
  );

  return (
    <nav className="cfg-shell__nav" aria-label="Configuration sections">
      {CONFIG_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`cfg-shell__nav-link${activeId === item.id ? ' cfg-shell__nav-link--active' : ''}`}
          aria-current={activeId === item.id ? 'true' : undefined}
          onClick={() => activateSection(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
