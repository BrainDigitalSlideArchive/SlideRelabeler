import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import ConfigField from '../../primitives/ConfigField';

function trimCommittedAlternates(alternates) {
  return alternates.map((a) => String(a).trim()).filter(Boolean);
}

/**
 * Reserved CSV field card — default header + ordered alternates (config-v2 kit).
 */
export default function CsvReservedFieldCard({
  role,
  helper,
  defaultHeader,
  required = false,
  alternates = [],
  disabled = false,
  onAlternatesChange,
}) {
  const [draftAlternates, setDraftAlternates] = useState(alternates);
  const isEditingRef = useRef(false);
  const cardRef = useRef(null);
  const focusAlternateIndexRef = useRef(null);

  useEffect(() => {
    if (isEditingRef.current) return;
    setDraftAlternates(alternates);
  }, [alternates]);

  useLayoutEffect(() => {
    const index = focusAlternateIndexRef.current;
    if (index == null) return;
    focusAlternateIndexRef.current = null;
    const input = cardRef.current?.querySelector(
      `[data-alternate-index="${index}"] input`,
    );
    input?.focus();
  }, [draftAlternates]);

  function updateAlternate(index, value) {
    isEditingRef.current = true;
    setDraftAlternates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleAlternateBlur(index) {
    isEditingRef.current = false;
    setDraftAlternates((current) => {
      const value = String(current[index] ?? '').trim();
      if (!value) {
        const next = current.filter((_, i) => i !== index);
        onAlternatesChange(trimCommittedAlternates(next));
        return next;
      }
      const next = [...current];
      next[index] = value;
      const committed = trimCommittedAlternates(next);
      onAlternatesChange(committed);
      return committed;
    });
  }

  function addAlternate() {
    isEditingRef.current = true;
    setDraftAlternates((prev) => {
      focusAlternateIndexRef.current = prev.length;
      return [...prev, ''];
    });
  }

  function removeAlternate(index) {
    isEditingRef.current = false;
    setDraftAlternates((current) => {
      const next = current.filter((_, i) => i !== index);
      const committed = trimCommittedAlternates(next);
      onAlternatesChange(committed);
      return committed;
    });
  }

  function moveAlternate(index, direction) {
    setDraftAlternates((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      const committed = trimCommittedAlternates(next);
      onAlternatesChange(committed);
      return committed;
    });
  }

  return (
    <div className="cfg-csv-field-card" ref={cardRef}>
      <p className="cfg-csv-field-card__title">
        <span className="cfg-csv-field-card__role">
          {role}
          {required ? (
            <span className="cfg-csv-field-card__required"> (required)</span>
          ) : null}
          :
        </span>{' '}
        <span className="cfg-csv-field-card__helper">{helper}</span>
      </p>

      <div className="cfg-csv-field-card__aliases">
        <div className="cfg-csv-field-card__alias-row">
          <span className="cfg-csv-field-card__alias-label">Default header name</span>
          <code className="cfg-csv-field-card__default-value">{defaultHeader}</code>
          <button
            type="button"
            className="cfg-csv-field-card__icon-btn cfg-csv-field-card__icon-btn--remove"
            disabled
            aria-label="Default header name cannot be removed"
            title="Default header name cannot be removed"
          >
            ×
          </button>
        </div>

        {draftAlternates.map((alias, index) => (
          <div
            key={`${role}-alt-${index}`}
            className="cfg-csv-field-card__alias-row"
            data-alternate-index={index}
          >
            <span className="cfg-csv-field-card__alias-label">Alternate header name</span>
            <ConfigField
              size="fill"
              omitLabel
              disabled={disabled}
              ariaLabel={`${role} alternate header name ${index + 1}`}
              placeholder="Alternate header name"
              value={alias}
              onChange={(value) => updateAlternate(index, value)}
              onBlur={() => handleAlternateBlur(index)}
            />
            <div className="cfg-csv-field-card__alias-actions">
              <button
                type="button"
                className="cfg-csv-field-card__icon-btn"
                disabled={disabled || index === 0}
                aria-label={`Move alternate ${index + 1} up`}
                onClick={() => moveAlternate(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="cfg-csv-field-card__icon-btn"
                disabled={disabled || index >= draftAlternates.length - 1}
                aria-label={`Move alternate ${index + 1} down`}
                onClick={() => moveAlternate(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="cfg-csv-field-card__icon-btn cfg-csv-field-card__icon-btn--remove"
                disabled={disabled}
                aria-label={`Remove alternate ${alias || index + 1}`}
                onClick={() => removeAlternate(index)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cfg-csv-field-card__add-row">
        <button
          type="button"
          className="cfg-csv-field-card__add-btn"
          disabled={disabled}
          onClick={addAlternate}
        >
          + Add alternate header name
        </button>
      </div>
    </div>
  );
}
