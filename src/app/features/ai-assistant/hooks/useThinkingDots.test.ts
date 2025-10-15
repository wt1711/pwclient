import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThinkingDots } from './useThinkingDots';

describe('useThinkingDots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Thinking." when inactive', () => {
    const { result } = renderHook(() => useThinkingDots(false));
    expect(result.current).toBe('Thinking.');
  });

  it('should start with "Thinking." when activated', () => {
    const { result } = renderHook(() => useThinkingDots(true));
    expect(result.current).toBe('Thinking.');
  });

  it('should cycle through dots when active', async () => {
    const { result } = renderHook(() => useThinkingDots(true, 100));

    // Start with 1 dot
    expect(result.current).toBe('Thinking.');

    // After 100ms, should have 2 dots
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('Thinking..');

    // After another 100ms, should have 3 dots
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('Thinking...');

    // After another 100ms, should cycle back to 1 dot
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('Thinking.');
  });

  it('should stop cycling when deactivated', () => {
    const { result, rerender } = renderHook(({ isActive }) => useThinkingDots(isActive, 100), {
      initialProps: { isActive: true },
    });

    // Start cycling
    expect(result.current).toBe('Thinking.');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('Thinking..');

    // Deactivate
    rerender({ isActive: false });
    expect(result.current).toBe('Thinking.');

    // Should not continue cycling
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('Thinking.');
  });

  it('should reset to 1 dot when reactivated', async () => {
    const { result, rerender } = renderHook(({ isActive }) => useThinkingDots(isActive, 100), {
      initialProps: { isActive: true },
    });

    // Cycle to 3 dots
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('Thinking...');

    // Deactivate and reactivate
    rerender({ isActive: false });
    rerender({ isActive: true });
    expect(result.current).toBe('Thinking.');
  });

  it('should use custom interval', () => {
    const { result } = renderHook(() => useThinkingDots(true, 50));

    expect(result.current).toBe('Thinking.');

    // Should not change before custom interval
    act(() => {
      vi.advanceTimersByTime(49);
    });
    expect(result.current).toBe('Thinking.');

    // Should change after custom interval
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('Thinking..');
  });
});
