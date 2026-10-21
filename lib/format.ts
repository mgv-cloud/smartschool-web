// Small shared formatters for money and dates. Money is stored in kobo (1/100 of a naira).
export const naira = (kobo: number | null | undefined) =>
  ((kobo ?? 0) / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 });

// Date-only values are stored as UTC midnight, so format them in UTC to avoid off-by-one-day shifts.
export const dateOnly = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

export const dateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const STATE_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  TRIAL: 'bg-blue-50 text-blue-700',
  EXPIRED: 'bg-amber-50 text-amber-800',
  SUSPENDED: 'bg-red-50 text-red-700',
};

// Parses a naira amount typed by a person into kobo. Accepts "50000", "50,000", "₦50,000.50" and
// returns NaN for anything else — never a silently wrong number (parseFloat("50,000") would give 50).
export const nairaToKobo = (v: string): number => {
  const cleaned = v.replace(/[₦,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  return Math.round(parseFloat(cleaned) * 100);
};
