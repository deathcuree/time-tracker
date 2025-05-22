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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PTOFormProps {
  onRequestSubmitted?: () => void;
}

export const PTOForm: React.FC<PTOFormProps> = ({ onRequestSubmitted }) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hours, setHours] = useState<number>(8);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createRequest, canRequestPTO, userPTOsThisMonth } = usePTO();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for your PTO request');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createRequest(date, hours, reason);
      
      // Reset form
      setDate(undefined);
      setHours(8);
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
          Submit your PTO request for approval. You have 16 hours of PTO available per month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Hours</label>
              <Select value={hours.toString()} onValueChange={(value) => setHours(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hours" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h} hour{h > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
