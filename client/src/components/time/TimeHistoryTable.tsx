import React, { useState, useCallback, useEffect, memo } from 'react';
import { useTime, TimeEntry } from '@/contexts/TimeContext';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ITEMS_PER_PAGE = 10;
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
  { value: 11, label: 'December' }
];

// Memoized table row component
const TimeEntryRow = memo(({ entry }: { entry: TimeEntry }) => {
  const formatTime = (time: string | null): string => {
    if (!time) return 'N/A';
    return format(parseISO(time), 'h:mm a');
  };

  const calculateHoursWorked = (entry: TimeEntry): string => {
    if (!entry.clockOut) return 'Still clocked in';
    
    const clockIn = parseISO(entry.clockIn);
    const clockOut = parseISO(entry.clockOut);
    
    const minutesWorked = differenceInMinutes(clockOut, clockIn);
    const hours = Math.floor(minutesWorked / 60);
    const minutes = minutesWorked % 60;
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <TableRow>
      <TableCell>
        {format(parseISO(entry.date), 'MMM dd, yyyy')}
      </TableCell>
      <TableCell>{formatTime(entry.clockIn)}</TableCell>
      <TableCell>
        {entry.clockOut ? (
          formatTime(entry.clockOut)
        ) : (
          <span className="text-primary font-medium">Still clocked in</span>
        )}
      </TableCell>
      <TableCell>{calculateHoursWorked(entry)}</TableCell>
    </TableRow>
  );
});

TimeEntryRow.displayName = 'TimeEntryRow';

export const TimeHistoryTable: React.FC = () => {
  const { entries, isLoading, fetchEntries, pagination } = useTime();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [currentFilters, setCurrentFilters] = useState({
    month: currentMonth,
    year: currentYear,
    status: 'all' as 'all' | 'active' | 'completed',
    page: 1
  });

  // Get available months for the current year
  const getAvailableMonths = () => {
    const months = [...MONTHS];
    if (currentFilters.year === currentYear) {
      // If current year, only show months up to current month
      return months.slice(0, currentMonth + 1).reverse();
    }
    return months.reverse(); // Show all months for past years
  };

  // Fetch entries with current filters
  const loadEntries = useCallback(() => {
    fetchEntries({
      month: currentFilters.month,
      year: currentFilters.year,
      status: currentFilters.status,
      page: currentFilters.page,
      limit: ITEMS_PER_PAGE
    });
  }, [currentFilters, fetchEntries]);

  // Load entries only when filters change
  useEffect(() => {
    loadEntries();
  }, [currentFilters]); // Only depend on currentFilters, not loadEntries

  if (isLoading && entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4">Loading time entries...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Select
            value={currentFilters.month.toString()}
            onValueChange={(value) => {
              setCurrentFilters(prev => ({
                ...prev,
                month: parseInt(value),
                page: 1
              }));
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableMonths().map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.status}
            onValueChange={(value: 'all' | 'active' | 'completed') => {
              setCurrentFilters(prev => ({
                ...prev,
                status: value,
                page: 1
              }));
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entries</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4 text-center">Date</TableHead>
                <TableHead className="w-1/4 text-center">Clock In</TableHead>
                <TableHead className="w-1/4 text-center">Clock Out</TableHead>
                <TableHead className="w-1/4 text-center">Hours Worked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <TimeEntryRow key={entry.id} entry={entry} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No time entries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={currentFilters.page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentFilters.page === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentFilters(prev => ({ ...prev, page }))}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={currentFilters.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
