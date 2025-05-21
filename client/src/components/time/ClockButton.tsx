import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle } from 'lucide-react';
import { useTime } from '@/contexts/TimeContext';

interface ClockButtonProps {
  className?: string;
}

export const ClockButton: React.FC<ClockButtonProps> = ({ className }) => {
  const { isClockedIn, clockIn, clockOut } = useTime();
  
  return isClockedIn ? (
    <Button
      onClick={clockOut}
      variant="outline"
      className={`border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 ${className}`}
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      Clock Out
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
