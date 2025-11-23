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
import Dashboard from "./pages/Dashboard";
import Learners from "./pages/Students";
import Alumni from "./pages/Alumni";
import Grades from "./pages/Grades";
import GradeDetail from "./pages/GradeDetail";
import StreamDetail from "./pages/StreamDetail";
import Performance from "./pages/Performance";
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
import SchoolInfo from "./pages/SchoolInfo";
import LearnerProfile from "./pages/LearnerProfile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import LearnerPortal from "./pages/LearnerPortal";
import LearnerPortalLayout from "./components/LearnerPortalLayout";
import LearnerDashboard from "./pages/LearnerDashboard";
import LearnerFeeStructures from "./pages/LearnerFeeStructures";
import Profile from "./pages/Profile";
import AcademicYears from "./pages/AcademicYears";
import Communication from "./pages/Communication";
import OfflineSettings from "./pages/OfflineSettings";
import AcademicSettings from "./pages/AcademicSettings";
import LearnerFeesPortal from "./pages/LearnerFeesPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/learner-portal" element={<ProtectedRoute><LearnerPortalLayout /></ProtectedRoute>}>
              <Route index element={<LearnerDashboard />} />
              <Route path="performance" element={<LearnerPortal />} />
              <Route path="fees" element={<LearnerPortal />} />
              <Route path="fee-structures" element={<LearnerFeeStructures />} />
              <Route path="assignments" element={<LearnerPortal />} />
              <Route path="messages" element={<LearnerPortal />} />
            </Route>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/learners" element={<ProtectedRoute><Learners /></ProtectedRoute>} />
            <Route path="/learners/:id" element={<ProtectedRoute><LearnerProfile /></ProtectedRoute>} />
            <Route path="/alumni" element={<ProtectedRoute><Alumni /></ProtectedRoute>} />
            <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
            <Route path="/grades/:grade" element={<ProtectedRoute><GradeDetail /></ProtectedRoute>} />
            <Route path="/grades/:grade/:stream" element={<ProtectedRoute><StreamDetail /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
            <Route path="/teachers/:id" element={<ProtectedRoute><TeacherProfile /></ProtectedRoute>} />
            <Route path="/non-teaching-staff" element={<ProtectedRoute><NonTeachingStaff /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/admissions" element={<ProtectedRoute><AdminRoute><Admissions /></AdminRoute></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute><AdminRoute><FeeManagement /></AdminRoute></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><AdminRoute><Invoices /></AdminRoute></ProtectedRoute>} />
            <Route path="/fee-structures" element={<ProtectedRoute><AdminRoute><FeeStructures /></AdminRoute></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/bulk-learner-reports" element={<ProtectedRoute><BulkLearnerReports /></ProtectedRoute>} />
            <Route path="/school-info" element={<ProtectedRoute><SchoolInfo /></ProtectedRoute>} />
            <Route path="/learner/:id" element={<ProtectedRoute><LearnerProfile /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/academic-years" element={<ProtectedRoute><AcademicYears /></ProtectedRoute>} />
            <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
            <Route path="/offline-storage" element={<ProtectedRoute><OfflineSettings /></ProtectedRoute>} />
            <Route path="/academic-settings" element={<ProtectedRoute><AcademicSettings /></ProtectedRoute>} />
            <Route path="/learner-fees" element={<ProtectedRoute><AdminRoute><LearnerFeesPortal /></AdminRoute></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
