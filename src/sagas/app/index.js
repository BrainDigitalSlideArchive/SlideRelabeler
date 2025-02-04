import { take } from 'redux-saga/effects';

import * as app_actions from '../../actions/app';

export function* app_saga () {
    yield take(app_actions.INIT_APP);
}

export default app_saga;