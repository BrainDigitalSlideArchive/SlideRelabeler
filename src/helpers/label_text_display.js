// helpers/label_text_display.js — collapsed file-table display for multiline label text.

/** Visible return-arrow glyph for newlines in dense grid cells (U+21B5). */
export const LABEL_TEXT_NEWLINE_GLYPH = '\u21B5';

export function isMultilineLabelText(text) {
  if (text == null) return false;
  const s = String(text);
  return s.includes('\n') || s.includes('\r');
}

/**
 * QR "Use Label" payload: empty when label text contains line breaks.
 */
export function qrPayloadFromLabelText(labelText) {
  if (labelText == null) return '';
  const text = String(labelText);
  if (isMultilineLabelText(text)) return '';
  return text;
}

/**
 * Single-line cell display: replace newlines with ↵ (no raw line breaks).
 */
export function formatLabelTextCellDisplay(text) {
  if (text == null) return '';
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, LABEL_TEXT_NEWLINE_GLYPH);
}
