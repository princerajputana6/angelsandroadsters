import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import cartReducer from './cartSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      cart: cartReducer,
    },
    middleware: (gdm) => gdm().concat(api.middleware),
  });

export const store = makeStore();
setupListeners(store.dispatch);
