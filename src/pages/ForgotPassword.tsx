import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { School, Loader2, ArrowLeft, KeyRound, Mail, Phone, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { schoolInfo, loading: schoolLoading } = useSchoolInfo();
  const { toast } = useToast();
  
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter your identifier", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the edge function to validate user and send OTP
      const response = await supabase.functions.invoke("send-otp-sms", {
        body: { 
          username: identifier.trim(), 
          mode: "forgot_password" 
        }
      });
      
      if (response.error) throw response.error;
      
      if (response.data?.success) {
        // Navigate to OTP verification page with reset password mode
        navigate("/reset-password", {
          state: {
            identifier: identifier.trim(),
            userId: response.data.userId,
            userType: response.data.userType,
            otp: response.data.otp,
            expiresAt: response.data.expiresAt,
            maskedPhone: response.data.phone || "",
            maskedEmail: response.data.email || "",
            deliveryMethod: response.data.deliveryMethod || "sms",
            deliveryMethods: response.data.deliveryMethods || []
          }
        });
        
        toast({ 
          title: "OTP Sent", 
          description: response.data.message || "Verification code sent successfully" 
        });
      } else if (response.data?.no_phone) {
        toast({ 
          title: "Cannot Reset Password", 
          description: "No phone number or email associated with this account. Please contact the administrator.",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "User Not Found", 
          description: "Please check your details and try again.",
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({ 
        title: "Error", 
        description: "Unable to process your request. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (schoolLoading) {
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
              <img 
                src={schoolInfo.logo_url} 
                alt="School Logo" 
                className="h-16 w-16 object-contain rounded-full ring-2 ring-primary/20"
              />
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
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Forgot Password?</CardTitle>
            <CardDescription className="text-sm">
              Enter your identifier to receive a verification code
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium">
                  Username / Identifier
                </Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11 rounded-lg"
                  placeholder="Enter your identifier"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Admission Number, Birth Certificate Number, Employee Number, or Email Address
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 rounded-lg font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </form>

            {/* Help Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-foreground">What can I enter?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  <span><strong>Learners:</strong> Admission Number or Birth Certificate Number</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  <span><strong>Teachers:</strong> TSC Number or Employee Number</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  <span><strong>Staff:</strong> Employee Number</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  <span><strong>Admins:</strong> Email Address</span>
                </li>
              </ul>
            </div>

            {/* Delivery Info */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>SMS</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </div>
            </div>
            
            <div className="text-center pt-2">
              <Link 
                to="/auth" 
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
