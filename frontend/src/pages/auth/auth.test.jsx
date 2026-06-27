import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Auth context mock ──────────────────────────────────────────────────────
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useAuth } from '../../context/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import VerifyEmailPage from './VerifyEmailPage';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const wrap = (ui, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

// ────────────────────────────────────────────────────────────────────────────
// LoginPage
// ────────────────────────────────────────────────────────────────────────────
describe('LoginPage', () => {
  const loginFn = vi.fn();
  const loginWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: loginFn, loginWithGoogle, loading: false });
  });

  // Helpers for LoginPage inputs (labels use i18n keys as text)
  const getEmailInput = () => screen.getByLabelText('login.emailLabel');
  const getPwInput = () => screen.getByLabelText('login.passwordLabel');

  it('renders email and password fields', () => {
    wrap(<LoginPage />);
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPwInput()).toBeInTheDocument();
  });

  it('calls login with email and password on submit', async () => {
    loginFn.mockResolvedValue({ role: 'customer' });
    wrap(<LoginPage />);
    fireEvent.change(getEmailInput(), { target: { value: 'user@test.com' } });
    fireEvent.change(getPwInput(), { target: { value: 'secret123' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(loginFn).toHaveBeenCalledWith('user@test.com', 'secret123'));
  });

  it('redirects to / for a customer after login', async () => {
    loginFn.mockResolvedValue({ role: 'customer' });
    wrap(<LoginPage />);
    fireEvent.change(getEmailInput(), { target: { value: 'a@b.com' } });
    fireEvent.change(getPwInput(), { target: { value: 'pass123' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('redirects to /admin for an admin after login', async () => {
    loginFn.mockResolvedValue({ role: 'admin' });
    wrap(<LoginPage />);
    fireEvent.change(getEmailInput(), { target: { value: 'admin@b.com' } });
    fireEvent.change(getPwInput(), { target: { value: 'admin123' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('shows an error message when login fails', async () => {
    loginFn.mockRejectedValue({ response: { data: { message: 'Bad credentials' } } });
    wrap(<LoginPage />);
    fireEvent.change(getEmailInput(), { target: { value: 'a@b.com' } });
    fireEvent.change(getPwInput(), { target: { value: 'wrong' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(screen.getByText('Bad credentials')).toBeInTheDocument());
  });

  it('shows the email-verified banner when ?verified=true is in the URL', () => {
    wrap(<LoginPage />, { route: '/?verified=true' });
    // Banner contains the i18n key msg.emailVerified
    expect(screen.getByText('msg.emailVerified')).toBeInTheDocument();
  });

  it('calls loginWithGoogle when the Google button is clicked', () => {
    wrap(<LoginPage />);
    const buttons = screen.getAllByRole('button');
    const googleBtn = buttons.find(b => b.textContent.includes('login.continueGoogle'));
    fireEvent.click(googleBtn);
    expect(loginWithGoogle).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// RegisterPage
// ────────────────────────────────────────────────────────────────────────────
describe('RegisterPage', () => {
  const registerFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ register: registerFn, loading: false });
  });

  // Helpers for RegisterPage inputs
  const getNameInput = () => screen.getByLabelText('register.nameLabel');
  const getRegEmailInput = () => screen.getByLabelText('register.emailLabel');
  const getRegPwInput = () => screen.getByLabelText('register.passwordLabel');

  it('renders name, email and password fields', () => {
    wrap(<RegisterPage />);
    expect(getNameInput()).toBeInTheDocument();
    expect(getRegEmailInput()).toBeInTheDocument();
    expect(getRegPwInput()).toBeInTheDocument();
  });

  it('shows a client-side error when password is fewer than 6 characters', async () => {
    wrap(<RegisterPage />);
    fireEvent.change(getNameInput(), { target: { value: 'Ann' } });
    fireEvent.change(getRegEmailInput(), { target: { value: 'a@b.com' } });
    fireEvent.change(getRegPwInput(), { target: { value: '123' } });
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(screen.getByText('msg.passwordMin6')).toBeInTheDocument());
    expect(registerFn).not.toHaveBeenCalled();
  });

  it('calls register and navigates to /verify-email on success', async () => {
    registerFn.mockResolvedValue({});
    wrap(<RegisterPage />);
    fireEvent.change(getNameInput(), { target: { value: 'Ann' } });
    fireEvent.change(getRegEmailInput(), { target: { value: 'ann@test.com' } });
    fireEvent.change(getRegPwInput(), { target: { value: 'secret123' } });
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      expect(registerFn).toHaveBeenCalledWith('Ann', 'ann@test.com', 'secret123');
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email', expect.any(Object));
    });
  });

  it('shows API error on registration failure', async () => {
    registerFn.mockRejectedValue({ response: { data: { message: 'Email taken' } } });
    wrap(<RegisterPage />);
    fireEvent.change(getNameInput(), { target: { value: 'Ann' } });
    fireEvent.change(getRegEmailInput(), { target: { value: 'a@b.com' } });
    fireEvent.change(getRegPwInput(), { target: { value: 'secret123' } });
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(screen.getByText('Email taken')).toBeInTheDocument());
  });
});

// ────────────────────────────────────────────────────────────────────────────
// ForgotPasswordPage
// ────────────────────────────────────────────────────────────────────────────
describe('ForgotPasswordPage', () => {
  const forgotFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ forgotPassword: forgotFn, loading: false });
  });

  it('renders an email input', () => {
    wrap(<ForgotPasswordPage />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls forgotPassword and shows the sent screen on success', async () => {
    forgotFn.mockResolvedValue({});
    wrap(<ForgotPasswordPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@test.com' } });
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => {
      expect(forgotFn).toHaveBeenCalledWith('user@test.com');
      // Sent heading is now visible
      expect(screen.getByText('forgot.sentHeading')).toBeInTheDocument();
    });
  });

  it('shows error when forgotPassword rejects', async () => {
    forgotFn.mockRejectedValue({ response: { data: { message: 'Server error' } } });
    wrap(<ForgotPasswordPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@test.com' } });
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
  });

  it('"Try again" button resets to the form from the sent screen', async () => {
    forgotFn.mockResolvedValue({});
    wrap(<ForgotPasswordPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@test.com' } });
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => screen.getByText('forgot.tryAgain'));
    fireEvent.click(screen.getByText('forgot.tryAgain'));
    expect(screen.getByText('forgot.heading')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// VerifyEmailPage
// ────────────────────────────────────────────────────────────────────────────
describe('VerifyEmailPage', () => {
  const resendFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ resendVerification: resendFn, loading: false });
  });

  it('shows pending screen when there is no token and no error param', () => {
    wrap(<VerifyEmailPage />, { route: '/verify-email' });
    expect(screen.getByText('verify.heading')).toBeInTheDocument();
  });

  it('shows error screen when ?error= is present in the URL', () => {
    wrap(<VerifyEmailPage />, { route: '/verify-email?error=expired' });
    expect(screen.getByText('verify.errorHeading')).toBeInTheDocument();
  });

  it('resend button calls resendVerification with the provided email', async () => {
    resendFn.mockResolvedValue({});
    wrap(<VerifyEmailPage />, { route: '/verify-email' });

    // Fill in the resend email input (shown when no email in history state)
    const emailInput = screen.getByPlaceholderText('Enter your email to resend');
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });

    fireEvent.click(screen.getByText('verify.resend'));
    await waitFor(() => expect(resendFn).toHaveBeenCalledWith('user@test.com'));
  });

  it('shows sent confirmation after successful resend', async () => {
    resendFn.mockResolvedValue({});
    wrap(<VerifyEmailPage />, { route: '/verify-email' });
    const emailInput = screen.getByPlaceholderText('Enter your email to resend');
    fireEvent.change(emailInput, { target: { value: 'u@t.com' } });
    fireEvent.click(screen.getByText('verify.resend'));
    await waitFor(() => expect(screen.getByText('verify.emailSent')).toBeInTheDocument());
  });
});
