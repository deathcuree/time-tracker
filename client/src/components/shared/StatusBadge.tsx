import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusBadgeMap = Record<string, string>;

export interface StatusBadgeProps {
  status: string;
  className?: string;
  map?: StatusBadgeMap;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  map,
  label,
}) => {
  const defaultMap: StatusBadgeMap = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    default: 'bg-gray-100 text-gray-800',
  };

  const classes = (map ?? defaultMap)[status] ?? (map ?? defaultMap).default;

  const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Badge className={cn(classes, className)}>{label ?? toTitle(status)}</Badge>
  );
};