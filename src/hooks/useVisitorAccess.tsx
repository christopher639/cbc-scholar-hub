import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useVisitorAccess() {
  const { user } = useAuth();
  
  const isVisitor = user?.role === "visitor";
  
  const checkAccess = (action: string = "perform this action"): boolean => {
    if (isVisitor) {
      toast.error("Access Denied", {
        description: `Visitors cannot ${action}. You have read-only access.`,
      });
      return false;
    }
    return true;
  };
  
  return { isVisitor, checkAccess };
}
