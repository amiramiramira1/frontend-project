import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderTimeline from './OrderTimeline';

// react-i18next is mocked globally — t(key) returns the key

describe('OrderTimeline (vertical)', () => {
  it('renders exactly 5 step labels', () => {
    render(<OrderTimeline status="pending" />);
    // Each step renders its t() key as label text
    expect(screen.getAllByText(/orders\.timeline\./)).toHaveLength(10); // 5 labels + 5 descs
  });

  it('active step has the ring class', () => {
    const { container } = render(<OrderTimeline status="preparing" />);
    // "preparing" is index 1 → the second step circle should have ring-4
    const rings = container.querySelectorAll('.ring-4');
    expect(rings).toHaveLength(1);
  });

  it('steps before active are completed (bg-brand-500 without ring)', () => {
    const { container } = render(<OrderTimeline status="out_for_delivery" />);
    // Index 0 (pending) and 1 (preparing) are completed
    const completed = container.querySelectorAll('.bg-brand-500:not(.ring-4)');
    expect(completed.length).toBeGreaterThanOrEqual(2);
  });

  it('steps after active are upcoming (bg-gray-200 circle)', () => {
    const { container } = render(<OrderTimeline status="pending" />);
    // Only count circles (w-9 h-9 rounded-full), not connector lines
    const upcoming = container.querySelectorAll('.w-9.h-9.rounded-full.bg-gray-200');
    expect(upcoming.length).toBe(4); // indices 1-4
  });

  it('unknown status renders all steps as upcoming circles', () => {
    const { container } = render(<OrderTimeline status="unknown" />);
    const upcoming = container.querySelectorAll('.w-9.h-9.rounded-full.bg-gray-200');
    expect(upcoming.length).toBe(5);
  });
});

describe('OrderTimeline (horizontal)', () => {
  it('renders with horizontal layout classes', () => {
    const { container } = render(<OrderTimeline status="pending" horizontal />);
    expect(container.querySelector('.flex.items-start.justify-between')).toBeInTheDocument();
  });

  it('horizontal active step has ring class', () => {
    const { container } = render(<OrderTimeline status="paid" horizontal />);
    const rings = container.querySelectorAll('.ring-4');
    expect(rings).toHaveLength(1);
  });
});
