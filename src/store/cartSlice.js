import { createSlice } from '@reduxjs/toolkit';

const load = () => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('trylinqr_cart')) || []; } catch { return []; }
};
const save = (items) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('trylinqr_cart', JSON.stringify(items));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    hydrate: (state) => { state.items = load(); },
    addItem: (state, { payload }) => {
      const existing = state.items.find(
        (i) => i.product === payload.product && i.size === payload.size && i.color === payload.color
      );
      if (existing) existing.quantity += payload.quantity || 1;
      else state.items.push({ ...payload, quantity: payload.quantity || 1 });
      save(state.items);
    },
    updateQty: (state, { payload }) => {
      const item = state.items.find((i) => i.product === payload.product);
      if (item) item.quantity = Math.max(1, payload.quantity);
      save(state.items);
    },
    removeItem: (state, { payload }) => {
      state.items = state.items.filter((i) => i.product !== payload);
      save(state.items);
    },
    clearCart: (state) => { state.items = []; save([]); },
  },
});

export const { hydrate, addItem, updateQty, removeItem, clearCart } = cartSlice.actions;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export default cartSlice.reducer;
