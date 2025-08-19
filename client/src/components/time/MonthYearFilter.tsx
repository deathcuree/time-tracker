import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface MonthYearFilterProps {
  year: number;
  month: number;
  startYear?: number;
  endYear?: number;
  onChange: (update: { year?: number; month?: number }) => void;
  className?: string;
}

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

export const MonthYearFilter: React.FC<MonthYearFilterProps> = ({
  year,
  month,
  startYear = 2025,
  endYear = new Date().getFullYear(),
  onChange,
  className,
}) => {
  const safeStart = Math.min(startYear, endYear);
  const safeEnd = Math.max(endYear, startYear);

  const years = Array.from(
    { length: safeEnd - safeStart + 1 },
    (_, i) => safeStart + i
  );

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Select
        value={year.toString()}
        onValueChange={(value) => onChange({ year: parseInt(value, 10) })}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={month.toString()}
        onValueChange={(value) => onChange({ month: parseInt(value, 10) })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value.toString()}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};