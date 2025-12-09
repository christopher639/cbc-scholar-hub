import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();

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

  // Admin, finance, and visitor roles can access the admin portal
  const allowedRoles = ["admin", "finance", "visitor"];
  if (!allowedRoles.includes(user.role)) {
    // Redirect learners and teachers to their portals
    if (user.role === "learner") {
      return <Navigate to="/learner-portal" replace />;
    }
    if (user.role === "teacher") {
      return <Navigate to="/teacher-portal" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
