import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromotionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerName: string;
}

export function PromotionHistoryDialog({ open, onOpenChange, learnerName }: PromotionHistoryDialogProps) {
  // Mock promotion history data
  const promotionHistory = [
    {
      id: "1",
      date: "2024-12-15",
      fromGrade: "Grade 3",
      fromStream: "Blue",
      toGrade: "Grade 4",
      toStream: "Green",
      academicYear: "2023-2024",
      reason: "End of year promotion",
      promotedBy: "Mrs. Njeri (Principal)",
    },
    {
      id: "2",
      date: "2023-12-20",
      fromGrade: "Grade 2",
      fromStream: "Red",
      toGrade: "Grade 3",
      toStream: "Blue",
      academicYear: "2022-2023",
      reason: "End of year promotion",
      promotedBy: "Mr. Kamau (Principal)",
    },
    {
      id: "3",
      date: "2022-12-18",
      fromGrade: "Grade 1",
      fromStream: "Yellow",
      toGrade: "Grade 2",
      toStream: "Red",
      academicYear: "2021-2022",
      reason: "End of year promotion",
      promotedBy: "Mrs. Wanjiru (Principal)",
    },
  ];

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
          <div className="space-y-4">
            {promotionHistory.map((promotion, index) => (
              <div
                key={promotion.id}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(promotion.date).toLocaleDateString()}
                    </span>
                  </div>
                  {index === 0 && (
                    <Badge variant="default">Current</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-1">
                      {promotion.fromGrade}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {promotion.fromStream}
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 text-primary" />

                  <div className="text-center">
                    <Badge variant="secondary" className="mb-1">
                      {promotion.toGrade}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {promotion.toStream}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Academic Year:</span>
                    <span className="font-medium">{promotion.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span className="font-medium">{promotion.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Promoted By:</span>
                    <span className="font-medium">{promotion.promotedBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
