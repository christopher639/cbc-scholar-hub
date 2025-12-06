import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { School, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, login } = useAuth();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load remembered credentials
    const rememberedUsername = localStorage.getItem("remembered_username");
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

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
    setIsSubmitting(true);
    
    // Handle remember me
    if (rememberMe) {
      localStorage.setItem("remembered_username", username);
    } else {
      localStorage.removeItem("remembered_username");
    }
    
    const result = await login(username, password);
    
    if (result?.success) {
      if (result.role === "learner") {
        navigate("/learner-portal", { replace: true });
      } else if (result.role === "teacher") {
        navigate("/teacher-portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPassword = () => {
    // For now, show a helpful message since we have different auth methods
    alert("Please contact the school administrator to reset your password.");
  };

  if (loading || schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {schoolInfo?.logo_url ? (
              <img 
                src={schoolInfo.logo_url} 
                alt="School Logo" 
                className="h-20 w-20 object-contain rounded-full shadow-lg ring-4 ring-primary/20"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shadow-lg ring-4 ring-primary/20">
                <School className="h-10 w-10 text-primary" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {schoolInfo?.school_name || "School Portal"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to access your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border/50">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary/20 transition-all"
              />
              <p className="text-xs text-muted-foreground">
                Admission number, employee number, or email
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary/20 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Birth certificate number, ID number, or password
              </p>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="rounded"
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Need help? Contact your school administrator
        </p>
      </div>
    </div>
  );
}
