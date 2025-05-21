
import React from 'react';
import { PTOForm } from '@/components/pto/PTOForm';
import { RequestList } from '@/components/pto/RequestList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PTORequestsPage: React.FC = () => {
  const [refresh, setRefresh] = React.useState(0);
  
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PTO Requests</h1>
        <p className="text-muted-foreground">View and manage your time off requests</p>
      </div>
      
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="create">Create Request</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="pt-4">
          <RequestList key={`requests-${refresh}`} />
        </TabsContent>
        <TabsContent value="create" className="pt-4">
          <PTOForm onRequestSubmitted={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PTORequestsPage;
