import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity,
  Search,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  FileText,
  Users,
  TrendingUp,
  LogIn
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const Activities = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
      case "added":
        return <UserPlus className="h-4 w-4" />;
      case "deleted":
      case "removed":
        return <UserMinus className="h-4 w-4" />;
      case "updated":
      case "edited":
        return <Edit className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
      case "added":
        return "bg-success/10 text-success";
      case "deleted":
      case "removed":
        return "bg-destructive/10 text-destructive";
      case "updated":
      case "edited":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case "learner":
      case "student":
        return <Users className="h-4 w-4" />;
      case "teacher":
        return <Users className="h-4 w-4" />;
      case "grade":
      case "stream":
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || activity.entity_type === filterType;
    const matchesAction = filterAction === "all" || activity.action === filterAction;

    return matchesSearch && matchesType && matchesAction;
  });

  const entityTypes = Array.from(new Set(activities.map(a => a.entity_type))).filter(Boolean);
  const actions = Array.from(new Set(activities.map(a => a.action))).filter(Boolean);

  // Prepare chart data - show all 30 days
  const chartData = useMemo(() => {
    const dailyStats: { [key: string]: { logins: number; actions: number; date: Date } } = {};
    
    // Initialize all 30 days with zero counts
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyStats[dateStr] = { logins: 0, actions: 0, date };
    }
    
    // Count activities for each day
    activities.forEach(activity => {
      const activityDate = new Date(activity.created_at);
      activityDate.setHours(0, 0, 0, 0);
      const dateStr = activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].actions += 1;
        
        if (activity.action?.toLowerCase() === "login") {
          dailyStats[dateStr].logins += 1;
        }
      }
    });
    
    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        logins: stats.logins,
        actions: stats.actions,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date + ", 2024");
        const dateB = new Date(b.date + ", 2024");
        return dateA.getTime() - dateB.getTime();
      });
  }, [activities]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Activities</h1>
          <p className="text-muted-foreground">Track all actions performed in the system</p>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                <CardTitle>Login Trends</CardTitle>
              </div>
              <CardDescription>Daily login activity over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="logins" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Logins"
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <CardTitle>Activity Trends</CardTitle>
              </div>
              <CardDescription>All system actions over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actions" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Total Actions"
                      dot={{ fill: 'hsl(var(--success))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user, entity, or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {entityTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Showing {filteredActivities.length} of {activities.length} activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activities found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {activity.user_name || "System"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.user_role || "system"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{activity.action}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {getEntityIcon(activity.entity_type)}
                          <span className="capitalize">{activity.entity_type}</span>
                        </div>
                        {activity.entity_name && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              {activity.entity_name}
                            </span>
                          </>
                        )}
                      </div>

                      {activity.details && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          {typeof activity.details === "string" 
                            ? activity.details 
                            : JSON.stringify(activity.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Activities;
