import {
  formatEngineMessagesForDiagnostics,
} from './diagnostics_log_format.js';

function parseMaybeJsonList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [raw];
    } catch {
      return [raw];
    }
  }
  return [raw];
}

/**
 * Pull engine debug/error rings into diagnostics.log, then clear the rings.
 * Safe to call from renderer or sagas (uses global electronAPI).
 */
export async function drainEngineToDiagnosticsLog() {
  if (typeof electronAPI === 'undefined') return;
  const rawDebugs = await electronAPI.getDebugs();
  const rawErrors = await electronAPI.getErrors();
  const debugs = parseMaybeJsonList(rawDebugs);
  const errors = parseMaybeJsonList(rawErrors);
  const lines = [
    ...formatEngineMessagesForDiagnostics(debugs, 'engine-debug'),
    ...formatEngineMessagesForDiagnostics(errors, 'engine-error'),
  ];
  if (lines.length > 0) {
    await electronAPI.appendDiagnosticsLogLines(lines);
  }
  await electronAPI.clearDebugs();
  await electronAPI.clearErrors();
}
