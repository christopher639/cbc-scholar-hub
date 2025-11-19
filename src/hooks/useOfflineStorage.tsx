import { useEffect, useState } from "react";
import { dbManager as db, STORES } from "@/utils/indexedDB";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SyncStatus {
  lastSync: Date | null;
  syncing: boolean;
  storageUsage: {
    usage: number;
    quota: number;
    percentage: number;
  };
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    syncing: false,
    storageUsage: { usage: 0, quota: 0, percentage: 0 },
  });
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncAllData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update storage usage
  useEffect(() => {
    updateStorageUsage();
  }, []);

  const updateStorageUsage = async () => {
    const usage = await db.getStorageEstimate();
    setSyncStatus(prev => ({ ...prev, storageUsage: usage }));
  };

  // Sync all data from server to IndexedDB
  const syncAllData = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline",
        variant: "destructive",
      });
      return;
    }

    setSyncStatus(prev => ({ ...prev, syncing: true }));

    try {
      // Sync learners
      const { data: learners } = await supabase
        .from("learners")
        .select("*")
        .eq("status", "active");
      
      if (learners) {
        await db.bulkPut(STORES.LEARNERS, learners);
      }

      // Sync grades
      const { data: grades } = await supabase
        .from("grades")
        .select("*");
      
      if (grades) {
        await db.bulkPut(STORES.GRADES, grades);
      }

      // Sync streams
      const { data: streams } = await supabase
        .from("streams")
        .select("*");
      
      if (streams) {
        await db.bulkPut(STORES.STREAMS, streams);
      }

      // Sync fee payments (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: payments } = await supabase
        .from("fee_payments")
        .select("*")
        .gte("payment_date", sixMonthsAgo.toISOString());
      
      if (payments) {
        await db.bulkPut(STORES.FEE_PAYMENTS, payments);
      }

      // Sync fee balances
      const { data: balances } = await supabase
        .from("fee_balances")
        .select("*");
      
      if (balances) {
        await db.bulkPut(STORES.FEE_BALANCES, balances);
      }

      // Sync teachers
      const { data: teachers } = await supabase
        .from("teachers")
        .select("*");
      
      if (teachers) {
        await db.bulkPut(STORES.TEACHERS, teachers);
      }

      // Sync performance records (current academic year)
      const currentYear = new Date().getFullYear();
      const { data: performance } = await supabase
        .from("performance_records")
        .select("*")
        .gte("academic_year", `${currentYear - 1}-${currentYear}`);
      
      if (performance) {
        await db.bulkPut(STORES.PERFORMANCE, performance);
      }

      // Sync alumni
      const { data: alumni } = await supabase
        .from("alumni")
        .select("*");
      
      if (alumni) {
        await db.bulkPut(STORES.ALUMNI, alumni);
      }

      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        syncing: false,
      }));

      await updateStorageUsage();

      toast({
        title: "Sync Complete",
        description: "All data has been cached for offline use",
      });

    } catch (error: any) {
      console.error("Sync error:", error);
      setSyncStatus(prev => ({ ...prev, syncing: false }));
      
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync data",
        variant: "destructive",
      });
    }
  };

  // Clear all cached data
  const clearAllData = async () => {
    try {
      await Promise.all([
        db.clear(STORES.LEARNERS),
        db.clear(STORES.GRADES),
        db.clear(STORES.STREAMS),
        db.clear(STORES.FEE_PAYMENTS),
        db.clear(STORES.FEE_BALANCES),
        db.clear(STORES.TEACHERS),
        db.clear(STORES.PERFORMANCE),
        db.clear(STORES.ALUMNI),
        db.clear(STORES.SYNC_QUEUE),
      ]);

      await updateStorageUsage();

      toast({
        title: "Cache Cleared",
        description: "All offline data has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  // Get counts for all stores
  const getCounts = async () => {
    const counts = await Promise.all([
      db.count(STORES.LEARNERS),
      db.count(STORES.GRADES),
      db.count(STORES.STREAMS),
      db.count(STORES.FEE_PAYMENTS),
      db.count(STORES.FEE_BALANCES),
      db.count(STORES.TEACHERS),
      db.count(STORES.PERFORMANCE),
      db.count(STORES.ALUMNI),
    ]);

    return {
      learners: counts[0],
      grades: counts[1],
      streams: counts[2],
      payments: counts[3],
      balances: counts[4],
      teachers: counts[5],
      performance: counts[6],
      alumni: counts[7],
    };
  };

  return {
    isOnline,
    syncStatus,
    syncAllData,
    clearAllData,
    getCounts,
    updateStorageUsage,
  };
}
