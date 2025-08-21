import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search as SearchIcon } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface SearchWithFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: FilterOption[];
  filterPlaceholder?: string;
  disabled?: boolean;
  selectDisabled?: boolean;
  className?: string;
  onSearchSubmit?: (value: string) => void;
  submitOnEnter?: boolean;
}

export const SearchWithFilterBar: React.FC<SearchWithFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = 'Filter',
  disabled = false,
  selectDisabled,
  className,
  onSearchSubmit,
  submitOnEnter = false,
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 ${className ?? ''}`}>
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (submitOnEnter && e.key === 'Enter') {
                e.preventDefault();
                onSearchSubmit?.(searchValue);
              }
            }}
            disabled={disabled}
            className="pl-9 max-w-sm [&::-webkit-search-cancel-button]:hover:cursor-pointer [&::-webkit-search-cancel-button]:appearance-auto"
          />
        </div>
        {onSearchSubmit && (
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={() => onSearchSubmit(searchValue)}
          >
            Search
          </Button>
        )}
      </div>
      <Select
        value={filterValue}
        onValueChange={onFilterChange}
        disabled={selectDisabled ?? disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={filterPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};