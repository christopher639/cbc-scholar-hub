import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useRecentMessages } from "@/hooks/useRecentMessages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Mail, MessageSquare, Clock, CheckCircle2, XCircle, Users, GraduationCap, Inbox, Eye, Phone, User, BarChart3, Timer, Play, RefreshCw, Reply, EyeOff, FileText, Search, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function Communication() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { grades } = useGrades();
  const { streams } = useStreams();
  const { academicYears } = useAcademicYears();
  const { data: recentMessages, isLoading: messagesLoading } = useRecentMessages();
  const [loading, setLoading] = useState(false);
  const [showRepliedMessages, setShowRepliedMessages] = useState(false);
  const [showAllRecentMessages, setShowAllRecentMessages] = useState(false);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [selectedContactMessage, setSelectedContactMessage] = useState<any>(null);
  
  // Report card email states
  const [reportCardLoading, setReportCardLoading] = useState(false);
  const [learnerSearch, setLearnerSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [reportCardForm, setReportCardForm] = useState({
    academicYear: "",
    term: "term_1",
    examType: "combined",
    recipientEmail: "",
  });
  
  const [formData, setFormData] = useState({
    messageType: "both",
    recipientType: "all_parents",
    gradeId: "",
    streamId: "",
    subject: "",
    message: "",
  });


  // Fetch fee reminder automation settings
  const { data: automationSettings, isLoading: automationSettingsLoading, refetch: refetchAutomation } = useQuery({
    queryKey: ["fee-reminder-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_reminder_settings")
        .select("*")
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const [automationForm, setAutomationForm] = useState({
    isEnabled: false,
    intervalDays: 7,
    scope: "school" as "school" | "grade",
    gradeId: "",
    includeCurrentTerm: true,
    includePreviousBalance: true,
  });

  // Sync automation form with fetched settings
  useEffect(() => {
    if (automationSettings) {
      setAutomationForm({
        isEnabled: automationSettings.is_enabled || false,
        intervalDays: automationSettings.interval_days || 7,
        scope: (automationSettings.scope as "school" | "grade") || "school",
        gradeId: automationSettings.grade_id || "",
        includeCurrentTerm: automationSettings.include_current_term ?? true,
        includePreviousBalance: automationSettings.include_previous_balance ?? true,
      });
    }
  }, [automationSettings]);

  // Fetch visitor contact messages
  const { data: contactMessages, isLoading: contactLoading } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);
      
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleOpenReply = (msg: any) => {
    setSelectedContactMessage(msg);
    setReplyMessage("");
    setReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedContactMessage || !replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive",
      });
      return;
    }

    setReplyLoading(true);
    try {
      const response = await supabase.functions.invoke("send-reply-message", {
        body: {
          contactMessageId: selectedContactMessage.id,
          replyMessage: replyMessage.trim(),
        },
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result.success) {
        // Mark message as read after successful reply
        await supabase
          .from("contact_messages")
          .update({ is_read: true })
          .eq("id", selectedContactMessage.id);
        
        toast({
          title: "Success",
          description: result.message,
        });
        setReplyDialogOpen(false);
        setSelectedContactMessage(null);
        setReplyMessage("");
        queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send reply",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const filteredStreams = formData.gradeId
    ? streams.filter((stream) => stream.grade_id === formData.gradeId)
    : [];


  const handleSaveAutomation = async () => {
    setAutomationLoading(true);
    try {
      const now = new Date();
      const nextRun = automationForm.isEnabled
        ? new Date(now.getTime() + automationForm.intervalDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const updateData = {
        is_enabled: automationForm.isEnabled,
        interval_days: automationForm.intervalDays,
        scope: automationForm.scope,
        grade_id: automationForm.scope === "grade" ? automationForm.gradeId : null,
        include_current_term: automationForm.includeCurrentTerm,
        include_previous_balance: automationForm.includePreviousBalance,
        next_run_at: nextRun,
      };

      if (automationSettings?.id) {
        const { error } = await supabase
          .from("fee_reminder_settings")
          .update(updateData)
          .eq("id", automationSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fee_reminder_settings")
          .insert([updateData]);
        if (error) throw error;
      }

      await refetchAutomation();
      toast({
        title: "Success",
        description: "Automation settings saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving automation settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save automation settings",
        variant: "destructive",
      });
    } finally {
      setAutomationLoading(false);
    }
  };

  const handleRunNow = async () => {
    setRunNowLoading(true);
    try {
      const response = await supabase.functions.invoke("automated-fee-reminder", {
        body: { force: true }
      });

      if (response.error) throw response.error;

      const result = response.data;
      await refetchAutomation();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Notice",
          description: result.message || "No reminders sent",
        });
      }
    } catch (error: any) {
      console.error("Error running automation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to run automation",
        variant: "destructive",
      });
    } finally {
      setRunNowLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if ((formData.recipientType === "grade" || formData.recipientType === "stream") && !formData.gradeId) {
      toast({
        title: "Error",
        description: "Please select a grade",
        variant: "destructive",
      });
      return;
    }

    if (formData.recipientType === "stream" && !formData.streamId) {
      toast({
        title: "Error",
        description: "Please select a stream",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in");
      }

      const dbRecipientType = formData.recipientType === "all_parents" ? "all" : formData.recipientType;

      const { data: insertedMessage, error: insertError } = await supabase
        .from("bulk_messages")
        .insert({
          sender_id: user.id,
          message_type: formData.messageType,
          recipient_type: dbRecipientType,
          grade_id: formData.gradeId || null,
          stream_id: formData.streamId || null,
          subject: formData.subject || null,
          message: formData.message,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const messageId = insertedMessage?.id;

      if (messageId) {
        const tasks: Promise<any>[] = [];

        // Trigger email sending if email or both
        if (formData.messageType === "email" || formData.messageType === "both") {
          tasks.push(
            supabase.functions
              .invoke("send-bulk-emails", { body: { messageId } })
              .then((res) => {
                if (res.error) throw res.error;
                const data: any = res.data;
                if (data?.failedCount > 0 && data?.sentCount === 0) {
                  throw new Error("Email sending failed. Please verify your sender domain in your email provider settings.");
                }
                return data;
              })
          );
        }

        // Trigger SMS sending if sms or both
        if (formData.messageType === "sms" || formData.messageType === "both") {
          tasks.push(
            supabase.functions
              .invoke("send-bulk-sms", { body: { messageId } })
              .then((res) => {
                if (res.error) throw res.error;
                return res.data;
              })
          );
        }

        const results = await Promise.allSettled(tasks);
        const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
        if (rejected) {
          throw rejected.reason;
        }
      }

      const recipientLabel = formData.recipientType === "all_teachers" ? "teachers" : "parents";
      const messageTypes = [];
      if (formData.messageType === "email" || formData.messageType === "both") messageTypes.push("emails");
      if (formData.messageType === "sms" || formData.messageType === "both") messageTypes.push("SMS");
      
      toast({
        title: "Success",
        description: `${messageTypes.join(" and ")} are being sent to ${recipientLabel}. Check recent messages for status.`,
      });

      setFormData({
        messageType: "both",
        recipientType: "all_parents",
        gradeId: "",
        streamId: "",
        subject: "",
        message: "",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "sending":
        return <Timer className="h-4 w-4 text-primary" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getRecipientLabel = (recipientType: string) => {
    switch (recipientType) {
      case "all":
      case "all_parents":
        return "All Parents";
      case "all_teachers":
        return "All Teachers";
      case "grade":
        return "Grade Parents";
      case "stream":
        return "Stream Parents";
      default:
      return recipientType;
    }
  };

  // Search learners for report card - auto-search as user types
  const handleSearchLearners = async (searchTerm?: string) => {
    const term = searchTerm !== undefined ? searchTerm : learnerSearch;
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("learners")
        .select(`
          id,
          first_name,
          last_name,
          admission_number,
          photo_url,
          grade:grades(name),
          stream:streams(name),
          parent:parents(email, first_name, last_name)
        `)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,admission_number.ilike.%${term}%`)
        .eq("status", "active")
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
      
      // Auto-select if exact admission number match
      if (data && data.length === 1 && data[0].admission_number.toLowerCase() === term.toLowerCase()) {
        handleSelectLearner(data[0]);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search learners",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Auto-search with debounce effect
  useEffect(() => {
    if (!learnerSearch.trim()) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      handleSearchLearners(learnerSearch);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [learnerSearch]);

  const handleSelectLearner = (learner: any) => {
    setSelectedLearner(learner);
    setSearchResults([]);
    setLearnerSearch("");
    // Pre-fill parent email if available
    if (learner.parent?.email) {
      setReportCardForm(prev => ({ ...prev, recipientEmail: learner.parent.email }));
    }
  };

  const handleSendReportCard = async () => {
    if (!selectedLearner) {
      toast({
        title: "Error",
        description: "Please select a learner",
        variant: "destructive",
      });
      return;
    }

    if (!reportCardForm.academicYear) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "destructive",
      });
      return;
    }

    if (!reportCardForm.recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    setReportCardLoading(true);
    try {
      const response = await supabase.functions.invoke("send-report-card-email", {
        body: {
          learnerId: selectedLearner.id,
          academicYear: reportCardForm.academicYear,
          term: reportCardForm.term,
          examType: reportCardForm.examType,
          recipientEmail: reportCardForm.recipientEmail,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Reset form
        setSelectedLearner(null);
        setReportCardForm({
          academicYear: "",
          term: "term_1",
          examType: "combined",
          recipientEmail: "",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send report card",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error sending report card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send report card email",
        variant: "destructive",
      });
    } finally {
      setReportCardLoading(false);
    }
  };

  const unreadCount = contactMessages?.filter(m => !m.is_read).length || 0;

  // Sort messages: unreplied (unread) first, then replied (read)
  const sortedContactMessages = contactMessages
    ? [...contactMessages].sort((a, b) => {
        if (!a.is_read && b.is_read) return -1;
        if (a.is_read && !b.is_read) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
    : [];

  // Filter based on showRepliedMessages toggle
  const filteredContactMessages = showRepliedMessages
    ? sortedContactMessages
    : sortedContactMessages.filter(m => !m.is_read);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Communication</h1>
          <p className="text-sm text-muted-foreground">Manage messages and send bulk communications</p>
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Visitor Inquiries</span>
              <span className="sm:hidden">Inquiries</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send Bulk Message</span>
              <span className="sm:hidden">Bulk SMS</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Timer className="h-4 w-4" />
              <span className="hidden sm:inline">Fee Automation</span>
              <span className="sm:hidden">Auto</span>
              {automationSettings?.is_enabled && (
                <Badge className="ml-1 h-5 min-w-5 text-xs bg-primary">
                  On
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="report-card" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Report Card Email</span>
              <span className="sm:hidden">Report</span>
            </TabsTrigger>
          </TabsList>

          {/* Visitor Inquiries Tab */}
          <TabsContent value="inbox" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Inbox className="h-5 w-5" />
                      Messages from Website Visitors
                    </CardTitle>
                    <CardDescription>
                      Contact form submissions from your public website
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showRepliedMessages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowRepliedMessages(!showRepliedMessages)}
                      className="gap-1"
                    >
                      {showRepliedMessages ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Hide Replied
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Show Replied
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contactLoading ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">Loading messages...</div>
                ) : !contactMessages || contactMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    No messages yet. Visitor inquiries from the website will appear here.
                  </div>
                ) : filteredContactMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    All messages have been replied. Click "Show Replied" to view them.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContactMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 border rounded-lg space-y-3 transition-colors ${
                          !msg.is_read ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-foreground">{msg.name}</span>
                              {!msg.is_read ? (
                                <Badge variant="default" className="text-xs">New</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Replied</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {msg.email}
                              </span>
                              {msg.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {msg.phone}
                                </span>
                              )}
                            </div>
                            <p className="text-foreground whitespace-pre-wrap">{msg.message}</p>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              variant={msg.is_read ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleOpenReply(msg)}
                              className="gap-1"
                            >
                              <Reply className="h-4 w-4" />
                              {msg.is_read ? "Reply Again" : "Reply"}
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Received: {format(new Date(msg.created_at), "PPpp")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reply Dialog */}
            <Dialog open={replyDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setReplyDialogOpen(false);
                setSelectedContactMessage(null);
                setReplyMessage("");
              }
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Reply className="h-5 w-5" />
                    Reply to {selectedContactMessage?.name}
                  </DialogTitle>
                  <DialogDescription>
                    Your reply will be sent via {selectedContactMessage?.phone ? "SMS" : ""}{selectedContactMessage?.phone && selectedContactMessage?.email ? " and " : ""}{selectedContactMessage?.email ? "email" : ""}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Original message:</p>
                    <p className="text-sm">{selectedContactMessage?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reply">Your Reply *</Label>
                    <Textarea
                      id="reply"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendReply}
                      disabled={replyLoading || !replyMessage.trim()}
                      className="gap-2"
                    >
                      {replyLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Reply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReplyDialogOpen(false);
                        setSelectedContactMessage(null);
                        setReplyMessage("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Send Bulk Message Tab */}
          <TabsContent value="send">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Bulk Message</CardTitle>
                    <CardDescription>
                      Send messages via SMS, email, or both to parents, guardians, or teachers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSend} className="space-y-6">
                      <div className="space-y-3">
                        <Label>Message Type *</Label>
                        <RadioGroup 
                          value={formData.messageType} 
                          onValueChange={(value) => setFormData({ ...formData, messageType: value })}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="both" />
                            <Label htmlFor="both" className="cursor-pointer flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              <Mail className="h-4 w-4" />
                              Both SMS & Email
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sms" id="sms" />
                            <Label htmlFor="sms" className="cursor-pointer flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              SMS Only
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="email" id="email" />
                            <Label htmlFor="email" className="cursor-pointer flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Only
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label>Send To *</Label>
                        <RadioGroup 
                          value={formData.recipientType} 
                          onValueChange={(value) => {
                            setFormData({ ...formData, recipientType: value, gradeId: "", streamId: "" });
                          }}
                        >
                          <div className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Parents
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <RadioGroupItem value="all_parents" id="all_parents" />
                            <Label htmlFor="all_parents" className="cursor-pointer">All Parents (Whole School)</Label>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <RadioGroupItem value="grade" id="grade" />
                            <Label htmlFor="grade" className="cursor-pointer">Parents of Specific Grade</Label>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <RadioGroupItem value="stream" id="stream" />
                            <Label htmlFor="stream" className="cursor-pointer">Parents of Specific Stream</Label>
                          </div>
                          
                          <div className="font-medium text-sm text-muted-foreground mt-4 mb-2 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Teachers
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <RadioGroupItem value="all_teachers" id="all_teachers" />
                            <Label htmlFor="all_teachers" className="cursor-pointer">All Teachers</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {(formData.recipientType === "grade" || formData.recipientType === "stream") && (
                        <div className="space-y-2">
                          <Label htmlFor="grade">Select Grade *</Label>
                          <Select 
                            value={formData.gradeId} 
                            onValueChange={(value) => setFormData({ ...formData, gradeId: value, streamId: "" })}
                          >
                            <SelectTrigger id="grade">
                              <SelectValue placeholder="Choose a grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {formData.recipientType === "stream" && formData.gradeId && (
                        <div className="space-y-2">
                          <Label htmlFor="stream">Select Stream *</Label>
                          <Select 
                            value={formData.streamId} 
                            onValueChange={(value) => setFormData({ ...formData, streamId: value })}
                          >
                            <SelectTrigger id="stream">
                              <SelectValue placeholder="Choose a stream" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredStreams.map((stream) => (
                                <SelectItem key={stream.id} value={stream.id}>
                                  {stream.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(formData.messageType === "email" || formData.messageType === "both") && (
                        <div className="space-y-2">
                          <Label htmlFor="subject">Email Subject</Label>
                          <Input
                            id="subject"
                            placeholder="e.g., School Fee Reminder, Important Notice"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Type your message here..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={6}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          {formData.message.length} characters
                        </p>
                      </div>

                      <Button type="submit" className="w-full gap-2" disabled={loading}>
                        <Send className="h-4 w-4" />
                        {loading ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Recent Messages</CardTitle>
                    <CardDescription>Recently sent communications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {messagesLoading ? (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : !recentMessages || recentMessages.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No messages sent yet</div>
                    ) : (
                      <div className="space-y-3">
                        {(showAllRecentMessages ? recentMessages : recentMessages.slice(0, 5)).map((msg: any) => (
                          <div
                            key={msg.id}
                            className="p-3 border border-border rounded-lg space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {msg.subject || "No Subject"}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {msg.message}
                                </p>
                              </div>
                              {getStatusIcon(msg.status)}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {msg.message_type === "email" || msg.message_type === "both" ? (
                                  <Mail className="h-3 w-3" />
                                ) : (
                                  <MessageSquare className="h-3 w-3" />
                                )}
                                {msg.message_type}
                              </span>
                              <span>• {getRecipientLabel(msg.recipient_type)}</span>
                              {msg.grades && (
                                <span>• {msg.grades.name}</span>
                              )}
                              {msg.streams && (
                                <span>• {msg.streams.name}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {format(new Date(msg.created_at), "MMM d, h:mm a")}
                              </span>
                              {msg.sent_count !== null && (
                                <span className="text-primary">
                                  Sent: {msg.sent_count}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {recentMessages.length > 5 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={() => setShowAllRecentMessages(!showAllRecentMessages)}
                          >
                            {showAllRecentMessages ? "Show Less" : `Show More (${recentMessages.length - 5} more)`}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>


          {/* Fee Automation Tab */}
          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Automated Fee Reminders
                </CardTitle>
                <CardDescription>
                  Configure automatic SMS reminders to parents about outstanding fee balances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {automationSettingsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
                ) : (
                  <>
                    {/* Status Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="flex items-center gap-2 mt-1">
                          {automationSettings?.is_enabled ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                              <span className="font-semibold text-primary">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                              <span className="font-semibold text-muted-foreground">Disabled</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="text-sm text-muted-foreground">Last Run</div>
                        <div className="font-semibold mt-1">
                          {automationSettings?.last_run_at
                            ? formatDistanceToNow(new Date(automationSettings.last_run_at), { addSuffix: true })
                            : "Never"}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="text-sm text-muted-foreground">Next Run</div>
                        <div className="font-semibold mt-1">
                          {automationSettings?.is_enabled && automationSettings?.next_run_at
                            ? format(new Date(automationSettings.next_run_at), "PPp")
                            : "Not scheduled"}
                        </div>
                      </div>
                    </div>

                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Enable Automated Reminders</div>
                        <div className="text-sm text-muted-foreground">
                          Automatically send fee reminders to parents at the specified interval
                        </div>
                      </div>
                      <Switch
                        checked={automationForm.isEnabled}
                        onCheckedChange={(checked) => setAutomationForm({ ...automationForm, isEnabled: checked })}
                      />
                    </div>

                    {/* Settings Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="interval">Reminder Interval (Days)</Label>
                          <Select
                            value={automationForm.intervalDays.toString()}
                            onValueChange={(value) => setAutomationForm({ ...automationForm, intervalDays: parseInt(value) })}
                          >
                            <SelectTrigger id="interval">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Every day</SelectItem>
                              <SelectItem value="3">Every 3 days</SelectItem>
                              <SelectItem value="7">Every week</SelectItem>
                              <SelectItem value="14">Every 2 weeks</SelectItem>
                              <SelectItem value="30">Every month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="scope">Send To</Label>
                          <Select
                            value={automationForm.scope}
                            onValueChange={(value: "school" | "grade") => setAutomationForm({ ...automationForm, scope: value, gradeId: "" })}
                          >
                            <SelectTrigger id="scope">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="school">Whole School</SelectItem>
                              <SelectItem value="grade">Specific Grade</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {automationForm.scope === "grade" && (
                        <div className="space-y-2">
                          <Label htmlFor="automationGrade">Select Grade</Label>
                          <Select
                            value={automationForm.gradeId}
                            onValueChange={(value) => setAutomationForm({ ...automationForm, gradeId: value })}
                          >
                            <SelectTrigger id="automationGrade">
                              <SelectValue placeholder="Choose a grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Include Current Term Fees</div>
                            <div className="text-xs text-muted-foreground">Remind about current term balance</div>
                          </div>
                          <Switch
                            checked={automationForm.includeCurrentTerm}
                            onCheckedChange={(checked) => setAutomationForm({ ...automationForm, includeCurrentTerm: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Include Previous Balance</div>
                            <div className="text-xs text-muted-foreground">Remind about arrears from past terms</div>
                          </div>
                          <Switch
                            checked={automationForm.includePreviousBalance}
                            onCheckedChange={(checked) => setAutomationForm({ ...automationForm, includePreviousBalance: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>SMS Preview:</strong> Parents will receive a message with their learner's fee balance and payment instructions (Paybill number and account reference).
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleSaveAutomation}
                        disabled={automationLoading}
                        className="gap-2"
                      >
                        {automationLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRunNow}
                        disabled={runNowLoading || !automationForm.isEnabled}
                        className="gap-2"
                      >
                        {runNowLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Run Now
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report Card Email Tab */}
          <TabsContent value="report-card">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Email Report Card
                </CardTitle>
                <CardDescription>
                  Send a learner's performance report card via email as a beautifully formatted document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Learner Search */}
                <div className="space-y-3">
                  <Label>Search Learner *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Search by name or admission number..."
                          value={learnerSearch}
                          onChange={(e) => setLearnerSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearchLearners()}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSearchLearners()}
                        disabled={searchLoading}
                      >
                      {searchLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {searchResults.map((learner) => (
                        <div
                          key={learner.id}
                          className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3"
                          onClick={() => handleSelectLearner(learner)}
                        >
                          {learner.photo_url ? (
                            <img
                              src={learner.photo_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {learner.first_name?.[0]}{learner.last_name?.[0]}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {learner.first_name} {learner.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {learner.admission_number} • {learner.grade?.name} {learner.stream?.name && `- ${learner.stream.name}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Learner */}
                  {selectedLearner && (
                    <div className="p-4 border rounded-lg bg-primary/5 flex items-center gap-3">
                      {selectedLearner.photo_url ? (
                        <img
                          src={selectedLearner.photo_url}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-medium text-primary">
                            {selectedLearner.first_name?.[0]}{selectedLearner.last_name?.[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {selectedLearner.first_name} {selectedLearner.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedLearner.admission_number} • {selectedLearner.grade?.name} {selectedLearner.stream?.name && `- ${selectedLearner.stream.name}`}
                        </p>
                        {selectedLearner.parent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Parent: {selectedLearner.parent.first_name} {selectedLearner.parent.last_name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLearner(null);
                          setReportCardForm(prev => ({ ...prev, recipientEmail: "" }));
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Academic Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year *</Label>
                    <Select
                      value={reportCardForm.academicYear}
                      onValueChange={(value) => setReportCardForm({ ...reportCardForm, academicYear: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.year}>
                            {year.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Term *</Label>
                    <Select
                      value={reportCardForm.term}
                      onValueChange={(value) => setReportCardForm({ ...reportCardForm, term: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term_1">Term 1</SelectItem>
                        <SelectItem value="term_2">Term 2</SelectItem>
                        <SelectItem value="term_3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select
                      value={reportCardForm.examType}
                      onValueChange={(value) => setReportCardForm({ ...reportCardForm, examType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="combined">All Exams (Combined)</SelectItem>
                        <SelectItem value="opener">Opener</SelectItem>
                        <SelectItem value="mid_term">Mid-Term</SelectItem>
                        <SelectItem value="final">Final/End-Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Recipient Email */}
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="Enter email address to send report card..."
                    value={reportCardForm.recipientEmail}
                    onChange={(e) => setReportCardForm({ ...reportCardForm, recipientEmail: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Parent's email is auto-filled if available. You can also enter a different email address.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Email Preview:</strong> The report card will include school information, learner details, subject-wise performance with marks for each exam type, overall average, and grading key.
                  </p>
                </div>

                <Button
                  onClick={handleSendReportCard}
                  disabled={reportCardLoading || !selectedLearner || !reportCardForm.academicYear || !reportCardForm.recipientEmail}
                  className="w-full md:w-auto gap-2"
                >
                  {reportCardLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Report Card
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
