import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Replace Navigate with a spy element so we can assert the redirect target
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="redirect" data-to={to} />),
  };
});

import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no user', () => {
    useAuth.mockReturnValue({ user: null, isAdmin: false });
    render(
      <ProtectedRoute>
        <div>secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/login');
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('renders children when user is authenticated', () => {
    useAuth.mockReturnValue({ user: { name: 'Sam' }, isAdmin: false });
    render(
      <ProtectedRoute>
        <div>secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  it('redirects to / when user is not admin and requireAdmin is true', () => {
    useAuth.mockReturnValue({ user: { name: 'Sam' }, isAdmin: false });
    render(
      <ProtectedRoute requireAdmin>
        <div>admin panel</div>
      </ProtectedRoute>
    );
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/');
    expect(screen.queryByText('admin panel')).toBeNull();
  });

  it('renders children when user is admin and requireAdmin is true', () => {
    useAuth.mockReturnValue({ user: { name: 'Admin', role: 'admin' }, isAdmin: true });
    render(
      <ProtectedRoute requireAdmin>
        <div>admin panel</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('admin panel')).toBeInTheDocument();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });
});
