import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function LearnerAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const learner = user?.data;
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (learner) {
      fetchAssignments();
    }
  }, [learner]);

  const fetchAssignments = async () => {
    if (!learner) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("learner_id", learner.id)
        .eq("sender_type", "assignment")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
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
        <h1 className="text-3xl font-bold mb-2">Assignments</h1>
        <p className="text-muted-foreground">View your holiday assignments and tasks</p>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Assignment</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(assignment.created_at), "MMM dd, yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={assignment.is_read ? "secondary" : "default"}>
                    {assignment.is_read ? "Read" : "New"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{assignment.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-muted-foreground">Your assignments will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
