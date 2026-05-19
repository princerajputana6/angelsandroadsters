'use client';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from './index';
import { hydrate } from './cartSlice';
import { Toaster } from 'react-hot-toast';

export default function StoreProvider({ children }) {
  useEffect(() => { store.dispatch(hydrate()); }, []);
  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" toastOptions={{ style: { background: '#171717', color: '#fff' } }} />
    </Provider>
  );
}
