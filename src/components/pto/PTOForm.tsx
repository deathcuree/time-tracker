
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { usePTO } from '@/contexts/PTOContext';
import { toast } from '@/components/ui/sonner';

interface PTOFormProps {
  onRequestSubmitted?: () => void;
}

export const PTOForm: React.FC<PTOFormProps> = ({ onRequestSubmitted }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createRequest, canRequestPTO, userPTOsThisMonth, userPTOLimit } = usePTO();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for your PTO request');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createRequest(startDate, endDate, reason);
      
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (error) {
      console.error('Error submitting PTO request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Time Off</CardTitle>
        <CardDescription>
          Submit your PTO request for approval 
          ({userPTOsThisMonth} of {userPTOLimit} requests used this month)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date < new Date() || (endDate ? date > endDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => 
                      date < new Date() || (startDate ? date < startDate : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Reason</label>
            <Textarea
              placeholder="Provide details about your time off request"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={isSubmitting || !canRequestPTO}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </CardFooter>
    </Card>
  );
};
