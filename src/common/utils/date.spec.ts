import { monthBounds } from './date';

describe('monthBounds', () => {
  it('returns first and last day for a 31-day month', () => {
    expect(monthBounds('2026-07')).toEqual({
      start: '2026-07-01',
      end: '2026-07-31',
    });
  });

  it('returns first and last day for a 30-day month', () => {
    expect(monthBounds('2026-06')).toEqual({
      start: '2026-06-01',
      end: '2026-06-30',
    });
  });

  it('handles February in a non-leap year (28 days)', () => {
    expect(monthBounds('2025-02')).toEqual({
      start: '2025-02-01',
      end: '2025-02-28',
    });
  });

  it('handles February in a leap year (29 days)', () => {
    expect(monthBounds('2024-02')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    });
  });

  it('handles December', () => {
    expect(monthBounds('2026-12')).toEqual({
      start: '2026-12-01',
      end: '2026-12-31',
    });
  });
});
