import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

export default function LearnerPerformance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const learner = user?.data;
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (learner) {
      fetchPerformance();
    }
  }, [learner]);

  const fetchPerformance = async () => {
    if (!learner) return;

    try {
      setLoading(true);
      
      // Fetch using learner_id
      const { data, error } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          academic_period:academic_periods(academic_year, term)
        `)
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPerformance(data || []);
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

  const getTermLabel = (term: string) => {
    const termMap: Record<string, string> = {
      term_1: "Term 1",
      term_2: "Term 2",
      term_3: "Term 3",
    };
    return termMap[term] || term;
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (marks >= 60) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (marks >= 50) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Academic Performance</h1>
        <p className="text-muted-foreground">Your exam results and grades</p>
      </div>

      {performance.length > 0 ? (
        <div className="space-y-4">
          {performance.map((record) => (
            <Card key={record.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{record.learning_area?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {record.academic_period?.academic_year} - {getTermLabel(record.academic_period?.term)}
                      </p>
                      {record.exam_type && (
                        <Badge variant="outline" className="mt-1">
                          {record.exam_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold">{record.marks}</div>
                      {record.grade_letter && (
                        <Badge className={getGradeColor(record.marks)}>
                          {record.grade_letter}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {record.remarks && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm"><span className="font-medium">Remarks:</span> {record.remarks}</p>
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
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No performance records yet</h3>
              <p className="text-muted-foreground">Your exam results will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
