import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | null;
  hideIfSingle?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  size = 'sm',
  hideIfSingle = true,
}) => {
  if (hideIfSingle && totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={cn('flex justify-center items-center space-x-2', className)}>
      <Button
        variant="outline"
        size={size ?? undefined}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      <div className="flex items-center space-x-1">
        {pages.map((p) => (
          <Button
            key={p}
            variant={currentPage === p ? 'default' : 'outline'}
            size={size ?? undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size={size ?? undefined}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};