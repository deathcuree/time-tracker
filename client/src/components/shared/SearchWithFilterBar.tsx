import React from 'react';
import { Input } from '@/components/ui/input';
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
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 p-4 ${className ?? ''}`}>
      <div className="flex-1 relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
          className="pl-9 max-w-sm [&::-webkit-search-cancel-button]:hover:cursor-pointer [&::-webkit-search-cancel-button]:appearance-auto"
        />
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