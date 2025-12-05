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

  // Get only last 20 activities for the table
  const recentActivities = filteredActivities.slice(0, 20);

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground">System Activities</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track all actions performed in the system</p>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader className="p-3 md:p-6">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <CardTitle className="text-sm md:text-base">Login Trends</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">Daily login activity over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              {loading ? (
                <Skeleton className="h-[200px] md:h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-[10px] md:text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 768 ? 8 : 12 }}
                      interval={window.innerWidth < 768 ? 6 : 2}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis 
                      className="text-[10px] md:text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 768 ? 8 : 12 }}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="logins" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Logins"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 md:p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-success" />
                <CardTitle className="text-sm md:text-base">Activity Trends</CardTitle>
              </div>
              <CardDescription className="text-xs md:text-sm">All system actions over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              {loading ? (
                <Skeleton className="h-[200px] md:h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-[10px] md:text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 768 ? 8 : 12 }}
                      interval={window.innerWidth < 768 ? 6 : 2}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis 
                      className="text-[10px] md:text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 768 ? 8 : 12 }}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="actions" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Total Actions"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-base">Filter Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="flex-1 md:w-[150px] text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {entityTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="flex-1 md:w-[150px] text-sm">
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
            </div>
          </CardContent>
        </Card>

        {/* Activities List - Last 20 */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-base">Recent Activities</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Showing last {recentActivities.length} of {filteredActivities.length} activities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activities found</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 md:gap-4 p-2 md:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-1.5 md:p-2 rounded-full shrink-0 ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 md:gap-2 mb-0.5 md:mb-1">
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                          <span className="font-medium text-foreground text-xs md:text-sm truncate max-w-[100px] md:max-w-none">
                            {activity.user_name || "System"}
                          </span>
                          <Badge variant="outline" className="text-[10px] md:text-xs px-1 md:px-2">
                            {activity.user_role || "system"}
                          </Badge>
                        </div>
                        <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm text-muted-foreground flex-wrap">
                        <span className="capitalize">{activity.action}</span>
                        <span>•</span>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          {getEntityIcon(activity.entity_type)}
                          <span className="capitalize">{activity.entity_type}</span>
                        </div>
                        {activity.entity_name && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <span className="font-medium text-foreground hidden md:inline truncate max-w-[150px]">
                              {activity.entity_name}
                            </span>
                          </>
                        )}
                      </div>
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
