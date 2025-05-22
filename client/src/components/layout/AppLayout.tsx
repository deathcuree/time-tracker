import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Clock, Calendar, User, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
}

export const AppLayout = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
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
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="w-72 flex-shrink-0 bg-sidebar-background border-r border-sidebar-border">
          <SidebarContent className="flex flex-col h-full">
            <div className="p-6 border-b border-sidebar-border">
              <h1 className="text-2xl font-semibold text-sidebar-foreground">
                TimeTracker
              </h1>
            </div>
            
            <div className="px-4 py-4">
              <div className="mb-6 px-4 py-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-sidebar-muted">Signed in as</p>
                <p className="font-medium text-sidebar-foreground text-base mt-1">{user?.name}</p>
                <p className="text-xs text-sidebar-muted mt-1">{user?.role}</p>
              </div>
            </div>
            
            <SidebarMenu className="flex-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path} className="px-4 mb-1">
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path}
                      className={({ isActive }) => cn(
                        "transition-colors duration-200 p-3 flex items-center rounded-md",
                        isActive 
                          ? "bg-white/10 text-sidebar-foreground" 
                          : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5"
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="text-base font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
            <div className="p-4 border-t border-sidebar-border space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-3 h-auto text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-5 w-5" />
                    <span className="text-base">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-5 w-5" />
                    <span className="text-base">Dark Mode</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start p-3 h-auto text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={logout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                <span className="text-base">Logout</span>
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 bg-background border-b border-border backdrop-blur-sm bg-background/80 supports-[backdrop-filter]:bg-background/60">
            <div className="h-16 px-6 flex items-center max-w-screen-2xl w-full">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground lg:hidden" />
              <h2 className="text-lg font-semibold ml-4 text-foreground">Time Tracker App</h2>
            </div>
          </header>
          
          <main className="flex-1 w-full">
            <div className="px-6 py-8 w-full max-w-screen-2xl mx-auto">
              <Outlet />
            </div>
          </main>
          
          <footer className="border-t border-border bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <div className="py-4 px-6 text-center text-sm text-muted-foreground max-w-screen-2xl mx-auto">
              Time Tracker App &copy; {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};
