import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { School } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, login } = useAuth();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user && !loading) {
      if (user.role === "learner") {
        navigate("/learner-portal", { replace: true });
      } else if (user.role === "teacher") {
        navigate("/teacher-portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await login(username, password);
    
    // Explicitly navigate based on result
    if (result?.success) {
      if (result.role === "learner") {
        navigate("/learner-portal", { replace: true });
      } else if (result.role === "teacher") {
        navigate("/teacher-portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
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
      <Card className="w-full max-w-md border-0 shadow-none">
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
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
