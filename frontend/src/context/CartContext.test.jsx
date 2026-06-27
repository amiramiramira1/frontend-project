import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

import api from '../api/axios';
import { useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

const EMPTY_CART = { items: [], cartTotal: 0 };

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
  });

  it('starts with an empty cart and itemCount 0 when no user', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
  });

  it('auto-fetches cart on mount when a user is present', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({
      data: { cart: { items: [{ _id: 'i1', quantity: 2 }, { _id: 'i2', quantity: 1 }], cartTotal: 80 } },
    });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.cart.items).toHaveLength(2));
    expect(api.get).toHaveBeenCalledWith('/cart');
    expect(result.current.itemCount).toBe(3); // 2 + 1
    expect(result.current.cart.cartTotal).toBe(80);
  });

  it('addToCart maps servingsPerMeal → servingSize and updates cart state', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { cart: EMPTY_CART } });
    api.post.mockResolvedValue({
      data: { cart: { items: [{ _id: 'i1', quantity: 1 }], cartTotal: 30 } },
    });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await act(async () => {
      await result.current.addToCart({ boxId: 'box1', servingsPerMeal: 2, quantity: 1 });
    });

    expect(api.post).toHaveBeenCalledWith('/cart/items', {
      boxId: 'box1',
      servingSize: 2,
      quantity: 1,
    });
    expect(result.current.cart.items).toHaveLength(1);
  });

  it('addToCart defaults quantity to 1 when omitted', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { cart: EMPTY_CART } });
    api.post.mockResolvedValue({ data: { cart: EMPTY_CART } });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await act(async () => {
      await result.current.addToCart({ boxId: 'b1', servingsPerMeal: 2 });
    });

    expect(api.post).toHaveBeenCalledWith('/cart/items', {
      boxId: 'b1',
      servingSize: 2,
      quantity: 1,
    });
  });

  it('updateItem calls PUT /cart/items/:itemId', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { cart: EMPTY_CART } });
    api.put.mockResolvedValue({ data: { cart: EMPTY_CART } });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await act(async () => {
      await result.current.updateItem('item123', { quantity: 3 });
    });

    expect(api.put).toHaveBeenCalledWith('/cart/items/item123', { quantity: 3 });
  });

  it('removeItem calls DELETE /cart/items/:itemId', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { cart: EMPTY_CART } });
    api.delete.mockResolvedValue({ data: { cart: EMPTY_CART } });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await act(async () => {
      await result.current.removeItem('item456');
    });

    expect(api.delete).toHaveBeenCalledWith('/cart/items/item456');
  });

  it('clearCart calls DELETE /cart', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { cart: EMPTY_CART } });
    api.delete.mockResolvedValue({ data: { cart: EMPTY_CART } });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await act(async () => {
      await result.current.clearCart();
    });

    expect(api.delete).toHaveBeenCalledWith('/cart');
  });

  it('resets to empty cart when user is null (logout)', () => {
    useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cart).toEqual(EMPTY_CART);
    expect(result.current.itemCount).toBe(0);
  });
});
