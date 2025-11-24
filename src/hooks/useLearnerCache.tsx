import { useState, useEffect } from "react";
import { dbManager, STORES } from "@/utils/indexedDB";

interface CachedData<T> {
  data: T | null;
  loading: boolean;
  fromCache: boolean;
}

export function useLearnerCache<T = any>(
  storeName: string,
  key: string,
  fetchFunction: () => Promise<T>
): CachedData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // First, try to load from cache immediately for instant UI
        const cached = await dbManager.get(storeName, key);
        if (cached && mounted) {
          setData(cached);
          setFromCache(true);
          setLoading(false);
        }

        // Then fetch fresh data in the background
        const freshData = await fetchFunction();
        if (mounted) {
          setData(freshData);
          setFromCache(false);
          setLoading(false);
          
          // Update cache with fresh data
          await dbManager.put(storeName, { id: key, ...freshData });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [storeName, key]);

  return { data, loading, fromCache };
}

// Hook specifically for learner portal data
export function useLearnerPortalCache(learnerId: string) {
  const [learnerData, setLearnerData] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCachedData = async () => {
      if (!learnerId) return;

      try {
        // Load cached data immediately for instant display
        const cachedLearner = await dbManager.get(STORES.LEARNERS, learnerId);
        const cachedSchool = await dbManager.getAll(STORES.SCHOOL_INFO);

        if (cachedLearner) {
          setLearnerData(cachedLearner);
        }
        if (cachedSchool && cachedSchool.length > 0) {
          setSchoolData(cachedSchool[0]);
        }
      } catch (error) {
        console.error("Error loading cached learner data:", error);
      }
    };

    loadCachedData();
  }, [learnerId]);

  const updateCache = async (learner: any, school: any) => {
    try {
      if (learner) {
        await dbManager.put(STORES.LEARNERS, learner);
        setLearnerData(learner);
      }
      if (school) {
        await dbManager.put(STORES.SCHOOL_INFO, school);
        setSchoolData(school);
      }
    } catch (error) {
      console.error("Error updating cache:", error);
    }
  };

  return { learnerData, schoolData, loading, updateCache };
}
