import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useAdminNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = useCallback((path: string) => {
    // Don't navigate if already on the same path
    if (location.pathname === path) return;
    
    // Set navigating state to show loading indicator
    setIsNavigating(true);
    setPendingPath(path);
    
    // Small delay to allow current page to show loading state
    // Then navigate - the target page will handle its own data loading
    // But we give a brief moment for any critical data to start loading
    requestAnimationFrame(() => {
      // Navigate after a micro-task to ensure smooth transition
      setTimeout(() => {
        navigate(path);
        setIsNavigating(false);
        setPendingPath(null);
      }, 50);
    });
  }, [navigate, location.pathname]);

  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  return {
    navigateTo,
    isNavigating,
    pendingPath,
    isActive,
    currentPath: location.pathname,
  };
}
