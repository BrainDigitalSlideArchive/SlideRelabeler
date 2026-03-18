// helpers/esm_filename_helpers.js

function safeToken(value) {
  const s = (value ?? "").toString().trim();
  if (!s) return "";
  // Replace characters that are commonly problematic in filenames across platforms.
  return s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").replace(/\s+/g, "_");
}

export function getAccessionFromBarcodeId(barcodeId) {
  if (!barcodeId) return "";
  const s = barcodeId.toString();
  return s.split(";")[0] || "";
}

export function computeAccessionToken(slide, mappingConfig) {
  const mode = mappingConfig?.accessionMode || "original";
  if (mode === "manual") return safeToken(mappingConfig?.accessionToken || "");
  if (mode === "auto") {
    // Simple deterministic token (no PHI) derived from ImageId/SlideId.
    // If you want something else (e.g., sequential CASE001, UUID short),
    // we can switch later without changing UI wiring.
    const base = safeToken(slide?.ImageId || slide?.SlideId || "");
    return base ? `CASE_${base}` : "";
  }
  // original
  return safeToken(getAccessionFromBarcodeId(slide?.BarcodeId));
}

export function buildBaseFilename(slide, accessionToken, mappingConfig, transformValue) {
  const fields = Array.isArray(mappingConfig?.fieldsOrder) ? mappingConfig.fieldsOrder : [];
  const parts = [];
  for (const field of fields) {
    if (field === "Accession") {
      if (accessionToken) {
        const v = typeof transformValue === "function" ? transformValue(accessionToken, field) : accessionToken;
        parts.push(safeToken(v));
      }
      continue;
    }
    const v = slide?.[field];
    const vv = typeof transformValue === "function" ? transformValue(v, field) : v;
    const tok = safeToken(vv);
    if (tok) parts.push(tok);
  }
  return parts.filter(Boolean).join("_");
}

export function applyDuplicateStrategy(items, duplicateStrategy) {
  // items: [{ id, baseName, ext }]
  const strat = duplicateStrategy || "suffix-index";
  const seen = new Map(); // key: full baseName, value: count
  const out = [];

  for (const it of items) {
    const key = it.baseName;
    const prev = seen.get(key) || 0;
    if (prev === 0) {
      seen.set(key, 1);
      out.push({ ...it, finalBaseName: it.baseName });
      continue;
    }

    if (strat === "skip-duplicates") {
      // omit subsequent duplicates
      continue;
    }

    // suffix-index
    const nextIndex = prev + 1;
    seen.set(key, nextIndex);
    out.push({ ...it, finalBaseName: `${it.baseName}_${nextIndex}` });
  }

  return out;
}

