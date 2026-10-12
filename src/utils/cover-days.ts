/**
 * Number of days a policy is on cover, counting BOTH the start and end date
 * (1 Jan – 31 Dec = 365). Must match the API, which pro-rates below 365 days
 * and charges the full annual premium from 365 up to 367 (a leap year counted inclusively).
 * Returns 0 when either date is missing/invalid or end is before start.
 */
export function inclusiveCoverDays(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): number {
  const s = toUtcDay(start);
  const e = toUtcDay(end);
  if (s === null || e === null || e < s) return 0;
  return Math.round((e - s) / 86_400_000) + 1;
}

// Calendar day at UTC midnight, so time-of-day and DST shifts can't change the count.
function toUtcDay(input: Date | string | null | undefined): number | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    const y = Number(input.slice(0, 4));
    const m = Number(input.slice(5, 7));
    const day = Number(input.slice(8, 10));
    return Date.UTC(y, m - 1, day);
  }
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}
