import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export interface TableRowSkeletonProps {
  showUserInfo?: boolean;
  showActions?: boolean;
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
  showUserInfo = false,
  showActions = false,
}) => {
  return (
    <TableRow>
      {showUserInfo && (
        <TableCell>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
        </TableCell>
      )}
      <TableCell>
        <Skeleton className="h-4 w-[120px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[60px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[200px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-[100px] rounded-full" />
      </TableCell>
      {showActions && (
        <TableCell>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-[80px]" />
            <Skeleton className="h-8 w-[80px]" />
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};