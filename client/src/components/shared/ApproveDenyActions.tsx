import React from 'react';
import { Button } from '@/components/ui/button';

export type SimpleStatus = 'pending' | 'approved' | 'denied';

export interface ApproveDenyActionsProps {
  status: SimpleStatus;
  onApprove: () => void;
  onDeny: () => void;
  size?: 'sm' | 'default' | 'lg' | null;
  approvedText?: string;
  deniedText?: string;
  approveLabel?: string;
  denyLabel?: string;
  className?: string;
}

export const ApproveDenyActions: React.FC<ApproveDenyActionsProps> = ({
  status,
  onApprove,
  onDeny,
  size = 'sm',
  approvedText = 'Approved',
  deniedText = 'Denied',
  approveLabel = 'Approve',
  denyLabel = 'Deny',
  className,
}) => {
  if (status !== 'pending') {
    return (
      <span className={`text-sm text-muted-foreground ${className ?? ''}`}>
        {status === 'approved' ? approvedText : deniedText}
      </span>
    );
  }

  return (
    <div className={`flex space-x-2 ${className ?? ''}`}>
      <Button
        variant="outline"
        size={size ?? undefined}
        className="border-green-500 text-green-500 hover:bg-green-50"
        onClick={onApprove}
      >
        {approveLabel}
      </Button>
      <Button
        variant="outline"
        size={size ?? undefined}
        className="border-red-500 text-red-500 hover:bg-red-50"
        onClick={onDeny}
      >
        {denyLabel}
      </Button>
    </div>
  );
};