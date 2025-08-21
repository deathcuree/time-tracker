import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchWithFilterBar } from '@/components/shared/SearchWithFilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { MonthYearFilter } from '@/components/time/MonthYearFilter';
import adminApi, { TimeLogItem, AdminTimeStatus, TimeLogsResponse, TimeLogsParams } from '@/lib/api/admin';
import { format, parseISO } from 'date-fns';
import { TableRowSkeleton } from '@/components/shared/TableRowSkeleton';
import ExportButton from '@/components/shared/ExportButton';
import { toast } from '@/components/ui/sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

const ITEMS_PER_PAGE = 10;

export const AdminTimeLogsTable: React.FC = () => {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchInputValue, setSearchInputValue] = React.useState('');
  const [status, setStatus] = React.useState<AdminTimeStatus>('all');
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [logs, setLogs] = React.useState<TimeLogItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);

  const isInitialMount = React.useRef(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const load = React.useCallback(async (override?: Partial<{ search: string; status: AdminTimeStatus; month: number; year: number; page: number }>) => {
    try {
      setIsLoading(true);
      const params = {
        search: (override?.search !== undefined ? override.search : (searchQuery || undefined)),
        status: override?.status ?? status,
        month: typeof (override?.month ?? month) === 'number' ? (override?.month ?? month) : undefined,
        year: typeof (override?.year ?? year) === 'number' ? (override?.year ?? year) : undefined,
        page: override?.page ?? page,
        limit: ITEMS_PER_PAGE,
      };
      const res: TimeLogsResponse = await adminApi.getTimeLogs(params);
      setLogs(res.items);
      setTotalPages(res.pagination.pages || 1);
    } catch (err: any) {
      toast.error('Failed to load time logs');
      setLogs([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [searchQuery, status, month, year, page]);

  React.useEffect(() => {
    load().catch(() => {});
  }, []);

  const debouncedSearch = React.useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value);
        setPage(1);
        load({ search: value, page: 1 }).catch(() => {});
      }, 300),
    [load]
  );


  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      const s = searchParams.get('search');
      const st = searchParams.get('status') as AdminTimeStatus | null;

      if (s) {
        setSearchQuery(s);
        setSearchInputValue(s);
        setIsSearching(true);
        load({ search: s, page: 1 }).catch(() => {});
      }

      if (st === 'active' || st === 'completed' || st === 'all') {
        setStatus(st || 'all');
      }
    }
  }, []);

  React.useEffect(() => {
    if (!isInitialMount.current) {
      if (!searchQuery && status === 'all') {
        navigate('.', { replace: true });
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (status !== 'all') params.set('status', status);
        setSearchParams(params);
      }
    }
  }, [searchQuery, status, navigate, setSearchParams]);

  const handleSearchChange = (newValue: string) => {
    setSearchInputValue(newValue);
    if (newValue === '') {
      setIsSearching(true);
      setSearchQuery('');
      setPage(1);
      navigate('.', { replace: true });
      load({ search: '', page: 1 }).catch(() => {});
    } else {
      setIsSearching(true);
      const params = new URLSearchParams();
      params.set('search', newValue);
      if (status !== 'all') params.set('status', status);
      setSearchParams(params);
      debouncedSearch(newValue);
    }
  };

  const handleSearchSubmit = (value: string) => {
    setIsSearching(true);
    setSearchQuery(value);
    setPage(1);
    const params = new URLSearchParams();
    if (value) params.set('search', value);
    if (status !== 'all') params.set('status', status);
    setSearchParams(params);
    load({ search: value, page: 1 }).catch(() => {});
  };

  const handleStatusChange = (value: string) => {
    const next = (value as AdminTimeStatus) || 'all';
    setStatus(next);
    setPage(1);
    load({ status: next, page: 1 }).catch(() => {});
  };

  const handleMonthYearChange = ({ year: y, month: m }: { year?: number; month?: number }) => {
    const nextYear = y ?? year;
    const nextMonth = m ?? month;
    setYear(nextYear);
    setMonth(nextMonth);
    setPage(1);
    load({ year: nextYear, month: nextMonth, page: 1 }).catch(() => {});
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    load({ page: p }).catch(() => {});
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return format(parseISO(iso), 'h:mm a');
    } catch {
      return '—';
    }
  };

  const formatDate = (iso: string) => {
    try {
      return format(parseISO(iso), 'MMM dd, yyyy');
    } catch {
      return iso.split('T')[0];
    }
  };

  const formatHoursWorked = (hours?: number | null) => {
    if (typeof hours !== 'number' || isNaN(hours)) return '0 mins';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h} hr${h === 1 ? '' : 's'}`);
    if (m > 0) parts.push(`${m} min${m === 1 ? '' : 's'}`);
    return parts.length > 0 ? parts.join(' ') : '0 mins';
  };

  const filterOptions = [
    { value: 'all', label: 'All Entries' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  const isBusy = isLoading || isSearching;

  return (
    <Card>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <MonthYearFilter
            year={year}
            month={month}
            startYear={2024}
            onChange={handleMonthYearChange}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SearchWithFilterBar
            searchValue={searchInputValue}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search"
            filterValue={status}
            onFilterChange={handleStatusChange}
            filterOptions={filterOptions}
            filterPlaceholder="Status"
            disabled={isLoading}
            selectDisabled={isLoading}
            className="p-0 w-full md:w-auto"
          />

          <ExportButton<TimeLogsParams>
            exporter={adminApi.exportTimeLogs}
            params={{
              search: searchQuery || undefined,
              status,
              month,
              year,
            }}
            disabled={isBusy}
            label="Export"
            size="sm"
            
          />
        </div>
      </div>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Employee</TableHead>
                <TableHead className="w-[14%] text-center">Date</TableHead>
                <TableHead className="w-[16%] text-center">Clock In</TableHead>
                <TableHead className="w-[16%] text-center">Clock Out</TableHead>
                <TableHead className="w-[16%] text-center">Hours Worked</TableHead>
                <TableHead className="w-[16%] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBusy && (
                Array.from({ length: 5 }).map((_ , idx) => (
                  <TableRowSkeleton key={idx} showUserInfo={true} />
                ))
              )}
              {!isBusy && logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No time logs found
                  </TableCell>
                </TableRow>
              )}
              {!isBusy && logs.map((item) => {
                const name = `${item.user.firstName} ${item.user.lastName}`.trim();
                return (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">{item.user.email}</div>
                    </TableCell>
                    <TableCell className="text-center">{formatDate(item.date)}</TableCell>
                    <TableCell className="text-center">{formatTime(item.clockIn)}</TableCell>
                    <TableCell className="text-center">{formatTime(item.clockOut)}</TableCell>
                    <TableCell className="text-center">{formatHoursWorked(item.hours)}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-4"
          size="sm"
        />
      </CardContent>
    </Card>
  );
};

export default AdminTimeLogsTable;