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
import { supabase } from "@/integrations/supabase/client";
import { Send, Mail, MessageSquare } from "lucide-react";

export default function Communication() {
  const { toast } = useToast();
  const { grades } = useGrades();
  const { streams } = useStreams();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    messageType: "both",
    recipientType: "all",
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

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in");
      }

      // Insert bulk message record
      const { error } = await supabase
        .from("bulk_messages")
        .insert({
          sender_id: user.id,
          message_type: formData.messageType,
          recipient_type: formData.recipientType,
          grade_id: formData.gradeId || null,
          stream_id: formData.streamId || null,
          subject: formData.subject || null,
          message: formData.message,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message queued for sending. Recipients will be notified shortly.",
      });

      // Reset form
      setFormData({
        messageType: "both",
        recipientType: "all",
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Communication</h1>
          <p className="text-muted-foreground">Send bulk messages and emails to parents</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Bulk Message</CardTitle>
            <CardDescription>
              Send messages via SMS, email, or both to parents and guardians
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer">All Parents (Whole School)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grade" id="grade" />
                    <Label htmlFor="grade" className="cursor-pointer">Specific Grade</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stream" id="stream" />
                    <Label htmlFor="stream" className="cursor-pointer">Specific Stream</Label>
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
                    placeholder="Enter email subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
    </DashboardLayout>
  );
}