import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import adminApi, { ExportParams } from '@/lib/api/admin';

export interface ExportButtonProps {
  params?: ExportParams;
  disabled?: boolean;
  className?: string;
  label?: string;
  size?: 'sm' | 'default' | 'lg' | null;
  variant?: React.ComponentProps<typeof Button>['variant'];
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  params,
  disabled = false,
  className,
  label = 'Export',
  size = 'sm',
  variant = 'default',
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const { blob, filename } = await adminApi.exportTableData({ ...(params ?? {}), pagination: false });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export started');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to export data';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || loading}
      className={className}
      size={size ?? undefined}
      variant={variant}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
};

export default ExportButton;