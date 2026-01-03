import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { OfflineStorageManager } from "@/components/OfflineStorageManager";

const OfflineSettings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Offline Storage</h1>
          <p className="text-sm text-muted-foreground">
            Manage offline data caching and sync settings
          </p>
        </div>

        <OfflineStorageManager />
      </div>
    </DashboardLayout>
  );
};

export default OfflineSettings;
