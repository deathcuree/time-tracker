import React from 'react';
import { toast } from 'sonner';
import { AddUserForm } from '@/components/user/AddUserForm';
import { usersApi, CreateUserData, createUserSchema } from '@/lib/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function UserManagementPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'user',
      position: '',
      password: '',
    },
  });

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      setIsLoading(true);
      const user = await usersApi.createUser(data);
      toast.success(`User ${user.firstName} ${user.lastName} created successfully`);
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
      // If it's a validation error from the server, set the form error
      if (error.response?.data?.message === 'User with this email already exists') {
        form.setError('email', {
          type: 'manual',
          message: error.response.data.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <AddUserForm onSubmit={handleCreateUser} isLoading={isLoading} form={form} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 