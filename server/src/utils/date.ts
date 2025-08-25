import { isValidObjectId } from 'mongoose';

export function parseDateRange(start?: string, end?: string): { start?: Date; end?: Date } {
  const result: { start?: Date; end?: Date } = {};

  const parse = (value?: string): Date | undefined => {
    if (!value || typeof value !== 'string') return undefined;
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d;
  };

  const startDate = parse(start);
  const endDate = parse(end);

  if (startDate) {
    const s = new Date(startDate);
    if (isDateOnlyString(start)) {
      s.setHours(0, 0, 0, 0);
    }
    result.start = s;
  }

  if (endDate) {
    const e = new Date(endDate);
    if (isDateOnlyString(end)) {
      e.setHours(23, 59, 59, 999);
    }
    result.end = e;
  }

  if (result.start && result.end && result.start.getTime() > result.end.getTime()) {
    const tmp = result.start;
    result.start = result.end;
    result.end = tmp;
  }

  return result;
}

function isDateOnlyString(v?: string): boolean {
  if (!v) return false;
  return /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(v.trim());
}

export function clampPagination(page?: number, limit?: number, maxLimit = 100) {
  const p = Math.max(1, Number.isFinite(page as number) ? Number(page) : 1);
  const l = Math.max(1, Math.min(maxLimit, Number.isFinite(limit as number) ? Number(limit) : 10));
  const skip = (p - 1) * l;
  return { page: p, limit: l, skip };
}

export { isValidObjectId };