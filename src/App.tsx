import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getRoleDashboard } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import InstallPrompt from "@/components/shared/InstallPrompt";

const Login = lazy(() => import("@/pages/auth/Login"));
const BlockedComplaint = lazy(() => import("@/pages/auth/BlockedComplaint"));
const MRDashboard = lazy(() => import("@/pages/mr/Dashboard"));
const NewReport = lazy(() => import("@/pages/mr/NewReport"));
const ReportHistory = lazy(() => import("@/pages/mr/ReportHistory"));
const ReportDetail = lazy(() => import("@/pages/mr/ReportDetail"));
const MasterList = lazy(() => import("@/pages/mr/MasterList"));
const MRLeave = lazy(() => import("@/pages/mr/Leave"));
const MRExpense = lazy(() => import("@/pages/mr/Expense"));
const MRTourProgram = lazy(() => import("@/pages/mr/TourProgram"));
const ManagerDashboard = lazy(() => import("@/pages/manager/Dashboard"));
const ManagerReports = lazy(() => import("@/pages/manager/Reports"));
const ManagerAnalytics = lazy(() => import("@/pages/manager/Analytics"));
const UnlockRequests = lazy(() => import("@/pages/manager/UnlockRequests"));
const ManagerTargets = lazy(() => import("@/pages/manager/Targets"));
const ManagerLeaves = lazy(() => import("@/pages/manager/Leaves"));
const ManagerSelfLeave = lazy(() => import("@/pages/manager/ManagerSelfLeave"));
const TeamVisitFrequency = lazy(() => import("@/pages/manager/TeamVisitFrequency"));
const MRVisitFrequency = lazy(() => import("@/pages/mr/VisitFrequency"));
const ManagerHolidays = lazy(() => import("@/pages/manager/Holidays"));
const ManagerTerritories = lazy(() => import("@/pages/manager/ManagerTerritories"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminDoctors = lazy(() => import("@/pages/admin/Doctors"));
const AdminAreas = lazy(() => import("@/pages/admin/Areas"));
const AdminMRAccess = lazy(() => import("@/pages/admin/MRAccess"));
const AdminTargets = lazy(() => import("@/pages/admin/Targets"));
const AdminHolidays = lazy(() => import("@/pages/admin/Holidays"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ProfilePage = lazy(() => import("@/pages/profile/Profile"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
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
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <HashRouter>
          <InstallPrompt />
          <Suspense fallback={<PageLoader />}>
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
            <Route path="/mr/visit-frequency" element={<ProtectedRoute allowedRoles={['mr']}><MRVisitFrequency /></ProtectedRoute>} />
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
            <Route path="/manager/my-leave" element={<ProtectedRoute allowedRoles={['manager']}><ManagerSelfLeave /></ProtectedRoute>} />
            <Route path="/manager/team/visit-frequency" element={<ProtectedRoute allowedRoles={['manager']}><TeamVisitFrequency /></ProtectedRoute>} />
            <Route path="/manager/holidays" element={<ProtectedRoute allowedRoles={['manager']}><ManagerHolidays /></ProtectedRoute>} />
            <Route path="/manager/territories" element={<ProtectedRoute allowedRoles={['manager']}><ManagerTerritories /></ProtectedRoute>} />
            <Route path="/manager/report/history" element={<ProtectedRoute allowedRoles={['manager']}><ReportHistory /></ProtectedRoute>} />
            <Route path="/manager/report/new" element={<ProtectedRoute allowedRoles={['manager']}><NewReport /></ProtectedRoute>} />
            <Route path="/manager/report/:id" element={<ProtectedRoute allowedRoles={['manager']}><ReportDetail /></ProtectedRoute>} />
            <Route path="/manager/expense" element={<ProtectedRoute allowedRoles={['manager']}><MRExpense /></ProtectedRoute>} />
            <Route path="/manager/tour-program" element={<ProtectedRoute allowedRoles={['manager']}><MRTourProgram /></ProtectedRoute>} />

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
          </Suspense>
          </HashRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
