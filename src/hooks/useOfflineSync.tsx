import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingRequests();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending requests from localStorage
    loadPendingRequests();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingRequests = () => {
    try {
      const stored = localStorage.getItem('pendingRequests');
      if (stored) {
        setPendingRequests(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const savePendingRequests = (requests: PendingRequest[]) => {
    try {
      localStorage.setItem('pendingRequests', JSON.stringify(requests));
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error saving pending requests:', error);
    }
  };

  const addPendingRequest = (request: Omit<PendingRequest, 'id' | 'timestamp'>) => {
    const newRequest: PendingRequest = {
      ...request,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    const updated = [...pendingRequests, newRequest];
    savePendingRequests(updated);

    toast({
      title: "Offline Mode",
      description: "Your changes will be synced when you're back online.",
    });
  };

  const syncPendingRequests = async () => {
    if (pendingRequests.length === 0) return;

    toast({
      title: "Syncing...",
      description: `Syncing ${pendingRequests.length} pending changes`,
    });

    const failed: PendingRequest[] = [];

    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (!response.ok) {
          failed.push(request);
        }
      } catch (error) {
        console.error('Sync failed for request:', request, error);
        failed.push(request);
      }
    }

    savePendingRequests(failed);

    if (failed.length === 0) {
      toast({
        title: "Sync Complete",
        description: "All changes have been synced successfully!",
      });
    } else {
      toast({
        title: "Partial Sync",
        description: `${pendingRequests.length - failed.length} changes synced. ${failed.length} failed.`,
        variant: "destructive",
      });
    }
  };

  return {
    isOnline,
    pendingRequests,
    addPendingRequest,
    syncPendingRequests,
  };
}
