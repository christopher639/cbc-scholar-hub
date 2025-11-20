import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Copy } from "lucide-react";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import { SetFeeStructureDialogEnhanced } from "@/components/SetFeeStructureDialogEnhanced";
import { Badge } from "@/components/ui/badge";

export default function FeeStructures() {
  const { structures, loading, fetchStructures } = useFeeStructures();
  const [dialogOpen, setDialogOpen] = useState(false);

  const groupedStructures = structures.reduce((acc, structure) => {
    const key = `${structure.academic_year}-${structure.term}`;
    if (!acc[key]) {
      acc[key] = {
        academicYear: structure.academic_year,
        term: structure.term,
        structures: [],
      };
    }
    acc[key].structures.push(structure);
    return acc;
  }, {} as Record<string, any>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fee Structures</h1>
            <p className="text-muted-foreground">
              Configure fee structures for each grade, term, and academic year
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Structure
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading fee structures...
          </div>
        ) : Object.keys(groupedStructures).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No fee structures configured yet
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Fee Structure
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedStructures).map((group: any) => (
              <Card key={`${group.academicYear}-${group.term}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {group.academicYear} - {group.term.replace("_", " ").toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        Fee structures for {group.structures.length} grade(s)
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Next Term
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.structures.map((structure: any) => (
                      <Card key={structure.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {structure.grade?.name}
                          </CardTitle>
                          {structure.category && (
                            <Badge variant="outline">{structure.category.name}</Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Total Amount:
                              </span>
                              <span className="font-semibold">
                                KES {structure.amount.toLocaleString()}
                              </span>
                            </div>
                            {structure.description && (
                              <p className="text-sm text-muted-foreground">
                                {structure.description}
                              </p>
                            )}
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SetFeeStructureDialogEnhanced
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchStructures}
      />
    </DashboardLayout>
  );
}
