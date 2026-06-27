import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from '../api/axios';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes user from localStorage', () => {
    localStorage.setItem('boxify_user', JSON.stringify({ name: 'Sam', role: 'admin' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user.name).toBe('Sam');
    expect(result.current.isAdmin).toBe(true);
  });

  it('login persists user + token and returns the user', async () => {
    api.post.mockResolvedValue({ data: { user: { name: 'Ann', role: 'customer' }, token: 'jwt1' } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    let returned;
    await act(async () => { returned = await result.current.login('a@b.com', 'pw'); });
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' });
    expect(returned.name).toBe('Ann');
    expect(localStorage.getItem('boxify_token')).toBe('jwt1');
    expect(JSON.parse(localStorage.getItem('boxify_user')).name).toBe('Ann');
    expect(result.current.user.name).toBe('Ann');
  });

  it('register persists user + token', async () => {
    api.post.mockResolvedValue({ data: { user: { name: 'New' }, token: 'jwt2' } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.register('New', 'n@b.com', 'pw'); });
    expect(api.post).toHaveBeenCalledWith('/auth/register', { name: 'New', email: 'n@b.com', password: 'pw' });
    expect(localStorage.getItem('boxify_token')).toBe('jwt2');
  });

  it('logout clears storage and user', async () => {
    localStorage.setItem('boxify_user', JSON.stringify({ name: 'Sam' }));
    localStorage.setItem('boxify_token', 't');
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.logout());
    expect(localStorage.getItem('boxify_token')).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('updateProfile stores the returned user (data.user, not data)', async () => {
    localStorage.setItem('boxify_token', 'keep');
    api.put.mockResolvedValue({ data: { user: { name: 'Updated', email: 'u@b.com' } } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.updateProfile({ name: 'Updated' }); });
    expect(api.put).toHaveBeenCalledWith('/auth/profile', { name: 'Updated' });
    expect(result.current.user.name).toBe('Updated');
  });

  it('changePassword posts current + new password', async () => {
    api.put.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.changePassword('old', 'new'); });
    expect(api.put).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'old', newPassword: 'new' });
  });

  it('refreshUser logs out when /auth/me fails', async () => {
    localStorage.setItem('boxify_user', JSON.stringify({ name: 'Sam' }));
    api.get.mockRejectedValue(new Error('401'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.refreshUser(); });
    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it('deleteAccount clears storage even if the API call fails', async () => {
    localStorage.setItem('boxify_token', 't');
    localStorage.setItem('boxify_user', JSON.stringify({ name: 'Sam' }));
    api.delete.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.deleteAccount(); });
    expect(localStorage.getItem('boxify_token')).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
