import { makeEsmSearchRow } from '../reducers/esm/default_state';

function stripBom(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

function parseCsvRecords(text) {
  const records = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const s = stripBom(text);

  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ',') {
      row.push(field.trim());
      field = '';
      continue;
    }
    if (c === '\n') {
      row.push(field.trim());
      field = '';
      if (row.some((cell) => cell !== '')) records.push(row);
      row = [];
      continue;
    }
    if (c === '\r') {
      continue;
    }
    field += c;
  }

  row.push(field.trim());
  if (row.some((cell) => cell !== '')) records.push(row);

  return records;
}

function normHeader(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

const ACCESSION_HEADERS = new Set(['accession', 'accessionnumber', 'accessionno', 'acc']);
const BLOCK_HEADERS = new Set(['block', 'blockid', 'blocknum', 'cassette', 'cassetteid']);
const DEID_HEADERS = new Set(['deid', 'deidentification', 'deident', 'deidnumber', 'deidno']);
const STAIN_HEADERS = new Set(['stain', 'stainmatching', 'stainid', 'stainname']);

function classifyHeader(cell) {
  const n = normHeader(cell);
  if (ACCESSION_HEADERS.has(n)) return 'accession';
  if (BLOCK_HEADERS.has(n)) return 'block';
  if (DEID_HEADERS.has(n)) return 'deid';
  if (STAIN_HEADERS.has(n)) return 'stain';
  return null;
}

function rowIsEmpty(cells) {
  if (!Array.isArray(cells)) return true;
  return cells.every((c) => String(c ?? '').trim() === '');
}

function mapHeaderRow(cells) {
  const accessionIdx = cells.findIndex((c) => classifyHeader(c) === 'accession');
  const blockIdx = cells.findIndex((c) => classifyHeader(c) === 'block');
  const deidIdx = cells.findIndex((c) => classifyHeader(c) === 'deid');
  const stainIdx = cells.findIndex((c) => classifyHeader(c) === 'stain');
  const idxs = [accessionIdx, blockIdx, deidIdx, stainIdx].filter((j) => j >= 0);
  const looksLikeHeader = idxs.length >= 1 && idxs.length === new Set(idxs).size;
  if (!looksLikeHeader) return null;
  return { accessionIdx, blockIdx, deidIdx, stainIdx };
}

/**
 * Parse CSV text into eSM search rows (ids assigned here).
 * With header row: columns Accession, Block (optional), De-ID, Stain (optional) by name.
 * Without header: 3 columns Accession, De-ID, Stain (legacy); 4+ columns Accession, Block, De-ID, Stain.
 */
export function parseEsmSearchCriteriaCsv(text) {
  try {
    const raw = typeof text === 'string' ? text : '';
    if (!stripBom(raw).trim()) {
      return { ok: false, error: 'The file is empty.' };
    }

    const records = parseCsvRecords(raw);

    if (!Array.isArray(records) || records.length === 0) {
      return { ok: false, error: 'No rows found in CSV.' };
    }

    let startIdx = 0;
    let accessionCol = 0;
    let blockCol = -1;
    let deidCol = 1;
    let stainCol = 2;

    const headerMap = mapHeaderRow(records[0]);
    if (headerMap) {
      startIdx = 1;
      accessionCol = headerMap.accessionIdx >= 0 ? headerMap.accessionIdx : 0;
      blockCol = headerMap.blockIdx >= 0 ? headerMap.blockIdx : -1;
      deidCol = headerMap.deidIdx >= 0 ? headerMap.deidIdx : -1;
      stainCol = headerMap.stainIdx >= 0 ? headerMap.stainIdx : -1;
    } else {
      const sample = records[0];
      const w = Array.isArray(sample) ? sample.length : 0;
      if (w >= 4) {
        accessionCol = 0;
        blockCol = 1;
        deidCol = 2;
        stainCol = 3;
      } else {
        accessionCol = 0;
        blockCol = -1;
        deidCol = 1;
        stainCol = 2;
      }
    }

    const rows = [];
    for (let i = startIdx; i < records.length; i += 1) {
      const line = records[i];
      if (!Array.isArray(line) || rowIsEmpty(line)) continue;

      const accession =
        accessionCol >= 0 && line[accessionCol] != null ? String(line[accessionCol]).trim() : '';
      const blockId =
        blockCol >= 0 && line[blockCol] != null ? String(line[blockCol]).trim() : '';
      const deid = deidCol >= 0 && line[deidCol] != null ? String(line[deidCol]).trim() : '';
      const stain = stainCol >= 0 && line[stainCol] != null ? String(line[stainCol]).trim() : '';

      if (!accession && !deid && !stain && !blockId) continue;

      const base = makeEsmSearchRow();
      rows.push({
        ...base,
        accession,
        blockId,
        deid,
        stain,
      });
    }

    if (rows.length === 0) {
      return { ok: false, error: 'No data rows with values were found.' };
    }

    return { ok: true, rows };
  } catch (e) {
    const msg = e && typeof e.message === 'string' ? e.message : 'Could not parse CSV.';
    return { ok: false, error: msg };
  }
}
