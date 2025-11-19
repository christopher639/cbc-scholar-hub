import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface DiscountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscountSettingsDialog({ open, onOpenChange }: DiscountSettingsDialogProps) {
  const { toast } = useToast();
  
  const [staffDiscountEnabled, setStaffDiscountEnabled] = useState(true);
  const [staffDiscountPercent, setStaffDiscountPercent] = useState("50");
  
  const [siblingDiscountEnabled, setSiblingDiscountEnabled] = useState(true);
  const [siblingDiscountPercent, setSiblingDiscountPercent] = useState("15");
  
  const [earlyPaymentEnabled, setEarlyPaymentEnabled] = useState(true);
  const [earlyPaymentPercent, setEarlyPaymentPercent] = useState("5");
  const [earlyPaymentDays, setEarlyPaymentDays] = useState("14");
  
  const [bursaryEnabled, setBursaryEnabled] = useState(true);

  const handleSave = () => {
    toast({
      title: "Discount Settings Saved",
      description: "Fee discount policies have been updated successfully",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fee Discount Settings</DialogTitle>
          <DialogDescription>
            Configure automatic fee discounts for different categories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Staff Discount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Staff Parent Discount</Label>
                <p className="text-sm text-muted-foreground">
                  Discount for children of school staff members
                </p>
              </div>
              <Switch
                checked={staffDiscountEnabled}
                onCheckedChange={setStaffDiscountEnabled}
              />
            </div>
            {staffDiscountEnabled && (
              <div className="space-y-2 pl-4">
                <Label htmlFor="staffDiscount">Discount Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="staffDiscount"
                    type="number"
                    value={staffDiscountPercent}
                    onChange={(e) => setStaffDiscountPercent(e.target.value)}
                    min="0"
                    max="100"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Sibling Discount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Sibling Discount</Label>
                <p className="text-sm text-muted-foreground">
                  Discount for families with multiple children enrolled
                </p>
              </div>
              <Switch
                checked={siblingDiscountEnabled}
                onCheckedChange={setSiblingDiscountEnabled}
              />
            </div>
            {siblingDiscountEnabled && (
              <div className="space-y-2 pl-4">
                <Label htmlFor="siblingDiscount">Discount Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="siblingDiscount"
                    type="number"
                    value={siblingDiscountPercent}
                    onChange={(e) => setSiblingDiscountPercent(e.target.value)}
                    min="0"
                    max="100"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Applied to 2nd child and onwards
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Early Payment Discount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Early Payment Discount</Label>
                <p className="text-sm text-muted-foreground">
                  Discount for paying fees early in the term
                </p>
              </div>
              <Switch
                checked={earlyPaymentEnabled}
                onCheckedChange={setEarlyPaymentEnabled}
              />
            </div>
            {earlyPaymentEnabled && (
              <div className="space-y-3 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="earlyDiscount">Discount Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="earlyDiscount"
                      type="number"
                      value={earlyPaymentPercent}
                      onChange={(e) => setEarlyPaymentPercent(e.target.value)}
                      min="0"
                      max="100"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="earlyDays">Early Payment Window</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="earlyDays"
                      type="number"
                      value={earlyPaymentDays}
                      onChange={(e) => setEarlyPaymentDays(e.target.value)}
                      min="1"
                      max="60"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days from term start</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Bursary Support */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Bursary Support</Label>
                <p className="text-sm text-muted-foreground">
                  Custom discounts for needy learners (set individually)
                </p>
              </div>
              <Switch
                checked={bursaryEnabled}
                onCheckedChange={setBursaryEnabled}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
