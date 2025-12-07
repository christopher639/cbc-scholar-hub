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
      <div className="w-full max-w-sm">
        {/* Logo and Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            {schoolInfo?.logo_url ? (
              <img 
                src={schoolInfo.logo_url} 
                alt="School Logo" 
                className="h-14 w-14 object-contain rounded-full ring-2 ring-primary/20"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <School className="h-7 w-7 text-primary" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground mb-0.5">
            {schoolInfo?.school_name || "School Portal"}
          </h1>
          <p className="text-muted-foreground text-xs">
            Sign in to access your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-xl p-5 border border-border/50">
          <form onSubmit={handleLogin} className="space-y-3">
            {/* Username Field */}
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="h-10 rounded-lg border-border/60 focus:border-primary focus:ring-primary/20 transition-all text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Admission number, employee number, or email
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium">
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
                  className="h-10 rounded-lg border-border/60 focus:border-primary focus:ring-primary/20 transition-all pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Birth certificate number, ID number, or password
              </p>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="rounded h-3.5 w-3.5"
                />
                <Label 
                  htmlFor="remember" 
                  className="text-xs font-normal text-muted-foreground cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-10 rounded-lg text-sm font-semibold transition-all mt-2" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          Need help? Contact your school administrator
        </p>
      </div>
    </div>
  );
}
