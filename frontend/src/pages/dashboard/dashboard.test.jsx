import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Shared mocks ─────────────────────────────────────────────────────────────
vi.mock('../../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));

vi.mock('../../components/OrderTimeline', () => ({
  default: ({ status }) => <div data-testid="order-timeline" data-status={status} />,
}));

vi.mock('../../utils/generateReceipt', () => ({ generateReceipt: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ProfilePage from './ProfilePage';
import OrdersPage from './OrdersPage';
import SubscriptionsPage from './SubscriptionsPage';

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

// ────────────────────────────────────────────────────────────────────────────
// ProfilePage
// ────────────────────────────────────────────────────────────────────────────
describe('ProfilePage', () => {
  const refreshUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { name: 'Ali', email: 'ali@test.com', addresses: [], allergens: [] },
      refreshUser,
    });
    api.put.mockResolvedValue({});
  });

  it('renders the user name and email', () => {
    wrap(<ProfilePage />);
    expect(screen.getByDisplayValue('Ali')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ali@test.com')).toBeInTheDocument();
  });

  it('shows "no addresses" message when addresses are empty', () => {
    wrap(<ProfilePage />);
    expect(screen.getByText('profile.noAddresses')).toBeInTheDocument();
  });

  it('shows the Add Address form when the add button is clicked', () => {
    wrap(<ProfilePage />);
    fireEvent.click(screen.getByText('profile.add'));
    expect(screen.getByPlaceholderText('profile.streetPh')).toBeInTheDocument();
  });

  it('adds an address to the list when form is filled and submitted', async () => {
    wrap(<ProfilePage />);
    fireEvent.click(screen.getByText('profile.add'));

    fireEvent.change(screen.getByPlaceholderText('profile.streetPh'), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByPlaceholderText('profile.phonePh'), { target: { value: '01011111111' } });
    fireEvent.click(screen.getByText('profile.addAddress'));

    await waitFor(() => {
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    });
  });

  it('saves profile by calling PUT /auth/profile and refreshing user', async () => {
    wrap(<ProfilePage />);
    // Change the name input
    const nameInput = screen.getByDisplayValue('Ali');
    fireEvent.change(nameInput, { target: { value: 'Ali Updated' } });

    // The save button
    fireEvent.click(screen.getByText(/save/i));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/auth/profile', expect.objectContaining({ name: 'Ali Updated' }));
      expect(refreshUser).toHaveBeenCalled();
    });
  });

  it('renders allergen toggle buttons', () => {
    wrap(<ProfilePage />);
    expect(screen.getByText(/Gluten/)).toBeInTheDocument();
    expect(screen.getByText(/Dairy/)).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// OrdersPage
// ────────────────────────────────────────────────────────────────────────────
describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
  });

  it('redirects to /login when no user', async () => {
    useAuth.mockReturnValue({ user: null });
    api.get.mockResolvedValue({ data: { orders: [] } });
    wrap(<OrdersPage />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  it('fetches and renders orders; clicking track shows the timeline', async () => {
    api.get.mockResolvedValue({
      data: {
        orders: [{ _id: 'ord1', status: 'pending', createdAt: '2024-01-01T00:00:00Z', items: [], totalPrice: 150 }],
      },
    });
    wrap(<OrdersPage />);
    // Wait for the order row to appear
    await waitFor(() => expect(screen.getByText('orders.trackOrder')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/orders/my');

    // Click Track Order to expand — timeline only shows when expanded
    fireEvent.click(screen.getByText('orders.trackOrder'));
    expect(screen.getByTestId('order-timeline')).toBeInTheDocument();
  });

  it('shows error text when orders fetch fails', async () => {
    api.get.mockRejectedValue(new Error('failed'));
    wrap(<OrdersPage />);
    await waitFor(() => expect(screen.getByText('msg.loadOrdersFailed')).toBeInTheDocument());
  });

  it('shows empty state when orders array is empty', async () => {
    api.get.mockResolvedValue({ data: { orders: [] } });
    wrap(<OrdersPage />);
    await waitFor(() => expect(screen.getByText('orders.emptyTitle')).toBeInTheDocument());
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SubscriptionsPage
// ────────────────────────────────────────────────────────────────────────────
describe('SubscriptionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
  });

  it('redirects to /login when no user', async () => {
    useAuth.mockReturnValue({ user: null });
    api.get.mockResolvedValue({ data: { subscriptions: [] } });
    wrap(<SubscriptionsPage />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  it('fetches and renders subscriptions', async () => {
    api.get.mockResolvedValue({
      data: {
        subscriptions: [{
          _id: 's1',
          status: 'active',
          frequency: 'weekly',
          deliveryDay: 'saturday',
          box: { _id: 'b1', name: 'Keto Box', basePrice: 50 },
          servingSize: 2,
        }],
      },
    });
    wrap(<SubscriptionsPage />);
    await waitFor(() => expect(screen.getByText('Keto Box')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/subscriptions/my');
  });

  it('shows empty state when no subscriptions', async () => {
    api.get.mockResolvedValue({ data: { subscriptions: [] } });
    wrap(<SubscriptionsPage />);
    await waitFor(() => expect(screen.getByText('subs.noSubsTitle')).toBeInTheDocument());
  });

  it('shows error text when subscriptions fetch fails', async () => {
    api.get.mockRejectedValue(new Error('network'));
    wrap(<SubscriptionsPage />);
    await waitFor(() => expect(screen.getByText('msg.loadSubsFailed')).toBeInTheDocument());
  });

  it('calls PUT pause endpoint when pause button is clicked', async () => {
    const SUB = { _id: 's1', status: 'active', frequency: 'weekly', deliveryDay: 'saturday',
      box: { _id: 'b1', name: 'Keto Box', basePrice: 50 }, servingSize: 2 };
    api.get
      .mockResolvedValueOnce({ data: { subscriptions: [SUB] } }) // initial fetch
      .mockResolvedValueOnce({ data: { subscriptions: [SUB] } }); // refetch after pause
    api.put.mockResolvedValue({ data: { subscription: { status: 'paused' } } });

    wrap(<SubscriptionsPage />);
    await waitFor(() => screen.getByText('Keto Box'));

    // Pause button has translated text subs.pause
    fireEvent.click(screen.getByText('subs.pause'));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/subscriptions/s1/pause'));
  });
});
