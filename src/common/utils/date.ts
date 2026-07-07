const pad = (value: number): string => value.toString().padStart(2, '0');

/**
 * Resolves the inclusive first/last calendar day for a `YYYY-MM` month.
 *
 * Uses `new Date(year, monthNumber, 0)` (local time) to derive the last day and
 * reads it back in local time, avoiding off-by-one shifts when the host runs in
 * a non-UTC timezone.
 */
export const monthBounds = (month: string): { start: string; end: string } => {
  const [yearStr, monthStr] = month.split('-');
  const year = Number.parseInt(yearStr, 10);
  const monthNumber = Number.parseInt(monthStr, 10); // 1-12

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    start: `${yearStr}-${monthStr}-01`,
    end: `${yearStr}-${monthStr}-${pad(lastDay)}`,
  };
};
