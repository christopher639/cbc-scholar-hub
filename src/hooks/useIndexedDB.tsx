import { useState, useEffect, useCallback } from "react";
import { dbManager as db, STORES } from "@/utils/indexedDB";
import { useToast } from "@/hooks/use-toast";

export function useIndexedDB<T = any>(storeName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const items = await db.getAll(storeName);
      setData(items);
    } catch (error: any) {
      console.error(`Error loading from IndexedDB (${storeName}):`, error);
      toast({
        title: "Cache Error",
        description: "Failed to load cached data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [storeName]);

  // Save data to IndexedDB
  const saveData = useCallback(async (items: T[]) => {
    try {
      await db.bulkPut(storeName, items);
      setData(items);
      return true;
    } catch (error: any) {
      console.error(`Error saving to IndexedDB (${storeName}):`, error);
      toast({
        title: "Cache Error",
        description: "Failed to cache data locally",
        variant: "destructive",
      });
      return false;
    }
  }, [storeName]);

  // Add single item
  const addItem = useCallback(async (item: T) => {
    try {
      await db.add(storeName, item);
      await loadData();
      return true;
    } catch (error: any) {
      console.error(`Error adding to IndexedDB (${storeName}):`, error);
      return false;
    }
  }, [storeName, loadData]);

  // Update single item
  const updateItem = useCallback(async (item: T) => {
    try {
      await db.put(storeName, item);
      await loadData();
      return true;
    } catch (error: any) {
      console.error(`Error updating IndexedDB (${storeName}):`, error);
      return false;
    }
  }, [storeName, loadData]);

  // Delete single item
  const deleteItem = useCallback(async (key: IDBValidKey) => {
    try {
      await db.delete(storeName, key);
      await loadData();
      return true;
    } catch (error: any) {
      console.error(`Error deleting from IndexedDB (${storeName}):`, error);
      return false;
    }
  }, [storeName, loadData]);

  // Clear all data
  const clearData = useCallback(async () => {
    try {
      await db.clear(storeName);
      setData([]);
      return true;
    } catch (error: any) {
      console.error(`Error clearing IndexedDB (${storeName}):`, error);
      return false;
    }
  }, [storeName]);

  // Get item count
  const getCount = useCallback(async () => {
    try {
      return await db.count(storeName);
    } catch (error: any) {
      console.error(`Error counting in IndexedDB (${storeName}):`, error);
      return 0;
    }
  }, [storeName]);

  // Get by index
  const getByIndex = useCallback(async (indexName: string, value: any) => {
    try {
      return await db.getByIndex(storeName, indexName, value);
    } catch (error: any) {
      console.error(`Error querying IndexedDB (${storeName}):`, error);
      return [];
    }
  }, [storeName]);

  // Sync with server
  const syncWithServer = useCallback(async (fetchFunction: () => Promise<T[]>) => {
    try {
      setSyncing(true);
      const serverData = await fetchFunction();
      await saveData(serverData);
      
      toast({
        title: "Sync Complete",
        description: `${storeName} data synced successfully`,
      });
      
      return true;
    } catch (error: any) {
      console.error(`Error syncing ${storeName}:`, error);
      toast({
        title: "Sync Failed",
        description: "Using cached data",
        variant: "destructive",
      });
      return false;
    } finally {
      setSyncing(false);
    }
  }, [storeName, saveData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    syncing,
    loadData,
    saveData,
    addItem,
    updateItem,
    deleteItem,
    clearData,
    getCount,
    getByIndex,
    syncWithServer,
  };
}

// Hook for managing offline queue
export function useOfflineQueue() {
  const { data: queue, addItem, deleteItem, clearData } = useIndexedDB(STORES.SYNC_QUEUE);
  const { toast } = useToast();

  const addToQueue = useCallback(async (operation: {
    type: 'create' | 'update' | 'delete';
    storeName: string;
    data: any;
  }) => {
    const queueItem = {
      ...operation,
      timestamp: Date.now(),
      synced: false,
    };
    
    await addItem(queueItem);
    
    toast({
      title: "Queued for Sync",
      description: "Your changes will sync when you're online",
    });
  }, [addItem]);

  const processQueue = useCallback(async () => {
    const unsynced = queue.filter((item: any) => !item.synced);
    
    if (unsynced.length === 0) return;

    toast({
      title: "Syncing Changes",
      description: `Processing ${unsynced.length} pending operations`,
    });

    // Process queue items
    // Implementation would integrate with actual API calls
    
  }, [queue]);

  return {
    queue,
    addToQueue,
    processQueue,
    clearQueue: clearData,
  };
}
