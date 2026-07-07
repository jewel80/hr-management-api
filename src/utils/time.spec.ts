import { normalizeCheckInTime } from './time';

describe('normalizeCheckInTime', () => {
  it('appends seconds when given HH:mm', () => {
    expect(normalizeCheckInTime('09:30')).toBe('09:30:00');
  });

  it('returns HH:mm:ss unchanged', () => {
    expect(normalizeCheckInTime('09:30:15')).toBe('09:30:15');
  });

  it('does not alter a zero-second value already in HH:mm:ss', () => {
    expect(normalizeCheckInTime('00:00:00')).toBe('00:00:00');
  });

  it('appends seconds to any single-colon input', () => {
    expect(normalizeCheckInTime('9:30')).toBe('9:30:00');
  });
});
