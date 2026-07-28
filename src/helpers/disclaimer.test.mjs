import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DISCLAIMER_TEXT_VERSION,
  DISCLAIMER_PROMPT_EVERY_LAUNCH,
  DISCLAIMER_PROMPT_ALLOW_REMEMBER,
  needsDisclaimerPrompt,
  normalizeDisclaimer,
} from './disclaimer.js';

test('needsDisclaimerPrompt is true for everyLaunch even with accepted version', () => {
  assert.equal(
    needsDisclaimerPrompt({
      promptMode: DISCLAIMER_PROMPT_EVERY_LAUNCH,
      acceptedVersion: DISCLAIMER_TEXT_VERSION,
    }),
    true,
  );
});

test('needsDisclaimerPrompt is false for allowRemember with matching version', () => {
  assert.equal(
    needsDisclaimerPrompt({
      promptMode: DISCLAIMER_PROMPT_ALLOW_REMEMBER,
      acceptedVersion: DISCLAIMER_TEXT_VERSION,
    }),
    false,
  );
});

test('needsDisclaimerPrompt is true for allowRemember without acceptance', () => {
  assert.equal(
    needsDisclaimerPrompt({ promptMode: DISCLAIMER_PROMPT_ALLOW_REMEMBER, acceptedVersion: null }),
    true,
  );
});

test('normalizeDisclaimer defaults missing fields', () => {
  assert.deepEqual(normalizeDisclaimer(undefined), {
    promptMode: DISCLAIMER_PROMPT_EVERY_LAUNCH,
    acceptedVersion: null,
  });
});
