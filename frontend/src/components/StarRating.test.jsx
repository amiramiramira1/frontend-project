import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders exactly 5 stars', () => {
    const { container } = render(<StarRating rating={3} />);
    expect(container.querySelectorAll('svg')).toHaveLength(5);
  });

  it('fills stars up to the rating value', () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll('svg');
    expect(stars[0].classList.contains('fill-yellow-400')).toBe(true);
    expect(stars[2].classList.contains('fill-yellow-400')).toBe(true);
    expect(stars[3].classList.contains('fill-gray-300')).toBe(true);
  });

  it('calls onRate with the clicked star when interactive', () => {
    const onRate = vi.fn();
    const { container } = render(<StarRating rating={0} interactive onRate={onRate} />);
    fireEvent.click(container.querySelectorAll('svg')[3]);
    expect(onRate).toHaveBeenCalledWith(4);
  });

  it('ignores clicks when not interactive', () => {
    const onRate = vi.fn();
    const { container } = render(<StarRating rating={2} onRate={onRate} />);
    fireEvent.click(container.querySelectorAll('svg')[1]);
    expect(onRate).not.toHaveBeenCalled();
  });
});
