
import React from 'react';
import { TimeHistoryTable } from '@/components/time/TimeHistoryTable';

const TimeHistoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Time History</h1>
        <p className="text-muted-foreground">View your time entries history</p>
      </div>
      
      <TimeHistoryTable />
    </div>
  );
};

export default TimeHistoryPage;
