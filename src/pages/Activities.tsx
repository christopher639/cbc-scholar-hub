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
  LogIn,
  Eye,
  Database,
  CreditCard,
  BookOpen,
  Settings,
  Bell
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const Activities = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
    fetchVisitorCount();
  }, []);

  const fetchVisitorCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_unique_visitor_count');
      if (error) throw error;
      setVisitorCount(data || 0);
    } catch (error) {
      console.error("Error fetching visitor count:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
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
        return <UserPlus className="h-3 w-3" />;
      case "deleted":
      case "removed":
        return <Trash2 className="h-3 w-3" />;
      case "updated":
      case "edited":
        return <Edit className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
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
      case "learners":
      case "learner":
      case "student":
        return <Users className="h-3 w-3" />;
      case "teachers":
      case "teacher":
        return <Users className="h-3 w-3" />;
      case "grades":
      case "grade":
      case "streams":
      case "stream":
        return <FileText className="h-3 w-3" />;
      case "fee_transactions":
      case "fee_payments":
      case "student_invoices":
      case "fee_structures":
        return <CreditCard className="h-3 w-3" />;
      case "performance_records":
      case "assignments":
      case "learning_areas":
        return <BookOpen className="h-3 w-3" />;
      case "notifications":
        return <Bell className="h-3 w-3" />;
      case "school_info":
      case "academic_years":
      case "academic_periods":
      case "discount_settings":
        return <Settings className="h-3 w-3" />;
      default:
        return <Database className="h-3 w-3" />;
    }
  };

  const formatEntityType = (entityType: string) => {
    return entityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.entity_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || activity.entity_type === filterType;
    const matchesAction = filterAction === "all" || activity.action === filterAction;

    return matchesSearch && matchesType && matchesAction;
  });

  const entityTypes = Array.from(new Set(activities.map(a => a.entity_type))).filter(Boolean).sort();
  const actions = Array.from(new Set(activities.map(a => a.action))).filter(Boolean).sort();

  const chartData = useMemo(() => {
    const dailyStats: { [key: string]: { logins: number; actions: number; date: Date } } = {};
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyStats[dateStr] = { logins: 0, actions: 0, date };
    }
    
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

  const recentActivities = filteredActivities.slice(0, 50);

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-base md:text-xl font-bold text-foreground">System Activities</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground">Track all CRUD operations across the system</p>
          </div>
          <Card className="w-fit">
            <CardContent className="p-2 flex items-center gap-2">
              <div className="h-7 w-7 bg-primary/10 rounded flex items-center justify-center">
                <Eye className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Visitors</p>
                <p className="text-sm font-bold text-foreground">{visitorCount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="p-2 md:p-3">
              <div className="flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5 text-primary" />
                <CardTitle className="text-xs md:text-sm">Login Trends</CardTitle>
              </div>
              <CardDescription className="text-[10px]">Daily logins (30 days)</CardDescription>
            </CardHeader>
            <CardContent className="p-1 md:p-2">
              {loading ? (
                <Skeleton className="h-[150px] md:h-[180px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                      interval={7}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                      width={25}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.25rem',
                        fontSize: '10px',
                        padding: '4px 8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="logins" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={1.5}
                      name="Logins"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-2 md:p-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                <CardTitle className="text-xs md:text-sm">Activity Trends</CardTitle>
              </div>
              <CardDescription className="text-[10px]">All system actions (30 days)</CardDescription>
            </CardHeader>
            <CardContent className="p-1 md:p-2">
              {loading ? (
                <Skeleton className="h-[150px] md:h-[180px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                      interval={7}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                      width={25}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.25rem',
                        fontSize: '10px',
                        padding: '4px 8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actions" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={1.5}
                      name="Actions"
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
          <CardContent className="p-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="flex-1 sm:w-[120px] h-7 text-[10px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Types</SelectItem>
                    {entityTypes.map(type => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {formatEntityType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="flex-1 sm:w-[100px] h-7 text-[10px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Actions</SelectItem>
                    {actions.map(action => (
                      <SelectItem key={action} value={action} className="text-xs capitalize">
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardHeader className="p-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs">Recent Activities</CardTitle>
              <CardDescription className="text-[10px]">
                {recentActivities.length} of {filteredActivities.length}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            {loading ? (
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-4">
                <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">No activities found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-1.5 p-1.5 border border-border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-1 rounded-full shrink-0 ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex items-center gap-1 flex-wrap">
                      <span className="font-medium text-foreground text-[10px] truncate max-w-[60px] sm:max-w-[100px]">
                        {activity.user_name || "System"}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">{activity.action}</span>
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        {getEntityIcon(activity.entity_type)}
                        <span className="hidden sm:inline">{formatEntityType(activity.entity_type)}</span>
                      </div>
                      {activity.entity_name && (
                        <span className="text-[10px] font-medium text-foreground truncate max-w-[80px] sm:max-w-[150px]">
                          "{activity.entity_name}"
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                        {activity.user_role || "sys"}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                        {new Date(activity.created_at).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
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
