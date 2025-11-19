import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  HardDrive,
  Users,
  GraduationCap,
  DollarSign,
  FileText,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineStorageManager() {
  const { isOnline, syncStatus, syncAllData, clearAllData, getCounts, updateStorageUsage } = useOfflineStorage();
  const [counts, setCounts] = useState({
    learners: 0,
    grades: 0,
    streams: 0,
    payments: 0,
    balances: 0,
    teachers: 0,
    performance: 0,
    alumni: 0,
  });

  useEffect(() => {
    loadCounts();
  }, [syncStatus.lastSync]);

  const loadCounts = async () => {
    const newCounts = await getCounts();
    setCounts(newCounts);
  };

  const handleSync = async () => {
    await syncAllData();
    await updateStorageUsage();
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all cached data? You will need to sync again to use offline features.')) {
      await clearAllData();
      await loadCounts();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const dataItems = [
    { icon: Users, label: 'Learners', count: counts.learners },
    { icon: GraduationCap, label: 'Grades', count: counts.grades },
    { icon: GraduationCap, label: 'Streams', count: counts.streams },
    { icon: DollarSign, label: 'Fee Payments', count: counts.payments },
    { icon: DollarSign, label: 'Fee Balances', count: counts.balances },
    { icon: Users, label: 'Teachers', count: counts.teachers },
    { icon: FileText, label: 'Performance', count: counts.performance },
    { icon: Users, label: 'Alumni', count: counts.alumni },
  ];

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Offline Storage
              </CardTitle>
              <CardDescription>
                Manage cached data for offline access
              </CardDescription>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Storage Used</span>
              </div>
              <span className="text-muted-foreground">
                {formatBytes(syncStatus.storageUsage.usage)} / {formatBytes(syncStatus.storageUsage.quota)}
              </span>
            </div>
            <Progress value={syncStatus.storageUsage.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {syncStatus.storageUsage.percentage.toFixed(1)}% of available storage used
            </p>
          </div>

          {/* Last Sync */}
          {syncStatus.lastSync && (
            <Alert>
              <AlertDescription>
                Last synced: {syncStatus.lastSync.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSync} 
              disabled={!isOnline || syncStatus.syncing}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.syncing ? 'animate-spin' : ''}`} />
              {syncStatus.syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={syncStatus.syncing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cached Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Cached Data</CardTitle>
          <CardDescription>
            Records stored locally for offline access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dataItems.map((item) => (
              <div 
                key={item.label}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <item.icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Offline Mode:</strong> When you're offline, you can still view all cached data. 
          Any changes you make will be saved locally and synced when you're back online.
        </AlertDescription>
      </Alert>
    </div>
  );
}
