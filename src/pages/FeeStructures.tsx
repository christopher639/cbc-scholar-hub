import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import { SetFeeStructureDialogEnhanced } from "@/components/SetFeeStructureDialogEnhanced";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useGrades } from "@/hooks/useGrades";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function FeeStructures() {
  const { structures, loading, fetchStructures } = useFeeStructures();
  const { academicYears } = useAcademicYears();
  const { grades } = useGrades();
  const { schoolInfo } = useSchoolInfo();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");

  // Filter structures by selected year and grade
  const filteredStructures = structures.filter(s => 
    (selectedYear ? s.academic_year === selectedYear : true) &&
    (selectedGrade ? s.grade_id === selectedGrade : true)
  );

  // Group by grade to show complete year structure
  const structuresByGrade = filteredStructures.reduce((acc, structure) => {
    const gradeId = structure.grade_id;
    if (!acc[gradeId]) {
      acc[gradeId] = {
        grade: structure.grade,
        term_1: null,
        term_2: null,
        term_3: null,
      };
    }
    acc[gradeId][structure.term] = structure;
    return acc;
  }, {} as Record<string, any>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fee Structures</h1>
            <p className="text-muted-foreground">
              View and manage fee structures by grade and academic year
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Structure
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Fee Structures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.year}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Grade</label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Structure Document */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading fee structures...
          </div>
        ) : !selectedYear || !selectedGrade ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Please select an academic year and grade to view fee structure
              </p>
            </CardContent>
          </Card>
        ) : Object.keys(structuresByGrade).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No fee structure found for the selected criteria
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Fee Structure
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.values(structuresByGrade).map((gradeStructure: any) => (
              <Card key={gradeStructure.grade?.id} className="border-2">
                <CardContent className="p-8">
                  {/* Document Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {schoolInfo?.logo_url && (
                        <img 
                          src={schoolInfo.logo_url} 
                          alt={schoolInfo.school_name}
                          className="h-16 w-16 object-contain"
                        />
                      )}
                      <div>
                        <h2 className="text-2xl font-bold">{schoolInfo?.school_name || "School Name"}</h2>
                        <p className="text-sm text-muted-foreground">{schoolInfo?.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {schoolInfo?.phone} | {schoolInfo?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Grade and Year Info */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold">Fee Structure Document</h3>
                    <p className="text-muted-foreground">
                      Grade: {gradeStructure.grade?.name} | Academic Year: {selectedYear}
                    </p>
                  </div>

                  {/* All Terms */}
                  <div className="space-y-6">
                    {["term_1", "term_2", "term_3"].map((term) => {
                      const termStructure = gradeStructure[term];
                      return (
                        <div key={term} className="border rounded-lg p-4">
                          <h4 className="text-lg font-semibold mb-3">
                            {term.replace("_", " ").toUpperCase()}
                          </h4>
                          {termStructure ? (
                            <div className="space-y-2">
                              <div className="flex justify-between py-2 border-b font-medium">
                                <span>Total Amount:</span>
                                <span className="text-lg">${Number(termStructure.amount).toLocaleString()}</span>
                              </div>
                              {termStructure.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {termStructure.description}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not configured</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grand Total */}
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold">Annual Total:</span>
                    <span className="text-2xl font-bold">
                      ${(
                        (gradeStructure.term_1?.amount || 0) +
                        (gradeStructure.term_2?.amount || 0) +
                        (gradeStructure.term_3?.amount || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <SetFeeStructureDialogEnhanced
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => {
            fetchStructures();
            setDialogOpen(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
