import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { usePTO, PTORequest, PTOStatus } from '@/contexts/PTOContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { SearchWithFilterBar } from '@/components/shared/SearchWithFilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { TableRowSkeleton } from '@/components/shared/TableRowSkeleton';
import { ApproveDenyActions } from '@/components/shared/ApproveDenyActions';

const ITEMS_PER_PAGE = 10;

interface RequestListProps {
  showUserInfo?: boolean;
}

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

  useEffect(() => {
    const clearSearchAndUrl = () => {
      setSearchQuery('');
      setSearchInputValue('');
      setStatusFilter('all');
      navigate('.', { replace: true });
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (!document.referrer) {
        clearSearchAndUrl();
      } else {
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

    const handleBeforeUnload = () => {
      clearSearchAndUrl();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (newValue: string) => {
    setSearchInputValue(newValue);
    if (newValue === '') {
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
      navigate('.', { replace: true });
    }
  };

  useEffect(() => {
    if (!isInitialMount.current) {
      if (!searchQuery && statusFilter === 'all') {
        navigate('.', { replace: true });
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        setSearchParams(params);
      }
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getUserName = (request: PTORequest): string => {
    if (typeof request.userId === 'object' && request.userId !== null) {
      return `${request.userId.firstName} ${request.userId.lastName}`;
    }
    return request.userName;
  };

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

  const filterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'denied', label: 'Denied' },
  ];

  const renderToolbar = (disabled: boolean = false) => (
    <SearchWithFilterBar
      searchValue={searchInputValue}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search"
      filterValue={statusFilter}
      onFilterChange={handleStatusFilterChange}
      filterOptions={filterOptions}
      filterPlaceholder="Filter by status"
      disabled={disabled}
      selectDisabled={disabled}
      className="p-4"
    />
  );

  const isAdmin = user?.role === 'admin';
  const headerColsBase = 4;
  const headerCols = headerColsBase + (showUserInfo ? 1 : 0) + (isAdmin ? 1 : 0);

  if (isLoading || isSearching) {
    return (
      <Card>
        {renderToolbar(true)}
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
                  {isAdmin && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton key={index} showUserInfo={!!showUserInfo} showActions={!!isAdmin} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {renderToolbar(false)}
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
                {isAdmin && <TableHead className="text-center">Actions</TableHead>}
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
                    <TableCell>{format(parseISO(request.date), 'PPP')}</TableCell>
                    <TableCell>
                      {request.hours} hour{request.hours > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <ApproveDenyActions
                          status={request.status}
                          onApprove={() => handleStatusChange(request._id, 'approved')}
                          onDeny={() => handleStatusChange(request._id, 'denied')}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headerCols} className="text-center h-24">
                    No PTO requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-4"
          size="sm"
        />
      </CardContent>
    </Card>
  );
};
