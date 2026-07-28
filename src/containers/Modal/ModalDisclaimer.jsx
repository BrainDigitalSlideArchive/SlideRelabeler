import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ModalHeader from './ModalHeader';
import Button from '../../components/controls/button/Button';
import * as modal_actions from '../../actions/modal';
import * as config_actions from '../../actions/config';
import {
  DISCLAIMER_TEXT,
  DISCLAIMER_PROMPT_ALLOW_REMEMBER,
} from '../../helpers/disclaimer.js';

import './ModalDisclaimer.scss';

export default function ModalDisclaimer() {
  const dispatch = useDispatch();
  const promptMode = useSelector((s) => s.config?.disclaimer?.promptMode);
  const allowRemember = promptMode === DISCLAIMER_PROMPT_ALLOW_REMEMBER;
  const [remember, setRemember] = useState(false);

  function onAgree() {
    dispatch({
      type: config_actions.ACCEPT_DISCLAIMER,
      payload: { remember: allowRemember && remember },
    });
    dispatch({ type: modal_actions.CLOSE_MODAL, payload: { force: true } });
  }

  function onQuit() {
    if (typeof electronAPI?.quitApp === 'function') {
      electronAPI.quitApp();
    }
  }

  function onMore() {
    dispatch({
      type: modal_actions.PUSH_MODAL_IF_ABSENT,
      payload: { type: 'help', focusSection: 'application' },
    });
  }

  return (
    <div className="__modal __modal--compact modal-disclaimer">
      <ModalHeader title="Disclaimer" type="disclaimer" hideClose />
      <div className="__content __content--config modal-disclaimer__content">
        <div className="config-panel">
          <div className="config-panel__body">
            <p className="modal-disclaimer__text">
              {DISCLAIMER_TEXT}{' '}
              <button type="button" className="modal-disclaimer__more" onClick={onMore}>
                More
              </button>
            </p>
            {allowRemember ? (
              <label className="modal-disclaimer__remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember my answer</span>
              </label>
            ) : null}
            <div className="modal-disclaimer__actions">
              <Button text="Quit" onClick={onQuit} />
              <Button
                text="I agree"
                extra_class_name="Button--filled"
                onClick={onAgree}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
