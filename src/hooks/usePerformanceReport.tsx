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

interface ExamTypeInfo {
  id: string;
  name: string;
  max_marks: number;
  display_order: number;
}

interface LearnerRecord {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  marks: Record<string, number | null>; // By learning area code
  examMarks: Record<string, Record<string, number | null>>; // By learning area code -> exam type name -> marks
  total: number;
  average: number;
}

interface ReportData {
  learners: LearnerRecord[];
  learningAreas: Array<{ id: string; code: string; name: string }>;
  examTypes: ExamTypeInfo[];
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

      // Fetch exam types
      const { data: examTypesData, error: etError } = await supabase
        .from("exam_types")
        .select("id, name, max_marks, display_order")
        .eq("is_active", true)
        .order("display_order");

      if (etError) throw etError;

      const examTypes: ExamTypeInfo[] = (examTypesData || []).map(et => ({
        id: et.id,
        name: et.name,
        max_marks: et.max_marks || 100,
        display_order: et.display_order || 0,
      }));

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

      // Fetch performance records - filter by grade_id in the performance record
      let perfQuery = supabase
        .from("performance_records")
        .select("learner_id, learning_area_id, marks, exam_type")
        .eq("academic_year", filters.academicYear)
        .eq("grade_id", filters.gradeId);

      if (filters.term !== "all") {
        perfQuery = perfQuery.eq("term", filters.term as any);
      }

      // Only filter by exam_type if not "all" or "combined"
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
          .select("id, admission_number, first_name, last_name, photo_url")
          .in("id", learnerIds)
          .order("first_name");
        
        if (lError) throw lError;
        learners = learnersData || [];
      }

      // Build marks map: learner_id -> learning_area_id -> exam_type -> marks
      const marksMap = new Map<string, Map<string, Map<string, number>>>();
      
      perfRecords?.forEach((record) => {
        if (!marksMap.has(record.learner_id)) {
          marksMap.set(record.learner_id, new Map());
        }
        const learnerMarks = marksMap.get(record.learner_id)!;
        
        if (!learnerMarks.has(record.learning_area_id)) {
          learnerMarks.set(record.learning_area_id, new Map());
        }
        const areaMarks = learnerMarks.get(record.learning_area_id)!;
        
        const examType = record.exam_type || "Unknown";
        areaMarks.set(examType, Number(record.marks));
      });

      // Build learner records with marks
      const learnerRecords: LearnerRecord[] = learners.map((learner) => {
        const learnerMarksMap = marksMap.get(learner.id);
        const marks: Record<string, number | null> = {};
        const examMarks: Record<string, Record<string, number | null>> = {};
        let totalPercentage = 0;
        let subjectCount = 0;

        learningAreas?.forEach((la) => {
          const areaMarksMap = learnerMarksMap?.get(la.id);
          
          // Initialize exam marks for this learning area
          examMarks[la.code] = {};
          examTypes.forEach(et => {
            examMarks[la.code][et.name] = null;
          });
          
          if (areaMarksMap && areaMarksMap.size > 0) {
            // Fill in actual marks for each exam type
            let areaTotal = 0;
            let examCount = 0;
            
            areaMarksMap.forEach((score, examTypeName) => {
              // Find matching exam type (case-insensitive)
              const matchedExamType = examTypes.find(
                et => et.name.toLowerCase().trim() === examTypeName.toLowerCase().trim()
              );
              
              if (matchedExamType) {
                examMarks[la.code][matchedExamType.name] = score;
                // Calculate percentage for this exam
                const percentage = (score / matchedExamType.max_marks) * 100;
                areaTotal += percentage;
                examCount++;
              }
            });
            
            // Calculate average for this learning area
            if (examCount > 0) {
              const areaAverage = areaTotal / examCount;
              marks[la.code] = Math.round(areaAverage * 10) / 10;
              totalPercentage += areaAverage;
              subjectCount++;
            } else {
              marks[la.code] = null;
            }
          } else {
            marks[la.code] = null;
          }
        });

        return {
          id: learner.id,
          admission_number: learner.admission_number,
          first_name: learner.first_name,
          last_name: learner.last_name,
          photo_url: learner.photo_url,
          marks,
          examMarks,
          total: Math.round(totalPercentage * 10) / 10,
          average: subjectCount > 0 ? Math.round((totalPercentage / subjectCount) * 10) / 10 : 0,
        };
      });

      // Sort by average descending
      learnerRecords.sort((a, b) => b.average - a.average);

      setReportData({
        learners: learnerRecords,
        learningAreas: learningAreas || [],
        examTypes,
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