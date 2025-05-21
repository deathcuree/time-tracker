
import React from 'react';
import { Clock, Calendar, Check, User } from 'lucide-react';
import { ClockButton } from '@/components/time/ClockButton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PTOForm } from '@/components/pto/PTOForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useTime } from '@/contexts/TimeContext';
import { usePTO } from '@/contexts/PTOContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isClockedIn, totalHoursToday, totalHoursThisWeek } = useTime();
  const { userPTOsThisMonth, userPTOLimit } = usePTO();
  
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
          value={`${totalHoursToday} hrs`}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="Total hours worked today"
        />
        
        <StatsCard
          title="Hours This Week"
          value={`${totalHoursThisWeek} hrs`}
          icon={<Check className="h-4 w-4 text-muted-foreground" />}
          description="Total hours worked this week"
        />
      </div>
      
      {/* Clock In/Out Card */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
          <CardDescription>Clock in when you start working and clock out when you're done</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <ClockButton className="w-full max-w-xs py-6 text-lg" />
        </CardContent>
      </Card>
      
      {/* PTO Status */}
      <Card>
        <CardHeader>
          <CardTitle>PTO Status</CardTitle>
          <CardDescription>Your paid time off requests and availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="text-5xl font-bold">
                {userPTOsThisMonth} <span className="text-muted-foreground">/ {userPTOLimit}</span>
              </div>
              <p className="mt-2 text-muted-foreground">PTO requests used this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* PTO Form */}
      <PTOForm />
    </div>
  );
};

export default DashboardPage;
