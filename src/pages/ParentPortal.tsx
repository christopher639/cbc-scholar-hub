import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User, BookOpen, DollarSign, MessageSquare } from "lucide-react";

export default function ParentPortal() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useUnifiedAuth();
  const { toast } = useToast();
  const [performance, setPerformance] = useState<any[]>([]);
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const learner = user?.role === "learner" ? user.data : null;

  useEffect(() => {
    if (!authLoading && !learner) {
      navigate("/auth");
    } else if (learner) {
      fetchData();
    }
  }, [authLoading, learner, navigate]);

  const fetchData = async () => {
    if (!learner) return;

    try {
      setLoading(true);

      // Fetch performance records
      const { data: perfData } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          academic_period:academic_periods(academic_year, term)
        `)
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false });

      setPerformance(perfData || []);

      // Fetch fee structure and payments
      if (learner.current_grade_id) {
        const { data: feeStructure } = await supabase
          .from("fee_structures")
          .select("amount")
          .eq("grade_id", learner.current_grade_id)
          .maybeSingle();

        const { data: payments } = await supabase
          .from("fee_payments")
          .select("*")
          .eq("learner_id", learner.id)
          .order("payment_date", { ascending: false });

        const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
        const expectedAmount = feeStructure?.amount || 0;
        const balance = Math.max(0, expectedAmount - totalPaid);

        setFeeInfo({
          totalFees: expectedAmount,
          paid: totalPaid,
          balance,
          payments: payments || [],
        });
      }

      // Fetch messages
      const { data: msgData } = await supabase
        .from("messages")
        .select("*")
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false });

      setMessages(msgData || []);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !learner) return;

    try {
      const { error } = await supabase.from("messages").insert({
        learner_id: learner.id,
        sender_type: "parent",
        sender_id: learner.parent?.id || learner.id,
        message: newMessage,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setNewMessage("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!learner) return null;

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={learner.photo_url} />
                  <AvatarFallback>
                    {learner.first_name[0]}{learner.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">
                    {learner.first_name} {learner.last_name}
                  </h1>
                  <p className="text-muted-foreground">
                    Admission No: {learner.admission_number}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{learner.current_grade?.name}</Badge>
                    {learner.current_stream && (
                      <Badge variant="outline">{learner.current_stream.name}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BookOpen className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="h-4 w-4 mr-2" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {learner.first_name} {learner.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {new Date(learner.date_of_birth).toLocaleDateString()} ({calculateAge(learner.date_of_birth)} years)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{learner.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-medium">{learner.admission_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment Date</p>
                  <p className="font-medium">
                    {new Date(learner.enrollment_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Grade</p>
                  <p className="font-medium">{learner.current_grade?.name}</p>
                </div>
                {learner.current_stream && (
                  <div>
                    <p className="text-sm text-muted-foreground">Stream</p>
                    <p className="font-medium">{learner.current_stream.name}</p>
                  </div>
                )}
                {learner.medical_info && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Medical Information</p>
                    <p className="font-medium">{learner.medical_info}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {performance.length > 0 ? (
                  <div className="space-y-4">
                    {performance.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{record.learning_area?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.academic_period?.academic_year} - {record.academic_period?.term.replace("_", " ").toUpperCase()}
                          </p>
                          {record.remarks && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {record.remarks}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{record.marks}%</p>
                          {record.grade_letter && (
                            <Badge variant="secondary">{record.grade_letter}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No performance records available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle>Fee Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {feeInfo && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Fees</p>
                        <p className="text-2xl font-bold">KSh {feeInfo.totalFees.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                          KSh {feeInfo.paid.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold text-orange-600">
                          KSh {feeInfo.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Payment History</h3>
                      {feeInfo.payments.length > 0 ? (
                        <div className="space-y-2">
                          {feeInfo.payments.map((payment: any) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">
                                  {new Date(payment.payment_date).toLocaleDateString()}
                                </p>
                                {payment.receipt_number && (
                                  <p className="text-sm text-muted-foreground">
                                    Receipt: {payment.receipt_number}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">KSh {Number(payment.amount_paid).toLocaleString()}</p>
                                <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                                  {payment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No payment history available
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages with Teachers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.sender_type === "parent"
                          ? "bg-primary/10 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={msg.sender_type === "parent" ? "default" : "secondary"}>
                          {msg.sender_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p>{msg.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet. Start a conversation with your child's teachers.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your message to the teachers..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleSendMessage} className="w-full">
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
