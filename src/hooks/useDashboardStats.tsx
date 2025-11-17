import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalLearners: 0,
    activeStreams: 0,
    feeCollection: 0,
    pendingAdmissions: 0,
  });
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get total learners
      const { count: learnersCount } = await supabase
        .from("learners")
        .select("*", { count: "exact", head: true });

      // Get active streams
      const { count: streamsCount } = await supabase
        .from("streams")
        .select("*", { count: "exact", head: true });

      // Get fee collection
      const { data: paymentsData } = await supabase
        .from("fee_payments")
        .select("amount_paid");

      const totalCollection = paymentsData?.reduce(
        (sum, payment) => sum + Number(payment.amount_paid),
        0
      ) || 0;

      // Get recent admissions
      const { data: admissionsData } = await supabase
        .from("learners")
        .select(`
          admission_number,
          first_name,
          last_name,
          enrollment_date,
          current_grade:grades(name),
          current_stream:streams(name)
        `)
        .order("enrollment_date", { ascending: false })
        .limit(5);

      // Get grade distribution
      const { data: gradesData } = await supabase
        .from("grades")
        .select(`
          name,
          streams(id)
        `);

      const distribution = await Promise.all(
        (gradesData || []).map(async (grade) => {
          const { count } = await supabase
            .from("learners")
            .select("*", { count: "exact", head: true })
            .eq("current_grade_id", grade.name);

          return {
            grade: grade.name,
            students: count || 0,
            streams: grade.streams?.length || 0,
          };
        })
      );

      setStats({
        totalLearners: learnersCount || 0,
        activeStreams: streamsCount || 0,
        feeCollection: totalCollection,
        pendingAdmissions: 0, // Can be calculated based on status field if added
      });

      setRecentAdmissions(admissionsData || []);
      setGradeDistribution(distribution);
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

  return { stats, recentAdmissions, gradeDistribution, loading, fetchStats };
}
