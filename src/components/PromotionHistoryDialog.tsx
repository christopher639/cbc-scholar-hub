import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromotionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerName?: string;
  promotionHistory?: any[];
}

export function PromotionHistoryDialog({ open, onOpenChange, learnerName, promotionHistory = [] }: PromotionHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Promotion History</DialogTitle>
          <DialogDescription>
            Complete promotion history for {learnerName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {promotionHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No promotion history found</p>
          ) : (
            <div className="space-y-4">
              {promotionHistory.map((promotion: any, index: number) => (
                <div
                  key={promotion.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {new Date(promotion.promotion_date).toLocaleDateString()}
                      </span>
                    </div>
                    {index === 0 && (
                      <Badge variant="default">Most Recent</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <Badge variant="outline" className="mb-1">
                        {promotion.from_grade?.name || 'N/A'}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {promotion.from_stream?.name || 'N/A'}
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-primary" />

                    <div className="text-center">
                      <Badge variant="secondary" className="mb-1">
                        {promotion.to_grade?.name || 'N/A'}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {promotion.to_stream?.name || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Academic Year:</span>
                      <span className="font-medium">{promotion.academic_year}</span>
                    </div>
                    {promotion.notes && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Notes:</span>
                        <span className="font-medium">{promotion.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
