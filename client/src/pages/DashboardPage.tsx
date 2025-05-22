import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check } from 'lucide-react';
import { ClockButton } from '@/components/time/ClockButton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PTOForm } from '@/components/pto/PTOForm';
import { PTOStatus } from '@/components/pto/PTOStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useTime } from '@/contexts/TimeContext';
import { usePTO } from '@/contexts/PTOContext';

const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes} minutes`;
  }
  
  if (wholeHours === 1) {
    return `1 hour${minutes > 0 ? ` ${minutes} minutes` : ''}`;
  }
  
  return `${wholeHours} hours${minutes > 0 ? ` ${minutes} minutes` : ''}`;
};

const formatElapsedTime = (clockInTime: string): string => {
  const start = new Date(clockInTime).getTime();
  const now = new Date().getTime();
  const diffInMinutes = Math.floor((now - start) / (1000 * 60));
  
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutes`;
  }
  
  if (hours === 1) {
    return `1 hour ${minutes} minutes`;
  }
  
  return `${hours} hours ${minutes} minutes`;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isClockedIn, totalHoursToday, totalHoursThisWeek, currentEntry } = useTime();
  const { userPTOsThisMonth, userPTOLimit, fetchRequests } = usePTO();
  const [elapsedTime, setElapsedTime] = useState<string>('');
  
  // Refresh PTO data when component mounts and becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRequests();
      }
    };

    // Initial fetch
    fetchRequests();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Remove fetchRequests from dependencies since it's stable
  
  // Update elapsed time every minute
  useEffect(() => {
    if (currentEntry) {
      const updateElapsedTime = () => {
        setElapsedTime(formatElapsedTime(currentEntry.clockIn));
      };
      
      // Update immediately
      updateElapsedTime();
      
      // Then update every minute
      const intervalId = setInterval(updateElapsedTime, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, [currentEntry]);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Track your time and request time off</p>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Current Status"
          value={isClockedIn ? "Clocked In" : "Clocked Out"}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description={isClockedIn ? "You're currently on the clock" : "You're not currently working"}
          className={isClockedIn ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-300"}
        />
        
        <StatsCard
          title="Hours Today"
          value={formatHours(totalHoursToday)}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="Total hours worked today"
        />
        
        <StatsCard
          title="Hours This Week"
          value={formatHours(totalHoursThisWeek)}
          icon={<Check className="h-4 w-4 text-muted-foreground" />}
          description="Total hours worked this week"
        />
      </div>
      
      {/* Clock In/Out Card */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
          <CardDescription>
            Clock in when you start working and clock out when you're done
          </CardDescription>
          {currentEntry && (
            <>
              <div className="mt-4 text-2xl font-bold">
                Clocked in since {new Date(currentEntry.clockIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
            </>
          )}
        </CardHeader>
        <CardContent className="flex justify-center">
          <ClockButton className="w-full max-w-xs text-lg" />
        </CardContent>
      </Card>
      
      {/* PTO Status */}
      <PTOStatus />
      
      {/* PTO Form */}
      <PTOForm />
    </div>
  );
};

export default DashboardPage;
