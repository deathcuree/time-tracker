import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePTO } from '@/contexts/PTOContext';
import { Separator } from '@/components/ui/separator';

export const PTOStatus: React.FC = () => {
  const { userPTOsThisMonth, userPTOLimit, fetchRequestsForMonth, fetchYearlyPTOHours } = usePTO();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonthPTOs, setSelectedMonthPTOs] = useState<number | null>(null);
  const [yearlyPTOInfo, setYearlyPTOInfo] = useState<{
    totalHoursUsed: number;
    yearlyLimit: number;
    remainingHours: number;
  } | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const loadMonthData = async () => {
      if (!isCurrentMonth(selectedDate)) {
        const count = await fetchRequestsForMonth(
          selectedDate.getMonth(),
          selectedDate.getFullYear()
        );
        setSelectedMonthPTOs(count);
      } else {
        setSelectedMonthPTOs(userPTOsThisMonth);
      }
    };

    loadMonthData();
  }, [selectedDate, userPTOsThisMonth]);

  useEffect(() => {
    const loadYearlyData = async () => {
      const yearlyData = await fetchYearlyPTOHours(selectedDate.getFullYear());
      setYearlyPTOInfo(yearlyData);
    };

    loadYearlyData();
  }, [selectedDate]);

  const handlePreviousMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const isCurrentMonth = (date: Date) => {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PTO Status</CardTitle>
        <CardDescription>Your paid time off requests and availability</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between w-full max-w-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium">
              {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Monthly PTO Counter */}
          <div className="text-center">
            <div className="text-5xl font-bold">
              {selectedMonthPTOs !== null ? (
                <>
                  {selectedMonthPTOs} <span className="text-muted-foreground">/ {userPTOLimit}</span>
                </>
              ) : (
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              )}
            </div>
            <p className="mt-2 text-muted-foreground">
              {isCurrentMonth(selectedDate)
                ? "Approved PTO requests this month"
                : "Approved PTO requests"}
            </p>
          </div>

          <Separator className="my-4" />

          {/* Yearly PTO Counter */}
          <div className="text-center w-full">
            <h3 className="text-sm font-medium mb-2">Yearly PTO Status ({selectedDate.getFullYear()})</h3>
            {yearlyPTOInfo ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {yearlyPTOInfo.remainingHours}
                  <span className="text-muted-foreground text-lg"> hours remaining</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Used: {yearlyPTOInfo.totalHoursUsed} / {yearlyPTOInfo.yearlyLimit} hours
                </p>
              </div>
            ) : (
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 