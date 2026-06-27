import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

import api from '../api/axios';
import { useAuth } from './AuthContext';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

const wrapper = ({ children }) => <FavoritesProvider>{children}</FavoritesProvider>;

describe('FavoritesContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
  });

  it('favorites is empty and favoritesCount is 0 when no user', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.favoritesCount).toBe(0);
  });

  it('fetches favorites when user is present', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({
      data: { favorites: [{ _id: 'box1' }, { _id: 'box2' }] },
    });

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.favorites).toHaveLength(2));
    expect(api.get).toHaveBeenCalledWith('/favorites');
    expect(result.current.favoritesCount).toBe(2);
  });

  it('isFavorite returns true for a favorited box and false otherwise', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { favorites: [{ _id: 'box1' }] } });

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.favorites).toHaveLength(1));

    expect(result.current.isFavorite('box1')).toBe(true);
    expect(result.current.isFavorite('box99')).toBe(false);
  });

  it('toggleFavorite adds box optimistically then confirms from server', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { favorites: [] } });
    api.post.mockResolvedValue({ data: { favorites: ['box1'] } });

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleFavorite('box1');
    });

    expect(api.post).toHaveBeenCalledWith('/favorites/box1');
    expect(result.current.isFavorite('box1')).toBe(true);
  });

  it('toggleFavorite removes box optimistically then confirms from server', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { favorites: [{ _id: 'box1' }] } });
    api.post.mockResolvedValue({ data: { favorites: [] } });

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isFavorite('box1')).toBe(true));

    await act(async () => {
      await result.current.toggleFavorite('box1');
    });

    expect(result.current.isFavorite('box1')).toBe(false);
  });

  it('does nothing when toggleFavorite is called without a user', async () => {
    useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.toggleFavorite('box1');
    });

    expect(api.post).not.toHaveBeenCalled();
    expect(result.current.favorites).toHaveLength(0);
  });

  it('reverts to server state when toggleFavorite API call fails', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { favorites: [] } });
    api.post.mockRejectedValue(new Error('network error'));
    // Second get for revert
    api.get.mockResolvedValueOnce({ data: { favorites: [] } })
           .mockResolvedValueOnce({ data: { favorites: [] } });

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleFavorite('box1');
    });

    await waitFor(() => expect(result.current.isFavorite('box1')).toBe(false));
  });
});
