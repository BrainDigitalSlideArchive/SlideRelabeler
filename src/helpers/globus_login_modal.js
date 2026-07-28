import * as modal_actions from '../actions/modal';

/** Push the Globus login modal onto the modal stack (no-op if already on top). */
export function openGlobusLogin(dispatch, getState) {
  const stack = getState?.()?.modal?.stack;
  if (Array.isArray(stack) && stack[stack.length - 1] === 'globusLogin') return;
  dispatch({
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'globusLogin' },
  });
}
