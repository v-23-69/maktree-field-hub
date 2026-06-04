import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getRoleDashboard } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import InstallPrompt from "@/components/shared/InstallPrompt";
import ProfileCompletionPrompt from "@/components/shared/ProfileCompletionPrompt";
import EmployeeBirthdayProvider from "@/components/shared/employee-birthday/EmployeeBirthdayProvider";
import NotificationProvider from "@/components/shared/NotificationProvider";
import type { UserRole } from "@/types/database.types";

function AppRoute({
  scope,
  allowedRoles,
  children,
}: {
  scope: string;
  allowedRoles?: UserRole[];
  children: ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles} scope={scope}>
      {children}
    </ProtectedRoute>
  );
}

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
const ManagerHistory = lazy(() => import("@/pages/manager/ManagerHistory"));
const ManagerLateDcrGrant = lazy(() => import("@/pages/manager/ManagerLateDcrGrant"));
const ManagerBackup = lazy(() => import("@/pages/manager/ManagerBackup"));
const UnlockRequests = lazy(() => import("@/pages/manager/UnlockRequests"));
const ManagerTargets = lazy(() => import("@/pages/manager/Targets"));
const ManagerLeaves = lazy(() => import("@/pages/manager/Leaves"));
const ManagerSelfLeave = lazy(() => import("@/pages/manager/ManagerSelfLeave"));
const TeamVisitFrequency = lazy(() => import("@/pages/manager/TeamVisitFrequency"));
const MRAnalytics = lazy(() => import("@/pages/mr/Analytics"));
const MRVisitFrequency = lazy(() => import("@/pages/mr/VisitFrequency"));
const ManagerHolidays = lazy(() => import("@/pages/manager/Holidays"));
const ManagerTerritories = lazy(() => import("@/pages/manager/ManagerTerritories"));
const ManagerTeamHub = lazy(() => import("@/pages/manager/TeamHub"));
const ManagerTeamMrDetail = lazy(() => import("@/pages/manager/TeamMrDetail"));
const ManagerDcrImport = lazy(() => import("@/pages/manager/ManagerDcrImport"));
const ManagerTerritoryAreas = lazy(() => import("@/pages/manager/ManagerTerritoryAreas"));
const ManagerVacantAreas = lazy(() => import("@/pages/manager/ManagerVacantAreas"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminDoctors = lazy(() => import("@/pages/admin/Doctors"));
const AdminAreas = lazy(() => import("@/pages/admin/Areas"));
const AdminMRAccess = lazy(() => import("@/pages/admin/MRAccess"));
const AdminTargets = lazy(() => import("@/pages/admin/Targets"));
const AdminHolidays = lazy(() => import("@/pages/admin/Holidays"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ProfilePage = lazy(() => import("@/pages/profile/Profile"));
const ContactSupport = lazy(() => import("@/pages/profile/ContactSupport"));

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
          <EmployeeBirthdayProvider>
          <NotificationProvider>
          <InstallPrompt />
          <ProfileCompletionPrompt />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/blocked-complaint" element={<BlockedComplaint />} />
            <Route path="/profile" element={<AppRoute scope="profile" allowedRoles={['mr', 'manager', 'admin']}><ProfilePage /></AppRoute>} />
            <Route path="/profile/support" element={<AppRoute scope="profile-support" allowedRoles={['mr', 'manager']}><ContactSupport /></AppRoute>} />
            <Route path="/profile/:userId" element={<AppRoute scope="profile-view" allowedRoles={['manager', 'admin']}><ProfilePage /></AppRoute>} />

            {/* MR Routes */}
            <Route path="/mr/dashboard" element={<AppRoute scope="mr-dashboard" allowedRoles={['mr']}><MRDashboard /></AppRoute>} />
            <Route path="/mr/report/new" element={<AppRoute scope="mr-report-new" allowedRoles={['mr']}><NewReport /></AppRoute>} />
            <Route path="/mr/master-list" element={<AppRoute scope="mr-master-list" allowedRoles={['mr']}><MasterList /></AppRoute>} />
            <Route path="/mr/analytics" element={<AppRoute scope="mr-analytics" allowedRoles={['mr']}><MRAnalytics /></AppRoute>} />
            <Route path="/mr/visit-frequency" element={<AppRoute scope="mr-visit-frequency" allowedRoles={['mr']}><MRVisitFrequency /></AppRoute>} />
            <Route path="/mr/leave" element={<AppRoute scope="mr-leave" allowedRoles={['mr']}><MRLeave /></AppRoute>} />
            <Route path="/mr/expense" element={<AppRoute scope="mr-expense" allowedRoles={['mr']}><MRExpense /></AppRoute>} />
            <Route path="/mr/tour-program" element={<AppRoute scope="mr-tour-program" allowedRoles={['mr']}><MRTourProgram /></AppRoute>} />
            <Route path="/mr/report/history" element={<AppRoute scope="mr-report-history" allowedRoles={['mr']}><ReportHistory /></AppRoute>} />
            <Route path="/mr/report/:id" element={<AppRoute scope="mr-report-detail" allowedRoles={['mr']}><ReportDetail /></AppRoute>} />

            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<AppRoute scope="manager-dashboard" allowedRoles={['manager']}><ManagerDashboard /></AppRoute>} />
            <Route path="/manager/reports" element={<AppRoute scope="manager-reports" allowedRoles={['manager']}><ManagerReports /></AppRoute>} />
            <Route path="/manager/requests" element={<AppRoute scope="manager-requests" allowedRoles={['manager']}><UnlockRequests /></AppRoute>} />
            <Route path="/manager/targets" element={<AppRoute scope="manager-targets" allowedRoles={['manager']}><ManagerTargets /></AppRoute>} />
            <Route path="/manager/analytics" element={<AppRoute scope="manager-analytics" allowedRoles={['manager']}><ManagerAnalytics /></AppRoute>} />
            <Route path="/manager/leaves" element={<AppRoute scope="manager-leaves" allowedRoles={['manager']}><ManagerLeaves /></AppRoute>} />
            <Route path="/manager/my-leave" element={<AppRoute scope="manager-my-leave" allowedRoles={['manager']}><ManagerSelfLeave /></AppRoute>} />
            <Route path="/manager/team/visit-frequency" element={<AppRoute scope="manager-team-visit-frequency" allowedRoles={['manager']}><TeamVisitFrequency /></AppRoute>} />
            <Route path="/manager/holidays" element={<AppRoute scope="manager-holidays" allowedRoles={['manager']}><ManagerHolidays /></AppRoute>} />
            <Route path="/manager/territories" element={<AppRoute scope="manager-territories" allowedRoles={['manager']}><ManagerTerritories /></AppRoute>} />
            <Route path="/manager/vacant-areas" element={<AppRoute scope="manager-vacant-areas-list" allowedRoles={['manager']}><ManagerVacantAreas /></AppRoute>} />
            <Route path="/manager/vacant-areas/:areaId" element={<AppRoute scope="manager-vacant-areas" allowedRoles={['manager']}><ManagerTerritoryAreas /></AppRoute>} />
            <Route path="/manager/team" element={<AppRoute scope="manager-team" allowedRoles={['manager']}><ManagerTeamHub /></AppRoute>} />
            <Route path="/manager/team/:mrId" element={<AppRoute scope="manager-team-mr" allowedRoles={['manager']}><ManagerTeamMrDetail /></AppRoute>} />
            <Route path="/manager/history" element={<AppRoute scope="manager-history" allowedRoles={['manager']}><ManagerHistory /></AppRoute>} />
            <Route path="/manager/late-dcr-grant" element={<AppRoute scope="manager-late-dcr-grant" allowedRoles={['manager']}><ManagerLateDcrGrant /></AppRoute>} />
            <Route path="/manager/backup" element={<AppRoute scope="manager-backup" allowedRoles={['manager']}><ManagerBackup /></AppRoute>} />
            <Route path="/manager/report/history" element={<Navigate to="/manager/history" replace />} />
            <Route path="/manager/report/new" element={<AppRoute scope="manager-report-new" allowedRoles={['manager']}><NewReport /></AppRoute>} />
            <Route path="/manager/dcr-import/:importId" element={<AppRoute scope="manager-dcr-import" allowedRoles={['manager']}><ManagerDcrImport /></AppRoute>} />
            <Route path="/manager/report/:id" element={<AppRoute scope="manager-report-detail" allowedRoles={['manager']}><ReportDetail /></AppRoute>} />
            <Route path="/manager/expense" element={<AppRoute scope="manager-expense" allowedRoles={['manager']}><MRExpense /></AppRoute>} />
            <Route path="/manager/tour-program" element={<AppRoute scope="manager-tour-program" allowedRoles={['manager']}><MRTourProgram /></AppRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AppRoute scope="admin-dashboard" allowedRoles={['admin']}><AdminDashboard /></AppRoute>} />
            <Route path="/admin/users" element={<AppRoute scope="admin-users" allowedRoles={['admin']}><AdminUsers /></AppRoute>} />
            <Route path="/admin/doctors" element={<AppRoute scope="admin-doctors" allowedRoles={['admin']}><AdminDoctors /></AppRoute>} />
            <Route path="/admin/areas" element={<AppRoute scope="admin-areas" allowedRoles={['admin']}><AdminAreas /></AppRoute>} />
            <Route path="/admin/mr-access" element={<AppRoute scope="admin-mr-access" allowedRoles={['admin']}><AdminMRAccess /></AppRoute>} />
            <Route path="/admin/targets" element={<AppRoute scope="admin-targets" allowedRoles={['admin']}><AdminTargets /></AppRoute>} />
            <Route path="/admin/holidays" element={<AppRoute scope="admin-holidays" allowedRoles={['admin']}><AdminHolidays /></AppRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </NotificationProvider>
          </EmployeeBirthdayProvider>
          </HashRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
