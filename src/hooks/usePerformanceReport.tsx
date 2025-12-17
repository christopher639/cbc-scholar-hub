import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReportFilters {
  academicYear: string;
  term: string;
  examType: string;
  gradeId: string;
  streamId?: string;
}

interface LearnerRecord {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  marks: Record<string, number | null>;
  total: number;
  average: number;
}

interface ReportData {
  learners: LearnerRecord[];
  learningAreas: Array<{ id: string; code: string; name: string }>;
  filters: ReportFilters;
  gradeName: string;
  streamName?: string;
}

export function usePerformanceReport() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReport = async (filters: ReportFilters) => {
    try {
      setLoading(true);

      // Fetch learning areas
      const { data: learningAreas, error: laError } = await supabase
        .from("learning_areas")
        .select("id, code, name")
        .order("name");

      if (laError) throw laError;

      // Fetch grade name
      const { data: grade } = await supabase
        .from("grades")
        .select("name")
        .eq("id", filters.gradeId)
        .single();

      // Fetch stream name if filtered
      let streamName: string | undefined;
      if (filters.streamId) {
        const { data: stream } = await supabase
          .from("streams")
          .select("name")
          .eq("id", filters.streamId)
          .single();
        streamName = stream?.name;
      }

      // Fetch performance records FIRST - filter by grade_id in the performance record
      // This correctly gets records for learners who were in this grade when marks were recorded
      let perfQuery = supabase
        .from("performance_records")
        .select("learner_id, learning_area_id, marks")
        .eq("academic_year", filters.academicYear)
        .eq("grade_id", filters.gradeId);

      if (filters.term !== "all") {
        perfQuery = perfQuery.eq("term", filters.term as any);
      }

      if (filters.examType !== "all" && filters.examType !== "combined") {
        perfQuery = perfQuery.eq("exam_type", filters.examType);
      }

      if (filters.streamId) {
        perfQuery = perfQuery.eq("stream_id", filters.streamId);
      }

      const { data: perfRecords, error: pError } = await perfQuery;
      if (pError) throw pError;

      // Get unique learner IDs from performance records
      const learnerIds = [...new Set(perfRecords?.map(r => r.learner_id) || [])];

      // Fetch learner details for those who have performance records
      let learners: any[] = [];
      if (learnerIds.length > 0) {
        const { data: learnersData, error: lError } = await supabase
          .from("learners")
          .select("id, admission_number, first_name, last_name")
          .in("id", learnerIds)
          .order("first_name");
        
        if (lError) throw lError;
        learners = learnersData || [];
      }

      // Build marks map: learner_id -> learning_area_id -> marks
      const marksMap = new Map<string, Map<string, number[]>>();
      
      perfRecords?.forEach((record) => {
        if (!marksMap.has(record.learner_id)) {
          marksMap.set(record.learner_id, new Map());
        }
        const learnerMarks = marksMap.get(record.learner_id)!;
        
        if (!learnerMarks.has(record.learning_area_id)) {
          learnerMarks.set(record.learning_area_id, []);
        }
        learnerMarks.get(record.learning_area_id)!.push(Number(record.marks));
      });

      // Build learner records with marks
      const learnerRecords: LearnerRecord[] = learners.map((learner) => {
        const learnerMarksMap = marksMap.get(learner.id);
        const marks: Record<string, number | null> = {};
        let total = 0;
        let subjectCount = 0;

        learningAreas?.forEach((la) => {
          const subjectMarks = learnerMarksMap?.get(la.id);
          if (subjectMarks && subjectMarks.length > 0) {
            // Average if combined/multiple entries
            const avg = subjectMarks.reduce((a, b) => a + b, 0) / subjectMarks.length;
            marks[la.code] = Math.round(avg * 10) / 10;
            total += marks[la.code]!;
            subjectCount++;
          } else {
            marks[la.code] = null;
          }
        });

        return {
          id: learner.id,
          admission_number: learner.admission_number,
          first_name: learner.first_name,
          last_name: learner.last_name,
          marks,
          total: Math.round(total * 10) / 10,
          average: subjectCount > 0 ? Math.round((total / subjectCount) * 10) / 10 : 0,
        };
      });

      // Sort by average descending
      learnerRecords.sort((a, b) => b.average - a.average);

      setReportData({
        learners: learnerRecords,
        learningAreas: learningAreas || [],
        filters,
        gradeName: grade?.name || "",
        streamName,
      });

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

  return { reportData, loading, fetchReport, setReportData };
}
