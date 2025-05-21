
import React, { useState } from 'react';
import { useTime, TimeEntry } from '@/contexts/TimeContext';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const TimeHistoryTable: React.FC = () => {
  const { entries, isLoading } = useTime();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4">Loading time entries...</p>
      </div>
    );
  }
  
  // Sort entries by date (most recent first)
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Filter by search query (date)
  const filteredEntries = sortedEntries.filter(entry => {
    if (!searchQuery) return true;
    return entry.date.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Calculate hours worked
  const calculateHoursWorked = (entry: TimeEntry): string => {
    if (!entry.clockOut) return 'Still clocked in';
    
    const clockIn = parseISO(entry.clockIn);
    const clockOut = parseISO(entry.clockOut);
    
    const minutesWorked = differenceInMinutes(clockOut, clockIn);
    const hours = Math.floor(minutesWorked / 60);
    const minutes = minutesWorked % 60;
    
    return `${hours}h ${minutes}m`;
  };
  
  const formatTime = (time: string | null): string => {
    if (!time) return 'N/A';
    return format(parseISO(time), 'h:mm a');
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by date (YYYY-MM-DD)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Hours Worked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry) => (
                  <TableRow key={entry.id}>
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
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
