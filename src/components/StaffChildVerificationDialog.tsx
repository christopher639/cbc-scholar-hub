import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiscountSettings } from "@/hooks/useDiscountSettings";
import { Loader2, CheckCircle, XCircle, UserCheck } from "lucide-react";

interface StaffChildVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (staffInfo: { name: string; employeeNumber: string; type: string }) => void;
  onCancel: () => void;
}

export function StaffChildVerificationDialog({
  open,
  onOpenChange,
  onVerified,
  onCancel,
}: StaffChildVerificationDialogProps) {
  const { toast } = useToast();
  const { settings } = useDiscountSettings();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    staffName?: string;
    staffType?: string;
    message?: string;
  } | null>(null);

  // Get staff discount percentage
  const staffDiscountSetting = settings.find(s => s.discount_type === 'staff_parent');
  const discountPercentage = staffDiscountSetting?.percentage || 0;
  const isDiscountEnabled = staffDiscountSetting?.is_enabled ?? false;

  const handleVerify = async () => {
    if (!employeeNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an employee number",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // First check in teachers table
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, employee_number, status")
        .eq("employee_number", employeeNumber.trim())
        .eq("status", "active")
        .maybeSingle();

      if (teacherError) throw teacherError;

      if (teacher) {
        setVerificationResult({
          verified: true,
          staffName: `${teacher.first_name} ${teacher.last_name}`,
          staffType: "Teacher",
        });
        return;
      }

      // Check in non-teaching staff table
      const { data: staff, error: staffError } = await supabase
        .from("non_teaching_staff")
        .select("id, first_name, last_name, employee_number, status, job_title")
        .eq("employee_number", employeeNumber.trim())
        .eq("status", "active")
        .maybeSingle();

      if (staffError) throw staffError;

      if (staff) {
        setVerificationResult({
          verified: true,
          staffName: `${staff.first_name} ${staff.last_name}`,
          staffType: staff.job_title || "Non-Teaching Staff",
        });
        return;
      }

      // Not found in either table
      setVerificationResult({
        verified: false,
        message: "No active staff member found with this employee number",
      });
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
      setVerificationResult({
        verified: false,
        message: "Error verifying employee number",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirm = () => {
    if (verificationResult?.verified) {
      onVerified({
        name: verificationResult.staffName!,
        employeeNumber: employeeNumber.trim(),
        type: verificationResult.staffType!,
      });
      resetAndClose();
    }
  };

  const handleCancel = () => {
    onCancel();
    resetAndClose();
  };

  const resetAndClose = () => {
    setEmployeeNumber("");
    setVerificationResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleCancel();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Verify Staff Parent
          </DialogTitle>
          <DialogDescription>
            Enter the employee number to verify the staff member and apply the staff parent discount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Discount Info */}
          {isDiscountEnabled && discountPercentage > 0 && (
            <Alert className="bg-primary/10 border-primary/20">
              <AlertDescription className="text-sm">
                Staff parent discount of <strong>{discountPercentage}%</strong> will be applied to all future term fees.
              </AlertDescription>
            </Alert>
          )}

          {!isDiscountEnabled && (
            <Alert className="bg-warning/10 border-warning/20">
              <AlertDescription className="text-sm text-warning">
                Staff parent discount is currently disabled in settings. Enable it in Fee Management → Discount Settings.
              </AlertDescription>
            </Alert>
          )}

          {/* Employee Number Input */}
          <div className="space-y-2">
            <Label htmlFor="employeeNumber">Employee Number</Label>
            <div className="flex gap-2">
              <Input
                id="employeeNumber"
                placeholder="e.g., EMP24001"
                value={employeeNumber}
                onChange={(e) => {
                  setEmployeeNumber(e.target.value);
                  setVerificationResult(null);
                }}
                disabled={verifying}
              />
              <Button 
                type="button" 
                onClick={handleVerify} 
                disabled={verifying || !employeeNumber.trim()}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className={`p-4 rounded-lg border ${
              verificationResult.verified 
                ? "bg-success/10 border-success/30" 
                : "bg-destructive/10 border-destructive/30"
            }`}>
              <div className="flex items-start gap-3">
                {verificationResult.verified ? (
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div className="flex-1">
                  {verificationResult.verified ? (
                    <>
                      <p className="font-semibold text-success">Staff Member Verified</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>{verificationResult.staffName}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {verificationResult.staffType}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-destructive">Verification Failed</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {verificationResult.message}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!verificationResult?.verified}
          >
            Confirm Staff Child
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}