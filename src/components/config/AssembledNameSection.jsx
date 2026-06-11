import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import Checkbox from '../controls/checkbox/Checkbox';
import Button from '../controls/button/Button';
import AssemblyBuildControls from './AssemblyBuildControls';
import { buildAssembledName } from '../../helpers/assembly_routing';

function routingChips(routing) {
  const chips = [];
  if (routing?.outputFilename?.enabled) chips.push('filename');
  if (routing?.labelText?.enabled) chips.push('label');
  if (routing?.dsaItemName?.enabled) chips.push('DSA');
  if (routing?.exportCsv?.enabled) chips.push('CSV');
  if (routing?.qr?.enabled && routing?.qr?.mode === 'same_column') chips.push('QR');
  return chips;
}

export default function AssembledNameSection({
  assembly,
  routing,
  disabled = false,
  columnOptions = [],
  sampleRow = null,
  onScrollToLabel,
  defaultExpanded = false,
}) {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const colName = assembly?.columnName || 'AssembledName';
  const preview = useMemo(() => {
    if (!sampleRow) return '';
    return buildAssembledName(sampleRow, assembly);
  }, [sampleRow, assembly]);

  const chips = routingChips(routing);

  function setAssembly(partial) {
    dispatch({ type: config_actions.SET_ASSEMBLY_CONFIG, payload: partial });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

  function setRouting(partial) {
    dispatch({ type: config_actions.SET_ROUTING_CONFIG, payload: partial });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

  function useAssembledNameForLabel() {
    dispatch({ type: config_actions.USE_ASSEMBLED_NAME_FOR_LABEL });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
    if (onScrollToLabel) onScrollToLabel();
  }

  return (
    <section className="assembled-name-section config-guided-section" id="config-assembled-name">
      <button
        type="button"
        className="assembled-name-section__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="__config-control-section-title">Assembled name</span>
        <span className="assembled-name-section__summary">
          <code>{preview || '(empty)'}</code>
          {chips.length > 0 && (
            <span className="assembled-name-section__chips">
              {chips.map((c) => (
                <span key={c} className="assembled-name-section__chip">{c}</span>
              ))}
            </span>
          )}
        </span>
        <span className="assembled-name-section__chevron">{expanded ? '▾' : '▸'}</span>
      </button>

      {!expanded && (
        <p className="__config-control-section-description">
          Combined metadata string shown in the file table. Expand to edit build rules and where this name is used.
        </p>
      )}

      {expanded && (
        <div className="assembled-name-section__body">
          <div className="__config-control-section-description">
            Build one human-readable name from slide metadata. It appears as a column in the file table. You can also
            route it to filenames, labels, exports, or catalog uploads.
          </div>

          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Build the name</div>
            <AssemblyBuildControls
              assembly={assembly}
              disabled={disabled}
              columnOptions={columnOptions}
              sampleRow={sampleRow}
              onAssemblyChange={setAssembly}
            />
          </div>

          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Column in file table</div>
            <div className="__config-control-subsection-description">
              Table column: <strong>Assembled name</strong> ({colName}).
            </div>
          </div>

          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Use this name elsewhere</div>
            <Checkbox
              disabled={disabled}
              label="Use for output filename"
              checked={!!routing?.outputFilename?.enabled}
              onClick={() => setRouting({ outputFilename: { enabled: !routing?.outputFilename?.enabled } })}
            />
            <Checkbox
              disabled={disabled}
              label="Use for label text"
              checked={!!routing?.labelText?.enabled}
              onClick={() => setRouting({ labelText: { enabled: !routing?.labelText?.enabled, column: colName } })}
            />
            <Checkbox
              disabled={disabled}
              label="Use for DSA catalog title"
              checked={!!routing?.dsaItemName?.enabled}
              onClick={() => setRouting({ dsaItemName: { enabled: !routing?.dsaItemName?.enabled } })}
            />
            <Checkbox
              disabled={disabled}
              label="Include in exported CSV"
              checked={!!routing?.exportCsv?.enabled}
              onClick={() => setRouting({ exportCsv: { enabled: !routing?.exportCsv?.enabled, columnHeader: colName } })}
            />
            <Checkbox
              disabled={disabled}
              label="Also encode in QR (same string)"
              checked={routing?.qr?.enabled && routing?.qr?.mode === 'same_column'}
              onClick={() => {
                const on = !(routing?.qr?.enabled && routing?.qr?.mode === 'same_column');
                setRouting({ qr: { enabled: on, mode: on ? 'same_column' : 'off' } });
              }}
            />
            <div className="__config-control-section-group _top-margin">
              <Button
                disabled={disabled}
                text="Use assembled name for label text"
                onClick={useAssembledNameForLabel}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
