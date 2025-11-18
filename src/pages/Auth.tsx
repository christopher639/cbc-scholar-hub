import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, loginLearner, loginTeacher, loginAdmin } = useUnifiedAuth();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [birthCertificate, setBirthCertificate] = useState("");
  
  const [tscNumber, setTscNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/dashboard");
      } else if (user.role === "teacher") {
        navigate("/performance");
      } else if (user.role === "learner") {
        navigate("/parent-portal");
      }
    }
  }, [user, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginAdmin(adminEmail, adminPassword);
    if (success) {
      navigate("/dashboard");
    }
  };

  const handleLearnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginLearner(admissionNumber, birthCertificate);
    if (success) {
      navigate("/parent-portal");
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginTeacher(tscNumber, idNumber);
    if (success) {
      navigate("/performance");
    }
  };

  if (loading || schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {schoolInfo?.logo_url ? (
              <img 
                src={schoolInfo.logo_url} 
                alt="School Logo" 
                className="h-24 w-24 object-contain"
              />
            ) : (
              <School className="h-24 w-24 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">
              Welcome to {schoolInfo?.school_name || "School Management System"}
            </CardTitle>
            <CardDescription>
              Sign in to access your portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="learner">Learner</TabsTrigger>
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@school.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Admin"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="learner">
              <form onSubmit={handleLearnerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admission-number">Admission Number</Label>
                  <Input
                    id="admission-number"
                    placeholder="2500001"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth-certificate">Birth Certificate Number</Label>
                  <Input
                    id="birth-certificate"
                    type="password"
                    placeholder="Enter birth certificate number"
                    value={birthCertificate}
                    onChange={(e) => setBirthCertificate(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Learner"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="teacher">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tsc-number">TSC Number</Label>
                  <Input
                    id="tsc-number"
                    placeholder="Enter TSC/Employee number"
                    value={tscNumber}
                    onChange={(e) => setTscNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id-number">ID Number</Label>
                  <Input
                    id="id-number"
                    type="password"
                    placeholder="Enter ID number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Teacher"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
