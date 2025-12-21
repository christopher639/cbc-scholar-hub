import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLearnerJourney } from "@/hooks/useLearnerJourney";
import { Loader2, TrendingUp, GraduationCap, ArrowRight, BookOpen, Award } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LearnerJourneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerId: string;
}

export function LearnerJourneyDialog({
  open,
  onOpenChange,
  learnerId,
}: LearnerJourneyDialogProps) {
  const { journeyData, loading, fetchLearnerJourney } = useLearnerJourney();

  useEffect(() => {
    if (open && learnerId) {
      fetchLearnerJourney(learnerId);
    }
  }, [open, learnerId]);

  const getTermLabel = (term: string) => {
    return term.replace("term_", "Term ");
  };

  const getGradeColor = (average: number) => {
    if (average >= 80) return "text-primary bg-primary/10";
    if (average >= 60) return "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
    if (average >= 40) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
    return "text-destructive bg-destructive/10";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Journey
          </DialogTitle>
          <DialogDescription>
            Complete academic history and performance tracking
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : journeyData ? (
            <div className="space-y-6">
              {/* Learner Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {journeyData.learner.first_name} {journeyData.learner.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Admission Number</p>
                      <p className="font-medium">{journeyData.learner.admission_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Grade</p>
                      <p className="font-medium">{journeyData.learner.current_grade?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stream</p>
                      <p className="font-medium">{journeyData.learner.current_stream?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={journeyData.learner.status === "active" ? "default" : "secondary"}>
                        {journeyData.learner.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Enrollment Date</p>
                      <p className="font-medium">
                        {new Date(journeyData.learner.enrollment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alumni Status */}
              {journeyData.alumni && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5 text-primary" />
                      Alumni Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Graduation Year</p>
                        <p className="font-medium">{journeyData.alumni.graduation_year}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Graduation Date</p>
                        <p className="font-medium">
                          {new Date(journeyData.alumni.graduation_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Final Grade</p>
                        <p className="font-medium">{journeyData.alumni.final_grade?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Final Stream</p>
                        <p className="font-medium">{journeyData.alumni.final_stream?.name || "N/A"}</p>
                      </div>
                    </div>
                    {journeyData.alumni.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm mt-1">{journeyData.alumni.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Promotion History */}
              {journeyData.promotions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" />
                      Promotion History
                    </CardTitle>
                    <CardDescription>
                      {journeyData.promotions.length} promotion(s) recorded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {journeyData.promotions.map((promotion: any, index: number) => (
                        <div key={promotion.id}>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">
                                  {promotion.from_grade?.name || "Unknown"} -{" "}
                                  {promotion.from_stream?.name || "No Stream"}
                                </Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <Badge>
                                  {promotion.to_grade?.name || "Unknown"} -{" "}
                                  {promotion.to_stream?.name || "No Stream"}
                                </Badge>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span>{promotion.academic_year}</span>
                                <span className="mx-2">•</span>
                                <span>
                                  {new Date(promotion.promotion_date).toLocaleDateString()}
                                </span>
                              </div>
                              {promotion.notes && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {promotion.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          {index < journeyData.promotions.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Summary by Period */}
              {journeyData.performance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5" />
                      Performance Summary
                    </CardTitle>
                    <CardDescription>
                      Academic performance across all terms and grades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {journeyData.performance.map((period: any, index: number) => (
                        <div key={`${period.academic_year}-${period.term}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">
                                  {period.academic_year} - {getTermLabel(period.term)}
                                </Badge>
                                {period.grade && (
                                  <span className="text-sm text-muted-foreground">
                                    {period.grade} {period.stream ? `- ${period.stream}` : ""}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Average</p>
                                  <p
                                    className={`text-lg font-bold ${getGradeColor(
                                      period.average_marks
                                    )}`}
                                  >
                                    {period.average_marks.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Subjects</p>
                                  <p className="text-lg font-semibold">
                                    {period.subjects_count}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Total Marks</p>
                                  <p className="text-lg font-semibold">{period.total_marks}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          {index < journeyData.performance.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transfer Records */}
              {journeyData.transfers.length > 0 && (
                <Card className="border-orange-200 dark:border-orange-900">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600 dark:text-orange-400">
                      Transfer Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {journeyData.transfers.map((transfer: any) => (
                        <div key={transfer.id}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{transfer.destination_school}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transfer.transfer_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {transfer.reason && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Reason: {transfer.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No journey data available
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
