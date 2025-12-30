import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { AppearanceLoader } from "@/components/AppearanceLoader";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Learners from "./pages/Students";
import Alumni from "./pages/Alumni";
import Grades from "./pages/Grades";
import GradeDetail from "./pages/GradeDetail";
import StreamDetail from "./pages/StreamDetail";
import LearningAreasPage from "./pages/LearningAreas";
import Admissions from "./pages/Admissions";
import FeeManagement from "./pages/FeeManagement";
import Reports from "./pages/Reports";
import BulkLearnerReports from "./pages/BulkLearnerReports";
import Settings from "./pages/Settings";
import Teachers from "./pages/Teachers";
import TeacherProfile from "./pages/TeacherProfile";
import NonTeachingStaff from "./pages/NonTeachingStaff";
import Invoices from "./pages/Invoices";
import FeeStructures from "./pages/FeeStructures";
import Activities from "./pages/Activities";
import LearnerProfile from "./pages/LearnerProfile";
import LearnerProfilePage from "./pages/LearnerProfilePage";
import LearnerSettings from "./pages/LearnerSettings";
import Auth from "./pages/Auth";
import OTPVerification from "./pages/OTPVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import LearnerPortalLayout from "./components/LearnerPortalLayout";
import LearnerDashboard from "./pages/LearnerDashboard";
import LearnerFeeStructures from "./pages/LearnerFeeStructures";
import LearnerFeesPage from "./pages/LearnerFeesPage";
import Profile from "./pages/Profile";
import AcademicYears from "./pages/AcademicYears";
import Communication from "./pages/Communication";
import OfflineSettings from "./pages/OfflineSettings";
import AcademicSettings from "./pages/AcademicSettings";
import LearnerFeesPortal from "./pages/LearnerFeesPortal";
import Signout from "./pages/Signout";
import Notifications from "./pages/Notifications";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import Gallery from "./pages/Gallery";
import Programs from "./pages/Programs";
import Houses from "./pages/Houses";
import Departments from "./pages/Departments";
import { TeacherPortalLayout } from "./components/TeacherPortalLayout";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherMarks from "./pages/TeacherMarks";
import TeacherAssignments from "./pages/TeacherAssignments";
import TeacherPortalProfile from "./pages/TeacherPortalProfile";
import TeacherSettings from "./pages/TeacherSettings";
import ReleaseMarks from "./pages/ReleaseMarks";

const queryClient = new QueryClient();

// Component that uses hooks requiring Router and Auth context
function SessionTimeoutWrapper({ children }: { children: React.ReactNode }) {
  const { showWarning, timeRemaining, extendSession } = useSessionTimeout();

  return (
    <>
      {children}
      <SessionTimeoutWarning open={showWarning} timeRemaining={timeRemaining} onExtend={extendSession} />
    </>
  );
}

// Routes component separated to be inside SessionTimeoutWrapper
function AppRoutes() {
  return (
    <Routes>
      {/* Public School Website */}
      <Route path="/" element={<Home />} />
      <Route path="/blog/:id" element={<BlogDetail />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/otp-verification" element={<OTPVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/signout" element={<Signout />} />

      {/* Learner Portal Routes */}
      <Route
        path="/learner-portal"
        element={
          <ProtectedRoute>
            <LearnerPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LearnerDashboard />} />
        <Route path="profile" element={<LearnerProfilePage />} />
        <Route path="fees" element={<LearnerFeesPage />} />
        <Route path="fee-structures" element={<LearnerFeeStructures />} />
        <Route path="settings" element={<LearnerSettings />} />
      </Route>

      {/* Teacher Portal Routes */}
      <Route
        path="/teacher-portal"
        element={
          <ProtectedRoute>
            <TeacherPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="profile" element={<TeacherPortalProfile />} />
        <Route path="settings" element={<TeacherSettings />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/learners"
        element={
          <ProtectedRoute>
            <Learners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learners/:id"
        element={
          <ProtectedRoute>
            <LearnerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alumni"
        element={
          <ProtectedRoute>
            <Alumni />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grades"
        element={
          <ProtectedRoute>
            <Grades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grades/:grade"
        element={
          <ProtectedRoute>
            <GradeDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grades/:grade/:stream"
        element={
          <ProtectedRoute>
            <StreamDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/release-marks"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <ReleaseMarks />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-areas"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <LearningAreasPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teachers"
        element={
          <ProtectedRoute>
            <Teachers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teachers/:id"
        element={
          <ProtectedRoute>
            <TeacherProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/non-teaching-staff"
        element={
          <ProtectedRoute>
            <NonTeachingStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <Activities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admissions"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Admissions />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <FeeManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Invoices />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fee-structures"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <FeeStructures />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Reports />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bulk-learner-reports"
        element={
          <ProtectedRoute>
            <BulkLearnerReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learner/:id"
        element={
          <ProtectedRoute>
            <LearnerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic-years"
        element={
          <ProtectedRoute>
            <AcademicYears />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication"
        element={
          <ProtectedRoute>
            <Communication />
          </ProtectedRoute>
        }
      />
      <Route
        path="/offline-storage"
        element={
          <ProtectedRoute>
            <OfflineSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic-settings"
        element={
          <ProtectedRoute>
            <AcademicSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learner-fees"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <LearnerFeesPortal />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Blogs />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Programs />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Gallery />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/houses"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Houses />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Departments />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppearanceLoader />
            <Toaster />
            <Sonner />
            <SessionTimeoutWrapper>
              <AppRoutes />
            </SessionTimeoutWrapper>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
