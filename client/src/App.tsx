import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TimeProvider } from "./contexts/TimeContext";
import { PTOProvider } from "./contexts/PTOContext";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminRoute } from "./components/auth/AdminRoute";
import './App.css';

import DashboardPage from "./pages/DashboardPage";
import TimeHistoryPage from "./pages/TimeHistoryPage";
import PTORequestsPage from "./pages/PTORequestsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import AccountPage from "./pages/AccountPage";
import { LoadingScreen } from "./components/ui/loading";

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
      />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/time-history" element={<TimeHistoryPage />} />
        <Route path="/pto-requests" element={<PTORequestsPage />} />
        <Route path="/account" element={<AccountPage />} />
        
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
      </Route>
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <TimeProvider>
        <PTOProvider>
          <TooltipProvider>
            <Toaster 
              position="top-right"
              expand={true}
              richColors={true}
            />
            <Router>
              <AppRoutes />
            </Router>
          </TooltipProvider>
        </PTOProvider>
      </TimeProvider>
    </AuthProvider>
  );
};

export default App;
