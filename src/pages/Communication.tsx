import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useRecentMessages } from "@/hooks/useRecentMessages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Mail, MessageSquare, Clock, CheckCircle2, XCircle, Users, GraduationCap, Inbox, Eye, Phone, User, BarChart3 } from "lucide-react";
import { format } from "date-fns";

export default function Communication() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { grades } = useGrades();
  const { streams } = useStreams();
  const { academicYears } = useAcademicYears();
  const { data: recentMessages, isLoading: messagesLoading } = useRecentMessages();
  const [loading, setLoading] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    messageType: "both",
    recipientType: "all_parents",
    gradeId: "",
    streamId: "",
    subject: "",
    message: "",
  });

  const [performanceForm, setPerformanceForm] = useState({
    academicYear: "",
    term: "term_1",
    examType: "combined",
    scope: "school" as "school" | "grade" | "stream",
    gradeId: "",
    streamId: "",
  });

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

  const filteredStreams = formData.gradeId
    ? streams.filter((stream) => stream.grade_id === formData.gradeId)
    : [];

  const performanceFilteredStreams = performanceForm.gradeId
    ? streams.filter((stream) => stream.grade_id === performanceForm.gradeId)
    : [];

  const handleSendPerformanceSms = async () => {
    if (!performanceForm.academicYear) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "destructive",
      });
      return;
    }

    if (performanceForm.scope === "grade" && !performanceForm.gradeId) {
      toast({
        title: "Error",
        description: "Please select a grade",
        variant: "destructive",
      });
      return;
    }

    if (performanceForm.scope === "stream" && (!performanceForm.gradeId || !performanceForm.streamId)) {
      toast({
        title: "Error",
        description: "Please select both grade and stream",
        variant: "destructive",
      });
      return;
    }

    setPerformanceLoading(true);

    try {
      const response = await supabase.functions.invoke("send-performance-sms", {
        body: {
          academicYear: performanceForm.academicYear,
          term: performanceForm.term,
          examType: performanceForm.examType,
          scope: performanceForm.scope,
          gradeId: performanceForm.gradeId || undefined,
          streamId: performanceForm.streamId || undefined,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Notice",
          description: result.message || "No messages sent",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error sending performance SMS:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send performance SMS",
        variant: "destructive",
      });
    } finally {
      setPerformanceLoading(false);
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

      const { error } = await supabase
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
        });

      if (error) throw error;

      const { data: messageData } = await supabase
        .from("bulk_messages")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (messageData) {
        // Trigger email sending if email or both
        if (formData.messageType === "email" || formData.messageType === "both") {
          supabase.functions.invoke("send-bulk-emails", {
            body: { messageId: messageData.id },
          }).catch(err => console.error("Error triggering email send:", err));
        }

        // Trigger SMS sending if sms or both
        if (formData.messageType === "sms" || formData.messageType === "both") {
          supabase.functions.invoke("send-bulk-sms", {
            body: { messageId: messageData.id },
          }).catch(err => console.error("Error triggering SMS send:", err));
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
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
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

  const unreadCount = contactMessages?.filter(m => !m.is_read).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Communication</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage messages and send bulk communications</p>
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
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Performance SMS</span>
              <span className="sm:hidden">Marks</span>
            </TabsTrigger>
          </TabsList>

          {/* Visitor Inquiries Tab */}
          <TabsContent value="inbox" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Messages from Website Visitors
                </CardTitle>
                <CardDescription>
                  Contact form submissions from your public website
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contactLoading ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">Loading messages...</div>
                ) : !contactMessages || contactMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    No messages yet. Visitor inquiries from the website will appear here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contactMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 border rounded-lg space-y-3 transition-colors ${
                          !msg.is_read ? "bg-primary/5 border-primary/20" : "bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-foreground">{msg.name}</span>
                              {!msg.is_read && (
                                <Badge variant="default" className="text-xs">New</Badge>
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
                          {!msg.is_read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(msg.id)}
                              className="flex-shrink-0"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
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
                        {(showAllMessages ? recentMessages : recentMessages.slice(0, 5)).map((msg: any) => (
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
                                <span className="text-green-600">
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
                            onClick={() => setShowAllMessages(!showAllMessages)}
                          >
                            {showAllMessages ? "Show Less" : `Show More (${recentMessages.length - 5} more)`}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Performance SMS Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Send Performance Records SMS
                </CardTitle>
                <CardDescription>
                  Send learner performance results to parents via SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year *</Label>
                    <Select
                      value={performanceForm.academicYear}
                      onValueChange={(value) => setPerformanceForm({ ...performanceForm, academicYear: value })}
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
                      value={performanceForm.term}
                      onValueChange={(value) => setPerformanceForm({ ...performanceForm, term: value })}
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
                    <Label>Exam Type *</Label>
                    <Select
                      value={performanceForm.examType}
                      onValueChange={(value) => setPerformanceForm({ ...performanceForm, examType: value })}
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

                <div className="space-y-3">
                  <Label>Send To *</Label>
                  <RadioGroup
                    value={performanceForm.scope}
                    onValueChange={(value: "school" | "grade" | "stream") =>
                      setPerformanceForm({ ...performanceForm, scope: value, gradeId: "", streamId: "" })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="school" id="perf-school" />
                      <Label htmlFor="perf-school" className="cursor-pointer">Whole School (All Parents)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="grade" id="perf-grade" />
                      <Label htmlFor="perf-grade" className="cursor-pointer">Specific Grade</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stream" id="perf-stream" />
                      <Label htmlFor="perf-stream" className="cursor-pointer">Specific Stream</Label>
                    </div>
                  </RadioGroup>
                </div>

                {(performanceForm.scope === "grade" || performanceForm.scope === "stream") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Grade *</Label>
                      <Select
                        value={performanceForm.gradeId}
                        onValueChange={(value) => setPerformanceForm({ ...performanceForm, gradeId: value, streamId: "" })}
                      >
                        <SelectTrigger>
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

                    {performanceForm.scope === "stream" && performanceForm.gradeId && (
                      <div className="space-y-2">
                        <Label>Select Stream *</Label>
                        <Select
                          value={performanceForm.streamId}
                          onValueChange={(value) => setPerformanceForm({ ...performanceForm, streamId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a stream" />
                          </SelectTrigger>
                          <SelectContent>
                            {performanceFilteredStreams.map((stream) => (
                              <SelectItem key={stream.id} value={stream.id}>
                                {stream.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>SMS Preview:</strong> Parents will receive a message with their learner's average score, grade category (E.E/M.E/A.E/B.E), and top 3 subjects for the selected period.
                  </p>
                </div>

                <Button
                  onClick={handleSendPerformanceSms}
                  disabled={performanceLoading}
                  className="w-full md:w-auto gap-2"
                >
                  <Send className="h-4 w-4" />
                  {performanceLoading ? "Sending..." : "Send Performance SMS"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
