
import React from 'react';
import { RequestList } from '@/components/pto/RequestList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  // Redirect if not an admin
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage time-off requests and user data</p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Admin Overview</CardTitle>
          <CardDescription>Review and manage employee time-off requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            As an administrator, you can view all employee time-off requests and approve or deny them.
            User management and other advanced features will be available in future updates.
          </p>
        </CardContent>
      </Card>
      
      <RequestList showUserInfo={true} />
    </div>
  );
};

export default AdminDashboardPage;
