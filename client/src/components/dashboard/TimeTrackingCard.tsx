import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClockButton } from "@/components/time/ClockButton";
import { TimeEntry } from "@/types";
import { formatTimeForDisplay } from "@/utils/date";

interface TimeTrackingCardProps {
  currentEntry: TimeEntry | null;
}

export const TimeTrackingCard: React.FC<TimeTrackingCardProps> = ({
  currentEntry,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking</CardTitle>
        <CardDescription>
          Clock in when you start working and clock out when you're done
        </CardDescription>
        {currentEntry && (
          <>
            <div className="mt-4 text-2xl font-bold text-slate-800">
              Clocked in since {formatTimeForDisplay(currentEntry.clockIn)}
            </div>
          </>
        )}
      </CardHeader>
      <CardContent className="flex justify-center">
        <ClockButton className="w-full max-w-xs text-lg" />
      </CardContent>
    </Card>
  );
};
