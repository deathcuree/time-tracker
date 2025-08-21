import React, { memo } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Clock, Calendar, User, LogOut, Settings, Sun, Moon, Users, Menu, ClipboardCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingScreen } from '@/components/ui/loading';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
}

const NavItem = memo(({ item }: { item: MenuItem }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  
  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:px-4 px-4 mb-3">
      <SidebarMenuButton asChild tooltip={item.title}>
        <NavLink 
          to={item.path}
          className={cn(
            "transition-colors duration-200 flex items-center rounded-md w-full",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-10",
            "p-3",
            isActive 
              ? "bg-primary/90 text-primary-foreground font-semibold shadow-sm ring-1 ring-primary/20" 
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5"
          )}
        >
          <item.icon className={cn(
            "w-5 h-5",
            "group-data-[collapsible=icon]:mr-0",
            "mr-3"
          )} />
          <span className="text-base font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

NavItem.displayName = 'NavItem';

export const AppLayout = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const userMenuItems: MenuItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: Clock },
    { title: 'Time History', path: '/time-history', icon: Calendar },
    { title: 'PTO Requests', path: '/pto-requests', icon: User },
  ];

  const accountMenuItem: MenuItem = { title: 'Account Settings', path: '/account', icon: Settings };
  
  const adminMenuItems: MenuItem[] = [
    { title: 'Approve PTO', path: '/admin', icon: ClipboardCheck },
    { title: 'Time Logs', path: '/admin/time-logs', icon: History },
    { title: 'Create User', path: '/admin/users', icon: Users },
  ];
  
  const menuItems = user?.role === 'admin'
    ? [...adminMenuItems, accountMenuItem]
    : [...userMenuItems, accountMenuItem];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#f8f9fb]">
        <Sidebar 
          className={cn(
            "flex-shrink-0 bg-sidebar-background border-r border-sidebar-border transition-[width]",
            "group-data-[collapsible=icon]:w-16",
            "w-72"
          )}
          collapsible="icon"
        >
          <SidebarContent className="flex flex-col h-full">
            <div className={cn(
              "border-b border-sidebar-border transition-[padding]",
              "group-data-[collapsible=icon]:p-4 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center",
              "p-6"
            )}>
              <h1 className={cn(
                "font-semibold text-sidebar-foreground transition-[font-size]",
                "group-data-[collapsible=icon]:text-lg",
                "text-2xl"
              )}>
                <span className="group-data-[collapsible=icon]:hidden">TimeTracker</span>
                <span className="hidden group-data-[collapsible=icon]:inline">TT</span>
              </h1>
            </div>
            
            <div className="px-4 py-4 group-data-[collapsible=icon]:hidden">
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
            
            <div className={cn(
              "border-t border-sidebar-border transition-[padding]",
              "group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4",
              "p-4"
            )}>
              <div className={cn(
                "flex items-center transition-[justify-content]",
                "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-2",
                "justify-between"
              )}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-sidebar-muted hover:text-sidebar-foreground"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="text-sidebar-muted hover:text-sidebar-foreground"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-0 bg-white border-b border-slate-200 shadow-sm px-4 py-3">
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
              <div className="flex items-center gap-3">
                <SidebarTrigger>
                  <Button variant="ghost" size="icon" className="hover:bg-accent">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SidebarTrigger>
                <h1 className="text-xl font-semibold text-slate-800">TimeTracker</h1>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 hidden md:block">
                  {user?.name} • {user?.role}
                </span>
              </div>
            </div>
          </div>
          
          <div className="max-w-screen-2xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
