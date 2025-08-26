import React, { useState, useCallback, useEffect, memo } from "react";
import { useTime, TimeEntry } from "@/contexts/TimeContext";
import { parseISO, differenceInMinutes } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthYearFilter } from "./MonthYearFilter";
import { StatusFilter } from "./StatusFilter";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { formatDateForDisplay, formatTimeForDisplay } from "@/utils/date";

const ITEMS_PER_PAGE = 10;

const TimeEntryRow = memo(
  ({
    entry,
    onDelete,
  }: {
    entry: TimeEntry;
    onDelete: (id: string) => void;
  }) => {
    const formatTime = (time: string | null): string => {
      if (!time) return "N/A";
      return formatTimeForDisplay(time);
    };

    const calculateHoursWorked = (entry: TimeEntry): string => {
      if (!entry.clockOut) return "Still clocked in";

      const clockIn = parseISO(entry.clockIn);
      const clockOut = parseISO(entry.clockOut);

      const minutesWorked = differenceInMinutes(clockOut, clockIn);
      const hours = Math.floor(minutesWorked / 60);
      const minutes = minutesWorked % 60;

      return `${hours}h ${minutes}m`;
    };

    const getStatus = (entry: TimeEntry): "active" | "completed" => {
      const s = (entry as any).status as "active" | "completed" | undefined;
      if (s === "active" || s === "completed") return s;
      return entry.clockOut ? "completed" : "active";
    };

    const isActive = !entry.clockOut;

    return (
      <TableRow>
        <TableCell>{formatDateForDisplay(entry.date)}</TableCell>
        <TableCell>{formatTime(entry.clockIn)}</TableCell>
        <TableCell>
          {entry.clockOut ? (
            formatTime(entry.clockOut)
          ) : (
            <span className="text-primary font-medium">Still clocked in</span>
          )}
        </TableCell>
        <TableCell>{calculateHoursWorked(entry)}</TableCell>
        <TableCell className="text-center">
          <StatusBadge status={getStatus(entry)} />
        </TableCell>
        <TableCell className="text-center">
          <AlertDialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      disabled={isActive}
                      aria-label={
                        isActive
                          ? "Cannot delete an active time entry. Clock out first."
                          : "Delete time entry"
                      }
                      title={
                        isActive
                          ? "Cannot delete an active time entry. Clock out first."
                          : "Delete time entry"
                      }
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {isActive ? "Cannot delete active entry" : "Delete entry"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete time entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  selected time entry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(entry.id ?? (entry as any)._id)}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>
    );
  }
);

TimeEntryRow.displayName = "TimeEntryRow";

export const TimeHistoryTable: React.FC = () => {
  const { entries, isLoading, fetchEntries, pagination, deleteTimeEntry } =
    useTime();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const handleDelete = (id: string) => {
    deleteTimeEntry(id);
  };

  const [currentFilters, setCurrentFilters] = useState({
    month: currentMonth,
    year: currentYear,
    status: "all" as "all" | "active" | "completed",
    page: 1,
  });

  const loadEntries = useCallback(() => {
    fetchEntries({
      month: currentFilters.month,
      year: currentFilters.year,
      status: currentFilters.status,
      page: currentFilters.page,
      limit: ITEMS_PER_PAGE,
    });
  }, [currentFilters, fetchEntries]);

  useEffect(() => {
    loadEntries();
  }, [currentFilters]);

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
          <MonthYearFilter
            year={currentFilters.year}
            month={currentFilters.month}
            startYear={2025}
            onChange={({ year, month }) =>
              setCurrentFilters((prev) => ({
                ...prev,
                ...(year !== undefined ? { year } : {}),
                ...(month !== undefined ? { month } : {}),
                page: 1,
              }))
            }
          />

          <StatusFilter
            value={currentFilters.status}
            onChange={(value) =>
              setCurrentFilters((prev) => ({
                ...prev,
                status: value,
                page: 1,
              }))
            }
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/6 text-center">Date</TableHead>
                <TableHead className="w-1/6 text-center">Clock In</TableHead>
                <TableHead className="w-1/6 text-center">Clock Out</TableHead>
                <TableHead className="w-1/6 text-center">
                  Hours Worked
                </TableHead>
                <TableHead className="w-1/6 text-center">Status</TableHead>
                <TableHead className="w-1/6 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <TimeEntryRow
                    key={(entry.id ?? (entry as any)._id) as string}
                    entry={entry}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <TableRow key="no-entries">
                  <TableCell colSpan={6} className="text-center h-24">
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
              key="prev"
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentFilters((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={currentFilters.page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <Button
                  key={`page-${page}`}
                  variant={currentFilters.page === page ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setCurrentFilters((prev) => ({ ...prev, page }))
                  }
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              key="next"
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentFilters((prev) => ({ ...prev, page: prev.page + 1 }))
              }
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
