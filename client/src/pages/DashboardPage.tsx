import React, { useState, useEffect } from 'react';
import { TimeTrackingCard } from '@/components/dashboard/TimeTrackingCard';
import { TimeStats } from '@/components/dashboard/TimeStats';
import { PTOForm } from '@/components/pto/PTOForm';
import { PTOStatus } from '@/components/pto/PTOStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useTime } from '@/contexts/TimeContext';
import { usePTO } from '@/contexts/PTOContext';
import { formatElapsedTime } from '@/utils/timeFormatters';

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
  }, []); 
  
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
      <TimeStats
        isClockedIn={isClockedIn}
        totalHoursToday={totalHoursToday}
        totalHoursThisWeek={totalHoursThisWeek}
      />
      
      {/* Clock In/Out Card */}
      <TimeTrackingCard currentEntry={currentEntry} />
      
      {/* PTO Status */}
      <PTOStatus />
      
      {/* PTO Form */}
      <PTOForm />
    </div>
  );
};

export default DashboardPage;
