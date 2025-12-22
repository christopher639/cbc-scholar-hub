import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { School, Loader2, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle2, Phone, Mail, RefreshCw, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  identifier: string;
  userId: string;
  userType: string;
  otp: string;
  expiresAt: string;
  maskedPhone: string;
  maskedEmail: string;
  deliveryMethod: string;
  deliveryMethods: string[];
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  const { toast } = useToast();
  
  const pendingData = location.state as LocationState | null;
  
  const [step, setStep] = useState<"otp" | "password" | "success">("otp");
  const [otpValue, setOtpValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes
  const [currentOtp, setCurrentOtp] = useState(pendingData?.otp || "");
  const [currentExpiresAt, setCurrentExpiresAt] = useState(pendingData?.expiresAt || "");

  // Countdown timer
  useEffect(() => {
    if (step !== "otp" || !currentExpiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(currentExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setRemainingTime(diff);
      
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentExpiresAt, step]);

  // Redirect if no pending data
  useEffect(() => {
    if (!pendingData) {
      navigate("/forgot-password", { replace: true });
    }
  }, [pendingData, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResendOtp = async () => {
    if (!pendingData?.identifier) return;
    
    setIsResending(true);
    try {
      const response = await supabase.functions.invoke("send-otp-sms", {
        body: { 
          username: pendingData.identifier, 
          mode: "forgot_password" 
        }
      });
      
      if (response.data?.success) {
        setCurrentOtp(response.data.otp);
        setCurrentExpiresAt(response.data.expiresAt);
        setRemainingTime(300);
        setOtpValue("");
        toast({ 
          title: "OTP Resent", 
          description: response.data.message || "New verification code sent" 
        });
      } else {
        throw new Error(response.data?.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to resend OTP",
        variant: "destructive" 
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast({ 
        title: "Error", 
        description: "Please enter the complete 6-digit code",
        variant: "destructive" 
      });
      return;
    }
    
    if (remainingTime <= 0) {
      toast({ 
        title: "Code Expired", 
        description: "Your verification code has expired. Please request a new one.",
        variant: "destructive" 
      });
      return;
    }
    
    if (otpValue !== currentOtp) {
      toast({ 
        title: "Invalid Code", 
        description: "The verification code is incorrect. Please try again.",
        variant: "destructive" 
      });
      return;
    }
    
    setStep("password");
    toast({ title: "Verified", description: "Please set your new password" });
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
      return { valid: false, message: "Password must be at least 6 characters" };
    }
    return { valid: true, message: "" };
  };

  const handleResetPassword = async () => {
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast({ title: "Error", description: validation.message, variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    if (!pendingData?.userId || !pendingData?.userType) {
      toast({ title: "Error", description: "Session expired. Please start over.", variant: "destructive" });
      navigate("/forgot-password", { replace: true });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call edge function to reset password
      const response = await supabase.functions.invoke("reset-password", {
        body: {
          userId: pendingData.userId,
          userType: pendingData.userType,
          newPassword: newPassword,
          identifier: pendingData.identifier
        }
      });
      
      if (response.error) throw response.error;
      
      if (response.data?.success) {
        setStep("success");
        toast({ 
          title: "Password Reset Successful", 
          description: "You can now log in with your new password" 
        });
      } else {
        throw new Error(response.data?.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to reset password",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (schoolLoading || !pendingData) {
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
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            {schoolInfo?.logo_url ? (
              <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary/20">
                <img 
                  src={schoolInfo.logo_url} 
                  alt="School Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <School className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {schoolInfo?.school_name || "School Portal"}
          </h1>
        </div>

        <Card className="border-border/50">
          {step === "otp" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Verify Your Identity</CardTitle>
                <CardDescription className="text-sm">
                  Enter the verification code sent to you
                </CardDescription>
                
                {/* Delivery Methods */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  {pendingData.maskedPhone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
                      <Phone className="h-3.5 w-3.5" />
                      <span>...{pendingData.maskedPhone}</span>
                    </div>
                  )}
                  {pendingData.maskedEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{pendingData.maskedEmail}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5">
                {/* OTP Input */}
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} className="w-11 h-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                {/* Timer */}
                <div className="text-center">
                  {remainingTime > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Code expires in{" "}
                      <span className={`font-mono font-semibold ${remainingTime <= 60 ? "text-destructive" : "text-foreground"}`}>
                        {formatTime(remainingTime)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-destructive font-medium">Code expired</p>
                  )}
                </div>
                
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-11 rounded-lg font-semibold"
                  disabled={otpValue.length !== 6 || remainingTime <= 0}
                >
                  Verify Code
                </Button>
                
                {/* Resend */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-sm"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Resend Code
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center pt-2">
                  <Link 
                    to="/forgot-password" 
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Try different identifier
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {step === "password" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Set New Password</CardTitle>
                <CardDescription className="text-sm">
                  Create a strong password for your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 rounded-lg pr-10"
                      placeholder="Enter new password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-lg pr-10"
                      placeholder="Confirm new password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Password Requirements */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Password requirements:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? "text-green-600" : ""}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? "bg-green-600" : "bg-muted-foreground/40"}`}></span>
                      At least 6 characters
                    </li>
                    <li className={`flex items-center gap-1.5 ${newPassword && newPassword === confirmPassword ? "text-green-600" : ""}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${newPassword && newPassword === confirmPassword ? "bg-green-600" : "bg-muted-foreground/40"}`}></span>
                      Passwords match
                    </li>
                  </ul>
                </div>
                
                <Button
                  onClick={handleResetPassword}
                  className="w-full h-11 rounded-lg font-semibold"
                  disabled={isSubmitting || !newPassword || !confirmPassword}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </CardContent>
            </>
          )}

          {step === "success" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-600">Password Reset Successful!</CardTitle>
                <CardDescription className="text-sm">
                  Your password has been successfully reset. You can now log in with your new password.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
                  <p>A confirmation has been sent to your registered phone number and email address.</p>
                </div>
                
                <Button
                  onClick={() => navigate("/auth", { replace: true })}
                  className="w-full h-11 rounded-lg font-semibold"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Sign In
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
