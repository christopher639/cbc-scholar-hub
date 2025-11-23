import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsFilters {
  academicYear?: string;
  term?: string;
  examType?: string;
  gradeId?: string;
  streamId?: string;
  learningAreaId?: string;
}

export function usePerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async (filters: AnalyticsFilters) => {
    try {
      setLoading(true);

      let query = supabase
        .from("performance_records")
        .select(`
          id,
          marks,
          grade_letter,
          academic_year,
          term,
          exam_type,
          learner:learners(
            id,
            admission_number,
            first_name,
            last_name,
            current_grade:grades(name),
            current_stream:streams(name)
          ),
          learning_area:learning_areas(
            name,
            code
          ),
          grade:grades(name),
          stream:streams(name)
        `);

      if (filters.academicYear) {
        query = query.eq("academic_year", filters.academicYear);
      }
      if (filters.term) {
        query = query.eq("term", filters.term as any);
      }
      if (filters.examType) {
        query = query.eq("exam_type", filters.examType);
      }
      if (filters.gradeId) {
        query = query.eq("grade_id", filters.gradeId);
      }
      if (filters.streamId) {
        query = query.eq("stream_id", filters.streamId);
      }
      if (filters.learningAreaId) {
        query = query.eq("learning_area_id", filters.learningAreaId);
      }

      const { data, error } = await query.order("marks", { ascending: false });

      if (error) throw error;

      // Calculate averages and rankings
      const learnerScores = new Map<string, { total: number; count: number; learner: any }>();
      
      data?.forEach((record) => {
        const learnerId = record.learner?.id;
        if (!learnerId) return;

        if (!learnerScores.has(learnerId)) {
          learnerScores.set(learnerId, {
            total: 0,
            count: 0,
            learner: record.learner,
          });
        }

        const current = learnerScores.get(learnerId)!;
        current.total += Number(record.marks);
        current.count += 1;
      });

      // Convert to array and calculate averages
      const results = Array.from(learnerScores.entries()).map(([learnerId, data]) => ({
        learner_id: learnerId,
        learner: data.learner,
        average_marks: data.total / data.count,
        total_marks: data.total,
        subjects_count: data.count,
        grade: data.learner?.current_grade,
        stream: data.learner?.current_stream,
      }));

      // Sort by average marks descending
      results.sort((a, b) => b.average_marks - a.average_marks);

      // Add rank
      const rankedResults = results.map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

      setAnalytics(rankedResults);
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

  return { analytics, loading, fetchAnalytics };
}
