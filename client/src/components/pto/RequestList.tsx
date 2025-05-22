import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { usePTO, PTORequest, PTOStatus } from '@/contexts/PTOContext';
import { cn } from '@/lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

interface RequestListProps {
  showUserInfo?: boolean;
}

const TableRowSkeleton: React.FC<{ showUserInfo: boolean; isAdmin: boolean }> = ({ showUserInfo, isAdmin }) => {
  const columns = showUserInfo ? (isAdmin ? 6 : 5) : (isAdmin ? 5 : 4);
  
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
      {isAdmin && (
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

export const RequestList: React.FC<RequestListProps> = ({ showUserInfo = false }) => {
  const { user } = useAuth();
  const { requests, isLoading, updateRequestStatus, fetchRequests } = usePTO();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isInitialMount = React.useRef(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<PTOStatus | 'all'>('all');
  const [isSearching, setIsSearching] = useState(false);

  // Clear URL and state on page refresh
  useEffect(() => {
    const clearSearchAndUrl = () => {
      setSearchQuery('');
      setSearchInputValue('');
      setStatusFilter('all');
      navigate('.', { replace: true }); // This clears URL parameters
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (!document.referrer) {
        clearSearchAndUrl();
      } else {
        // Only restore search params during normal navigation
        const searchFromUrl = searchParams.get('search');
        const statusFromUrl = searchParams.get('status') as PTOStatus | 'all';
        if (searchFromUrl) {
          setSearchQuery(searchFromUrl);
          setSearchInputValue(searchFromUrl);
          setIsSearching(true);
          debouncedSearch(searchFromUrl);
        }
        if (statusFromUrl) {
          setStatusFilter(statusFromUrl);
        }
      }
    }

    // Add event listener for page refresh
    const handleBeforeUnload = () => {
      clearSearchAndUrl();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Create a stable debounced search function
  const debouncedSearch = React.useCallback(
    debounce(async (query: string) => {
      try {
        setSearchQuery(query);
        await fetchRequests(query);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [fetchRequests]
  );

  // Cleanup debounced search on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchInputValue(newValue);
    if (newValue === '') {
      // Clear URL parameters when search is cleared
      navigate('.', { replace: true });
      fetchRequests('');
    } else {
      setIsSearching(true);
      debouncedSearch(newValue);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as PTOStatus | 'all');
    setCurrentPage(1);
    if (value === 'all' && !searchQuery) {
      // Clear URL parameters when filter is reset and no search
      navigate('.', { replace: true });
    }
  };
  
  // Update search params when filters change
  useEffect(() => {
    if (!isInitialMount.current) {
      if (!searchQuery && statusFilter === 'all') {
        // Clear URL parameters when no active filters
        navigate('.', { replace: true });
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        setSearchParams(params);
      }
    }
  }, [searchQuery, statusFilter]);

  // Initial data load
  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusColor = (status: PTOStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Show skeleton during initial load or search
  if (isLoading || isSearching) {
    return (
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search by employee name, email, month (May), date, hours, reason, or status..."
              value={searchInputValue}
              onChange={handleSearchChange}
              className="pl-9 max-w-sm [&::-webkit-search-cancel-button]:hover:cursor-pointer [&::-webkit-search-cancel-button]:appearance-auto"
            />
          </div>
          <Select value={statusFilter} disabled>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showUserInfo && <TableHead className="text-center">Employee</TableHead>}
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                  <TableHead className="text-center">Reason</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {user?.role === 'admin' && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton 
                    key={index} 
                    showUserInfo={showUserInfo} 
                    isAdmin={user?.role === 'admin'}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const filteredRequests = requests.filter(request => {
    // Status filter
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
  
  // Get user ID helper function
  const getUserId = (request: PTORequest): string => {
    if (typeof request.userId === 'string') {
      return request.userId;
    }
    return request.userId._id;
  };

  // Get user name helper function
  const getUserName = (request: PTORequest): string => {
    if (typeof request.userId === 'object' && request.userId !== null) {
      return `${request.userId.firstName} ${request.userId.lastName}`;
    }
    return request.userName;
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handleStatusChange = async (requestId: string, newStatus: PTOStatus) => {
    await updateRequestStatus(requestId, newStatus);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search by employee name, email, month (May), date, hours, reason, or status..."
            value={searchInputValue}
            onChange={handleSearchChange}
            className="pl-9 max-w-sm [&::-webkit-search-cancel-button]:hover:cursor-pointer [&::-webkit-search-cancel-button]:appearance-auto"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showUserInfo && <TableHead className="text-center">Employee</TableHead>}
                <TableHead className="text-center">Date</TableHead>
                <TableHead className="text-center">Hours</TableHead>
                <TableHead className="text-center">Reason</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {user?.role === 'admin' && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <TableRow key={request._id}>
                    {showUserInfo && (
                      <TableCell>
                        {getUserName(request)}
                        <div className="text-sm text-muted-foreground">
                          {typeof request.userId === 'object' ? request.userId.email : request.userEmail}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      {format(parseISO(request.date), 'PPP')}
                    </TableCell>
                    <TableCell>
                      {request.hours} hour{request.hours > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        {request.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-500 hover:bg-green-50"
                              onClick={() => handleStatusChange(request._id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() => handleStatusChange(request._id, 'denied')}
                            >
                              Deny
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {request.status === 'approved' ? 'Approved' : 'Denied'}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={showUserInfo ? 6 : 5} 
                    className="text-center h-24"
                  >
                    No PTO requests found
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

