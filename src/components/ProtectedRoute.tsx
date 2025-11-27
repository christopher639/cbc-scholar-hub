import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Handle role-based redirects
  const isLearnerRoute = location.pathname.startsWith("/learner-portal");
  const isTeacherRoute = location.pathname.startsWith("/teacher-portal");
  const isLearner = user.role === "learner";
  const isTeacher = user.role === "teacher";

  // If learner trying to access non-learner routes, redirect to learner portal
  if (isLearner && !isLearnerRoute && location.pathname !== "/auth") {
    return <Navigate to="/learner-portal" replace />;
  }

  // If teacher trying to access non-teacher routes (except auth), redirect to teacher portal
  if (isTeacher && !isTeacherRoute && location.pathname !== "/auth") {
    return <Navigate to="/teacher-portal" replace />;
  }

  // If non-learner trying to access learner routes, redirect appropriately
  if (!isLearner && isLearnerRoute) {
    return <Navigate to={isTeacher ? "/teacher-portal" : "/dashboard"} replace />;
  }

  // If non-teacher trying to access teacher routes, redirect appropriately
  if (!isTeacher && isTeacherRoute) {
    return <Navigate to={isLearner ? "/learner-portal" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}