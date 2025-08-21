import React from 'react';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';

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
    <div className={`flex flex-col sm:flex-row items-center gap-2 ${className ?? ''}`}>
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        disabled={disabled}
        onSubmit={onSearchSubmit}
        submitOnEnter={submitOnEnter}
        className="flex-1 w-full"
      />
      <FilterSelect
        value={filterValue}
        onChange={onFilterChange}
        options={filterOptions}
        placeholder={filterPlaceholder}
        disabled={selectDisabled ?? disabled}
      />
    </div>
  );
};