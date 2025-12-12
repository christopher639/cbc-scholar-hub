import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, ArrowLeft, School, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  username: string;
  password: string;
  role: string;
  userType?: string;
  otp: string;
  expiresAt: string;
  maskedPhone: string;
  isGoogleAuth?: boolean;
}

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const { schoolInfo } = useSchoolInfo();
  const { toast } = useToast();

  const [otpInput, setOtpInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentOtp, setSentOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [pendingData, setPendingData] = useState<LocationState | null>(null);

  useEffect(() => {
    const state = location.state as LocationState;
    
    if (!state?.otp || !state?.username) {
      // No valid OTP data, redirect back to auth
      navigate("/auth", { replace: true });
      return;
    }

    setSentOtp(state.otp);
    setOtpExpiry(new Date(state.expiresAt));
    setMaskedPhone(state.maskedPhone);
    setPendingData(state);
  }, [location.state, navigate]);

  const handleResendOtp = async () => {
    if (!pendingData) return;
    
    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("send-otp-sms", {
        body: { username: pendingData.username, mode: "2fa_login" }
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        setSentOtp(response.data.otp);
        setOtpExpiry(new Date(response.data.expiresAt));
        setMaskedPhone(response.data.phone);
        toast({
          title: "OTP Resent",
          description: `New verification code sent to phone ending in ...${response.data.phone}. Valid for 5 minutes.`
        });
      } else if (response.data?.no_phone) {
        // No phone - skip 2FA
        toast({
          title: "2FA Skipped",
          description: "No phone number on file. Proceeding with login.",
        });
        await completeLogin();
      } else {
        throw new Error(response.data?.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeLogin = async () => {
    if (!pendingData) return;

    if (pendingData.isGoogleAuth) {
      // Google users are already authenticated, just redirect
      if (pendingData.role === "learner") {
        navigate("/learner-portal", { replace: true });
      } else if (pendingData.role === "teacher") {
        navigate("/teacher-portal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      // For username/password login, complete the login
      const result = await login(pendingData.username, pendingData.password);

      if (result?.success) {
        if (result.role === "learner") {
          navigate("/learner-portal", { replace: true });
        } else if (result.role === "teacher") {
          navigate("/teacher-portal", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        toast({ title: "Error", description: "Login failed after verification.", variant: "destructive" });
        navigate("/auth", { replace: true });
      }
    }
  };

  const handleVerifyOtp = async () => {
    // Check if OTP has expired
    if (otpExpiry && new Date() > otpExpiry) {
      toast({ title: "OTP Expired", description: "Your OTP has expired. Please request a new one.", variant: "destructive" });
      return;
    }

    if (otpInput === sentOtp) {
      setIsSubmitting(true);
      toast({ title: "Verified", description: "Login successful!" });
      await completeLogin();
      setIsSubmitting(false);
    } else {
      toast({ title: "Error", description: "Invalid OTP. Please try again.", variant: "destructive" });
    }
  };

  const handleBackToLogin = async () => {
    // Use the logout function from AuthContext to properly clear all state
    await logout();
    navigate("/auth", { replace: true });
  };

  if (!pendingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        </div>

        {/* OTP Verification Card */}
        <div className="bg-card rounded-xl p-6 border border-border/50">
          <div className="text-center mb-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to your phone
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Phone ending in ...{maskedPhone}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
              <Input
                id="otp"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-14 rounded-lg border-border/60 text-2xl text-center tracking-[0.5em] font-mono"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-center text-muted-foreground">
                Code expires in 5 minutes
              </p>
            </div>

            <Button
              type="button"
              className="w-full h-12 rounded-lg text-sm font-semibold"
              onClick={handleVerifyOtp}
              disabled={isSubmitting || otpInput.length !== 6}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verify & Continue
                </>
              )}
            </Button>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Sending..." : "Didn't receive code? Resend OTP"}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
