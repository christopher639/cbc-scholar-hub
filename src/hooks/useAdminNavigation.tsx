import { useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Global cache for prefetched data
export const prefetchCache: Record<string, { data: any; timestamp: number; ready: boolean }> = {};
const CACHE_TTL = 30000; // 30 seconds cache validity

// Data fetchers for each route
const routeFetchers: Record<string, () => Promise<any>> = {
  "/dashboard": async () => {
    const [learners, teachers, grades, payments, invoices] = await Promise.all([
      supabase.from("learners").select("id, status, current_grade_id, enrollment_date").eq("status", "active"),
      supabase.from("teachers").select("id"),
      supabase.from("grades").select("id, name"),
      supabase.from("fee_payments").select("*").order("payment_date", { ascending: false }).limit(10),
      supabase.from("student_invoices").select("id, status, balance_due"),
    ]);
    return { learners: learners.data, teachers: teachers.data, grades: grades.data, payments: payments.data, invoices: invoices.data };
  },
  "/learners": async () => {
    const [learners, grades, streams] = await Promise.all([
      supabase.from("learners").select(`
        id, admission_number, first_name, last_name, gender, status, boarding_status, photo_url,
        current_grade_id, current_stream_id,
        grades:current_grade_id(id, name),
        streams:current_stream_id(id, name)
      `).order("created_at", { ascending: false }).limit(50),
      supabase.from("grades").select("id, name"),
      supabase.from("streams").select("id, name, grade_id"),
    ]);
    return { learners: learners.data, grades: grades.data, streams: streams.data };
  },
  "/grades": async () => {
    const [grades, streams, learners] = await Promise.all([
      supabase.from("grades").select("*").order("grade_level"),
      supabase.from("streams").select("*, grades(name)"),
      supabase.from("learners").select("id, current_grade_id, current_stream_id").eq("status", "active"),
    ]);
    return { grades: grades.data, streams: streams.data, learners: learners.data };
  },
  "/teachers": async () => {
    const [teachers, departments] = await Promise.all([
      supabase.from("teachers").select("*, departments(name)").order("created_at", { ascending: false }),
      supabase.from("departments").select("id, name"),
    ]);
    return { teachers: teachers.data, departments: departments.data };
  },
  "/fees": async () => {
    const [invoices, feeStructures, grades] = await Promise.all([
      supabase.from("student_invoices").select(`
        *, learners(first_name, last_name, admission_number),
        grades(name), streams(name)
      `).order("created_at", { ascending: false }).limit(50),
      supabase.from("fee_structures").select("*, grades(name)"),
      supabase.from("grades").select("id, name"),
    ]);
    return { invoices: invoices.data, feeStructures: feeStructures.data, grades: grades.data };
  },
  "/performance": async () => {
    const [grades, streams, learningAreas, academicPeriods] = await Promise.all([
      supabase.from("grades").select("id, name").order("grade_level"),
      supabase.from("streams").select("id, name, grade_id"),
      supabase.from("learning_areas").select("id, name, code"),
      supabase.from("academic_periods").select("*").eq("is_current", true).limit(1),
    ]);
    return { grades: grades.data, streams: streams.data, learningAreas: learningAreas.data, currentPeriod: academicPeriods.data?.[0] };
  },
  "/settings": async () => {
    const [schoolInfo] = await Promise.all([
      supabase.from("school_info").select("*").limit(1).maybeSingle(),
    ]);
    return { schoolInfo: schoolInfo.data };
  },
  "/users": async () => {
    const [profiles, userRoles] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    return { profiles: profiles.data, userRoles: userRoles.data };
  },
  "/communication": async () => {
    const [messages, bulkMessages] = await Promise.all([
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("bulk_messages").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    return { messages: messages.data, bulkMessages: bulkMessages.data };
  },
  "/houses": async () => {
    const [houses, learners] = await Promise.all([
      supabase.from("houses").select("*").order("name"),
      supabase.from("learners").select("id, first_name, last_name, house_id, current_grade_id, current_stream_id").eq("status", "active"),
    ]);
    return { houses: houses.data, learners: learners.data };
  },
  "/departments": async () => {
    const [departments, teachers] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("teachers").select("id, first_name, last_name, department_id"),
    ]);
    return { departments: departments.data, teachers: teachers.data };
  },
  "/non-teaching-staff": async () => {
    const { data } = await supabase.from("non_teaching_staff").select("*").order("created_at", { ascending: false });
    return { staff: data };
  },
  "/profile": async () => {
    return {}; // Profile page loads its own user-specific data
  },
  "/reports": async () => {
    const [grades, academicYears] = await Promise.all([
      supabase.from("grades").select("id, name"),
      supabase.from("academic_years").select("*").order("year", { ascending: false }),
    ]);
    return { grades: grades.data, academicYears: academicYears.data };
  },
  "/activities": async () => {
    const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100);
    return { activities: data };
  },
  "/blogs": async () => {
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    return { blogs: data };
  },
  "/gallery": async () => {
    const { data } = await supabase.from("gallery_images").select("*").order("display_order");
    return { images: data };
  },
  "/programs": async () => {
    const { data } = await supabase.from("programs").select("*").order("display_order");
    return { programs: data };
  },
  "/admissions": async () => {
    const [learners, grades] = await Promise.all([
      supabase.from("learners").select("*").order("enrollment_date", { ascending: false }).limit(50),
      supabase.from("grades").select("id, name"),
    ]);
    return { learners: learners.data, grades: grades.data };
  },
  "/alumni": async () => {
    const { data } = await supabase.from("alumni").select("*, learners(first_name, last_name, admission_number)").order("graduation_date", { ascending: false });
    return { alumni: data };
  },
  "/academic-settings": async () => {
    const [academicYears, academicPeriods] = await Promise.all([
      supabase.from("academic_years").select("*").order("year", { ascending: false }),
      supabase.from("academic_periods").select("*").order("start_date", { ascending: false }),
    ]);
    return { academicYears: academicYears.data, academicPeriods: academicPeriods.data };
  },
  "/bulk-learner-reports": async () => {
    const [grades, streams] = await Promise.all([
      supabase.from("grades").select("id, name").order("grade_level"),
      supabase.from("streams").select("id, name, grade_id"),
    ]);
    return { grades: grades.data, streams: streams.data };
  },
  "/offline-storage": async () => {
    return {}; // No prefetch needed
  },
  "/timetable": async () => {
    const [grades, streams, teachers, learningAreas, academicYears] = await Promise.all([
      supabase.from("grades").select("id, name").order("grade_level"),
      supabase.from("streams").select("id, name, grade_id"),
      supabase.from("teachers").select("id, first_name, last_name"),
      supabase.from("learning_areas").select("id, name"),
      supabase.from("academic_years").select("*").order("year", { ascending: false }),
    ]);
    return { grades: grades.data, streams: streams.data, teachers: teachers.data, learningAreas: learningAreas.data, academicYears: academicYears.data };
  },
};

