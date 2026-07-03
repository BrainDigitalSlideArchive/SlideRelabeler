const MARGIN = 8;
const GAP = 8;
const MIN_WIDTH = 240;
const MAX_WIDTH = 640;

export function findPopoverBoundsElement(root) {
  if (!root) return null;
  return (
    root.closest('.__modal')
    || root.closest('.__content')
    || root.closest('.__config-controls')
    || root.parentElement
    || null
  );
}

function overflowAmount(left, top, width, height, boundsRect) {
  return (
    Math.max(0, boundsRect.left + MARGIN - left)
    + Math.max(0, left + width - boundsRect.right + MARGIN)
    + Math.max(0, boundsRect.top + MARGIN - top)
    + Math.max(0, top + height - boundsRect.bottom + MARGIN)
  );
}

function clampPosition(left, top, width, height, boundsRect) {
  return {
    left: Math.min(
      Math.max(left, boundsRect.left + MARGIN),
      boundsRect.right - width - MARGIN,
    ),
    top: Math.min(
      Math.max(top, boundsRect.top + MARGIN),
      boundsRect.bottom - height - MARGIN,
    ),
  };
}

/**
 * Compute fixed viewport coordinates for a popover anchored to a trigger element.
 * Prefers below the trigger, then above, right, and left.
 */
export function computePopoverPosition(iconEl, popoverEl, boundsEl) {
  if (!iconEl || !popoverEl) return null;

  const boundsRect = boundsEl
    ? boundsEl.getBoundingClientRect()
    : document.documentElement.getBoundingClientRect();
  const iconRect = iconEl.getBoundingClientRect();

  const maxWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, boundsRect.width - MARGIN * 2));
  popoverEl.style.maxWidth = `${Math.round(maxWidth)}px`;

  const measured = popoverEl.getBoundingClientRect();
  const width = Math.min(Math.max(measured.width, 1), maxWidth);
  const height = Math.max(measured.height, 1);

  const candidates = [
    { left: iconRect.left, top: iconRect.bottom + GAP },
    { left: iconRect.right - width, top: iconRect.bottom + GAP },
    { left: iconRect.left + (iconRect.width / 2) - (width / 2), top: iconRect.bottom + GAP },
    { left: iconRect.left, top: iconRect.top - GAP - height },
    { left: iconRect.right + GAP, top: iconRect.top },
    { left: iconRect.left - GAP - width, top: iconRect.top },
  ];

  let best = candidates[0];
  let bestOverflow = Infinity;
  for (const candidate of candidates) {
    const overflow = overflowAmount(candidate.left, candidate.top, width, height, boundsRect);
    if (overflow < bestOverflow) {
      bestOverflow = overflow;
      best = candidate;
    }
  }

  const clamped = clampPosition(best.left, best.top, width, height, boundsRect);

  return {
    left: `${Math.round(clamped.left)}px`,
    top: `${Math.round(clamped.top)}px`,
    maxWidth: `${Math.round(maxWidth)}px`,
  };
}
