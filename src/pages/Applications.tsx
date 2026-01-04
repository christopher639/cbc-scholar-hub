import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  FileText, Search, Eye, CheckCircle, XCircle, Clock, Settings, 
  Mail, User, GraduationCap, Phone, Calendar, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisitorAccess } from "@/hooks/useVisitorAccess";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";

interface Application {
  id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  birth_certificate_number: string | null;
  previous_school: string | null;
  previous_grade: string | null;
  parent_first_name: string;
  parent_last_name: string;
  parent_email: string;
  parent_phone: string;
  parent_occupation: string | null;
  parent_address: string | null;
  applying_for_grade_id: string | null;
  applying_for_grade_name: string;
  boarding_status: string;
  medical_info: string | null;
  allergies: string | null;
  blood_type: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  status: string;
  fee_paid: boolean;
  fee_amount: number;
  payment_reference: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export default function Applications() {
  const queryClient = useQueryClient();
  const { isVisitor, checkAccess } = useVisitorAccess();
  const { schoolInfo } = useSchoolInfo();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
  });

  // Fetch application settings
  const { data: settings } = useQuery({
    queryKey: ["application-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_settings")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { fee_enabled: boolean; fee_amount: number }) => {
      const { error } = await supabase
        .from("application_settings")
        .update(newSettings)
        .eq("id", settings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-settings"] });
      toast.success("Settings updated successfully");
      setSettingsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  // Review application mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ 
      applicationId, 
      action, 
      notes, 
      reason 
    }: { 
      applicationId: string; 
      action: "approve" | "reject"; 
      notes: string; 
      reason: string 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status: action === "approve" ? "approved" : "rejected",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      };

      if (action === "reject") {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;

      // Send email notification
      if (selectedApplication) {
        await supabase.functions.invoke("send-application-status", {
          body: {
            parentEmail: selectedApplication.parent_email,
            parentName: `${selectedApplication.parent_first_name} ${selectedApplication.parent_last_name}`,
            childName: `${selectedApplication.first_name} ${selectedApplication.last_name}`,
            applicationNumber: selectedApplication.application_number,
            status: action,
            rejectionReason: action === "reject" ? reason : null,
            schoolName: schoolInfo?.school_name || "School",
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(`Application ${reviewAction === "approve" ? "approved" : "rejected"} successfully`);
      setReviewDialogOpen(false);
      setViewDialogOpen(false);
      setReviewNotes("");
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast.error("Failed to update application: " + error.message);
    },
  });

  const filteredApplications = applications.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    return (
      app.first_name.toLowerCase().includes(searchLower) ||
      app.last_name.toLowerCase().includes(searchLower) ||
      app.application_number.toLowerCase().includes(searchLower) ||
      app.parent_email.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReview = (action: "approve" | "reject") => {
    if (!checkAccess(`${action} application`)) return;
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const submitReview = () => {
    if (!selectedApplication) return;
    if (reviewAction === "reject" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    reviewMutation.mutate({
      applicationId: selectedApplication.id,
      action: reviewAction,
      notes: reviewNotes,
      reason: rejectionReason,
    });
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            <p className="text-muted-foreground">Manage learner admission applications</p>
          </div>
          {!isVisitor && (
            <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Application Settings
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, application number, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application #</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Parent Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.application_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.first_name} {app.last_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{app.gender}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.applying_for_grade_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{app.parent_first_name} {app.parent_last_name}</p>
                          <p className="text-xs text-muted-foreground">{app.parent_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{format(new Date(app.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {selectedApplication?.application_number} • Submitted on {selectedApplication && format(new Date(selectedApplication.created_at), "PPP")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <Tabs defaultValue="applicant" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="applicant">Applicant</TabsTrigger>
                <TabsTrigger value="parent">Parent</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
              </TabsList>
              
              <TabsContent value="applicant" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">{format(new Date(selectedApplication.date_of_birth), "PPP")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-medium capitalize">{selectedApplication.gender}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Birth Certificate</Label>
                    <p className="font-medium">{selectedApplication.birth_certificate_number || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Applying for Grade</Label>
                    <p className="font-medium">{selectedApplication.applying_for_grade_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Boarding Status</Label>
                    <p className="font-medium capitalize">{selectedApplication.boarding_status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Previous School</Label>
                    <p className="font-medium">{selectedApplication.previous_school || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Previous Grade</Label>
                    <p className="font-medium">{selectedApplication.previous_grade || "-"}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="parent" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Parent Name</Label>
                    <p className="font-medium">{selectedApplication.parent_first_name} {selectedApplication.parent_last_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedApplication.parent_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedApplication.parent_phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Occupation</Label>
                    <p className="font-medium">{selectedApplication.parent_occupation || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">{selectedApplication.parent_address || "-"}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="medical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Blood Type</Label>
                    <p className="font-medium">{selectedApplication.blood_type || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Allergies</Label>
                    <p className="font-medium">{selectedApplication.allergies || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Medical Info</Label>
                    <p className="font-medium">{selectedApplication.medical_info || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Emergency Contact</Label>
                    <p className="font-medium">{selectedApplication.emergency_contact || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Emergency Phone</Label>
                    <p className="font-medium">{selectedApplication.emergency_phone || "-"}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {selectedApplication?.status === "pending" && !isVisitor && (
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => handleReview("reject")}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => handleReview("approve")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          )}

          {selectedApplication?.status !== "pending" && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Status:</strong> {selectedApplication?.status === "approved" ? "Approved" : "Rejected"}
              </p>
              {selectedApplication?.reviewed_at && (
                <p className="text-sm text-muted-foreground">
                  Reviewed on {format(new Date(selectedApplication.reviewed_at), "PPP")}
                </p>
              )}
              {selectedApplication?.rejection_reason && (
                <p className="text-sm mt-2">
                  <strong>Reason:</strong> {selectedApplication.rejection_reason}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" 
                ? "The applicant will receive an approval email notification."
                : "Please provide a reason for rejection."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {reviewAction === "reject" && (
              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why this application is being rejected..."
                  rows={3}
                />
              </div>
            )}
            <div>
              <Label>Review Notes (Internal)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any internal notes about this review..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {reviewMutation.isPending ? "Processing..." : reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Settings</DialogTitle>
            <DialogDescription>
              Configure application fee and other settings
            </DialogDescription>
          </DialogHeader>
          
          {settings && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Application Fee</Label>
                  <p className="text-sm text-muted-foreground">
                    Require payment before application submission
                  </p>
                </div>
                <Switch
                  checked={settings.fee_enabled}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ 
                      fee_enabled: checked, 
                      fee_amount: settings.fee_amount 
                    })
                  }
                />
              </div>
              
              {settings.fee_enabled && (
                <div>
                  <Label>Fee Amount (KES)</Label>
                  <Input
                    type="number"
                    value={settings.fee_amount}
                    onChange={(e) => 
                      updateSettingsMutation.mutate({ 
                        fee_enabled: settings.fee_enabled, 
                        fee_amount: parseFloat(e.target.value) || 0 
                      })
                    }
                    placeholder="Enter fee amount"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSettingsDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
