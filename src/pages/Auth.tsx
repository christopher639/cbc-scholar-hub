import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { School, Eye, EyeOff, LogIn, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, login } = useAuth();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingGoogleAuth, setCheckingGoogleAuth] = useState(true);

  // Check for Google OAuth callback and handle user verification
  useEffect(() => {
    const handleGoogleAuthCallback = async () => {
      // Only process if this is an OAuth callback (URL has hash or code parameter)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      const isOAuthCallback = hashParams.has('access_token') || urlParams.has('code');
      
      if (!isOAuthCallback) {
        setCheckingGoogleAuth(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user has a role assigned
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (roleData?.role) {
          // User is verified and has a role - redirect to appropriate dashboard
          if (roleData.role === "learner") {
            navigate("/learner-portal", { replace: true });
          } else if (roleData.role === "teacher") {
            navigate("/teacher-portal", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          // Check if this is the first user in the system (no admins exist)
          const { data: adminCount } = await supabase.rpc("count_admin_users");
          
          const userName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
          
          if (adminCount === 0) {
            // First user - make them admin automatically
            // Create/update profile
            await supabase.from("profiles").upsert({
              id: session.user.id,
              full_name: userName,
              is_activated: true,
              activation_status: "activated",
            });
            
            // Assign admin role
            await supabase.rpc("assign_user_role", {
              p_user_id: session.user.id,
              p_role: "admin",
            });
            
            toast({
              title: "Welcome, Admin!",
              description: "You are the first user. You have been assigned as an administrator.",
            });
            
            navigate("/dashboard", { replace: true });
          } else {
            // Not the first user - create profile and notify admins
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", session.user.id)
              .single();
            
            if (!profile) {
              // Create profile for new Google user
              await supabase.from("profiles").upsert({
                id: session.user.id,
                full_name: userName,
                is_activated: false,
                activation_status: "pending",
              });
              
              // Notify admins about the new user request
              await supabase.rpc("notify_admins", {
                p_title: "New User Registration Request",
                p_message: `${userName} has requested to become a system user. Please assign a role or deny the request.`,
                p_type: "user_request",
                p_entity_type: "user",
                p_entity_id: session.user.id,
              });
            }
            
            // Sign out and show message
            await supabase.auth.signOut();
            toast({
              title: "Account Pending Verification",
              description: "Your account has not been verified. Please contact the admin for activation.",
              variant: "destructive",
            });
            navigate("/", { replace: true });
          }
        }
      }
      setCheckingGoogleAuth(false);
    };
    
    handleGoogleAuthCallback();
  }, [navigate, toast]);

  useEffect(() => {
    const rememberedUsername = localStorage.getItem("remembered_username");
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      // Check if user is activated
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Please enter your full name", variant: "destructive" });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: username,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile with pending activation status
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            is_activated: false,
            activation_status: "pending",
          });
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
        
        toast({
          title: "Account Created!",
          description: "Your account is pending admin approval. You'll be notified once activated.",
        });
        
        // Sign out since they need approval
        await supabase.auth.signOut();
        setIsSignUp(false);
        setFullName("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Please contact the school administrator to reset your password.");
  };

  if (loading || schoolLoading || checkingGoogleAuth) {
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
            {isSignUp ? "Create your account" : "Sign in to access your account"}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-card rounded-xl p-5 border border-border/50">
        {isSignUp ? (
            // Sign Up Form - Google Only
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 rounded-lg text-sm"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>
              
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="w-full text-xs text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
            </div>
          ) : (
            // Sign In Form
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs font-medium">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="h-10 rounded-lg border-border/60 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Admission number, employee number, or email
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-10 rounded-lg border-border/60 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Birth certificate number, ID number, or password
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="rounded h-3.5 w-3.5"
                  />
                  <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full h-10 rounded-lg text-sm font-semibold mt-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" />Sign In</>
                )}
              </Button>
              
              <div className="relative my-3">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] text-muted-foreground">
                  or
                </span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 rounded-lg text-sm"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="w-full text-xs text-primary hover:text-primary/80 font-medium mt-2"
              >
                Don't have an account? Sign Up
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-3">
          Need help? Contact your school administrator
        </p>
      </div>
    </div>
  );
}