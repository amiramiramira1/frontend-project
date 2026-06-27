import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../context/FavoritesContext', () => ({
  useFavorites: vi.fn(),
}));

// useNavigate needs to be mockable
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import BoxCard from './BoxCard';

const BOX = {
  _id: 'box1',
  name: 'Keto Power Box',
  description: 'High-fat low-carb meals',
  dietType: 'keto',
  basePrice: 50,
  image: null,
  meals: [{ _id: 'm1' }, { _id: 'm2' }, { _id: 'm3' }],
};

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('BoxCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { _id: 'u1' } });
    useFavorites.mockReturnValue({
      isFavorite: vi.fn(() => false),
      toggleFavorite: vi.fn(),
    });
  });

  it('renders the box name and description', () => {
    wrap(<BoxCard box={BOX} />);
    expect(screen.getByText('Keto Power Box')).toBeInTheDocument();
    expect(screen.getByText('High-fat low-carb meals')).toBeInTheDocument();
  });

  it('shows the correct meal count', () => {
    wrap(<BoxCard box={BOX} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('shows the diet badge for keto type', () => {
    wrap(<BoxCard box={BOX} />);
    // The badge uses the emoji + translated key. t() returns the key.
    expect(screen.getByText(/⚡/)).toBeInTheDocument();
  });

  it('shows "from X EGP" price label', () => {
    wrap(<BoxCard box={BOX} />);
    // basePrice 50 × MULTIPLIERS[2] (1.8) = 90
    expect(screen.getByText(/90/)).toBeInTheDocument();
  });

  it('heart button calls toggleFavorite when user is logged in', () => {
    const toggleFavorite = vi.fn();
    useFavorites.mockReturnValue({ isFavorite: vi.fn(() => false), toggleFavorite });

    wrap(<BoxCard box={BOX} />);
    fireEvent.click(screen.getByRole('button'));
    expect(toggleFavorite).toHaveBeenCalledWith('box1');
  });

  it('heart button navigates to /login when user is not logged in', () => {
    useAuth.mockReturnValue({ user: null });
    useFavorites.mockReturnValue({ isFavorite: vi.fn(() => false), toggleFavorite: vi.fn() });

    wrap(<BoxCard box={BOX} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('heart icon is filled when box is favorited', () => {
    useFavorites.mockReturnValue({
      isFavorite: vi.fn(() => true),
      toggleFavorite: vi.fn(),
    });

    const { container } = wrap(<BoxCard box={BOX} />);
    // The Heart SVG should have fill-red-500 class when favorited
    const heart = container.querySelector('svg.fill-red-500');
    expect(heart).toBeInTheDocument();
  });

  it('renders without crashing when box has no meals array', () => {
    const boxNoMeals = { ...BOX, meals: undefined };
    wrap(<BoxCard box={boxNoMeals} />);
    expect(screen.getByText('Keto Power Box')).toBeInTheDocument();
  });

  it('renders without a price when basePrice is absent', () => {
    const boxNoPrice = { ...BOX, basePrice: null };
    wrap(<BoxCard box={boxNoPrice} />);
    // No "from X EGP" text should appear
    expect(screen.queryByText(/from/i)).toBeNull();
  });
});
