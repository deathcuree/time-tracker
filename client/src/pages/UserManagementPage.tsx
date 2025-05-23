import React from 'react';
import { UserManagement } from '@/components/user/UserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  
  // Redirect if not an admin
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Create and manage user accounts</p>
      </div>

      <UserManagement />
    </div>
  );
};

export default UserManagementPage; 