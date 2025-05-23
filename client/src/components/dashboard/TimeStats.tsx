import React from 'react';
import { Clock, Calendar, Check } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { formatHours } from '@/utils/timeFormatters';

interface TimeStatsProps {
  isClockedIn: boolean;
  totalHoursToday: number;
  totalHoursThisWeek: number;
}

export const TimeStats: React.FC<TimeStatsProps> = ({
  isClockedIn,
  totalHoursToday,
  totalHoursThisWeek,
}) => {
  return (
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
  );
}; 