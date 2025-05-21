
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TimeProvider } from "./contexts/TimeContext";
import { PTOProvider } from "./contexts/PTOContext";
import { AppLayout } from "./components/layout/AppLayout";

// Pages
import DashboardPage from "./pages/DashboardPage";
import TimeHistoryPage from "./pages/TimeHistoryPage";
import PTORequestsPage from "./pages/PTORequestsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";

const App = () => (
  <AuthProvider>
    <TimeProvider>
      <PTOProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/time-history" element={<TimeHistoryPage />} />
                <Route path="/pto-requests" element={<PTORequestsPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PTOProvider>
    </TimeProvider>
  </AuthProvider>
);

export default App;
