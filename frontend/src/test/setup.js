// Global test setup for Vitest + React Testing Library.
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// ── Browser APIs jsdom doesn't implement ──────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
window.IntersectionObserver = MockObserver;
window.ResizeObserver = MockObserver;
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
if (!window.HTMLElement.prototype.setPointerCapture) {
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
}

// ── Module mocks applied to every test file ───────────────────────────────
// i18n: t() returns the key (or its string/defaultValue fallback) so assertions
// are deterministic regardless of the loaded locale.
const tFn = (k, o) => (typeof o === 'string' ? o : (o && o.defaultValue)) || k;

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn(), custom: vi.fn() },
  Toaster: () => null,
}));

vi.mock('i18next', () => ({
  default: {
    t: tFn,
    language: 'en',
    changeLanguage: vi.fn(),
    use: () => ({ init: vi.fn() }),
    on: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: tFn,
    i18n: { language: 'en', changeLanguage: vi.fn(), dir: () => 'ltr', on: vi.fn() },
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  I18nextProvider: ({ children }) => children,
}));
