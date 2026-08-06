import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LABEL_ICON_UNREADABLE_DETAIL,
  LABEL_ICON_UNREADABLE_SUMMARY,
} from './label_icon_batch.js';
import {
  DELIVERY_LOCAL_FOLDER_SUMMARY,
  DELIVERY_NONE_ENABLED_SUMMARY,
  getProcessBlockerDetail,
  getProcessBlockerMessage,
  getProcessBlockerSettingsSection,
  isProcessBlockerWarning,
  isProcessReadinessBlocked,
} from './process_blockers.js';

const ready = {
  processReady: true,
  anyDeliveryEnabled: true,
  localEnabled: true,
  localConfigured: true,
  uploadEnabled: false,
  uploadConfigured: true,
  patternValidation: { blocking: false, messages: [] },
};

describe('getProcessBlockerMessage', () => {
  it('asks for files when the table is empty', () => {
    assert.equal(getProcessBlockerMessage(0, ready), 'Select files to inspect and process');
  });

  it('flags unreadable label icon ahead of delivery issues', () => {
    const notReady = {
      ...ready,
      processReady: false,
      anyDeliveryEnabled: false,
    };
    assert.equal(
      getProcessBlockerMessage(2, notReady, { iconReadable: false }),
      LABEL_ICON_UNREADABLE_SUMMARY,
    );
    assert.match(LABEL_ICON_UNREADABLE_SUMMARY, /label icon/i);
  });

  it('ignores icon while readability is pending', () => {
    assert.equal(getProcessBlockerMessage(1, ready, { iconReadable: null }), '');
    assert.equal(getProcessBlockerMessage(1, ready, { iconReadable: true }), '');
  });

  it('uses a single homepage line when nothing is enabled', () => {
    assert.equal(
      getProcessBlockerMessage(1, {
        ...ready,
        processReady: false,
        anyDeliveryEnabled: false,
      }),
      DELIVERY_NONE_ENABLED_SUMMARY,
    );
  });

  it('uses a single homepage line when local save is incomplete', () => {
    assert.equal(
      getProcessBlockerMessage(1, {
        ...ready,
        processReady: false,
        localConfigured: false,
      }),
      DELIVERY_LOCAL_FOLDER_SUMMARY,
    );
  });
});

describe('getProcessBlockerDetail', () => {
  it('expands label-icon guidance for the popover', () => {
    assert.equal(
      getProcessBlockerDetail(1, ready, { iconReadable: false }),
      LABEL_ICON_UNREADABLE_DETAIL,
    );
    assert.notEqual(LABEL_ICON_UNREADABLE_DETAIL, LABEL_ICON_UNREADABLE_SUMMARY);
  });

  it('matches the short message for homepage delivery blockers', () => {
    const none = {
      ...ready,
      processReady: false,
      anyDeliveryEnabled: false,
    };
    assert.equal(getProcessBlockerDetail(1, none), getProcessBlockerMessage(1, none));

    const local = {
      ...ready,
      processReady: false,
      localConfigured: false,
    };
    assert.equal(getProcessBlockerDetail(1, local), getProcessBlockerMessage(1, local));
  });
});

describe('getProcessBlockerSettingsSection', () => {
  it('deep-links icon issues to Slide label', () => {
    assert.equal(
      getProcessBlockerSettingsSection(1, ready, { iconReadable: false }),
      'config-slide-label',
    );
  });

  it('does not deep-link homepage delivery enable/folder blockers to Settings', () => {
    assert.equal(
      getProcessBlockerSettingsSection(1, {
        ...ready,
        processReady: false,
        anyDeliveryEnabled: false,
      }),
      null,
    );
    assert.equal(
      getProcessBlockerSettingsSection(1, {
        ...ready,
        processReady: false,
        localConfigured: false,
      }),
      null,
    );
  });

  it('deep-links unfinished upload connection to Output delivery settings', () => {
    assert.equal(
      getProcessBlockerSettingsSection(1, {
        ...ready,
        processReady: false,
        uploadEnabled: true,
        uploadConfigured: false,
        uploadReadiness: { blockers: ['Sign in to DSA'] },
      }),
      'config-output-delivery',
    );
  });
});

describe('isProcessReadinessBlocked', () => {
  it('blocks on empty table, unread icon, or processReady false', () => {
    assert.equal(isProcessReadinessBlocked(0, ready), true);
    assert.equal(isProcessReadinessBlocked(1, ready, { iconReadable: false }), true);
    assert.equal(isProcessReadinessBlocked(1, { ...ready, processReady: false }), true);
    assert.equal(isProcessReadinessBlocked(1, ready, { iconReadable: true }), false);
  });
});

describe('isProcessBlockerWarning', () => {
  it('is warning only when files are loaded and a message exists', () => {
    assert.equal(isProcessBlockerWarning(0, 'Select files…'), false);
    assert.equal(isProcessBlockerWarning(2, LABEL_ICON_UNREADABLE_SUMMARY), true);
    assert.equal(isProcessBlockerWarning(2, ''), false);
  });
});
