/**
 * Config sticky-nav scroll helpers.
 *
 * ## Active section (spy)
 * Prefer the section containing a top-of-scrollport probe among sections that
 * intersect the scrollport; otherwise the topmost visible section.
 *
 * ## Nav click (pin + smooth scroll)
 * Click selects a section immediately. While a programmatic smooth scroll to
 * that section is in flight, the spy is suppressed (standard scrollspy pattern).
 * After the scroll settles, keep the pin while the section remains visible (B2);
 * clear it when the section leaves the scrollport.
 */

export const CONFIG_NAV_ANCHOR_OFFSET_PX = 8;
export const CONFIG_NAV_SCROLL_TOP_PADDING_PX = 4;
export const CONFIG_NAV_SCROLL_EPSILON_PX = 1;

/**
 * @param {{ top: number, bottom: number }} rootRect
 * @param {{ top: number, bottom: number }} sectionRect
 */
export function rectIntersectsRoot(rootRect, sectionRect) {
  return sectionRect.bottom > rootRect.top && sectionRect.top < rootRect.bottom;
}

/**
 * Pure scrollTop needed to place a section at the top of the scrollport.
 *
 * @param {number} scrollTop current scrollRoot.scrollTop
 * @param {number} rootTop scrollRoot.getBoundingClientRect().top
 * @param {number} sectionTop section.getBoundingClientRect().top
 * @param {number} [topPadding]
 */
export function computeSectionScrollTop(
  scrollTop,
  rootTop,
  sectionTop,
  topPadding = CONFIG_NAV_SCROLL_TOP_PADDING_PX,
) {
  return Math.max(0, scrollTop + (sectionTop - rootTop) - topPadding);
}

/**
 * @param {number} scrollTop
 * @param {number} targetTop
 * @param {number} [epsilon]
 */
export function isAtScrollTarget(
  scrollTop,
  targetTop,
  epsilon = CONFIG_NAV_SCROLL_EPSILON_PX,
) {
  return Math.abs(scrollTop - targetTop) <= epsilon;
}

/**
 * True when scrollTop has reached target, or target is past max scroll and we
 * are clamped at the bottom (typical for short trailing sections).
 *
 * @param {{ scrollTop: number, scrollHeight: number, clientHeight: number }} scrollRoot
 * @param {number | null | undefined} targetTop
 */
export function hasReachedScrollDestination(scrollRoot, targetTop) {
  if (targetTop == null || !scrollRoot) return false;
  if (isAtScrollTarget(scrollRoot.scrollTop, targetTop)) return true;

  const maxScroll = Math.max(0, scrollRoot.scrollHeight - scrollRoot.clientHeight);
  if (targetTop > maxScroll && isAtScrollTarget(scrollRoot.scrollTop, maxScroll)) {
    return true;
  }
  return false;
}

/**
 * Pure resolver for tests and DOM wrapper.
 *
 * @param {{ top: number, bottom: number }} rootRect
 * @param {Array<{ id: string, top: number, bottom: number }>} sections
 * @param {{ anchorOffset?: number }} [opts]
 * @returns {string | null}
 */
export function resolveActiveSectionFromRects(rootRect, sections, opts = {}) {
  if (!sections.length) return null;

  const visible = sections.filter((section) => rectIntersectsRoot(rootRect, section));
  if (!visible.length) {
    return sections[0].id;
  }

  const anchorOffset = opts.anchorOffset ?? CONFIG_NAV_ANCHOR_OFFSET_PX;
  const probeY = rootRect.top + anchorOffset;

  for (const section of visible) {
    if (section.top <= probeY && section.bottom > probeY) {
      return section.id;
    }
  }

  return visible[0].id;
}

/**
 * @param {Element} scrollRoot
 * @param {string} sectionId
 * @returns {boolean}
 */
export function sectionIntersectsScrollRoot(scrollRoot, sectionId) {
  if (!scrollRoot || !sectionId) return false;
  const el = document.getElementById(sectionId);
  if (!el) return false;
  const rootRect = scrollRoot.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return rectIntersectsRoot(rootRect, { top: rect.top, bottom: rect.bottom });
}

/**
 * @param {Element} scrollRoot
 * @param {string} sectionId
 * @param {{ topPadding?: number }} [opts]
 * @returns {number | null} target scrollTop, or null if missing
 */
export function getSectionScrollTop(scrollRoot, sectionId, opts = {}) {
  if (!scrollRoot) return null;
  const el = document.getElementById(sectionId);
  if (!el) return null;

  const topPadding = opts.topPadding ?? CONFIG_NAV_SCROLL_TOP_PADDING_PX;
  const rootRect = scrollRoot.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return computeSectionScrollTop(
    scrollRoot.scrollTop,
    rootRect.top,
    elRect.top,
    topPadding,
  );
}

/**
 * @param {Element} scrollRoot
 * @param {string[]} sectionIds
 * @param {{ anchorOffset?: number }} [opts]
 * @returns {string | null}
 */
export function resolveActiveSectionId(scrollRoot, sectionIds, opts = {}) {
  if (!scrollRoot || !sectionIds?.length) return null;

  const rootRect = scrollRoot.getBoundingClientRect();
  const sections = [];
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    sections.push({ id, top: rect.top, bottom: rect.bottom });
  }

  return resolveActiveSectionFromRects(rootRect, sections, opts);
}

/**
 * @param {Element} scrollRoot
 * @param {string} sectionId
 * @param {{ behavior?: ScrollBehavior, topPadding?: number }} [opts]
 * @returns {number | null} target scrollTop
 */
export function scrollSectionIntoView(scrollRoot, sectionId, opts = {}) {
  const targetTop = getSectionScrollTop(scrollRoot, sectionId, opts);
  if (targetTop == null || !scrollRoot) return null;

  const behavior = opts.behavior ?? 'smooth';
  scrollRoot.scrollTo({ top: targetTop, behavior });
  return targetTop;
}
