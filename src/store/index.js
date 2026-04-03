import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import reducer from '../reducers';
import saga from '../sagas';
import { createReduxActionDebugMiddleware } from './reduxActionDebugMiddleware';

const sagaMiddleware = createSagaMiddleware();
const reduxActionDebugMiddleware = createReduxActionDebugMiddleware();
const middleware = [reduxActionDebugMiddleware, sagaMiddleware];

const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false    }).concat(middleware),
});

sagaMiddleware.run(saga);

window.redux_store = store;

export default store;
