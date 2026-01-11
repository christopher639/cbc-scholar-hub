import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  FileText, Search, Eye, CheckCircle, XCircle, Clock, Settings, 
  Mail, User, GraduationCap, Phone, Calendar, Filter, Download,
  ClipboardList, Users, TrendingUp
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
import { Separator } from "@/components/ui/separator";
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

interface ApplicationSettings {
  id: string;
  fee_enabled: boolean;
  fee_amount: number;
  applications_open: boolean;
  interview_enabled: boolean;
  interview_date: string | null;
  interview_time: string | null;
  interview_location: string | null;
  interview_requirements: string | null;
  interview_fee: number | null;
  interview_fee_note: string | null;
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
      return data as ApplicationSettings;
    },
  });

  // Local settings state for editing
  const [localSettings, setLocalSettings] = useState<Partial<ApplicationSettings>>({});

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<ApplicationSettings>) => {
      const { error } = await supabase
        .from("application_settings")
        .update(newSettings)
        .eq("id", settings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-settings"] });
      toast.success("Settings updated successfully");
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
        return <Badge variant="outline" className="bg-accent text-accent-foreground border-border"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
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

  const openSettings = () => {
    setLocalSettings({
      applications_open: settings?.applications_open,
      fee_enabled: settings?.fee_enabled,
      fee_amount: settings?.fee_amount,
      interview_enabled: settings?.interview_enabled,
      interview_date: settings?.interview_date,
      interview_time: settings?.interview_time,
      interview_location: settings?.interview_location,
      interview_requirements: settings?.interview_requirements,
      interview_fee: settings?.interview_fee,
      interview_fee_note: settings?.interview_fee_note,
    });
    setSettingsDialogOpen(true);
  };

  const saveSettings = () => {
    updateSettingsMutation.mutate(localSettings);
    setSettingsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" />
              Applications
            </h1>
            <p className="text-muted-foreground">Manage learner admission applications</p>
          </div>
          
          {/* Search - between title and button on large screens */}
          <div className="w-full lg:flex-1 lg:max-w-md lg:mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, application number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>
          </div>
          
          {!isVisitor && (
            <Button onClick={openSettings} className="gap-2 flex-shrink-0">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          )}
        </div>

        {/* Applications Table with inline stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Applications List</CardTitle>
                <CardDescription>
                  {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              
              {/* Inline Stats */}
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "all" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-base font-semibold">{stats.total}</span>
                  <span className="text-sm text-muted-foreground">Total</span>
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "pending" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span className="text-base font-semibold">{stats.pending}</span>
                  <span className="text-sm text-muted-foreground">Pending</span>
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "approved" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-base font-semibold">{stats.approved}</span>
                  <span className="text-sm text-muted-foreground">Approved</span>
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "rejected" ? "bg-destructive/10 text-destructive" : "hover:bg-muted"
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="text-base font-semibold">{stats.rejected}</span>
                  <span className="text-sm text-muted-foreground">Rejected</span>
                </button>
              </div>
            </div>
            
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Application #</TableHead>
                  <TableHead className="font-semibold">Applicant</TableHead>
                  <TableHead className="font-semibold">Grade</TableHead>
                  <TableHead className="font-semibold">Parent Contact</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading applications...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No applications found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-medium">{app.application_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{app.first_name} {app.last_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{app.gender}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{app.applying_for_grade_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{app.parent_first_name} {app.parent_last_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {app.parent_phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(app.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setSelectedApplication(app);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View
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
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {selectedApplication?.first_name} {selectedApplication?.last_name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <span className="font-mono">{selectedApplication?.application_number}</span>
                  <span>•</span>
                  <span>{selectedApplication && format(new Date(selectedApplication.created_at), "PPP")}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedApplication && (
            <Tabs defaultValue="applicant" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="applicant" className="gap-1">
                  <User className="h-4 w-4" />
                  Applicant
                </TabsTrigger>
                <TabsTrigger value="parent" className="gap-1">
                  <Users className="h-4 w-4" />
                  Parent
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-1">
                  <FileText className="h-4 w-4" />
                  Medical
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="applicant" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
                    <p className="font-medium">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date of Birth</Label>
                    <p className="font-medium">{format(new Date(selectedApplication.date_of_birth), "PPP")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Gender</Label>
                    <p className="font-medium capitalize">{selectedApplication.gender}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Birth Certificate</Label>
                    <p className="font-medium">{selectedApplication.birth_certificate_number || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Applying for Grade</Label>
                    <Badge variant="secondary">{selectedApplication.applying_for_grade_name}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Boarding Status</Label>
                    <p className="font-medium capitalize">{selectedApplication.boarding_status}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Previous School</Label>
                    <p className="font-medium">{selectedApplication.previous_school || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Previous Grade</Label>
                    <p className="font-medium">{selectedApplication.previous_grade || "-"}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="parent" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Parent Name</Label>
                    <p className="font-medium">{selectedApplication.parent_first_name} {selectedApplication.parent_last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                    <p className="font-medium">{selectedApplication.parent_email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
                    <p className="font-medium">{selectedApplication.parent_phone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Occupation</Label>
                    <p className="font-medium">{selectedApplication.parent_occupation || "-"}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Address</Label>
                    <p className="font-medium">{selectedApplication.parent_address || "-"}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="medical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Blood Type</Label>
                    <p className="font-medium">{selectedApplication.blood_type || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Allergies</Label>
                    <p className="font-medium">{selectedApplication.allergies || "-"}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Medical Info</Label>
                    <p className="font-medium">{selectedApplication.medical_info || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Emergency Contact</Label>
                    <p className="font-medium">{selectedApplication.emergency_contact || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Emergency Phone</Label>
                    <p className="font-medium">{selectedApplication.emergency_phone || "-"}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {selectedApplication?.status === "pending" && !isVisitor && (
            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => handleReview("reject")} className="gap-2">
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button onClick={() => handleReview("approve")} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </DialogFooter>
          )}

          {selectedApplication?.status !== "pending" && (
            <div className={`mt-4 p-4 rounded-lg ${selectedApplication?.status === "approved" ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
              <p className="text-sm font-medium">
                Status: {selectedApplication?.status === "approved" ? "✓ Approved" : "✕ Rejected"}
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
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === "approve" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
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
              <div className="space-y-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why this application is being rejected..."
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Application Settings
            </DialogTitle>
            <DialogDescription>
              Configure application process and fees
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Applications Open */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label className="font-medium">Applications Open</Label>
                <p className="text-sm text-muted-foreground">
                  Allow visitors to submit new applications
                </p>
              </div>
              <Switch
                checked={localSettings.applications_open ?? settings?.applications_open}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, applications_open: checked }))
                }
              />
            </div>

            <Separator />

            {/* Application Fee */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Application Fee</Label>
                  <p className="text-sm text-muted-foreground">
                    Charge fee for application submission
                  </p>
                </div>
                <Switch
                  checked={localSettings.fee_enabled ?? settings?.fee_enabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, fee_enabled: checked }))
                  }
                />
              </div>
              
              {(localSettings.fee_enabled ?? settings?.fee_enabled) && (
                <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-3">
                  <div className="space-y-2">
                    <Label>Fee Amount (KES)</Label>
                    <Input
                      type="number"
                      value={localSettings.fee_amount ?? settings?.fee_amount ?? 0}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ 
                          ...prev, 
                          fee_amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      placeholder="Enter fee amount"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Interview Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Interview Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require interview as part of admission process
                  </p>
                </div>
                <Switch
                  checked={localSettings.interview_enabled ?? settings?.interview_enabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev, interview_enabled: checked }))
                  }
                />
              </div>
              
              {(localSettings.interview_enabled ?? settings?.interview_enabled) && (
                <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Interview Date</Label>
                      <Input
                        type="date"
                        value={localSettings.interview_date ?? settings?.interview_date ?? ""}
                        onChange={(e) => 
                          setLocalSettings(prev => ({ ...prev, interview_date: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interview Time</Label>
                      <Input
                        type="text"
                        placeholder="e.g., 9:00 AM - 12:00 PM"
                        value={localSettings.interview_time ?? settings?.interview_time ?? ""}
                        onChange={(e) => 
                          setLocalSettings(prev => ({ ...prev, interview_time: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Interview Location</Label>
                    <Input
                      placeholder="e.g., School Main Hall"
                      value={localSettings.interview_location ?? settings?.interview_location ?? ""}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, interview_location: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interview Requirements</Label>
                    <Textarea
                      placeholder="List requirements (e.g., bring report cards, birth certificate, etc.)"
                      value={localSettings.interview_requirements ?? settings?.interview_requirements ?? ""}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, interview_requirements: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interview Fee (KES)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localSettings.interview_fee ?? settings?.interview_fee ?? 0}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ 
                          ...prev, 
                          interview_fee: parseFloat(e.target.value) || 0 
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Note</Label>
                    <Input
                      placeholder="e.g., This fee is non-refundable"
                      value={localSettings.interview_fee_note ?? settings?.interview_fee_note ?? ""}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, interview_fee_note: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}