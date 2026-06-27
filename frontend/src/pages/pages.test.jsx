import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Shared mocks ─────────────────────────────────────────────────────────────
vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../context/CartContext',  () => ({ useCart: vi.fn() }));

// BoxCard has its own deep context deps — stub it out
vi.mock('../components/BoxCard', () => ({
  default: ({ box }) => <div data-testid="box-card">{box.name}</div>,
}));

// react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <>{children}</>,
  HelmetProvider: ({ children }) => children,
}));

// react-datepicker
vi.mock('react-datepicker', () => ({
  default: ({ onChange, placeholderText }) => (
    <input
      data-testid="date-picker"
      placeholder={placeholderText}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
  registerLocale: vi.fn(),
}));
vi.mock('date-fns/locale', () => ({ ar: {} }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

import HomePage from './HomePage';
import BoxesPage from './BoxesPage';
import CartPage from './CartPage';
import SubscribePage from './SubscribePage';

const wrap = (ui, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

// ────────────────────────────────────────────────────────────────────────────
// HomePage
// ────────────────────────────────────────────────────────────────────────────
describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
    api.get.mockResolvedValue({ data: { boxes: [] } });
  });

  it('renders the hero section', () => {
    wrap(<HomePage />);
    // Hero title keys are returned by t()
    expect(screen.getByText('home.heroTitle1')).toBeInTheDocument();
  });

  it('fetches featured boxes on mount and renders BoxCard per result', async () => {
    api.get.mockResolvedValue({ data: { boxes: [{ _id: 'b1', name: 'Box A' }, { _id: 'b2', name: 'Box B' }] } });
    wrap(<HomePage />);
    await waitFor(() => expect(screen.getAllByTestId('box-card')).toHaveLength(2));
    expect(api.get).toHaveBeenCalledWith('/boxes', expect.objectContaining({ params: { limit: 3 } }));
  });

  it('does NOT fetch recommended boxes when no user', async () => {
    api.get.mockResolvedValue({ data: { boxes: [] } });
    wrap(<HomePage />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(api.get).not.toHaveBeenCalledWith('/boxes/recommended', expect.anything());
  });

  it('fetches recommended boxes when user is logged in', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    api.get.mockResolvedValue({ data: { boxes: [{ _id: 'r1', name: 'Rec Box' }] } });
    wrap(<HomePage />);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/boxes/recommended', expect.anything()));
  });

  it('shows the "Explore Boxes" link', () => {
    wrap(<HomePage />);
    expect(screen.getByText('home.exploreBoxes')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// BoxesPage
// ────────────────────────────────────────────────────────────────────────────
describe('BoxesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null });
  });

  it('renders the page title and search input', async () => {
    api.get.mockResolvedValue({ data: { boxes: [] } });
    wrap(<BoxesPage />);
    expect(screen.getByText('boxes.pageTitle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('boxes.searchPlaceholder')).toBeInTheDocument();
  });

  it('fetches boxes on mount', async () => {
    api.get.mockResolvedValue({ data: { boxes: [{ _id: 'b1', name: 'Keto Box' }] } });
    wrap(<BoxesPage />);
    await waitFor(() => expect(screen.getByTestId('box-card')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/boxes', expect.objectContaining({ params: {} }));
  });

  it('filters displayed boxes by search text without re-fetching', async () => {
    api.get.mockResolvedValue({
      data: { boxes: [
        { _id: 'b1', name: 'Keto Box', description: 'low carb' },
        { _id: 'b2', name: 'Vegan Box', description: 'plant based' },
      ] },
    });
    wrap(<BoxesPage />);
    await waitFor(() => expect(screen.getAllByTestId('box-card')).toHaveLength(2));

    fireEvent.change(screen.getByPlaceholderText('boxes.searchPlaceholder'), {
      target: { value: 'keto' },
    });

    expect(screen.getAllByTestId('box-card')).toHaveLength(1);
    expect(screen.getByText('Keto Box')).toBeInTheDocument();
  });

  it('sends dietType param when a diet filter is selected', async () => {
    api.get.mockResolvedValue({ data: { boxes: [] } });
    wrap(<BoxesPage />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('boxes.dietKeto'));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/boxes', expect.objectContaining({ params: { dietType: 'keto' } })));
  });

  it('shows error text when API call fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));
    wrap(<BoxesPage />);
    await waitFor(() => expect(screen.getByText('msg.loadBoxesFailed')).toBeInTheDocument());
  });

  it('shows a "clear filters" button when filters are active', async () => {
    api.get.mockResolvedValue({ data: { boxes: [] } });
    wrap(<BoxesPage />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.change(screen.getByPlaceholderText('boxes.searchPlaceholder'), { target: { value: 'x' } });
    expect(screen.getByText('boxes.clearFilters')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// CartPage
// ────────────────────────────────────────────────────────────────────────────
describe('CartPage', () => {
  const removeItem = vi.fn();
  const updateItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    removeItem.mockResolvedValue();
    updateItem.mockResolvedValue();
  });

  it('shows a sign-in prompt when there is no user', () => {
    useAuth.mockReturnValue({ user: null });
    useCart.mockReturnValue({ cart: { items: [], cartTotal: 0 }, loading: false, removeItem, updateItem });
    wrap(<CartPage />);
    expect(screen.getByText('cart.signInTitle')).toBeInTheDocument();
  });

  it('shows empty cart state when the cart has no items', () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    useCart.mockReturnValue({ cart: { items: [], cartTotal: 0 }, loading: false, removeItem, updateItem });
    wrap(<CartPage />);
    expect(screen.getByText('cart.emptyTitle')).toBeInTheDocument();
  });

  it('renders cart items with names and prices', () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    useCart.mockReturnValue({
      cart: {
        items: [{ _id: 'i1', box: { name: 'Keto Box' }, servingSize: 2, quantity: 1, pricePerItem: 90 }],
        cartTotal: 90,
      },
      loading: false, removeItem, updateItem,
    });
    wrap(<CartPage />);
    expect(screen.getByText('Keto Box')).toBeInTheDocument();
    // Price appears in both item row and order summary
    expect(screen.getAllByText(/90 EGP/).length).toBeGreaterThanOrEqual(1);
  });

  it('calls removeItem when the trash button is clicked', async () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    useCart.mockReturnValue({
      cart: { items: [{ _id: 'i1', box: { name: 'Keto Box' }, servingSize: 2, quantity: 1, pricePerItem: 90 }], cartTotal: 90 },
      loading: false, removeItem, updateItem,
    });
    wrap(<CartPage />);
    fireEvent.click(document.querySelector('button[class*="hover:text-red"]'));
    await waitFor(() => expect(removeItem).toHaveBeenCalledWith('i1'));
  });

  it('navigates to /checkout when the checkout button is clicked', () => {
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    useCart.mockReturnValue({
      cart: { items: [{ _id: 'i1', box: { name: 'Keto Box' }, servingSize: 2, quantity: 1, pricePerItem: 90 }], cartTotal: 90 },
      loading: false, removeItem, updateItem,
    });
    wrap(<CartPage />);
    fireEvent.click(screen.getByText(/cart\.checkout/));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SubscribePage
// ────────────────────────────────────────────────────────────────────────────
describe('SubscribePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({});
  });

  it('redirects to /login when no user is present', () => {
    useAuth.mockReturnValue({ user: null });
    wrap(<SubscribePage />, { route: '/subscribe?boxId=b1&servings=2&name=TestBox' });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders the subscription form for an authenticated user', () => {
    useAuth.mockReturnValue({ user: { _id: 'u1', addresses: [] } });
    wrap(<SubscribePage />, { route: '/subscribe?boxId=b1&servings=2&name=TestBox' });
    // Frequency options and day chips should render
    expect(screen.getByText('subscribe.weekly')).toBeInTheDocument();
    expect(screen.getByText('subscribe.monthly')).toBeInTheDocument();
  });

  it('shows street and city inputs for delivery address', () => {
    useAuth.mockReturnValue({ user: { _id: 'u1', addresses: [] } });
    wrap(<SubscribePage />, { route: '/subscribe?boxId=b1&servings=2&name=TestBox' });
    // Placeholder uses defaultValue fallback — our t() mock returns it
    expect(screen.getByPlaceholderText('Street address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
  });

  it('shows toast error when form is submitted without street/city', async () => {
    const toast = await import('react-hot-toast');
    useAuth.mockReturnValue({ user: { _id: 'u1', addresses: [] } });
    wrap(<SubscribePage />, { route: '/subscribe?boxId=b1&servings=2&name=TestBox' });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(toast.default.error).toHaveBeenCalled());
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows toast error when no boxId is provided', async () => {
    const toast = await import('react-hot-toast');
    useAuth.mockReturnValue({ user: { _id: 'u1', addresses: [] } });
    wrap(<SubscribePage />, { route: '/subscribe?servings=2' });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(toast.default.error).toHaveBeenCalled());
  });
});
