import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Global cache for school info to prevent re-fetching on every route change
let schoolInfoCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSchoolInfo() {
  const [schoolInfo, setSchoolInfo] = useState<any>(schoolInfoCache);
  const [loading, setLoading] = useState(!schoolInfoCache);
  const { toast } = useToast();
  const hasFetched = useRef(false);

  const fetchSchoolInfo = async (forceRefresh = false) => {
    // Use cache if available and not expired
    const now = Date.now();
    if (!forceRefresh && schoolInfoCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setSchoolInfo(schoolInfoCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("school_info")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      
      // Update cache
      schoolInfoCache = data;
      cacheTimestamp = now;
      setSchoolInfo(data);
    } catch (error: any) {
      console.error("Error fetching school info:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSchoolInfo = async (data: any) => {
    try {
      const { data: existingData } = await supabase
        .from("school_info")
        .select("id")
        .single();

      if (existingData) {
        const { error } = await supabase
          .from("school_info")
          .update(data)
          .eq("id", existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("school_info")
          .insert(data);

        if (error) throw error;
      }

      // Force refresh after update
      await fetchSchoolInfo(true);
      toast({
        title: "Success",
        description: "School information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Only fetch if we haven't already or cache is empty
    if (!hasFetched.current || !schoolInfoCache) {
      hasFetched.current = true;
      fetchSchoolInfo();
    }
  }, []);

  return { schoolInfo, loading, updateSchoolInfo, fetchSchoolInfo };
}
