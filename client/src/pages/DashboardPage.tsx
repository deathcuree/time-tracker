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
  const { fetchRequests } = usePTO();
  const [, setElapsedTime] = useState<string>('');
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRequests();
      }
    };

    fetchRequests();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); 
  
  useEffect(() => {
    if (currentEntry) {
      const updateElapsedTime = () => {
        setElapsedTime(formatElapsedTime(currentEntry.clockIn));
      };
      
      updateElapsedTime();
      
      const intervalId = setInterval(updateElapsedTime, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, [currentEntry]);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Welcome, {user?.name}</h1>
        <p className="text-slate-600">Track your time and request time off</p>
      </div>
      
      <TimeStats
        isClockedIn={isClockedIn}
        totalHoursToday={totalHoursToday}
        totalHoursThisWeek={totalHoursThisWeek}
      />
      
      <TimeTrackingCard currentEntry={currentEntry} />
      
      <PTOStatus />
      
      <PTOForm />
    </div>
  );
};

export default DashboardPage;
