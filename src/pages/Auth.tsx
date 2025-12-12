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
import { School, Eye, EyeOff, LogIn, Loader2, UserPlus, ArrowLeft, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, login, validateCredentials } = useAuth();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingGoogleAuth, setCheckingGoogleAuth] = useState(true);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentOtp, setSentOtp] = useState("");
  const [userType, setUserType] = useState<"learner" | "teacher">("learner");
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [verifiedUserId, setVerifiedUserId] = useState("");
  
  // 2FA states
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [loginOtp, setLoginOtp] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginSentOtp, setLoginSentOtp] = useState("");
  const [loginOtpExpiry, setLoginOtpExpiry] = useState<Date | null>(null);
  const [pendingLoginData, setPendingLoginData] = useState<{ username: string; password: string; role?: string | null; userType?: string | null } | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");

  // State for Google 2FA
  const [googleUser, setGoogleUser] = useState<{ id: string; role: string; email: string } | null>(null);

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
          // Check if 2FA is enabled
          const { data: schoolData } = await supabase
            .from("school_info")
            .select("two_factor_enabled")
            .single();
          
          if (schoolData?.two_factor_enabled) {
            // Store Google user data and require 2FA
            setGoogleUser({ 
              id: session.user.id, 
              role: roleData.role, 
              email: session.user.email || "" 
            });
            
            // Send OTP to user's phone
            try {
              const response = await supabase.functions.invoke("send-otp-sms", {
                body: { username: session.user.email, mode: "2fa_login" }
              });
              
              if (response.data?.success) {
                setLoginSentOtp(response.data.otp);
                setLoginOtpExpiry(new Date(response.data.expiresAt));
                setMaskedPhone(response.data.phone);
                setIs2FARequired(true);
                setLoginOtpSent(true);
                setPendingLoginData({ username: session.user.email || "", password: "", role: roleData.role });
                toast({ 
                  title: "OTP Sent", 
                  description: `Verification code sent to phone ending in ...${response.data.phone}. Valid for 5 minutes.` 
                });
              } else {
                throw new Error(response.data?.message || "Failed to send OTP");
              }
            } catch (error: any) {
              toast({ title: "Error", description: error.message || "Failed to send verification code", variant: "destructive" });
              await supabase.auth.signOut();
            }
          } else {
            // No 2FA - redirect directly
            if (roleData.role === "learner") {
              navigate("/learner-portal", { replace: true });
            } else if (roleData.role === "teacher") {
              navigate("/teacher-portal", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }
        } else {
          // No role assigned - create profile and require admin activation
          const userName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .single();
          
          if (!profile) {
            // Create profile for new Google user with pending status
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
          
          // Sign out and show message - all new users need admin activation
          await supabase.auth.signOut();
          toast({
            title: "Account Pending Verification",
            description: "Your account has been created and is pending admin approval. You'll be notified once activated.",
          });
          navigate("/", { replace: true });
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
    // Don't auto-redirect if 2FA verification is pending
    if (is2FARequired) return;
    
    if (user && !loading) {
      // Check if user is activated and redirect based on role
      if (user.role === "learner") {
        navigate("/learner-portal", { replace: true });
      } else if (user.role === "teacher") {
        navigate("/teacher-portal", { replace: true });
      } else if (user.role === "admin" || user.role === "finance" || user.role === "visitor") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate, is2FARequired]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (rememberMe) {
      localStorage.setItem("remembered_username", username);
    } else {
      localStorage.removeItem("remembered_username");
    }
    
    // Check if 2FA is enabled
    if (schoolInfo?.two_factor_enabled) {
      // First validate credentials WITHOUT completing login
      const result = await validateCredentials(username, password);
      
      if (result?.success) {
        // Store pending login data (including userType for proper login after OTP)
        setPendingLoginData({ username, password, role: result.role, userType: result.userType });
        
        // Automatically send OTP to user's associated phone
        try {
          const response = await supabase.functions.invoke("send-otp-sms", {
            body: { username, mode: "2fa_login" }
          });
          
          if (response.error) throw response.error;
          
          if (response.data?.success) {
            setLoginSentOtp(response.data.otp);
            setLoginOtpExpiry(new Date(response.data.expiresAt));
            setMaskedPhone(response.data.phone);
            setIs2FARequired(true);
            setLoginOtpSent(true);
            toast({ 
              title: "OTP Sent", 
              description: `Verification code sent to phone ending in ...${response.data.phone}. Valid for 5 minutes.` 
            });
          } else {
            throw new Error(response.data?.message || "Failed to send OTP");
          }
        } catch (error: any) {
          toast({ title: "Error", description: error.message || "Failed to send verification code", variant: "destructive" });
        }
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      return;
    } else {
      // Normal login without 2FA
      const result = await login(username, password);
      
      if (result?.success) {
        if (result.role === "learner") {
          navigate("/learner-portal", { replace: true });
        } else if (result.role === "teacher") {
          navigate("/teacher-portal", { replace: true });
        } else if (result.role === "admin" || result.role === "finance" || result.role === "visitor") {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
    
    setIsSubmitting(false);
  };

  const handleResend2FAOtp = async () => {
    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("send-otp-sms", {
        body: { username: pendingLoginData?.username, mode: "2fa_login" }
      });
      
      if (response.error) throw response.error;
      
      if (response.data?.success) {
        setLoginSentOtp(response.data.otp);
        setLoginOtpExpiry(new Date(response.data.expiresAt));
        setMaskedPhone(response.data.phone);
        toast({ 
          title: "OTP Resent", 
          description: `New verification code sent to phone ending in ...${response.data.phone}. Valid for 5 minutes.` 
        });
      } else {
        throw new Error(response.data?.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FAOtp = async () => {
    // Check if OTP has expired
    if (loginOtpExpiry && new Date() > loginOtpExpiry) {
      toast({ title: "OTP Expired", description: "Your OTP has expired. Please request a new one.", variant: "destructive" });
      return;
    }
    
    if (loginOtp === loginSentOtp) {
      setIsSubmitting(true);
      
      // OTP verified - now actually complete the login
      if (pendingLoginData) {
        const result = await login(pendingLoginData.username, pendingLoginData.password);
        
        if (result?.success) {
          toast({ title: "Verified", description: "Login successful!" });
          setIs2FARequired(false);
          
          if (result.role === "learner") {
            navigate("/learner-portal", { replace: true });
          } else if (result.role === "teacher") {
            navigate("/teacher-portal", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          toast({ title: "Error", description: "Login failed after verification.", variant: "destructive" });
        }
      } else if (googleUser) {
        // For Google users, they're already authenticated - just redirect
        toast({ title: "Verified", description: "Login successful!" });
        setIs2FARequired(false);
        
        if (googleUser.role === "learner") {
          navigate("/learner-portal", { replace: true });
        } else if (googleUser.role === "teacher") {
          navigate("/teacher-portal", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
      
      setIsSubmitting(false);
    } else {
      toast({ title: "Error", description: "Invalid OTP. Please try again.", variant: "destructive" });
    }
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
    setIsForgotPassword(true);
  };

  const handleSendOtp = async () => {
    if (!username || !phone) {
      toast({ title: "Error", description: "Please enter your username and phone number", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const formattedPhone = phone.startsWith("0") ? `254${phone.substring(1)}` : phone;
      const response = await supabase.functions.invoke("send-otp-sms", {
        body: { phone: formattedPhone, username, userType }
      });
      if (response.error) throw response.error;
      if (response.data?.success) {
        setSentOtp(response.data.otp);
        setVerifiedUserId(response.data.userId);
        setOtpSent(true);
        toast({ title: "OTP Sent", description: `OTP sent to phone ending in ...${response.data.phone}` });
      } else {
        throw new Error(response.data?.message || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp === sentOtp) {
      setOtpVerified(true);
      toast({ title: "Success", description: "OTP verified! Please set your new password." });
    } else {
      toast({ title: "Error", description: "Invalid OTP. Please try again.", variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      toast({ title: "Error", description: "Please enter and confirm your new password", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update password based on user type
      if (userType === "learner") {
        const { error } = await supabase
          .from("learners")
          .update({ birth_certificate_number: newPassword })
          .eq("id", verifiedUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("teachers")
          .update({ id_number: newPassword })
          .eq("id", verifiedUserId);
        if (error) throw error;
      }
      
      toast({ title: "Password Reset", description: "Your password has been updated. You can now login." });
      // Reset all states
      setIsForgotPassword(false);
      setOtpSent(false);
      setOtpVerified(false);
      setOtp("");
      setSentOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPhone("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
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
        {is2FARequired ? (
            // 2FA OTP Verification Form
            <div className="space-y-4">
              <div className="text-center mb-2">
                <Phone className="h-10 w-10 mx-auto text-primary mb-2" />
                <h2 className="text-lg font-semibold">Verify Your Login</h2>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to phone ending in ...{maskedPhone}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Code expires in 5 minutes
                </p>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="login-otp" className="text-xs font-medium">Verification Code</Label>
                <Input
                  id="login-otp"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 rounded-lg border-border/60 text-lg text-center tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <Button
                type="button"
                className="w-full h-10 rounded-lg text-sm font-semibold"
                onClick={handleVerify2FAOtp}
                disabled={isSubmitting || loginOtp.length !== 6}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
              
              <button
                type="button"
                onClick={handleResend2FAOtp}
                disabled={isSubmitting}
                className="w-full text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Didn't receive code? Resend OTP"}
              </button>
              
              <button
                type="button"
                onClick={() => { 
                  setIs2FARequired(false); 
                  setLoginOtpSent(false); 
                  setLoginOtp(""); 
                  setPendingLoginData(null);
                }}
                className="w-full text-xs text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
            </div>
          ) : isForgotPassword ? (
            // Forgot Password OTP Form
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg font-semibold">Reset Password</h2>
                <p className="text-xs text-muted-foreground">
                  {otpSent ? "Enter the OTP sent to your phone" : "Enter your details to receive an OTP"}
                </p>
              </div>
              
              {!otpSent ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">I am a</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={userType === "learner" ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setUserType("learner")}
                      >
                        Learner
                      </Button>
                      <Button
                        type="button"
                        variant={userType === "teacher" ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setUserType("teacher")}
                      >
                        Teacher
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="forgot-username" className="text-xs font-medium">
                      {userType === "learner" ? "Admission Number" : "TSC Number"}
                    </Label>
                    <Input
                      id="forgot-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-10 rounded-lg border-border/60 text-sm"
                      placeholder={userType === "learner" ? "Enter admission number" : "Enter TSC number"}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 rounded-lg border-border/60 text-sm"
                      placeholder="e.g., 0712345678"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {userType === "learner" ? "Parent's phone number" : "Your registered phone number"}
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    className="w-full h-10 rounded-lg text-sm font-semibold"
                    onClick={handleSendOtp}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="otp" className="text-xs font-medium">Enter OTP</Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-10 rounded-lg border-border/60 text-sm text-center tracking-widest"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    className="w-full h-10 rounded-lg text-sm font-semibold"
                    onClick={handleVerifyOtp}
                    disabled={isSubmitting}
                  >
                    Verify OTP
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Resend OTP
                  </button>
                </>
              )}
              
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setOtpSent(false); setOtp(""); setPhone(""); }}
                className="w-full text-xs text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
            </div>
          ) : isSignUp ? (
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