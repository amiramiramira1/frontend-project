import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import api from './axios';

const reqInterceptor = api.interceptors.request.handlers[0].fulfilled;
const resError = api.interceptors.response.handlers[0].rejected;

describe('api/axios request interceptor', () => {
  beforeEach(() => localStorage.clear());

  it('attaches the Bearer token when present', () => {
    localStorage.setItem('boxify_token', 'tok123');
    const cfg = reqInterceptor({ headers: {} });
    expect(cfg.headers.Authorization).toBe('Bearer tok123');
  });

  it('omits Authorization when no token', () => {
    const cfg = reqInterceptor({ headers: {} });
    expect(cfg.headers.Authorization).toBeUndefined();
  });

  it('sets Accept-Language from i18nextLng (defaults to en)', () => {
    const cfg = reqInterceptor({ headers: {} });
    expect(cfg.headers['Accept-Language']).toBe('en');
    localStorage.setItem('i18nextLng', 'ar');
    const cfg2 = reqInterceptor({ headers: {} });
    expect(cfg2.headers['Accept-Language']).toBe('ar');
  });
});

describe('api/axios response error interceptor', () => {
  beforeEach(() => localStorage.clear());

  it('flattens express-validator error arrays into one message', async () => {
    const err = {
      config: { url: '/boxes' },
      response: { status: 400, data: { message: 'Validation failed', errors: [{ message: 'A required' }, { message: 'B required' }] } },
    };
    await expect(resError(err)).rejects.toBe(err);
    expect(err.response.data.message).toBe('A required. B required');
  });

  it('clears auth and redirects to /login on 401 (non-auth request)', async () => {
    localStorage.setItem('boxify_token', 't');
    localStorage.setItem('boxify_user', '{}');
    const original = window.location;
    delete window.location;
    window.location = { pathname: '/dashboard', href: '' };
    const err = { config: { url: '/orders' }, response: { status: 401, data: {} } };
    await expect(resError(err)).rejects.toBe(err);
    expect(localStorage.getItem('boxify_token')).toBeNull();
    expect(window.location.href).toBe('/login');
    window.location = original;
  });

  it('does NOT redirect on 401 for a login request', async () => {
    const original = window.location;
    delete window.location;
    window.location = { pathname: '/login', href: '' };
    const err = { config: { url: '/auth/login' }, response: { status: 401, data: {} } };
    await expect(resError(err)).rejects.toBe(err);
    expect(window.location.href).toBe('');
    window.location = original;
  });
});
