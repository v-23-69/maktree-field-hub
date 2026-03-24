import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getRoleDashboard } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

import Login from "@/pages/auth/Login";
import BlockedComplaint from "@/pages/auth/BlockedComplaint";
import MRDashboard from "@/pages/mr/Dashboard";
import NewReport from "@/pages/mr/NewReport";
import ReportHistory from "@/pages/mr/ReportHistory";
import ReportDetail from "@/pages/mr/ReportDetail";
import MasterList from "@/pages/mr/MasterList";
import MRLeave from "@/pages/mr/Leave";
import MRExpense from "@/pages/mr/Expense";
import MRTourProgram from "@/pages/mr/TourProgram";
import ManagerDashboard from "@/pages/manager/Dashboard";
import ManagerReports from "@/pages/manager/Reports";
import ManagerAnalytics from "@/pages/manager/Analytics";
import UnlockRequests from "@/pages/manager/UnlockRequests";
import ManagerTargets from "@/pages/manager/Targets";
import ManagerLeaves from "@/pages/manager/Leaves";
import ManagerHolidays from "@/pages/manager/Holidays";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminDoctors from "@/pages/admin/Doctors";
import AdminAreas from "@/pages/admin/Areas";
import AdminMRAccess from "@/pages/admin/MRAccess";
import AdminTargets from "@/pages/admin/Targets";
import AdminHolidays from "@/pages/admin/Holidays";
import NotFound from "@/pages/NotFound";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ProfilePage from "@/pages/profile/Profile";

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
            <Route path="/blocked-complaint" element={<BlockedComplaint />} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['mr', 'manager', 'admin']}><ProfilePage /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><ProfilePage /></ProtectedRoute>} />

            {/* MR Routes */}
            <Route path="/mr/dashboard" element={<ProtectedRoute allowedRoles={['mr']}><MRDashboard /></ProtectedRoute>} />
            <Route path="/mr/report/new" element={<ProtectedRoute allowedRoles={['mr']}><NewReport /></ProtectedRoute>} />
            <Route path="/mr/master-list" element={<ProtectedRoute allowedRoles={['mr']}><MasterList /></ProtectedRoute>} />
            <Route path="/mr/leave" element={<ProtectedRoute allowedRoles={['mr']}><MRLeave /></ProtectedRoute>} />
            <Route path="/mr/expense" element={<ProtectedRoute allowedRoles={['mr']}><MRExpense /></ProtectedRoute>} />
            <Route path="/mr/tour-program" element={<ProtectedRoute allowedRoles={['mr']}><MRTourProgram /></ProtectedRoute>} />
            <Route path="/mr/report/history" element={<ProtectedRoute allowedRoles={['mr']}><ReportHistory /></ProtectedRoute>} />
            <Route path="/mr/report/:id" element={<ProtectedRoute allowedRoles={['mr']}><ReportDetail /></ProtectedRoute>} />

            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/manager/reports" element={<ProtectedRoute allowedRoles={['manager']}><ManagerReports /></ProtectedRoute>} />
            <Route path="/manager/requests" element={<ProtectedRoute allowedRoles={['manager']}><UnlockRequests /></ProtectedRoute>} />
            <Route path="/manager/targets" element={<ProtectedRoute allowedRoles={['manager']}><ManagerTargets /></ProtectedRoute>} />
            <Route path="/manager/analytics" element={<ProtectedRoute allowedRoles={['manager']}><ManagerAnalytics /></ProtectedRoute>} />
            <Route path="/manager/leaves" element={<ProtectedRoute allowedRoles={['manager']}><ManagerLeaves /></ProtectedRoute>} />
            <Route path="/manager/holidays" element={<ProtectedRoute allowedRoles={['manager']}><ManagerHolidays /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDoctors /></ProtectedRoute>} />
            <Route path="/admin/areas" element={<ProtectedRoute allowedRoles={['admin']}><AdminAreas /></ProtectedRoute>} />
            <Route path="/admin/mr-access" element={<ProtectedRoute allowedRoles={['admin']}><AdminMRAccess /></ProtectedRoute>} />
            <Route path="/admin/targets" element={<ProtectedRoute allowedRoles={['admin']}><AdminTargets /></ProtectedRoute>} />
            <Route path="/admin/holidays" element={<ProtectedRoute allowedRoles={['admin']}><AdminHolidays /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
