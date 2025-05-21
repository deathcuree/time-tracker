
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle } from 'lucide-react';
import { useTime } from '@/contexts/TimeContext';
import { format } from 'date-fns';

interface ClockButtonProps {
  className?: string;
}

export const ClockButton: React.FC<ClockButtonProps> = ({ className }) => {
  const { isClockedIn, clockIn, clockOut, currentEntry } = useTime();
  
  // Format the clock-in time if available
  const clockInTime = currentEntry?.clockIn 
    ? format(new Date(currentEntry.clockIn), 'h:mm a')
    : '';
  
  return isClockedIn ? (
    <Button
      onClick={clockOut}
      variant="outline"
      className={`border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 ${className}`}
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      Clock Out <span className="ml-2 text-xs opacity-70">(In since {clockInTime})</span>
    </Button>
  ) : (
    <Button 
      onClick={clockIn} 
      variant="default"
      className={`${className}`}
    >
      <Clock className="mr-2 h-4 w-4" />
      Clock In
    </Button>
  );
};
