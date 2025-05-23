import React from 'react';
import { RequestList } from '@/components/pto/RequestList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
          <p className="text-sm mb-4">
            As an administrator, you can view all employee time-off requests and approve or deny them.
            Visit the User Management page to create and manage user accounts.
          </p>
          <Button asChild>
            <Link to="/admin/users">Go to User Management</Link>
          </Button>
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Time-Off Requests</h2>
        <RequestList showUserInfo={true} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
