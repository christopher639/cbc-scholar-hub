import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Edit, Trash2 } from "lucide-react";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import { SetFeeStructureDialogEnhanced } from "@/components/SetFeeStructureDialogEnhanced";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useGrades } from "@/hooks/useGrades";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/currency";

export default function FeeStructures() {
  const { structures, loading, fetchStructures } = useFeeStructures();
  const { academicYears } = useAcademicYears();
  const { grades } = useGrades();
  const { schoolInfo } = useSchoolInfo();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [structureToDelete, setStructureToDelete] = useState<any>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!structureToDelete) return;
    
    try {
      const { error } = await supabase
        .from("fee_structures")
        .delete()
        .eq("id", structureToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Fee structure deleted successfully",
      });
      
      fetchStructures();
      setDeleteDialogOpen(false);
      setStructureToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
            <h1 className="text-xl font-bold">Fee Structures</h1>
            <p className="text-sm text-muted-foreground">
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
            <div className="flex justify-end mb-4 print:hidden">
              <Button onClick={handleDownload} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download / Print
              </Button>
            </div>
            
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #fee-structure-document, #fee-structure-document * {
                  visibility: visible;
                }
                #fee-structure-document {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  font-size: 11px;
                }
                #fee-structure-document .compact-table td,
                #fee-structure-document .compact-table th {
                  padding: 4px 8px;
                }
              }
            `}</style>
            
            <div id="fee-structure-document">
              {Object.values(structuresByGrade).map((gradeStructure: any) => (
                <div key={gradeStructure.grade?.id} className="mb-4 p-4 border">
                  {/* Document Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {schoolInfo?.logo_url && (
                      <img 
                        src={schoolInfo.logo_url} 
                        alt={schoolInfo.school_name}
                        className="h-12 w-12 object-contain"
                      />
                    )}
                    <div className="text-xs">
                      <h2 className="text-lg font-bold">{schoolInfo?.school_name || "School Name"}</h2>
                      <p>{schoolInfo?.address}</p>
                      <p>{schoolInfo?.phone} | {schoolInfo?.email}</p>
                    </div>
                  </div>

                  <hr className="my-2" />

                  {/* Grade and Year Info */}
                  <div className="mb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-semibold">Fee Structure Document</h3>
                      <p className="text-xs">Grade: {gradeStructure.grade?.name} | Academic Year: {selectedYear}</p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDialogOpen(true)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setStructureToDelete(gradeStructure.term_1 || gradeStructure.term_2 || gradeStructure.term_3);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* All Terms - Horizontal Layout */}
                  <div className="grid grid-cols-3 gap-2">
                    {["term_1", "term_2", "term_3"].map((term) => {
                      const termStructure = gradeStructure[term];
                      return (
                        <div key={term} className="border p-2">
                          <h4 className="text-sm font-semibold mb-1">
                            {term.replace("_", " ").toUpperCase()}
                          </h4>
                          {termStructure ? (
                            <table className="w-full text-xs compact-table">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-1">#</th>
                                  <th className="text-left py-1">Item</th>
                                  <th className="text-right py-1">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {termStructure.fee_structure_items?.sort((a: any, b: any) => 
                                  (a.display_order || 0) - (b.display_order || 0)
                                ).map((item: any, index: number) => (
                                  <tr key={item.id} className="border-b">
                                    <td className="py-1">{index + 1}</td>
                                    <td className="py-1">
                                      <div className="font-medium">{item.item_name}</div>
                                      {item.description && (
                                        <div className="text-[10px] text-muted-foreground">{item.description}</div>
                                      )}
                                    </td>
                                    <td className="text-right py-1">{formatCurrency(Number(item.amount))}</td>
                                  </tr>
                                ))}
                                <tr className="font-bold">
                                  <td colSpan={2} className="text-right py-1">Total:</td>
                                  <td className="text-right py-1">{formatCurrency(Number(termStructure.amount))}</td>
                                </tr>
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-muted-foreground">Not configured</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grand Total */}
                  <hr className="my-2" />
                  <div className="flex justify-between items-center pt-1 text-sm">
                    <span className="font-bold">Annual Total:</span>
                    <span className="text-lg font-bold">{formatCurrency(
                        (gradeStructure.term_1?.amount || 0) +
                        (gradeStructure.term_2?.amount || 0) +
                        (gradeStructure.term_3?.amount || 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this fee structure? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
