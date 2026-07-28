import { useEffect, useRef, useState } from 'react';

import {
  getSectionScrollTop,
  hasReachedScrollDestination,
  resolveActiveSectionId,
  sectionIntersectsScrollRoot,
} from './config_nav_scroll.js';

/**
 * Sticky config-nav selection.
 *
 * States:
 * - programmatic scroll in flight → keep clicked pin; spy off
 * - idle + pin visible → keep pin (B2)
 * - idle + pin gone / no pin → spy
 *
 * Programmatic scroll settles when the destination is reached (including
 * clamp-at-max for unreachable targets) or on `scrollend`.
 *
 * @param {string} scrollBodySelector
 * @param {string[]} sectionIds
 */
export function useConfigNavActiveSection(scrollBodySelector, sectionIds) {
  const [activeId, setActiveId] = useState(sectionIds[0]);
  const pinnedIdRef = useRef(null);
  const programmaticRef = useRef(false);
  const programmaticTargetRef = useRef(null);
  const sectionIdsRef = useRef(sectionIds);
  sectionIdsRef.current = sectionIds;

  useEffect(() => {
    const scrollRoot = document.querySelector(scrollBodySelector);
    if (!scrollRoot) return undefined;

    let frame = null;

    function syncIdle() {
      const pinned = pinnedIdRef.current;
      if (pinned) {
        if (sectionIntersectsScrollRoot(scrollRoot, pinned)) {
          setActiveId((prev) => (prev === pinned ? prev : pinned));
          return;
        }
        pinnedIdRef.current = null;
      }
      const next = resolveActiveSectionId(scrollRoot, sectionIdsRef.current);
      if (next) setActiveId((prev) => (prev === next ? prev : next));
    }

    function settleProgrammatic() {
      if (!programmaticRef.current) return;
      programmaticRef.current = false;
      programmaticTargetRef.current = null;

      const pinned = pinnedIdRef.current;
      if (pinned && !sectionIntersectsScrollRoot(scrollRoot, pinned)) {
        pinnedIdRef.current = null;
      }
      syncIdle();
    }

    function onScroll() {
      if (programmaticRef.current) {
        if (hasReachedScrollDestination(scrollRoot, programmaticTargetRef.current)) {
          settleProgrammatic();
        }
        return;
      }
      if (frame == null) {
        frame = requestAnimationFrame(() => {
          frame = null;
          syncIdle();
        });
      }
    }

    function onScrollEnd() {
      settleProgrammatic();
      if (!programmaticRef.current) {
        syncIdle();
      }
    }

    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    scrollRoot.addEventListener('scrollend', onScrollEnd);
    window.addEventListener('resize', onScroll, { passive: true });
    syncIdle();

    return () => {
      scrollRoot.removeEventListener('scroll', onScroll);
      scrollRoot.removeEventListener('scrollend', onScrollEnd);
      window.removeEventListener('resize', onScroll);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [scrollBodySelector]);

  function activateSection(id) {
    const scrollRoot = document.querySelector(scrollBodySelector);
    pinnedIdRef.current = id;
    setActiveId(id);

    if (!scrollRoot) {
      pinnedIdRef.current = null;
      programmaticRef.current = false;
      programmaticTargetRef.current = null;
      return;
    }

    const targetTop = getSectionScrollTop(scrollRoot, id);
    if (targetTop == null) return;

    // Already at destination (or already clamped at max for this target).
    if (hasReachedScrollDestination(scrollRoot, targetTop)) {
      programmaticRef.current = false;
      programmaticTargetRef.current = null;
      if (!sectionIntersectsScrollRoot(scrollRoot, id)) {
        pinnedIdRef.current = null;
        const next = resolveActiveSectionId(scrollRoot, sectionIdsRef.current);
        if (next) setActiveId(next);
      }
      return;
    }

    programmaticRef.current = true;
    programmaticTargetRef.current = targetTop;
    scrollRoot.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  return { activeId, activateSection };
}
