import React, {useEffect, useState} from "react";
import { useSelector, useDispatch } from "react-redux";

import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

import * as debug_actions from "../../actions/debug";

import ModalHeader from "./ModalHeader";

function render_error_messages(title, clear_action, display, set_display, messages, dispatch) {
  return (
    <div className="__messages">
      <div className="__messages-header">
        <div className="__messages-header-title">{title} #: {messages.length}</div>
        <div className="__messages-header-spacer"/>
        <div className="__messages-header-clear">
          <button onClick={() => dispatch({type: clear_action})}>
            <i className="fi fi fi-rr-trash-xmark"/>
          </button>
        </div>
        
        <div className="__messages-header-toggle">
          {
            display ? 
            <button onClick={() => set_display(false)}><i className="fi fi-rr-square-minus"/></button> :
            <button onClick={() => set_display(true)}><i className="fi fi-rr-square-plus"/></button>
          }
        </div>
      </div>
      {
        display &&messages.map((message, index) => {
          return (
            <div key={index} className="__message">
              <JSONPretty id="json-pretty" data={message}></JSONPretty>
            </div>
          )
        })
      }
    </div>
  )
}

const ModalDebug = () => {
  const { has_error, frontend_debug_messages, frontend_error_messages, backend_debug_messages, backend_error_messages } = useSelector(state => state.debug);

  const [update, set_update] = useState(true);

  const [display_frontend_debug_messages, set_display_frontend_debug_messages] = useState(false);
  const [display_frontend_error_messages, set_display_frontend_error_messages] = useState(false);
  const [display_backend_debug_messages, set_display_backend_debug_messages] = useState(false);
  const [display_backend_error_messages, set_display_backend_error_messages] = useState(false);

  const dispatch = useDispatch();

  return (
    <div className="__modal">
      <ModalHeader title={"Debug"} type={"debug"}/>
      <div className="__content">
        {
          frontend_debug_messages.length > 0 && 
          render_error_messages('Frontend Debug Messages', debug_actions.CLEAR_FRONTEND_DEBUG_MESSAGES, display_frontend_debug_messages, set_display_frontend_debug_messages, frontend_debug_messages, dispatch) 
        }
        {
          frontend_error_messages.length > 0 &&
           render_error_messages('Frontend Error Messages', debug_actions.CLEAR_FRONTEND_ERROR_MESSAGES, display_frontend_error_messages, set_display_frontend_error_messages, frontend_error_messages, dispatch)
        }
        {
          backend_debug_messages.length > 0 && 
          render_error_messages('Backend Debug Messages', debug_actions.CLEAR_BACKEND_DEBUG_MESSAGES, display_backend_debug_messages, set_display_backend_debug_messages, backend_debug_messages, dispatch)
        }
        {
          backend_error_messages.length > 0 && 
          render_error_messages('Backend Error Messages', debug_actions.CLEAR_BACKEND_ERROR_MESSAGES, display_backend_error_messages, set_display_backend_error_messages, backend_error_messages, dispatch)
        }
      </div>
      <div className="__spacer"/>
      <div className="__footer">
        <div className="__button-label">
          Export Debug JSON
        </div>
        <button className="__button" onClick={() => dispatch({type: debug_actions.EXPORT_DEBUG_JSON})}>
          <i className="fi fi-rr-file-export"/>
        </button>
      </div>
    </div>
  )
};

export default ModalDebug;
