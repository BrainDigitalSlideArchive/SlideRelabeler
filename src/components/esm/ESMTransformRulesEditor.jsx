import React, { useState } from 'react';

import InputText from '../controls/input/InputText';
import { applyRules, summarizeTransformRuleSteps } from '../../helpers/esm_transform_rules';

import '../esm/esm_light_panel.scss';

/**
 * Transform rules editor for an eSM profile (Configuration modal).
 */
export default function ESMTransformRulesEditor({
  disabled = false,
  profile,
  onProfileChange,
}) {
  const transformRules = profile?.transformRules || [];
  const [expandedRuleId, setExpandedRuleId] = useState(null);
  const [testInput, setTestInput] = useState('');

  const enabledRules = transformRules.filter((r) => r && r.enabled !== false);
  const testOutput = applyRules(testInput, enabledRules);

  function makeId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function setRules(nextRules) {
    onProfileChange({ transformRules: nextRules });
  }

  function addRule() {
    const id = makeId();
    const rule = {
      id,
      name: 'New rule',
      enabled: true,
      steps: [{ find: '', replace: '', matchMode: 'all', caseSensitive: true }],
    };
    setRules([...transformRules, rule]);
    setExpandedRuleId(id);
  }

  function updateRule(rule) {
    setRules(transformRules.map((r) => (r && r.id === rule.id ? { ...r, ...rule } : r)));
  }

  function deleteRule(id) {
    setRules(transformRules.filter((r) => r && r.id !== id));
    if (expandedRuleId === id) setExpandedRuleId(null);
  }

  function moveRule(id, dir) {
    const idx = transformRules.findIndex((r) => r && r.id === id);
    if (idx === -1) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= transformRules.length) return;
    const next = [...transformRules];
    const tmp = next[idx];
    next[idx] = next[nextIdx];
    next[nextIdx] = tmp;
    setRules(next);
  }

  function toggleRuleExpanded(id) {
    setExpandedRuleId((prev) => (prev === id ? null : id));
  }

  function renderRuleActions(rule, ruleIndex) {
    const ruleLabel = rule.name?.trim() || 'unnamed';
    return (
      <div className="esm-transform-rules-editor__rule-actions">
        <button
          type="button"
          className="esm-transform-rules-editor__icon-btn"
          disabled={disabled || ruleIndex === 0}
          aria-label={`Move rule "${ruleLabel}" up`}
          onClick={() => moveRule(rule.id, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="esm-transform-rules-editor__icon-btn"
          disabled={disabled || ruleIndex >= transformRules.length - 1}
          aria-label={`Move rule "${ruleLabel}" down`}
          onClick={() => moveRule(rule.id, 1)}
        >
          ↓
        </button>
        <button
          type="button"
          className="esm-transform-rules-editor__icon-btn esm-transform-rules-editor__icon-btn--remove"
          disabled={disabled}
          aria-label={`Delete rule "${ruleLabel}"`}
          onClick={() => deleteRule(rule.id)}
        >
          ×
        </button>
      </div>
    );
  }

  function renderEnabledCheck(rule) {
    return (
      <label
        className="esm-transform-rules-editor__enabled-check"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={rule.enabled !== false}
          disabled={disabled}
          onChange={() => updateRule({ ...rule, enabled: rule.enabled === false })}
        />
        Enabled
      </label>
    );
  }

  function renderStepRow(rule, step, idx) {
    const stepCount = (Array.isArray(rule.steps) ? rule.steps : []).length;

    return (
      <div key={idx} className="esm-transform-rules-editor__step-inline">
        <InputText
          omitLabel
          ariaLabel={`Find text for step ${idx + 1}`}
          placeholder="Find"
          value={step?.find ?? ''}
          variant="onLight"
          disabled={disabled}
          onChange={(v) => {
            const steps = [...(rule.steps || [])];
            steps[idx] = { ...steps[idx], find: v };
            updateRule({ ...rule, steps });
          }}
        />
        <span className="esm-transform-rules-editor__step-arrow" aria-hidden="true">→</span>
        <InputText
          omitLabel
          ariaLabel={`Replace text for step ${idx + 1}`}
          placeholder="Replace"
          value={step?.replace ?? ''}
          variant="onLight"
          disabled={disabled}
          onChange={(v) => {
            const steps = [...(rule.steps || [])];
            steps[idx] = { ...steps[idx], replace: v };
            updateRule({ ...rule, steps });
          }}
        />
        <button
          type="button"
          className="esm-transform-rules-editor__icon-btn esm-transform-rules-editor__icon-btn--remove"
          disabled={disabled || stepCount <= 1}
          aria-label={`Remove step ${idx + 1}`}
          onClick={() => {
            const steps = [...(rule.steps || [])];
            steps.splice(idx, 1);
            updateRule({ ...rule, steps });
          }}
        >
          ×
        </button>
      </div>
    );
  }

  function renderRuleEdit(rule) {
    return (
      <div
        id={`rule-edit-${rule.id}`}
        className="esm-light-panel__rule-edit"
      >
        {(Array.isArray(rule.steps) ? rule.steps : []).map((step, idx) =>
          renderStepRow(rule, step, idx)
        )}
        <button
          type="button"
          className="esm-profile-editor__btn esm-profile-editor__btn--add"
          disabled={disabled}
          onClick={() => {
            const steps = [...(rule.steps || [])];
            steps.push({ find: '', replace: '', matchMode: 'all', caseSensitive: true });
            updateRule({ ...rule, steps });
          }}
        >
          Add step
        </button>
      </div>
    );
  }

  function renderRuleCard(rule, ruleIndex) {
    const isExpanded = expandedRuleId === rule.id;
    const ruleLabel = rule.name?.trim() || '(unnamed rule)';
    const stepSummary = summarizeTransformRuleSteps(rule);
    const cardClass = [
      'esm-light-panel__rule-card',
      isExpanded
        ? 'esm-transform-rules-editor__rule-card--expanded'
        : 'esm-transform-rules-editor__rule-card--collapsed',
    ].join(' ');

    return (
      <div key={rule.id} className={cardClass} role="listitem">
        <div className="esm-transform-rules-editor__rule-header">
          <button
            type="button"
            className={
              isExpanded
                ? 'esm-transform-rules-editor__rule-toggle esm-transform-rules-editor__rule-toggle--chevron-only'
                : 'esm-transform-rules-editor__rule-toggle'
            }
            aria-expanded={isExpanded}
            aria-controls={`rule-edit-${rule.id}`}
            aria-label={isExpanded ? `Collapse rule "${ruleLabel}"` : `Expand rule "${ruleLabel}"`}
            disabled={disabled}
            onClick={() => toggleRuleExpanded(rule.id)}
          >
            <span className="esm-transform-rules-editor__rule-chevron" aria-hidden="true">
              {isExpanded ? '▾' : '▸'}
            </span>
            {!isExpanded && (
              <>
                <span className="esm-transform-rules-editor__rule-name">{ruleLabel}</span>
                <span className="esm-transform-rules-editor__rule-summary">{stepSummary}</span>
                {rule.enabled === false && (
                  <span className="esm-transform-rules-editor__rule-disabled-tag">(disabled)</span>
                )}
              </>
            )}
          </button>
          {isExpanded && (
            <InputText
              omitLabel
              ariaLabel="Rule name"
              placeholder="Rule name"
              value={rule.name || ''}
              variant="onLight"
              disabled={disabled}
              onChange={(v) => updateRule({ ...rule, name: v })}
            />
          )}
          {renderEnabledCheck(rule)}
          {renderRuleActions(rule, ruleIndex)}
        </div>
        {isExpanded && renderRuleEdit(rule)}
      </div>
    );
  }

  return (
    <section
      className="esm-transform-rules-editor esm-transform-rules-editor--config"
      aria-labelledby="esm-transform-rules-title"
    >
      <div className="esm-profile-editor__list">
        <div className="esm-transform-rules-editor__rules-list" role="list">
          {transformRules.map((rule, ruleIndex) => renderRuleCard(rule, ruleIndex))}
        </div>
        <button
          type="button"
          className="esm-profile-editor__btn esm-profile-editor__btn--add"
          disabled={disabled}
          onClick={addRule}
        >
          Add rule
        </button>
      </div>

      {transformRules.length > 0 && (
        <div className="esm-profile-editor__preview">
          <h5 className="esm-profile-editor__preview-title">Test cleanup</h5>
          <div className="esm-transform-rules-editor__live-test-row">
            <span className="esm-transform-rules-editor__live-test-label">Try</span>
            <InputText
              omitLabel
              ariaLabel="Test input"
              placeholder="Sample text"
              value={testInput}
              onChange={setTestInput}
              variant="onLight"
              disabled={disabled}
            />
            <span className="esm-transform-rules-editor__step-arrow" aria-hidden="true">→</span>
            <InputText
              omitLabel
              ariaLabel="Test output"
              placeholder="Result"
              value={testOutput}
              onChange={() => {}}
              readOnly
              disabled={disabled}
              variant="onLight"
            />
          </div>
        </div>
      )}
    </section>
  );
}
