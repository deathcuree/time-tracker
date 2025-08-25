import * as XLSX from 'xlsx';

export function makeExcelFile(
  rows: Array<Record<string, any>>,
  headers: string[],
  sheetName: string
): { buffer: Buffer; filename: string } {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const safeSheet = sanitizeSheetName(sheetName);
  XLSX.utils.book_append_sheet(wb, ws, safeSheet);
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

  const today = new Date().toISOString().slice(0, 10);
  const base = safeSheet.toLowerCase().replace(/\s+/g, '-');
  const filename = `${base}-${today}.xlsx`;
  return { buffer, filename };
}

function sanitizeSheetName(name: string): string {
  const invalid = /[:\\/?*\[\]]/g;
  let sanitized = (name || 'Sheet').replace(invalid, '-');
  if (sanitized.length > 31) sanitized = sanitized.slice(0, 31);
  if (!sanitized.trim()) sanitized = 'Sheet';
  return sanitized;
}