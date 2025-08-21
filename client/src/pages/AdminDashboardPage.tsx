import React from 'react';
import { RequestList } from '@/components/pto/RequestList';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Admin Approve PTO</h1>
        <p className="text-slate-600">Review and manage va's time-off requests</p>
      </div>
      
      <RequestList showUserInfo={true} />
    </div>
  );
};

export default AdminDashboardPage;
