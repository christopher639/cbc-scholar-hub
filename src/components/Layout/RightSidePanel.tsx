import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Plus,
  MessageSquare,
  Bell,
  X,
  Mail,
  Phone,
  Clock,
  Loader2,
  CheckCircle2,
  Circle,
  UserPlus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddLearnerDialog } from "@/components/AddLearnerDialog";

type PanelType = "add-learner" | "messages" | "notifications" | null;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function RightSidePanel() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [addLearnerOpen, setAddLearnerOpen] = useState(false);

  // Fetch contact messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["contact-messages-panel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ContactMessage[];
    },
    enabled: activePanel === "messages",
  });

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications-panel"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: activePanel === "notifications",
  });

  // Get unread counts
  const { data: unreadCounts } = useQuery({
    queryKey: ["panel-unread-counts"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const [messagesResult, notificationsResult] = await Promise.all([
        supabase.from("contact_messages").select("id", { count: "exact" }).eq("is_read", false),
        session?.user 
          ? supabase.from("notifications").select("id", { count: "exact" }).eq("user_id", session.user.id).eq("is_read", false)
          : Promise.resolve({ count: 0 })
      ]);
      
      return {
        messages: messagesResult.count || 0,
        notifications: notificationsResult.count || 0,
      };
    },
  });

  const handlePanelClick = (panel: PanelType) => {
    if (panel === "add-learner") {
      setAddLearnerOpen(true);
      return;
    }
    setActivePanel(activePanel === panel ? null : panel);
  };

  const markMessageAsRead = async (id: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    refetchMessages();
  };

  const markNotificationAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    refetchNotifications();
  };

  const panelItems = [
    {
      id: "add-learner" as PanelType,
      icon: UserPlus,
      label: "Add Learner",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20",
      badge: 0,
    },
    {
      id: "messages" as PanelType,
      icon: MessageSquare,
      label: "Messages",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
      badge: unreadCounts?.messages || 0,
    },
    {
      id: "notifications" as PanelType,
      icon: Bell,
      label: "Notifications",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 hover:bg-amber-500/20",
      badge: unreadCounts?.notifications || 0,
    },
  ];

  return (
    <>
      {/* Right Icon Bar - Only visible on large screens */}
      <div className="hidden lg:flex flex-col items-center py-4 px-2 border-l bg-background/50 backdrop-blur-sm gap-3 h-full">
        <TooltipProvider>
          {panelItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative h-10 w-10 rounded-full transition-all",
                    item.bgColor,
                    activePanel === item.id && "ring-2 ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => handlePanelClick(item.id)}
                >
                  <item.icon className={cn("h-5 w-5", item.color)} />
                  {item.badge > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Expandable Panel - Now relative positioned, not fixed */}
      <div
        className={cn(
          "hidden lg:block bg-background border-l shadow-lg transition-all duration-300 h-full overflow-hidden",
          activePanel ? "w-80" : "w-0"
        )}
      >
        {activePanel && (
          <div className="flex flex-col h-full">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm">
                {activePanel === "messages" && "Visitor Messages"}
                {activePanel === "notifications" && "Notifications"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setActivePanel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Panel Content */}
            <ScrollArea className="flex-1">
              {activePanel === "messages" && (
                <div className="p-2">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No messages yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors",
                            msg.is_read 
                              ? "bg-background hover:bg-muted/50" 
                              : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                          )}
                          onClick={() => markMessageAsRead(msg.id)}
                        >
                          <div className="flex items-start gap-2">
                            {msg.is_read ? (
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            ) : (
                              <Circle className="h-4 w-4 text-blue-500 mt-0.5 fill-blue-500" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{msg.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{msg.email}</span>
                              </div>
                              {msg.phone && (
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{msg.phone}</span>
                                </div>
                              )}
                              <p className="text-xs mt-1 line-clamp-2">{msg.message}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activePanel === "notifications" && (
                <div className="p-2">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors",
                            notif.is_read 
                              ? "bg-background hover:bg-muted/50" 
                              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                          )}
                          onClick={() => markNotificationAsRead(notif.id)}
                        >
                          <div className="flex items-start gap-2">
                            {notif.is_read ? (
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            ) : (
                              <Bell className="h-4 w-4 text-amber-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs">{notif.title}</p>
                              <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(notif.created_at), "MMM d, yyyy h:mm a")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Add Learner Dialog */}
      <AddLearnerDialog
        open={addLearnerOpen}
        onOpenChange={setAddLearnerOpen}
      />
    </>
  );
}
