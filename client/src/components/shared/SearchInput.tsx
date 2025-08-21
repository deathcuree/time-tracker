import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  onSubmit?: (value: string) => void;
  submitOnEnter?: boolean;
  buttonLabel?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className,
  inputClassName,
  onSubmit,
  submitOnEnter = false,
  buttonLabel = 'Search',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <div className="relative w-full sm:w-auto flex-1">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (submitOnEnter && e.key === 'Enter') {
              e.preventDefault();
              onSubmit?.(value);
            }
          }}
          disabled={disabled}
          className={`pl-9 max-w-sm [&::-webkit-search-cancel-button]:hover:cursor-pointer [&::-webkit-search-cancel-button]:appearance-auto ${inputClassName ?? ''}`}
        />
      </div>
      {onSubmit && (
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={() => onSubmit(value)}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
};