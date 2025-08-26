export const APP_TIMEZONE: string = (import.meta as any)?.env
  ?.VITE_APP_TIMEZONE;

type Input = string | Date | number | null | undefined;

const ensureDate = (value: Input): Date | null => {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatWithIntl = (
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string
): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone || APP_TIMEZONE,
      ...options,
    }).format(date);
  } catch {
    // Fallback to ISO if Intl fails (should be rare)
    return date.toISOString();
  }
};

/**
 * formatDateForDisplay(date, timezone?)
 * - Renders a calendar date, no time component.
 * - Example: "Aug 26, 2025"
 */
export function formatDateForDisplay(value: Input, timeZone?: string): string {
  const d = ensureDate(value);
  if (!d) return "—";
  return formatWithIntl(
    d,
    { year: "numeric", month: "short", day: "2-digit" },
    timeZone
  );
}

/**
 * formatTimeForDisplay(date, timezone?)
 * - Renders a local time in 12-hour clock by default with minutes.
 * - Example: "1:05 PM"
 */
export function formatTimeForDisplay(
  value: Input,
  timeZone?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = ensureDate(value);
  if (!d) return "—";
  return formatWithIntl(
    d,
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...(options || {}),
    },
    timeZone
  );
}

/**
 * formatDateTimeForDisplay(date, timezone?)
 * - Renders both date and time.
 * - Example: "Aug 26, 2025, 1:05 PM"
 */
export function formatDateTimeForDisplay(
  value: Input,
  timeZone?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = ensureDate(value);
  if (!d) return "—";
  return formatWithIntl(
    d,
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...(options || {}),
    },
    timeZone
  );
}
