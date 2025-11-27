import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkPerformanceEntry } from "@/components/BulkPerformanceEntry";

export default function TeacherMarks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Performance Marks</h1>
        <p className="text-muted-foreground">
          Enter and manage learner performance records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Marks Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <BulkPerformanceEntry 
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
}
