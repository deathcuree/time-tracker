import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminTimeLogsTable from '@/components/admin/AdminTimeLogsTable';

const AdminTimeLogsPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Time Logs</h1>
        <p className="text-muted-foreground">
          Review all users' time entries with search, status, and monthly filters
        </p>
      </div>

      <AdminTimeLogsTable />
    </div>
  );
};

export default AdminTimeLogsPage;