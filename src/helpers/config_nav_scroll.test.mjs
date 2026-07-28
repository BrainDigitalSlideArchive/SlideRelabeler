import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSectionScrollTop,
  hasReachedScrollDestination,
  isAtScrollTarget,
  rectIntersectsRoot,
  resolveActiveSectionFromRects,
} from './config_nav_scroll.js';

const ROOT = { top: 100, bottom: 500 };

test('computeSectionScrollTop places section at root top minus padding', () => {
  // scrollTop 200, section 80px below root top → need to scroll down by 80 - padding
  assert.equal(computeSectionScrollTop(200, 100, 180, 4), 276);
  assert.equal(computeSectionScrollTop(0, 100, 50, 4), 0); // clamp
});

test('isAtScrollTarget uses inclusive epsilon', () => {
  assert.equal(isAtScrollTarget(100, 100), true);
  assert.equal(isAtScrollTarget(100, 100.5), true);
  assert.equal(isAtScrollTarget(100, 102), false);
});

test('hasReachedScrollDestination clamps when target exceeds max scroll', () => {
  const root = {
    scrollTop: 500,
    scrollHeight: 800,
    clientHeight: 300, // maxScroll = 500
  };
  assert.equal(hasReachedScrollDestination(root, 500), true);
  assert.equal(hasReachedScrollDestination(root, 650), true); // unreachable → clamped
  assert.equal(hasReachedScrollDestination(root, 400), false);
  root.scrollTop = 400;
  assert.equal(hasReachedScrollDestination(root, 650), false);
});

test('probe inside a section selects that section', () => {
  const sections = [
    { id: 'a', top: 100, bottom: 200 },
    { id: 'b', top: 200, bottom: 350 },
    { id: 'c', top: 350, bottom: 480 },
  ];
  assert.equal(resolveActiveSectionFromRects(ROOT, sections), 'a');
});

test('short trailing sections visible while earlier section owns top — not last', () => {
  const sections = [
    { id: 'output-delivery', top: 100, bottom: 220 },
    { id: 'audit', top: 220, bottom: 340 },
    { id: 'advanced', top: 340, bottom: 460 },
  ];
  assert.equal(resolveActiveSectionFromRects(ROOT, sections), 'output-delivery');
});

test('audit at top with advanced below selects audit', () => {
  const sections = [
    { id: 'output-delivery', top: -80, bottom: 100 },
    { id: 'audit', top: 100, bottom: 240 },
    { id: 'advanced', top: 240, bottom: 380 },
  ];
  assert.equal(resolveActiveSectionFromRects(ROOT, sections), 'audit');
});

test('tall last section owning the top selects last', () => {
  const sections = [
    { id: 'audit', top: -200, bottom: 90 },
    { id: 'advanced', top: 90, bottom: 800 },
  ];
  assert.equal(resolveActiveSectionFromRects(ROOT, sections), 'advanced');
});

test('probe in divider gap selects topmost visible, not off-screen previous', () => {
  // Data loading fully above viewport; divider gap; Output delivery first on screen.
  const sections = [
    { id: 'data-loading', top: -80, bottom: 95 },
    { id: 'output-delivery', top: 120, bottom: 240 },
    { id: 'audit', top: 240, bottom: 360 },
  ];
  assert.equal(rectIntersectsRoot(ROOT, sections[0]), false);
  assert.equal(resolveActiveSectionFromRects(ROOT, sections), 'output-delivery');
});

test('probe in gap between two on-screen sections selects topmost visible', () => {
  const sections = [
    { id: 'a', top: 100, bottom: 150 },
    { id: 'b', top: 180, bottom: 300 },
  ];
  assert.equal(resolveActiveSectionFromRects(ROOT, sections), 'a');

  const gapRoot = { top: 155, bottom: 500 };
  // a scrolled fully away; only b visible
  assert.equal(
    resolveActiveSectionFromRects(gapRoot, [
      { id: 'a', top: 100, bottom: 150 },
      { id: 'b', top: 180, bottom: 300 },
    ], { anchorOffset: 8 }),
    'b',
  );
});

test('empty sections returns null', () => {
  assert.equal(resolveActiveSectionFromRects(ROOT, []), null);
});

test('all sections below probe returns first visible', () => {
  const sections = [
    { id: 'a', top: 200, bottom: 300 },
    { id: 'b', top: 300, bottom: 400 },
  ];
  assert.equal(resolveActiveSectionFromRects(ROOT, sections), 'a');
});
