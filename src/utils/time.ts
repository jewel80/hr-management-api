/**
 * Normalizes a check-in time of day to `HH:mm:ss`.
 * Accepts `HH:mm` (appends `:00`) or an already-complete `HH:mm:ss`.
 */
export const normalizeCheckInTime = (value: string): string => {
  const parts = value.split(':');
  if (parts.length === 2) {
    return `${value}:00`;
  }
  return value;
};
