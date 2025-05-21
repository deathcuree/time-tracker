
import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Clock, Calendar, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
}

export const AppLayout = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  
  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const commonMenuItems: MenuItem[] = [
    { title: 'Dashboard', path: '/', icon: Clock },
    { title: 'Time History', path: '/time-history', icon: Calendar },
    { title: 'PTO Requests', path: '/pto-requests', icon: User },
  ];
  
  const adminMenuItems: MenuItem[] = [
    { title: 'Admin Dashboard', path: '/admin', icon: Settings },
  ];
  
  const menuItems = user?.role === 'admin' 
    ? [...commonMenuItems, ...adminMenuItems] 
    : commonMenuItems;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <h1 className="text-xl font-semibold text-white">TimeTracker</h1>
            </div>
            
            <div className="px-3 py-2">
              <div className="mb-4 px-4 py-3 rounded-md bg-sidebar-accent/20">
                <p className="text-sm text-sidebar-foreground/80">Signed in as</p>
                <p className="font-medium text-sidebar-foreground">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/70">{user?.role}</p>
              </div>
            </div>
            
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path}
                      className={({ isActive }) => 
                        isActive ? "text-sidebar-accent font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      }
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            <div className="mt-auto p-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-white hover:text-white hover:bg-red-500/20 border-red-500/30"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h2 className="text-lg font-semibold ml-2">Time Tracker App</h2>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
          
          <footer className="bg-white dark:bg-gray-800 border-t py-4 px-6 text-center text-sm text-gray-500">
            Time Tracker App &copy; {new Date().getFullYear()}
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};
