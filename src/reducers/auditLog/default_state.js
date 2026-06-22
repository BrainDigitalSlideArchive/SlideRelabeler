export const DEFAULT_AUDIT_LOG_SETTINGS = {
  enabled: true,
  maxEntries: null,
};

export default {
  settings: { ...DEFAULT_AUDIT_LOG_SETTINGS },
  currentRunId: null,
  nextSequence: 0,
  entries: [],
};
