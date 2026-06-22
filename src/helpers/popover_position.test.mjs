import test from 'node:test';
import assert from 'node:assert/strict';
import { computePopoverPosition } from './popover_position.js';

function mockRect(el, rect) {
  el.getBoundingClientRect = () => ({
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    left: rect.left,
  });
}

test('computePopoverPosition prefers below the trigger', () => {
  const iconEl = { getBoundingClientRect: () => ({}) };
  const popoverEl = { style: {}, getBoundingClientRect: () => ({}) };
  const boundsEl = { getBoundingClientRect: () => ({}) };

  mockRect(boundsEl, { left: 0, top: 0, width: 800, height: 600 });
  mockRect(iconEl, { left: 120, top: 80, width: 20, height: 20 });
  mockRect(popoverEl, { left: 0, top: 0, width: 320, height: 96 });

  const style = computePopoverPosition(iconEl, popoverEl, boundsEl);
  assert.equal(style.left, '120px');
  assert.equal(style.top, '108px');
});

test('computePopoverPosition clamps within modal bounds', () => {
  const iconEl = { getBoundingClientRect: () => ({}) };
  const popoverEl = { style: {}, getBoundingClientRect: () => ({}) };
  const boundsEl = { getBoundingClientRect: () => ({}) };

  mockRect(boundsEl, { left: 100, top: 100, width: 400, height: 300 });
  mockRect(iconEl, { left: 420, top: 120, width: 20, height: 20 });
  mockRect(popoverEl, { left: 0, top: 0, width: 320, height: 96 });

  const style = computePopoverPosition(iconEl, popoverEl, boundsEl);
  assert.ok(parseInt(style.left, 10) <= 492 - 320 - 8);
  assert.equal(style.top, '148px');
});
