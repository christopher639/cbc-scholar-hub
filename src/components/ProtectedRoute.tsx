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
  const isLearner = user.role === "learner";
  const isTeacher = user.role === "teacher";

  // If learner trying to access non-learner routes, redirect to learner portal
  if (isLearner && !isLearnerRoute && location.pathname !== "/auth") {
    return <Navigate to="/learner-portal" replace />;
  }

  // If non-learner trying to access learner routes, redirect appropriately
  if (!isLearner && isLearnerRoute) {
    return <Navigate to={isTeacher ? "/performance" : "/dashboard"} replace />;
  }

  // If teacher trying to access dashboard, redirect to performance
  if (isTeacher && location.pathname === "/dashboard") {
    return <Navigate to="/performance" replace />;
  }

  return <>{children}</>;
}