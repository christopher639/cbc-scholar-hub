import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  
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
        // Check if user has a role assigned (existing verified user)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (roleData?.role) {
          // EXISTING USER - Requires OTP verification if 2FA is enabled
          const { data: schoolData } = await supabase
            .from("school_info")
            .select("two_factor_enabled")
            .single();
          
          if (schoolData?.two_factor_enabled) {
            // Send OTP to user's phone/email
            try {
              const response = await supabase.functions.invoke("send-otp-sms", {
                body: { username: session.user.email, mode: "2fa_login" }
              });
              
              if (response.data?.success) {
                // Navigate to OTP verification page
                navigate("/otp-verification", { 
                  replace: true,
                  state: {
                    username: session.user.email || "",
                    password: "",
                    role: roleData.role,
                    otp: response.data.otp,
                    expiresAt: response.data.expiresAt,
                    maskedPhone: response.data.phone || "",
                    maskedEmail: response.data.email || "",
                    deliveryMethod: response.data.deliveryMethod || "sms",
                    isGoogleAuth: true
                  }
                });
              } else if (response.data?.no_phone) {
                // No phone number - skip 2FA and allow login
                toast({ 
                  title: "2FA Skipped", 
                  description: "No phone number on file. Please add one in settings for 2FA.",
                });
                if (roleData.role === "learner") {
                  navigate("/learner-portal", { replace: true });
                } else if (roleData.role === "teacher") {
                  navigate("/teacher-portal", { replace: true });
                } else {
                  navigate("/dashboard", { replace: true });
                }
              } else if (response.data?.otpFailed) {
                // OTP failed to send - BLOCK LOGIN
                toast({ 
                  title: "Login Blocked", 
                  description: response.data.message || "Failed to send verification code. Please try again later or contact admin.",
                  variant: "destructive" 
                });
                await supabase.auth.signOut();
                navigate("/", { replace: true });
              } else {
                throw new Error(response.data?.message || "Failed to send OTP");
              }
            } catch (error: any) {
              // Check if error is about no phone number
              if (error.message?.includes("No phone number")) {
                toast({ 
                  title: "2FA Skipped", 
                  description: "No phone number on file. Please add one in settings for 2FA.",
                });
                if (roleData.role === "learner") {
                  navigate("/learner-portal", { replace: true });
                } else if (roleData.role === "teacher") {
                  navigate("/teacher-portal", { replace: true });
                } else {
                  navigate("/dashboard", { replace: true });
                }
              } else {
                toast({ title: "Error", description: error.message || "Failed to send verification code", variant: "destructive" });
                await supabase.auth.signOut();
                navigate("/", { replace: true });
              }
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
          // NEW USER (first-time Google signup) - No OTP required, create pending account
          const userName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
          const userEmail = session.user.email || "";
          const userPhone = session.user.phone || "";
          
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

            // Send account created notification via SMS/Email
            try {
              await supabase.functions.invoke("send-account-notification", {
                body: { 
                  userId: session.user.id, 
                  notificationType: "account_created",
                  email: userEmail,
                  phone: userPhone,
                  fullName: userName
                }
              });
            } catch (notifyError) {
              console.error("Failed to send account created notification:", notifyError);
            }
          }
          
          // Sign out and show message - all new users need admin activation
          await supabase.auth.signOut();
          toast({
            title: "Account Pending Verification",
            description: "Your account has been created. You'll receive a notification via SMS/email once admin approves your account.",
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
    // Only auto-redirect if user exists, not loading, AND we're not handling OAuth callback
    // OAuth callback is handled separately with 2FA check
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthCallback = hashParams.has('access_token') || urlParams.has('code');
    
    if (user && !loading && !isOAuthCallback && !checkingGoogleAuth) {
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
  }, [user, loading, navigate, checkingGoogleAuth]);

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
        // Automatically send OTP to user's associated phone
        try {
          const response = await supabase.functions.invoke("send-otp-sms", {
            body: { username, mode: "2fa_login" }
          });
          
          if (response.error) throw response.error;
          
          if (response.data?.success) {
            // Navigate to OTP verification page
            navigate("/otp-verification", {
              replace: true,
              state: {
                username,
                password,
                role: result.role,
                userType: result.userType,
                otp: response.data.otp,
                expiresAt: response.data.expiresAt,
                maskedPhone: response.data.phone || "",
                maskedEmail: response.data.email || "",
                deliveryMethod: response.data.deliveryMethod || "sms",
                isGoogleAuth: false
              }
            });
          } else if (response.data?.no_phone) {
            // No phone number - proceed with login without 2FA
            toast({ 
              title: "2FA Skipped", 
              description: "No phone number on file. Please add one in settings for 2FA.",
            });
            const loginResult = await login(username, password);
            if (loginResult?.success) {
              if (loginResult.role === "learner") {
                navigate("/learner-portal", { replace: true });
              } else if (loginResult.role === "teacher") {
                navigate("/teacher-portal", { replace: true });
              } else {
                navigate("/dashboard", { replace: true });
              }
            }
          } else if (response.data?.otpFailed) {
            // OTP failed to send - BLOCK LOGIN
            toast({ 
              title: "Login Blocked", 
              description: response.data.message || "Failed to send verification code. Unable to verify your identity.",
              variant: "destructive" 
            });
          } else {
            throw new Error(response.data?.message || "Failed to send OTP");
          }
        } catch (error: any) {
          // Check if error is about no phone number
          if (error.message?.includes("No phone number")) {
            toast({ 
              title: "2FA Skipped", 
              description: "No phone number on file. Please add one in settings for 2FA.",
            });
            const loginResult = await login(username, password);
            if (loginResult?.success) {
              if (loginResult.role === "learner") {
                navigate("/learner-portal", { replace: true });
              } else if (loginResult.role === "teacher") {
                navigate("/teacher-portal", { replace: true });
              } else {
                navigate("/dashboard", { replace: true });
              }
            }
          } else {
            // OTP failed - Block login
            toast({ title: "Login Blocked", description: error.message || "Failed to send verification code. Please try again later.", variant: "destructive" });
          }
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Please enter your full name", variant: "destructive" });
      return;
    }

    if (!signupEmail.trim()) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (!signupPhone.trim()) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return;
    }

    // Validate phone format (should start with 07, 01, or +254)
    const phoneClean = signupPhone.replace(/\s/g, "");
    if (!/^(0[17]\d{8}|\+?254[17]\d{8})$/.test(phoneClean)) {
      toast({ title: "Error", description: "Please enter a valid Kenyan phone number (e.g., 0712345678)", variant: "destructive" });
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
        email: signupEmail.trim().toLowerCase(),
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
        // Format phone number
        let formattedPhone = phoneClean;
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "254" + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith("+")) {
          formattedPhone = formattedPhone.substring(1);
        }

        // Create profile with pending activation status and phone number
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            phone_number: formattedPhone,
            is_activated: false,
            activation_status: "pending",
          });
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // Notify admins about the new user request (in-app notification)
        await supabase.rpc("notify_admins", {
          p_title: "New User Registration",
          p_message: `${fullName.trim()} has registered and is waiting for account verification.`,
          p_type: "user_request",
          p_entity_type: "user",
          p_entity_id: data.user.id,
        });

        // Send account created notification via SMS/Email
        try {
          await supabase.functions.invoke("send-account-notification", {
            body: { 
              userId: data.user.id, 
              notificationType: "account_created",
              email: signupEmail.trim().toLowerCase(),
              phone: formattedPhone,
              fullName: fullName.trim()
            }
          });
        } catch (notifyError) {
          console.error("Failed to send account created notification:", notifyError);
        }
        
        toast({
          title: "Account Created!",
          description: "You'll receive an SMS and email notification. Please wait for admin approval.",
        });
        
        // Sign out since they need approval
        await supabase.auth.signOut();
        setIsSignUp(false);
        setFullName("");
        setSignupEmail("");
        setSignupPhone("");
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
              <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-primary/20">
                <img 
                  src={schoolInfo.logo_url} 
                  alt="School Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
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
        {isForgotPassword ? (
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
            // Sign Up Form - Email/Password + Phone OR Google
            <form onSubmit={handleSignUp} className="space-y-3">
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
              
              <div className="relative my-3">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] text-muted-foreground">
                  or sign up with email
                </span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="h-10 rounded-lg border-border/60 text-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signupEmail" className="text-xs font-medium">Email Address</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10 rounded-lg border-border/60 text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signupPhone" className="text-xs font-medium">Phone Number (+254)</Label>
                <Input
                  id="signupPhone"
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  className="h-10 rounded-lg border-border/60 text-sm"
                  placeholder="0712345678"
                />
                <p className="text-[10px] text-muted-foreground">
                  Used for OTP verification and notifications
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signupPassword" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="signupPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-10 rounded-lg border-border/60 pr-10 text-sm"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-10 rounded-lg border-border/60 pr-10 text-sm"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 rounded-lg text-sm font-semibold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</>
                ) : (
                  <><UserPlus className="mr-2 h-4 w-4" />Create Account</>
                )}
              </Button>
              
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="w-full text-xs text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
            </form>
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
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Forgot password?
                </Link>
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