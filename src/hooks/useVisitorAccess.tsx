import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useVisitorAccess() {
  const { user } = useAuth();
  
  const isVisitor = user?.role === "visitor";
  const isFinance = user?.role === "finance";
  
  const checkAccess = (action: string = "perform this action"): boolean => {
    if (isVisitor) {
      toast.error("Access Denied", {
        description: `Visitors cannot ${action}. You have read-only access.`,
      });
      return false;
    }
    return true;
  };

  // Finance users can only perform actions on finance-related features
  const checkFinanceAccess = (action: string = "perform this action", isFinanceRelated: boolean = false): boolean => {
    if (isVisitor) {
      toast.error("Access Denied", {
        description: `Visitors cannot ${action}. You have read-only access.`,
      });
      return false;
    }
    if (isFinance && !isFinanceRelated) {
      toast.error("Access Denied", {
        description: `Finance users can only manage financial data.`,
      });
      return false;
    }
    return true;
  };
  
  return { isVisitor, isFinance, checkAccess, checkFinanceAccess };
}
