import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimetableGrid } from "@/components/TimetableGrid";
import { useTimetable } from "@/hooks/useTimetable";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export default function TeacherTimetable() {
  const { academicYears } = useAcademicYears();
  const activeYear = academicYears.find(y => y.is_active)?.year || new Date().getFullYear().toString();
  
  const [selectedYear, setSelectedYear] = useState(activeYear);
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const printRef = useRef<HTMLDivElement>(null);

  // Get current teacher's ID
  const { data: teacherData } = useQuery({
    queryKey: ['currentTeacher'],
    queryFn: async () => {
      // First try teacher session
      const teacherSession = localStorage.getItem("teacher_session");
      if (teacherSession) {
        const { data } = await supabase
          .from("teacher_sessions")
          .select("teacher_id, teachers(id, first_name, last_name)")
          .eq("session_token", teacherSession)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();
        
        if (data?.teachers) {
          return data.teachers as { id: string; first_name: string; last_name: string };
        }
      }
      
      // Fallback to auth user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("teachers")
          .select("id, first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle();
        return data;
      }
      return null;
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `My-Timetable-${selectedYear}-${selectedTerm}`,
  });

  const { entries, isLoading } = useTimetable({
    academicYear: selectedYear,
    term: selectedTerm,
    teacherId: teacherData?.id,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Timetable
          </h1>
          <p className="text-sm text-muted-foreground">View your teaching schedule</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => handlePrint()}>
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(year => (
                  <SelectItem key={year.id} value={year.year}>
                    {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map(term => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={printRef} className="print:p-4">
            <div className="hidden print:block mb-4">
              <h2 className="text-lg font-bold">
                {teacherData?.first_name} {teacherData?.last_name}'s Timetable
              </h2>
              <p className="text-sm">{selectedYear} - {selectedTerm}</p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading timetable...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No timetable entries found for this term</p>
              </div>
            ) : (
              <TimetableGrid
                entries={entries}
                viewMode="teacher"
                isAdmin={false}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
