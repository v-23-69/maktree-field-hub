import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getRoleDashboard } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

import Login from "@/pages/auth/Login";
import MRDashboard from "@/pages/mr/Dashboard";
import NewReport from "@/pages/mr/NewReport";
import ReportHistory from "@/pages/mr/ReportHistory";
import ReportDetail from "@/pages/mr/ReportDetail";
import ManagerDashboard from "@/pages/manager/Dashboard";
import ManagerReports from "@/pages/manager/Reports";
import ManagerAnalytics from "@/pages/manager/Analytics";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminDoctors from "@/pages/admin/Doctors";
import AdminAreas from "@/pages/admin/Areas";
import AdminMRAccess from "@/pages/admin/MRAccess";
import NotFound from "@/pages/NotFound";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** Avoid refetching on every mount/focus during navigation (faster perceived load). */
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RootRedirect() {
  const { user, isAuthenticated, authReady } = useAuth();
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleDashboard(user.role)} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />

            {/* MR Routes */}
            <Route path="/mr/dashboard" element={<ProtectedRoute allowedRoles={['mr']}><MRDashboard /></ProtectedRoute>} />
            <Route path="/mr/report/new" element={<ProtectedRoute allowedRoles={['mr']}><NewReport /></ProtectedRoute>} />
            <Route path="/mr/report/history" element={<ProtectedRoute allowedRoles={['mr']}><ReportHistory /></ProtectedRoute>} />
            <Route path="/mr/report/:id" element={<ProtectedRoute allowedRoles={['mr']}><ReportDetail /></ProtectedRoute>} />

            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/manager/reports" element={<ProtectedRoute allowedRoles={['manager']}><ManagerReports /></ProtectedRoute>} />
            <Route path="/manager/analytics" element={<ProtectedRoute allowedRoles={['manager']}><ManagerAnalytics /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDoctors /></ProtectedRoute>} />
            <Route path="/admin/areas" element={<ProtectedRoute allowedRoles={['admin']}><AdminAreas /></ProtectedRoute>} />
            <Route path="/admin/mr-access" element={<ProtectedRoute allowedRoles={['admin']}><AdminMRAccess /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
