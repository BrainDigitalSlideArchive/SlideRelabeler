import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as debug_actions from '../../actions/debug';
import { scrollConfigSectionIntoView } from '../../components/config-v2/ConfigV2Nav';
import { drainEngineToDiagnosticsLog } from '../../helpers/diagnostics_drain.js';
import Button from '../../components/controls/button/Button';
import ModalHeader from './ModalHeader';

import './ModalDebug.scss';

const CLEAR_CONFIRM = 'Clear the diagnostic log? This cannot be undone.';

async function readDiagnosticsText() {
  if (typeof electronAPI === 'undefined' || !electronAPI.readDiagnosticsLog) {
    return '';
  }
  const result = await electronAPI.readDiagnosticsLog();
  return typeof result?.text === 'string' ? result.text : '';
}

const ModalDebug = () => {
  const dispatch = useDispatch();
  const recording = useSelector((state) => !!state.config?.debug?.enable_debug);
  const modalStack = useSelector((state) => state.modal?.stack ?? []);
  const returnToAdvanced = modalStack.includes('config');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const preRef = useRef(null);
  const stickToBottomRef = useRef(true);

  const loadLog = useCallback(async ({ drain = false } = {}) => {
    setError('');
    setLoading(true);
    try {
      if (drain && recording) {
        await drainEngineToDiagnosticsLog();
      }
      const next = await readDiagnosticsText();
      setText(next);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [recording]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (recording) {
          await drainEngineToDiagnosticsLog();
        }
        if (cancelled) return;
        const next = await readDiagnosticsText();
        if (!cancelled) setText(next);
      } catch (err) {
        if (!cancelled) setError(err?.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const unsubscribe = typeof electronAPI !== 'undefined'
      && electronAPI.onDiagnosticsLogUpdated
      ? electronAPI.onDiagnosticsLogUpdated((payload) => {
        if (payload && typeof payload.text === 'string') {
          setText(payload.text);
          setLoading(false);
        }
      })
      : null;

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [recording]);

  useEffect(() => {
    const el = preRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [text]);

  function onScroll() {
    const el = preRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = remaining < 48;
  }

  function handleClear() {
    if (!window.confirm(CLEAR_CONFIRM)) return;
    dispatch({ type: debug_actions.CLEAR_DIAGNOSTICS_LOG });
  }

  function handleClose() {
    if (!returnToAdvanced) return;
    requestAnimationFrame(() => {
      setTimeout(() => scrollConfigSectionIntoView('config-advanced'), 50);
    });
  }

  const empty = !loading && !error && !text.trim();

  return (
    <div className="__modal _large modal-debug">
      <ModalHeader title="Diagnostic log" type="debug" onClose={handleClose} />
      <div className="__content __content--config modal-debug__content">
        <div className="config-panel modal-debug__panel">
          <p className="modal-debug__intro">
            {recording
              ? 'Recording is on. New diagnostic messages appear here as they are written.'
              : 'Recording is off. Showing the saved log; turn on Record diagnostic log in Advanced to capture new messages.'}
          </p>
          <div className="modal-debug__bar">
            <Button
              variant="onLight"
              text="Refresh"
              onClick={() => loadLog({ drain: true })}
            />
            <Button
              variant="onLight"
              text="Clear log"
              onClick={handleClear}
            />
          </div>
          {error ? (
            <p className="modal-debug__error">{error}</p>
          ) : null}
          {loading ? (
            <p className="modal-debug__empty">Loading…</p>
          ) : empty ? (
            <p className="modal-debug__empty">No diagnostic messages yet.</p>
          ) : (
            <pre
              ref={preRef}
              className="modal-debug__pre"
              onScroll={onScroll}
            >
              {text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDebug;
