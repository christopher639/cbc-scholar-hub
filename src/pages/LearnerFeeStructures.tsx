import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LearnerFeeStructures() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [filteredStructures, setFilteredStructures] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedGrade, selectedYear, selectedTerm, feeStructures]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: structuresData, error: structuresError } = await supabase
        .from("fee_structures")
        .select(`
          *,
          grade:grades(id, name),
          items:fee_structure_items(*)
        `)
        .order("academic_year", { ascending: false });

      if (structuresError) throw structuresError;

      const { data: gradesData } = await supabase
        .from("grades")
        .select("*")
        .order("name");

      setFeeStructures(structuresData || []);
      setFilteredStructures(structuresData || []);
      setGrades(gradesData || []);

      const uniqueYears = [...new Set(structuresData?.map((s) => s.academic_year) || [])];
      setAcademicYears(uniqueYears as string[]);
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

  const applyFilters = () => {
    let filtered = [...feeStructures];

    if (selectedGrade !== "all") {
      filtered = filtered.filter((s) => s.grade_id === selectedGrade);
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter((s) => s.academic_year === selectedYear);
    }

    if (selectedTerm !== "all") {
      filtered = filtered.filter((s) => s.term === selectedTerm);
    }

    setFilteredStructures(filtered);
  };

  const resetFilters = () => {
    setSelectedGrade("all");
    setSelectedYear("all");
    setSelectedTerm("all");
  };

  const getTermLabel = (term: string) => {
    const termMap: Record<string, string> = {
      term_1: "Term 1",
      term_2: "Term 2",
      term_3: "Term 3",
    };
    return termMap[term] || term;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-2">Fee Structures</h1>
        <p className="text-sm text-muted-foreground">Browse and filter fee structures by grade, year, and term</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger id="term">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="term_1">Term 1</SelectItem>
                  <SelectItem value="term_2">Term 2</SelectItem>
                  <SelectItem value="term_3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredStructures.length} of {feeStructures.length} fee structures
        </p>
      </div>

      {filteredStructures.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStructures.map((structure) => (
            <Card key={structure.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{structure.grade?.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {structure.academic_year} • {getTermLabel(structure.term)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    KES {Number(structure.amount).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {structure.description && (
                  <p className="text-sm text-muted-foreground mb-4">{structure.description}</p>
                )}
                
                {structure.items && structure.items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Breakdown:</p>
                    {structure.items
                      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                      .map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.item_name}
                            {item.is_optional && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Optional
                              </Badge>
                            )}
                          </span>
                          <span className="font-medium">
                            KES {Number(item.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No fee structures found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
