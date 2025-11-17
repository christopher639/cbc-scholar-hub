import React, { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, MapPin, Calendar, FileText, DollarSign, TrendingUp, History } from "lucide-react";
import { PromotionHistoryDialog } from "@/components/PromotionHistoryDialog";

const LearnerProfile = () => {
  const [promotionHistoryOpen, setPromotionHistoryOpen] = useState(false);

  // Mock learner data
  const learner = {
    admissionNumber: "CBC2024001",
    firstName: "Jane",
    middleName: "Wanjiku",
    lastName: "Kamau",
    photo: "/placeholder.svg",
    dateOfBirth: "2015-03-15",
    gender: "Female",
    grade: "Grade 4",
    stream: "Green",
    status: "Active",
    enrollmentDate: "2021-01-10",
    birthCertificateNumber: "123456789",
  };

  const parentInfo = {
    name: "John Kamau",
    relationship: "Father",
    phone: "+254 712 345 678",
    email: "j.kamau@email.com",
    isStaff: true,
    occupation: "Teacher",
  };

  const feeInfo = {
    totalFees: 45000,
    paid: 30000,
    balance: 15000,
    discounts: [
      { type: "Staff Discount", amount: 22500 },
    ],
  };

  const performance = [
    { subject: "Mathematics", grade: "A", score: 92, term: "Term 3 2024" },
    { subject: "English", grade: "A-", score: 87, term: "Term 3 2024" },
    { subject: "Science", grade: "B+", score: 81, term: "Term 3 2024" },
    { subject: "Social Studies", grade: "A", score: 90, term: "Term 3 2024" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={learner.photo} alt={`${learner.firstName} ${learner.lastName}`} />
                <AvatarFallback className="text-3xl">
                  {learner.firstName[0]}{learner.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {learner.firstName} {learner.middleName} {learner.lastName}
                  </h1>
                  <p className="text-muted-foreground">Admission No: {learner.admissionNumber}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-base">
                    {learner.grade} {learner.stream}
                  </Badge>
                  <Badge className="text-base">{learner.status}</Badge>
                  {parentInfo.isStaff && (
                    <Badge variant="outline" className="text-base">Staff Child</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Born: {new Date(learner.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{learner.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Enrolled: {new Date(learner.enrollmentDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button>Edit Profile</Button>
                <Button variant="outline">Print Report</Button>
                <Button variant="outline" onClick={() => setPromotionHistoryOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="parent">Parent/Guardian</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{learner.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Middle Name</p>
                    <p className="font-medium">{learner.middleName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{learner.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{learner.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{new Date(learner.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Birth Certificate No.</p>
                    <p className="font-medium">{learner.birthCertificateNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Information */}
          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Academic Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Grade</p>
                    <p className="font-medium text-lg">{learner.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stream</p>
                    <p className="font-medium text-lg">{learner.stream}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="mt-1">{learner.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{item.subject}</p>
                        <p className="text-sm text-muted-foreground">{item.term}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-base">{item.grade}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{item.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Information */}
          <TabsContent value="fees" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Fees</CardDescription>
                  <CardTitle className="text-2xl">KSH {feeInfo.totalFees.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Academic Year 2024/2025</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Amount Paid</CardDescription>
                  <CardTitle className="text-2xl text-success">KSH {feeInfo.paid.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{((feeInfo.paid / feeInfo.totalFees) * 100).toFixed(1)}% paid</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Balance</CardDescription>
                  <CardTitle className="text-2xl text-warning">KSH {feeInfo.balance.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Outstanding amount</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Applied Discounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feeInfo.discounts.map((discount, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <span className="font-medium">{discount.type}</span>
                      <Badge variant="secondary">- KSH {discount.amount.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parent Information */}
          <TabsContent value="parent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{parentInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Relationship</p>
                    <p className="font-medium">{parentInfo.relationship}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{parentInfo.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{parentInfo.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">{parentInfo.occupation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Staff Member</p>
                    <Badge variant={parentInfo.isStaff ? "default" : "secondary"}>
                      {parentInfo.isStaff ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PromotionHistoryDialog 
          open={promotionHistoryOpen}
          onOpenChange={setPromotionHistoryOpen}
          learnerName={`${learner.firstName} ${learner.lastName}`}
        />
      </div>
    </DashboardLayout>
  );
};

export default LearnerProfile;
