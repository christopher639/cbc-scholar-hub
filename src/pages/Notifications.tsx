import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { DollarSign, UserPlus, Users, AlertTriangle, Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Notifications() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_receipt':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'overdue_invoice':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'new_learner':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'new_staff':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);

    if (notification.entity_type === 'learner' && notification.entity_id) {
      navigate(`/learners/${notification.entity_id}`);
    } else if (notification.entity_type === 'teacher' && notification.entity_id) {
      navigate(`/teachers/${notification.entity_id}`);
    } else if (notification.entity_type === 'invoice') {
      navigate('/invoices');
    } else if (notification.entity_type === 'fee_transaction') {
      navigate('/fees');
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const renderNotifications = (notificationList: any[]) => (
    <div className="space-y-3">
      {notificationList.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No notifications</p>
        </div>
      ) : (
        notificationList.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-colors hover:border-primary ${
              !notification.is_read ? 'border-primary/50 bg-accent/30' : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-base">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    {!notification.is_read && (
                      <Badge variant="default" className="flex-shrink-0">New</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Stay updated with payments, enrollments, and important events
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              All {notifications.length > 0 && `(${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="read">
              Read {readNotifications.length > 0 && `(${readNotifications.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {renderNotifications(notifications)}
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            {renderNotifications(unreadNotifications)}
          </TabsContent>

          <TabsContent value="read" className="mt-6">
            {renderNotifications(readNotifications)}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
