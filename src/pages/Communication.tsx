import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useRecentMessages } from "@/hooks/useRecentMessages";
import { supabase } from "@/integrations/supabase/client";
import { Send, Mail, MessageSquare, Clock, CheckCircle2, XCircle, Users, GraduationCap } from "lucide-react";
import { format } from "date-fns";

export default function Communication() {
  const { toast } = useToast();
  const { grades } = useGrades();
  const { streams } = useStreams();
  const { data: recentMessages, isLoading: messagesLoading } = useRecentMessages();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    messageType: "both",
    recipientType: "all_parents",
    gradeId: "",
    streamId: "",
    subject: "",
    message: "",
  });

  const filteredStreams = formData.gradeId
    ? streams.filter((stream) => stream.grade_id === formData.gradeId)
    : [];

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

    // Validate grade selection for grade/stream recipient types
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

      // Map recipient type to database format
      const dbRecipientType = formData.recipientType === "all_parents" ? "all" : formData.recipientType;

      // Insert bulk message record
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

      // Call edge function to send emails
      const { data: messageData } = await supabase
        .from("bulk_messages")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (messageData && (formData.messageType === "email" || formData.messageType === "both")) {
        // Trigger email sending in background
        supabase.functions.invoke("send-bulk-emails", {
          body: { messageId: messageData.id },
        }).catch(err => console.error("Error triggering email send:", err));
      }

      const recipientLabel = formData.recipientType === "all_teachers" ? "teachers" : "parents";
      toast({
        title: "Success",
        description: formData.messageType === "email" || formData.messageType === "both" 
          ? `Emails are being sent to ${recipientLabel}. Check recent messages for status.` 
          : "Message sent successfully.",
      });

      // Reset form
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

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Communication</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Send bulk messages and emails to parents and teachers</p>
        </div>

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
              {/* Message Type */}
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

              {/* Recipients */}
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

              {/* Grade Selection */}
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

              {/* Stream Selection */}
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

              {/* Subject (for email) */}
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

              {/* Message */}
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
                    {recentMessages.map((msg: any) => (
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
