import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, ArrowUp, FileDown, Calendar } from "lucide-react";
import { useStreamDetail } from "@/hooks/useStreamDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PromoteLearnerDialog } from "@/components/PromoteLearnerDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { downloadFeeBalanceReport } from "@/utils/feeReportGenerator";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

const StreamDetail = () => {
  const { grade, stream } = useParams();
  const [gradeId, setGradeId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [term, setTerm] = useState<Term>("term_3");
  const { toast } = useToast();

  useEffect(() => {
    const fetchIds = async () => {
      // Get grade ID from grade name
      const { data: gradeData } = await supabase
        .from("grades")
        .select("id")
        .eq("name", grade)
        .maybeSingle();

      if (gradeData) {
        setGradeId(gradeData.id);

        // Get stream ID from stream name and grade ID
        const { data: streamData } = await supabase
          .from("streams")
          .select("id")
          .eq("grade_id", gradeData.id)
          .eq("name", stream)
          .maybeSingle();

        if (streamData) {
          setStreamId(streamData.id);
        }
      }
    };

    if (grade && stream) {
      fetchIds();
    }
  }, [grade, stream]);

  const { streamData, learners, stats, loading, refetch } = useStreamDetail(
    gradeId,
    streamId,
    academicYear,
    term
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLearners(learners.map(l => l.id));
    } else {
      setSelectedLearners([]);
    }
  };

  const handleSelectLearner = (learnerId: string, checked: boolean) => {
    if (checked) {
      setSelectedLearners([...selectedLearners, learnerId]);
    } else {
      setSelectedLearners(selectedLearners.filter(id => id !== learnerId));
    }
  };

  const handleDownloadFeeBalances = () => {
    if (learners.length === 0) {
      toast({
        title: "No Data",
        description: "No learners found to generate report",
        variant: "destructive",
      });
      return;
    }

    downloadFeeBalanceReport(
      learners,
      grade || "",
      stream || "",
      academicYear,
      term
    );

    toast({
      title: "Success",
      description: "Fee balance report downloaded successfully",
    });
  };

  if (loading || !gradeId || !streamId) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/grades/${grade}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {streamData?.grade?.name || grade} - {stream} Stream
            </h1>
            <p className="text-muted-foreground">{stats.total} learners in this stream</p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={selectedLearners.length === 0}
              onClick={() => setPromoteDialogOpen(true)}
              className="gap-2"
            >
              <ArrowUp className="h-4 w-4" />
              Promote Selected ({selectedLearners.length})
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownloadFeeBalances}>
              <FileDown className="h-4 w-4" />
              Download Fee Balances
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export List
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex gap-4 flex-1">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Academic Year</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024/2025</SelectItem>
                      <SelectItem value="2023-2024">2023/2024</SelectItem>
                      <SelectItem value="2022-2023">2022/2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Term</Label>
                  <Select value={term} onValueChange={(value) => setTerm(value as Term)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Learners</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Out of {stats.capacity} capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Male Learners</CardDescription>
              <CardTitle className="text-3xl">{stats.male}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0}% of stream
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Female Learners</CardDescription>
              <CardTitle className="text-3xl">{stats.female}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0}% of stream
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Fee Collection</CardDescription>
              <CardTitle className="text-3xl">{Math.round(stats.feeCollectionRate)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Payment rate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Learners</CardTitle>
            <CardDescription>{learners.length} learners in this stream</CardDescription>
          </CardHeader>
          <CardContent>
            {learners.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No learners found in this stream</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3 pr-4">Admission No.</th>
                      <th className="pb-3 pr-4">Learner Name</th>
                      <th className="pb-3 pr-4">Gender</th>
                      <th className="pb-3 pr-4">Date of Birth</th>
                      <th className="pb-3">Fee Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {learners.map((learner) => (
                      <tr key={learner.id} className="text-sm hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <Link to={`/learners/${learner.id}`} className="text-primary hover:underline">
                            {learner.admission_number}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {learner.first_name} {learner.last_name}
                        </td>
                        <td className="py-3 pr-4 capitalize">{learner.gender}</td>
                        <td className="py-3 pr-4">{new Date(learner.date_of_birth).toLocaleDateString()}</td>
                        <td className="py-3">
                          <Badge variant={learner.feeBalance > 0 ? "destructive" : "default"}>
                            KES {learner.feeBalance.toLocaleString()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StreamDetail;
