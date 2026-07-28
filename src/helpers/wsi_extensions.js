// helpers/wsi_extensions.js — supported whole-slide image extensions (file picker + folder walk).

export const WSI_SUPPORTED_EXTENSIONS = ['.svs', '.ndpi', '.tif', '.tiff'];

/** Electron dialog filter extensions (no leading dot). */
export const WSI_DIALOG_EXTENSIONS = WSI_SUPPORTED_EXTENSIONS.map((ext) => ext.slice(1));

export function formatWsiExtensionList() {
  return WSI_SUPPORTED_EXTENSIONS.join(', ');
}

export function isWsiExtension(filename) {
  if (!filename) return false;
  const lower = String(filename).toLowerCase();
  return WSI_SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
