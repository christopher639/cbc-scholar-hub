import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to check if browser notifications are supported
const isBrowserNotificationSupported = () => {
  return "Notification" in window;
};

// Helper to request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isBrowserNotificationSupported()) {
    console.log("Browser notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

// Helper to show a browser notification
const showBrowserNotification = (title: string, message: string, icon?: string) => {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(title, {
      body: message,
      icon: icon || "/icon.png",
      badge: "/icon.png",
      tag: `notification-${Date.now()}`,
    });
  } catch (error) {
    console.error("Error showing browser notification:", error);
  }
};

// Check if push notifications are enabled in localStorage
export const isPushNotificationsEnabled = (): boolean => {
  return localStorage.getItem("push_notifications_enabled") === "true";
};

// Set push notifications preference
export const setPushNotificationsEnabled = (enabled: boolean) => {
  localStorage.setItem("push_notifications_enabled", enabled ? "true" : "false");
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(isPushNotificationsEnabled());
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const enablePushNotifications = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPushNotificationsEnabled(true);
      setPushEnabled(true);
      toast({
        title: "Push Notifications Enabled",
        description: "You will now receive browser notifications for important updates.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
    return granted;
  };

  const disablePushNotifications = () => {
    setPushNotificationsEnabled(false);
    setPushEnabled(false);
    toast({
      title: "Push Notifications Disabled",
      description: "You will no longer receive browser notifications.",
    });
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Set up realtime subscription for new notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show in-app toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });

          // Show browser push notification if enabled
          if (isPushNotificationsEnabled() && Notification.permission === "granted") {
            showBrowserNotification(newNotification.title, newNotification.message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.is_read).length);
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedNotification = payload.old as Notification;
          setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.is_read).length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
    pushEnabled,
    enablePushNotifications,
    disablePushNotifications,
    isBrowserNotificationSupported: isBrowserNotificationSupported(),
  };
}
