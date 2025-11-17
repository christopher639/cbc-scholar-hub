import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useReportAnalytics() {
  const [analytics, setAnalytics] = useState({
    learnerStats: {
      total: 0,
      byGender: { male: 0, female: 0, other: 0 },
      byGrade: [] as Array<{ grade: string; count: number }>,
    },
    feeStats: {
      totalCollected: 0,
      outstanding: 0,
      collectionRate: 0,
    },
    admissionTrends: [] as Array<{ month: string; count: number }>,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Learner statistics
      const { data: learners } = await supabase
        .from("learners")
        .select("gender, current_grade_id, enrollment_date, grades(name)");

      const total = learners?.length || 0;
      const byGender = learners?.reduce(
        (acc, l) => {
          acc[l.gender] = (acc[l.gender] || 0) + 1;
          return acc;
        },
        { male: 0, female: 0, other: 0 } as any
      ) || { male: 0, female: 0, other: 0 };

      // Grade distribution
      const gradeMap = new Map<string, number>();
      learners?.forEach((l: any) => {
        const gradeName = l.grades?.name || "Unassigned";
        gradeMap.set(gradeName, (gradeMap.get(gradeName) || 0) + 1);
      });

      const byGrade = Array.from(gradeMap.entries()).map(([grade, count]) => ({
        grade,
        count,
      }));

      // Fee statistics
      const { data: payments } = await supabase
        .from("fee_payments")
        .select("amount_paid");

      const totalCollected = payments?.reduce(
        (sum, p) => sum + Number(p.amount_paid),
        0
      ) || 0;

      const { data: structures } = await supabase
        .from("fee_structures")
        .select("amount")
        .limit(1);

      const feePerLearner = structures?.[0]?.amount || 0;
      const totalExpected = feePerLearner * total;
      const outstanding = Math.max(0, totalExpected - totalCollected);
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      // Admission trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const admissionMap = new Map<string, number>();
      learners
        ?.filter((l) => new Date(l.enrollment_date) >= sixMonthsAgo)
        .forEach((l) => {
          const month = new Date(l.enrollment_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          });
          admissionMap.set(month, (admissionMap.get(month) || 0) + 1);
        });

      const admissionTrends = Array.from(admissionMap.entries()).map(
        ([month, count]) => ({ month, count })
      );

      setAnalytics({
        learnerStats: { total, byGender, byGrade },
        feeStats: { totalCollected, outstanding, collectionRate },
        admissionTrends,
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

  return { analytics, loading, fetchAnalytics };
}
