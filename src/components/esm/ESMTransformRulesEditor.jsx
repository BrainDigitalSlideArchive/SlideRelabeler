import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import InputText from '../controls/input/InputText';
import { applyRules, getSelectedTransformRules } from '../../helpers/esm_transform_rules';

import './esm_light_panel.scss';

export default function ESMTransformRulesEditor({ disabled = false }) {
  const dispatch = useDispatch();
  const transformRules = useSelector((s) => s.esm.transformRules) || [];
  const selectedTransformRuleIds = useSelector((s) => s.esm.selectedTransformRuleIds) || [];

  const [editingRuleId, setEditingRuleId] = useState(null);
  const [testInput, setTestInput] = useState('');

  const selectedRules = getSelectedTransformRules(transformRules, selectedTransformRuleIds);
  const testOutput = applyRules(testInput, selectedRules);

  function makeId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function toggleSelectedRule(id) {
    if (disabled) return;
    const current = Array.isArray(selectedTransformRuleIds) ? selectedTransformRuleIds : [];
    const exists = current.includes(id);
    const next = exists ? current.filter((x) => x !== id) : [...current, id];
    dispatch({ type: esm_actions.ESM_SET_SELECTED_TRANSFORM_RULE_IDS, payload: next });
  }

  function moveSelectedRule(id, dir) {
    if (disabled) return;
    const current = Array.isArray(selectedTransformRuleIds) ? [...selectedTransformRuleIds] : [];
    const idx = current.indexOf(id);
    if (idx === -1) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= current.length) return;
    const tmp = current[idx];
    current[idx] = current[nextIdx];
    current[nextIdx] = tmp;
    dispatch({ type: esm_actions.ESM_SET_SELECTED_TRANSFORM_RULE_IDS, payload: current });
  }

  return (
    <section className="esm-transform-rules-editor" aria-labelledby="esm-transform-rules-title">
      <h3 id="esm-transform-rules-title" className="esm-light-panel__subsection-title">
        Transform rules (site-specific)
      </h3>
      <p className="esm-light-panel__hint">
        Find/replace steps normalize eSM field values before filenames are built. Selected rules apply to TargetFilename
        and to added files.
      </p>

      <div className="esm-light-panel__actions-row">
        <button
          type="button"
          className="esm-light-panel__btn esm-light-panel__btn--primary"
          disabled={disabled}
          onClick={() => {
            const id = makeId();
            const rule = {
              id,
              name: 'New rule',
              enabled: true,
              steps: [{ find: '', replace: '', matchMode: 'all', caseSensitive: true }],
            };
            dispatch({ type: esm_actions.ESM_ADD_TRANSFORM_RULE, payload: rule });
            setEditingRuleId(id);
          }}
        >
          Add rule
        </button>
        <button
          type="button"
          className="esm-light-panel__btn esm-light-panel__btn--secondary"
          disabled={disabled || selectedTransformRuleIds.length === 0}
          onClick={() => dispatch({ type: esm_actions.ESM_SET_SELECTED_TRANSFORM_RULE_IDS, payload: [] })}
        >
          Clear selected rules
        </button>
      </div>

      <div className="esm-light-panel__scroll" role="list">
        {(Array.isArray(transformRules) ? transformRules : []).map((rule) => {
          const selected = Array.isArray(selectedTransformRuleIds) && selectedTransformRuleIds.includes(rule.id);
          const isEditing = editingRuleId === rule.id;
          return (
            <div key={rule.id} className="esm-light-panel__rule-card" role="listitem">
              <div className="esm-light-panel__rule-card-header">
                <div className="esm-light-panel__rule-card-title">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => toggleSelectedRule(rule.id)}
                    aria-label={`Select rule ${rule.name || 'unnamed'}`}
                  />
                  <span>{rule.name || '(unnamed rule)'}</span>
                  {rule.enabled === false && (
                    <span style={{ opacity: 0.65, fontWeight: 500 }}>(disabled)</span>
                  )}
                </div>
                <div className="esm-light-panel__rule-card-actions">
                  <button
                    type="button"
                    className="esm-light-panel__btn esm-light-panel__btn--outline"
                    disabled={disabled || !selected}
                    onClick={() => moveSelectedRule(rule.id, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="esm-light-panel__btn esm-light-panel__btn--outline"
                    disabled={disabled || !selected}
                    onClick={() => moveSelectedRule(rule.id, 1)}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="esm-light-panel__btn esm-light-panel__btn--outline"
                    disabled={disabled}
                    onClick={() => setEditingRuleId(isEditing ? null : rule.id)}
                  >
                    {isEditing ? 'Close' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    className="esm-light-panel__btn esm-light-panel__btn--danger"
                    disabled={disabled}
                    onClick={() => dispatch({ type: esm_actions.ESM_DELETE_TRANSFORM_RULE, payload: rule.id })}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="esm-light-panel__rule-edit">
                  <InputText
                    label={'Rule name'}
                    value={rule.name || ''}
                    variant="onLight"
                    disabled={disabled}
                    onChange={(v) =>
                      dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, name: v } })
                    }
                  />
                  <div className="esm-light-panel__actions-row">
                    <label className="esm-light-panel__inline-label">
                      <input
                        type="checkbox"
                        checked={rule.enabled !== false}
                        disabled={disabled}
                        onChange={() =>
                          dispatch({
                            type: esm_actions.ESM_UPDATE_TRANSFORM_RULE,
                            payload: { id: rule.id, enabled: rule.enabled === false },
                          })
                        }
                      />
                      Enabled
                    </label>
                    <button
                      type="button"
                      className="esm-light-panel__btn esm-light-panel__btn--secondary"
                      disabled={disabled}
                      onClick={() => {
                        const steps = Array.isArray(rule.steps) ? rule.steps : [];
                        dispatch({
                          type: esm_actions.ESM_UPDATE_TRANSFORM_RULE,
                          payload: {
                            id: rule.id,
                            steps: [...steps, { find: '', replace: '', matchMode: 'all', caseSensitive: true }],
                          },
                        });
                      }}
                    >
                      Add step
                    </button>
                  </div>

                  {(Array.isArray(rule.steps) ? rule.steps : []).map((step, idx) => (
                    <div key={idx} className="esm-light-panel__step-row">
                      <div className="esm-light-panel__field" style={{ flex: '2 1 8rem' }}>
                        <InputText
                          label={`Find (${idx + 1})`}
                          value={step?.find ?? ''}
                          variant="onLight"
                          disabled={disabled}
                          onChange={(v) => {
                            const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                            steps[idx] = { ...steps[idx], find: v };
                            dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                          }}
                        />
                      </div>
                      <div className="esm-light-panel__field" style={{ flex: '2 1 8rem' }}>
                        <InputText
                          label={'Replace'}
                          value={step?.replace ?? ''}
                          variant="onLight"
                          disabled={disabled}
                          onChange={(v) => {
                            const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                            steps[idx] = { ...steps[idx], replace: v };
                            dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                          }}
                        />
                      </div>
                      <div className="esm-light-panel__field" style={{ flex: '0 1 6rem' }}>
                        <label className="esm-light-panel__label" htmlFor={`esm-rule-${rule.id}-mode-${idx}`}>
                          Mode
                        </label>
                        <select
                          id={`esm-rule-${rule.id}-mode-${idx}`}
                          className="esm-light-panel__select"
                          disabled={disabled}
                          value={step?.matchMode === 'first' ? 'first' : 'all'}
                          onChange={(e) => {
                            const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                            steps[idx] = { ...steps[idx], matchMode: e.target.value };
                            dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                          }}
                        >
                          <option value="all">All</option>
                          <option value="first">First</option>
                        </select>
                      </div>
                      <label className="esm-light-panel__inline-label" style={{ marginBottom: '0.15rem' }}>
                        <input
                          type="checkbox"
                          checked={step?.caseSensitive !== false}
                          disabled={disabled}
                          onChange={() => {
                            const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                            steps[idx] = { ...steps[idx], caseSensitive: !(step?.caseSensitive !== false) };
                            dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                          }}
                        />
                        Case sensitive
                      </label>
                      <button
                        type="button"
                        className="esm-light-panel__btn esm-light-panel__btn--outline"
                        disabled={disabled}
                        onClick={() => {
                          const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                          steps.splice(idx, 1);
                          dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h4 className="esm-light-panel__subsection-title" style={{ marginTop: '0.35rem' }}>
        Live test
      </h4>
      <p className="esm-light-panel__hint">
        Quick check for selected rules. After searching eSM, use the TargetFilename column for a full preview.
      </p>
      <div className="esm-light-panel__field-grid">
        <InputText label={'Test input'} value={testInput} onChange={setTestInput} variant="onLight" disabled={disabled} />
        <InputText
          label={'Test output'}
          value={testOutput}
          onChange={() => {}}
          disabled={true}
          variant="onLight"
        />
      </div>
    </section>
  );
}
