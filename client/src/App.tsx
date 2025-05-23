import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TimeProvider } from "./contexts/TimeContext";
import { PTOProvider } from "./contexts/PTOContext";
import { AppLayout } from "./components/layout/AppLayout";
import './App.css';

// Pages
import DashboardPage from "./pages/DashboardPage";
import TimeHistoryPage from "./pages/TimeHistoryPage";
import PTORequestsPage from "./pages/PTORequestsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import AccountPage from "./pages/AccountPage";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} 
      />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/time-history" element={<TimeHistoryPage />} />
        <Route path="/pto-requests" element={<PTORequestsPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/account" element={<AccountPage />} />
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
            <Sonner 
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
