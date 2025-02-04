import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import reducer from '../reducers';
import saga from '../sagas';


// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware];
// const enhancer = composeWithStateSync(middleware);
// Mount it on the Store
const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false    }).concat(middleware),
});

// const store = createStore(reducer, enhancer);

// Then run the saga
sagaMiddleware.run(saga);

export default store;