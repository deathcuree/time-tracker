import React, { memo } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Clock, Calendar, User, LogOut, Settings, Sun, Moon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
}

const NavItem = memo(({ item }: { item: MenuItem }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  
  return (
    <SidebarMenuItem className="px-4 mb-1">
      <SidebarMenuButton asChild>
        <NavLink 
          to={item.path}
          className={cn(
            "transition-colors duration-200 p-3 flex items-center rounded-md w-full",
            isActive 
              ? "bg-primary/90 text-primary-foreground font-semibold shadow-sm ring-1 ring-primary/20" 
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5"
          )}
        >
          <item.icon className="w-5 h-5 mr-3" />
          <span className="text-base font-medium">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

NavItem.displayName = 'NavItem';

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
    { title: 'Dashboard', path: '/dashboard', icon: Clock },
    { title: 'Time History', path: '/time-history', icon: Calendar },
    { title: 'PTO Requests', path: '/pto-requests', icon: User },
    { title: 'Account', path: '/account', icon: Settings },
  ];
  
  const adminMenuItems: MenuItem[] = [
    { title: 'Admin Dashboard', path: '/admin', icon: Settings },
    { title: 'User Management', path: '/admin/users', icon: Users },
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
                <NavItem key={item.path} item={item} />
              ))}
            </SidebarMenu>
            
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-sidebar-muted hover:text-sidebar-foreground"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="text-sidebar-muted hover:text-sidebar-foreground"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-8 px-4">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
