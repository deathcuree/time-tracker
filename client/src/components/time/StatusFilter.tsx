import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type StatusValue = 'all' | 'active' | 'completed';

export interface StatusFilterProps {
  value: StatusValue;
  onChange: (value: StatusValue) => void;
  className?: string;
  placeholder?: string;
  labels?: Partial<Record<StatusValue, string>>;
}

const DEFAULT_LABELS: Record<StatusValue, string> = {
  all: 'All Entries',
  active: 'Active',
  completed: 'Completed',
};

export const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  className,
  placeholder = 'Status',
  labels,
}) => {
  const mergedLabels = { ...DEFAULT_LABELS, ...(labels || {}) };

  return (
    <Select value={value} onValueChange={(v) => onChange(v as StatusValue)}>
      <SelectTrigger className={`w-[150px] ${className ?? ''}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{mergedLabels.all}</SelectItem>
        <SelectItem value="active">{mergedLabels.active}</SelectItem>
        <SelectItem value="completed">{mergedLabels.completed}</SelectItem>
      </SelectContent>
    </Select>
  );
};