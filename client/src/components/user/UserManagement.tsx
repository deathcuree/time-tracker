import React, { useState } from 'react';
import { AddUserForm } from './AddUserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const UserManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async (data: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call to create user
      console.log('Creating user:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('User created successfully');
    } catch (error) {
      toast.error('Failed to create user');
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Create new users and manage their roles</CardDescription>
      </CardHeader>
      <CardContent>
        <AddUserForm onSubmit={handleCreateUser} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}; 