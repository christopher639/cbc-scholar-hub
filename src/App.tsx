import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Grades from "./pages/Grades";
import GradeDetail from "./pages/GradeDetail";
import StreamDetail from "./pages/StreamDetail";
import Performance from "./pages/Performance";
import Admissions from "./pages/Admissions";
import FeeManagement from "./pages/FeeManagement";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Teachers from "./pages/Teachers";
import SchoolInfo from "./pages/SchoolInfo";
import LearnerProfile from "./pages/LearnerProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/grades/:grade" element={<GradeDetail />} />
          <Route path="/grades/:grade/:stream" element={<StreamDetail />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/fees" element={<FeeManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/school-info" element={<SchoolInfo />} />
          <Route path="/learner/:id" element={<LearnerProfile />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
