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

export default function LearnerTimetable() {
  const { academicYears } = useAcademicYears();
  const activeYear = academicYears.find(y => y.is_active)?.year || new Date().getFullYear().toString();
  
  const [selectedYear, setSelectedYear] = useState(activeYear);
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const printRef = useRef<HTMLDivElement>(null);

  // Get current learner's stream info
  const { data: learnerData } = useQuery({
    queryKey: ['currentLearnerStream'],
    queryFn: async () => {
      // Try learner session first
      const learnerSession = localStorage.getItem("learner_session");
      if (learnerSession) {
        try {
          const sessionData = JSON.parse(learnerSession);
          if (sessionData?.current_stream_id && sessionData?.current_grade_id) {
            // Get grade and stream names
            const [gradeRes, streamRes] = await Promise.all([
              supabase.from("grades").select("name").eq("id", sessionData.current_grade_id).maybeSingle(),
              supabase.from("streams").select("name").eq("id", sessionData.current_stream_id).maybeSingle(),
            ]);
            
            return {
              streamId: sessionData.current_stream_id,
              gradeId: sessionData.current_grade_id,
              gradeName: gradeRes.data?.name,
              streamName: streamRes.data?.name,
              firstName: sessionData.first_name,
              lastName: sessionData.last_name,
            };
          }
        } catch (e) {
          console.error("Error parsing learner session", e);
        }
      }
      
      // Fallback to auth user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("learners")
          .select(`
            id, first_name, last_name, current_stream_id, current_grade_id,
            grade:grades(name),
            stream:streams(name)
          `)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          return {
            streamId: data.current_stream_id,
            gradeId: data.current_grade_id,
            gradeName: (data.grade as { name: string } | null)?.name,
            streamName: (data.stream as { name: string } | null)?.name,
            firstName: data.first_name,
            lastName: data.last_name,
          };
        }
      }
      return null;
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Class-Timetable-${selectedYear}-${selectedTerm}`,
  });

  const { entries, isLoading } = useTimetable({
    academicYear: selectedYear,
    term: selectedTerm,
    streamId: learnerData?.streamId,
    gradeId: learnerData?.gradeId,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Class Timetable
          </h1>
          <p className="text-sm text-muted-foreground">
            {learnerData?.gradeName && learnerData?.streamName
              ? `${learnerData.gradeName} - ${learnerData.streamName}`
              : 'View your class schedule'}
          </p>
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
                {learnerData?.gradeName} - {learnerData?.streamName} Timetable
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
                <p className="text-muted-foreground">No timetable available for this term</p>
              </div>
            ) : (
              <TimetableGrid
                entries={entries}
                viewMode="learner"
                isAdmin={false}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
