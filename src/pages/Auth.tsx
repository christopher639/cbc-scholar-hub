import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { School } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, loginAdmin, loginTeacher, loginLearner } = useUnifiedAuth();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<"admin" | "teacher" | "student">("student");

  useEffect(() => {
    if (user && !loading) {
      if (user.role === "learner") {
        navigate("/learner-portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let result;
    
    if (loginType === "admin") {
      result = await loginAdmin(username, password);
    } else if (loginType === "teacher") {
      result = await loginTeacher(username, password);
    } else {
      result = await loginLearner(username, password);
    }
    
    // Don't navigate here - let the useEffect handle it after user state is updated
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
              Sign in with your credentials
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <Label>Login As</Label>
              <RadioGroup value={loginType} onValueChange={(value) => setLoginType(value as any)} className="flex flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="cursor-pointer">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher" className="cursor-pointer">Teacher</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="cursor-pointer">Admin</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">
                {loginType === "student" ? "Admission Number" : "Username/Email"}
              </Label>
              <Input
                id="username"
                placeholder={loginType === "student" ? "Enter admission number" : "Enter username or email"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {loginType === "student" ? "Birth Certificate Number" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={loginType === "student" ? "Enter birth certificate number" : "Enter password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