// Check if cached data is valid and ready
export function getCachedData(path: string): any | null {
  const cached = prefetchCache[path];
  if (cached && cached.ready && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

// Check if data is ready for a path
export function isDataReady(path: string): boolean {
  const cached = prefetchCache[path];
  return !!(cached && cached.ready && Date.now() - cached.timestamp < CACHE_TTL);
}

// Clear cache for a specific route
export function clearRouteCache(path: string) {
  delete prefetchCache[path];
}

// Clear all cache
export function clearAllCache() {
  Object.keys(prefetchCache).forEach(key => delete prefetchCache[key]);
}

export function useAdminNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigationIdRef = useRef(0);

  const prefetchRoute = useCallback(async (path: string, navId: number): Promise<boolean> => {
    const fetcher = routeFetchers[path];
    if (!fetcher) {
      // No fetcher defined, mark as ready
      prefetchCache[path] = { data: {}, timestamp: Date.now(), ready: true };
      return true;
    }

    // Check if data is already cached and ready
    if (isDataReady(path)) {
      return true;
    }

    // Mark as loading
    prefetchCache[path] = { data: null, timestamp: Date.now(), ready: false };

    try {
      const data = await fetcher();
      
      // Check if this navigation was cancelled
      if (navId !== navigationIdRef.current) {
        return false;
      }
      
      // Mark data as ready
      prefetchCache[path] = { data, timestamp: Date.now(), ready: true };
      return true;
    } catch (error) {
      console.error(`Failed to prefetch ${path}:`, error);
      // Mark as ready anyway to allow navigation (page will handle its own errors)
      prefetchCache[path] = { data: null, timestamp: Date.now(), ready: true };
      return true;
    }
  }, []);

  const navigateTo = useCallback(async (path: string) => {
    // Don't navigate if already on the same path
    if (location.pathname === path) return;
    
    // Cancel any pending navigation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Increment navigation ID to track this specific navigation
    navigationIdRef.current += 1;
    const currentNavId = navigationIdRef.current;

    // Set navigating state - user stays on current page
    setIsNavigating(true);
    setPendingPath(path);

    try {
      // Prefetch data for target route - wait for completion
      const success = await prefetchRoute(path, currentNavId);
      
      // Check if this navigation was cancelled
      if (currentNavId !== navigationIdRef.current) {
        return;
      }
      
      // Only navigate after data is confirmed ready
      if (success && isDataReady(path)) {
        navigate(path);
      } else {
        // Even if prefetch had issues, still navigate
        navigate(path);
      }
    } finally {
      // Only clear state if this is still the current navigation
      if (currentNavId === navigationIdRef.current) {
        setIsNavigating(false);
        setPendingPath(null);
      }
    }
  }, [navigate, location.pathname, prefetchRoute]);

  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  return {
    navigateTo,
    isNavigating,
    pendingPath,
    isActive,
    currentPath: location.pathname,
    getCachedData,
    clearRouteCache,
    isDataReady,
  };
}
