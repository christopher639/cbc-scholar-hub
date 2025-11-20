import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, MapPin, Calendar, FileText, DollarSign, TrendingUp, History, ArrowLeft, Edit, UserX } from "lucide-react";
import { PromotionHistoryDialog } from "@/components/PromotionHistoryDialog";
import { EditLearnerDialog } from "@/components/EditLearnerDialog";
import { TransferLearnerDialog } from "@/components/TransferLearnerDialog";
import { useLearnerDetail } from "@/hooks/useLearnerDetail";
import { Skeleton } from "@/components/ui/skeleton";

const LearnerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [promotionHistoryOpen, setPromotionHistoryOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const { learner, loading, refetch } = useLearnerDetail(id || "");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!learner) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Learner not found</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link to="/learners">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Learners
          </Button>
        </Link>

        {/* Header Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={learner.photo_url} alt={`${learner.first_name} ${learner.last_name}`} />
                <AvatarFallback className="text-3xl">
                  {learner.first_name[0]}{learner.last_name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {learner.first_name} {learner.last_name}
                  </h1>
                  <p className="text-muted-foreground">Admission No: {learner.admission_number}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-base">
                    {learner.current_grade?.name} {learner.current_stream?.name}
                  </Badge>
                  {learner.status === "alumni" ? (
                    <Badge variant="default" className="text-base bg-purple-600">Alumni</Badge>
                  ) : (
                    <Badge className="text-base">Active</Badge>
                  )}
                  {learner.is_staff_child && (
                    <Badge variant="outline" className="text-base">Staff Child</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Born: {new Date(learner.date_of_birth).toLocaleDateString()} ({calculateAge(learner.date_of_birth)} years)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="capitalize">{learner.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Enrolled: {new Date(learner.enrollment_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button onClick={() => setPromotionHistoryOpen(true)} variant="outline" className="gap-2">
                  <History className="h-4 w-4" />
                  View Promotion History
                </Button>
                <Button onClick={() => setEditDialogOpen(true)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Information
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="parent">Parent/Guardian</TabsTrigger>
            {learner.status === "alumni" && (
              <TabsTrigger value="alumni">Alumni Info</TabsTrigger>
            )}
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">First Name</p>
                    <p className="text-base font-medium">{learner.first_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                    <p className="text-base font-medium">{learner.last_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-base font-medium">{new Date(learner.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="text-base font-medium capitalize">{learner.gender}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                    <p className="text-base font-medium">{learner.admission_number}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
                    <p className="text-base font-medium">{new Date(learner.enrollment_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {learner.medical_info && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Medical Information</p>
                      <p className="text-base">{learner.medical_info}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Grade</p>
                    <Badge variant="secondary" className="text-base">{learner.current_grade?.name}</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Stream</p>
                    <Badge variant="outline" className="text-base">{learner.current_stream?.name}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Records */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Records</CardTitle>
                <CardDescription>Recent assessment results</CardDescription>
              </CardHeader>
              <CardContent>
                {learner.performance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No performance records found</p>
                ) : (
                  <div className="space-y-4">
                    {learner.performance.map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{record.learning_area?.name}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{record.academic_year}</span>
                            {record.term && <span>• {record.term.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>}
                            {record.exam_type && <span>• {record.exam_type}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge className="text-base">{record.grade_letter || 'N/A'}</Badge>
                            <span className="text-2xl font-bold">{record.marks}%</span>
                          </div>
                          {record.remarks && (
                            <p className="text-xs text-muted-foreground mt-1">{record.remarks}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Information</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Academic Year: <span className="font-medium">{learner.currentAcademicYear || "N/A"}</span> | 
                  Current Term: <span className="font-medium">{learner.currentTerm?.replace("_", " ").toUpperCase() || "N/A"}</span>
                </p>
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Current Term Fees</CardDescription>
                  <CardTitle className="text-2xl">KES {learner.feeInfo.currentTermFees?.toLocaleString() || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Expected for current term</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Amount Paid</CardDescription>
                  <CardTitle className="text-2xl text-green-600">KES {learner.feeInfo.currentTermPaid?.toLocaleString() || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Payments received
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Current Balance</CardDescription>
                  <CardTitle className={`text-2xl ${learner.feeInfo.currentTermBalance < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {learner.feeInfo.currentTermBalance < 0 ? '-' : ''}KES {Math.abs(learner.feeInfo.currentTermBalance || 0).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {learner.feeInfo.currentTermBalance < 0 ? 'Credit/Overpayment' : 'Amount due'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Recent fee transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {learner.feeInfo.transactions?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payment records found</p>
                ) : (
                  <div className="space-y-4">
                    {learner.feeInfo.transactions?.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">KES {Number(payment.amount_paid).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                          {payment.receipt_number && (
                            <p className="text-xs text-muted-foreground">Receipt: {payment.receipt_number}</p>
                          )}
                        </div>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parent/Guardian Tab */}
          <TabsContent value="parent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
              </CardHeader>
              <CardContent>
                {!learner.parent ? (
                  <p className="text-center text-muted-foreground py-8">No parent/guardian information available</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="text-base font-medium">{learner.parent.first_name} {learner.parent.last_name}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base font-medium">{learner.parent.phone}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base font-medium">{learner.parent.email}</p>
                        </div>
                      </div>
                      {learner.parent.occupation && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                          <p className="text-base font-medium">{learner.parent.occupation}</p>
                        </div>
                      )}
                    </div>
                    {learner.parent.address && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Address</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <p className="text-base">{learner.parent.address}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alumni Info Tab */}
          {learner.status === "alumni" && learner.alumni && learner.alumni.length > 0 && (
            <TabsContent value="alumni" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alumni Information</CardTitle>
                  <CardDescription>Graduation details and records</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Graduation Year</p>
                      <p className="text-2xl font-bold text-purple-600">{learner.alumni[0].graduation_year}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Graduation Date</p>
                      <p className="text-base font-medium">{new Date(learner.alumni[0].graduation_date).toLocaleDateString()}</p>
                    </div>
                    {learner.alumni[0].final_grade && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Final Grade</p>
                        <Badge variant="secondary" className="text-base">
                          {learner.alumni[0].final_grade.name}
                        </Badge>
                      </div>
                    )}
                    {learner.alumni[0].final_stream && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Final Stream</p>
                        <Badge variant="outline" className="text-base">
                          {learner.alumni[0].final_stream.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {learner.alumni[0].notes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-base">{learner.alumni[0].notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <PromotionHistoryDialog
          open={promotionHistoryOpen}
          onOpenChange={setPromotionHistoryOpen}
          learnerName={`${learner.first_name} ${learner.last_name}`}
          promotionHistory={learner.promotionHistory}
        />
        
        <EditLearnerDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          learner={learner}
          onSuccess={refetch}
        />
      </div>
    </DashboardLayout>
  );
};

export default LearnerProfile;
