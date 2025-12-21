import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  colorClass?: string;
}

export function StatCard({ title, value, icon: Icon, trend, colorClass = "text-primary" }: StatCardProps) {
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-4 sm:p-6 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <h3 className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-foreground truncate">{value}</h3>
            {trend && (
              <p className={cn("mt-1 sm:mt-2 text-xs sm:text-sm font-medium", trend.positive ? "text-success" : "text-destructive")}>
                {trend.positive ? "+" : "-"}{trend.value}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg bg-muted p-2 sm:p-3 flex-shrink-0 ml-2", colorClass)}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
