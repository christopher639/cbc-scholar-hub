import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Users, ArrowUp, Calendar, History } from "lucide-react";
import { PromoteLearnerDialog } from "@/components/PromoteLearnerDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewHistoricalDataDialog } from "@/components/ViewHistoricalDataDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGradeDetail } from "@/hooks/useGradeDetail";
import { Skeleton } from "@/components/ui/skeleton";

const GradeDetail = () => {
  const { grade } = useParams();
  const navigate = useNavigate();
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [historicalDialogOpen, setHistoricalDialogOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [term, setTerm] = useState("Term 3");

  const { gradeData, streams, learners, loading } = useGradeDetail(grade || "");

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

  if (loading) {
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

  const totalLearners = learners.length;
  const totalCapacity = streams.reduce((sum, s) => sum + (s.capacity || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/grades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{gradeData?.name || `Grade ${grade}`}</h1>
            <p className="text-muted-foreground">View all streams in this grade - {totalLearners} total learners</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setHistoricalDialogOpen(true)}>
              <History className="h-4 w-4 mr-2" />
              View History
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
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
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
              <CardDescription>Total Streams</CardDescription>
              <CardTitle className="text-3xl">{streams.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Active streams</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Learners</CardDescription>
              <CardTitle className="text-3xl">{totalLearners}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Out of {totalCapacity} capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average per Stream</CardDescription>
              <CardTitle className="text-3xl">
                {streams.length > 0 ? Math.round(totalLearners / streams.length) : 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Learners per stream</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Available Space</CardDescription>
              <CardTitle className="text-3xl">{Math.max(0, totalCapacity - totalLearners)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">More learners can join</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Streams</CardTitle>
            <CardDescription>{streams.length} streams in this grade</CardDescription>
          </CardHeader>
          <CardContent>
            {streams.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No streams found for this grade</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {streams.map((stream: any) => {
                  const streamLearners = learners.filter(l => l.current_stream_id === stream.id);
                  const percentage = stream.capacity ? (streamLearners.length / stream.capacity) * 100 : 0;
                  
                  return (
                    <Link key={stream.id} to={`/grades/${gradeData?.name || grade}/${stream.name}`}>
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">{stream.name}</CardTitle>
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Enrollment</span>
                              <span className="font-medium">{streamLearners.length}/{stream.capacity || 0}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Learners</CardTitle>
                <CardDescription>{learners.length} learners in this grade</CardDescription>
              </div>
              <Button
                disabled={selectedLearners.length === 0}
                onClick={() => setPromoteDialogOpen(true)}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Promote Selected ({selectedLearners.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {learners.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No learners found in this grade</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3 pr-4">
                        <Checkbox
                          checked={selectedLearners.length === learners.length && learners.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="pb-3 pr-4">Admission No.</th>
                      <th className="pb-3 pr-4">Learner Name</th>
                      <th className="pb-3 pr-4">Stream</th>
                      <th className="pb-3 pr-4">Gender</th>
                      <th className="pb-3">Fee Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {learners.map((learner) => (
                      <tr key={learner.id} className="text-sm hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <Checkbox
                            checked={selectedLearners.includes(learner.id)}
                            onCheckedChange={(checked) => handleSelectLearner(learner.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <Link to={`/learners/${learner.id}`} className="text-primary hover:underline">
                            {learner.admission_number}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 font-medium">{learner.first_name} {learner.last_name}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">{learner.current_stream?.name || "N/A"}</Badge>
                        </td>
                        <td className="py-3 pr-4 capitalize">{learner.gender}</td>
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

        <PromoteLearnerDialog
          open={promoteDialogOpen}
          onOpenChange={setPromoteDialogOpen}
          selectedLearners={selectedLearners}
          currentGrade={grade || ""}
        />

        <ViewHistoricalDataDialog
          open={historicalDialogOpen}
          onOpenChange={setHistoricalDialogOpen}
          onPeriodSelect={(year, term) => {
            setAcademicYear(year);
            setTerm(term);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default GradeDetail;
