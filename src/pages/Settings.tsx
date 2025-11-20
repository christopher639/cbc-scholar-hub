import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { School, Users, Bell, Shield, DollarSign, Moon, Sun } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DiscountSettingsDialog } from "@/components/DiscountSettingsDialog";
import { SetFeeStructureDialogEnhanced } from "@/components/SetFeeStructureDialogEnhanced";
import { useTheme } from "next-themes";
import { useDiscountSettings } from "@/hooks/useDiscountSettings";
import { useAdmissionNumberSettings } from "@/hooks/useAdmissionNumberSettings";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [feeStructureDialogOpen, setFeeStructureDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, loading, updateSettings } = useDiscountSettings();
  const { settings: admissionSettings, loading: admissionLoading, updateSettings: updateAdmissionSettings } = useAdmissionNumberSettings();
  const { toast } = useToast();
  
  const [admissionPrefix, setAdmissionPrefix] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [admissionPadding, setAdmissionPadding] = useState("4");

  // Get individual discount settings
  const staffDiscount = settings.find(s => s.discount_type === 'staff_parent');
  const siblingDiscount = settings.find(s => s.discount_type === 'sibling');
  const earlyPaymentDiscount = settings.find(s => s.discount_type === 'early_payment');
  const bursaryDiscount = settings.find(s => s.discount_type === 'bursary');

  // Update local state when admission settings load
  useEffect(() => {
    if (admissionSettings) {
      setAdmissionPrefix(admissionSettings.prefix || "");
      setAdmissionNumber(admissionSettings.current_number.toString());
      setAdmissionPadding(admissionSettings.padding.toString());
    }
  }, [admissionSettings]);

  const handleToggleDiscount = async (discountType: string, currentEnabled: boolean) => {
    const discountToUpdate = settings.find(s => s.discount_type === discountType);
    if (!discountToUpdate) return;

    const updates = settings.map(s => ({
      discount_type: s.discount_type,
      percentage: s.percentage,
      is_enabled: s.discount_type === discountType ? !currentEnabled : s.is_enabled
    }));

    const success = await updateSettings(updates);
    if (success) {
      toast({
        title: "Discount Updated",
        description: `${discountType.replace('_', ' ')} has been ${!currentEnabled ? 'enabled' : 'disabled'}`,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and preferences</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="school" className="space-y-4">
          <TabsList>
            <TabsTrigger value="school" className="gap-2">
              <School className="h-4 w-4" />
              School
            </TabsTrigger>
            <TabsTrigger value="admissions" className="gap-2">
              <Users className="h-4 w-4" />
              Admissions
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* School Settings */}
          <TabsContent value="school" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>School Information</CardTitle>
                <CardDescription>Basic school details and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input id="schoolName" placeholder="Enter school name" defaultValue="CBC Primary School" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code</Label>
                    <Input id="schoolCode" placeholder="Enter school code" defaultValue="CBC001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input id="county" placeholder="Enter county" defaultValue="Nairobi" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subCounty">Sub-County</Label>
                    <Input id="subCounty" placeholder="Enter sub-county" defaultValue="Westlands" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Enter phone number" defaultValue="+254 712 345 678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="Enter email" defaultValue="info@cbcschool.ac.ke" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="address">Physical Address</Label>
                  <Input id="address" placeholder="Enter physical address" defaultValue="123 Education Road, Nairobi" />
                </div>
                <Button>Save School Information</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                    >
                      System
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Academic Year Settings</CardTitle>
                <CardDescription>Configure academic terms and calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentYear">Current Academic Year</Label>
                    <Input id="currentYear" defaultValue="2025" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentTerm">Current Term</Label>
                    <Input id="currentTerm" defaultValue="Term 1" />
                  </div>
                </div>
                <Button>Update Academic Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admissions Settings */}
          <TabsContent value="admissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admission Number Settings</CardTitle>
                <CardDescription>Configure automatic generation of admission numbers for learners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {admissionLoading ? (
                  <p className="text-sm text-muted-foreground">Loading admission settings...</p>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="admissionPrefix">Prefix (Optional)</Label>
                        <Input 
                          id="admissionPrefix" 
                          placeholder="e.g., STU-" 
                          value={admissionPrefix}
                          onChange={(e) => setAdmissionPrefix(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Letters or numbers to start each admission number</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admissionNumber">Next Number</Label>
                        <Input 
                          id="admissionNumber" 
                          type="number" 
                          min="1"
                          value={admissionNumber}
                          onChange={(e) => setAdmissionNumber(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">The next admission number to be assigned</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admissionPadding">Number Length</Label>
                        <Input 
                          id="admissionPadding" 
                          type="number" 
                          min="1"
                          max="10"
                          value={admissionPadding}
                          onChange={(e) => setAdmissionPadding(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Minimum digits (e.g., 4 = 0001)</p>
                      </div>
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-1">Preview:</p>
                      <p className="text-lg font-mono">
                        {admissionPrefix}{admissionNumber.padStart(parseInt(admissionPadding) || 4, '0')}
                      </p>
                    </div>
                    <Button 
                      onClick={async () => {
                        const success = await updateAdmissionSettings({
                          prefix: admissionPrefix,
                          current_number: parseInt(admissionNumber) || 1,
                          padding: parseInt(admissionPadding) || 4
                        });
                        if (success) {
                          toast({
                            title: "Settings Saved",
                            description: "Admission number settings updated successfully",
                          });
                        }
                      }}
                    >
                      Save Admission Settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Settings */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Administrators</p>
                      <p className="text-sm text-muted-foreground">Full system access</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Teachers</p>
                      <p className="text-sm text-muted-foreground">Class and learner management</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Accounts Officers</p>
                      <p className="text-sm text-muted-foreground">Fee management access</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Parents</p>
                      <p className="text-sm text-muted-foreground">View learner progress</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Settings */}
          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Structure by Grade</CardTitle>
                <CardDescription>Set different fee amounts for each grade level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure fee structures for each grade, term, and academic year.
                </p>
                <Button onClick={() => setFeeStructureDialogOpen(true)}>
                  Set Fee Structure
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discount Settings</CardTitle>
                <CardDescription>Configure automatic fee discounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading discount settings...</p>
                ) : (
                  <div className="space-y-3">
                    {staffDiscount && (
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <div>
                          <p className="font-medium">Staff Parent Discount</p>
                          <p className="text-sm text-muted-foreground">
                            {staffDiscount.percentage}% discount {staffDiscount.is_enabled ? 'enabled' : 'disabled'}
                          </p>
                        </div>
                        <Switch 
                          checked={staffDiscount.is_enabled}
                          onCheckedChange={() => handleToggleDiscount('staff_parent', staffDiscount.is_enabled)}
                        />
                      </div>
                    )}
                    {siblingDiscount && (
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <div>
                          <p className="font-medium">Sibling Discount</p>
                          <p className="text-sm text-muted-foreground">
                            {siblingDiscount.percentage}% discount {siblingDiscount.is_enabled ? 'enabled' : 'disabled'}
                          </p>
                        </div>
                        <Switch 
                          checked={siblingDiscount.is_enabled}
                          onCheckedChange={() => handleToggleDiscount('sibling', siblingDiscount.is_enabled)}
                        />
                      </div>
                    )}
                    {earlyPaymentDiscount && (
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <div>
                          <p className="font-medium">Early Payment Discount</p>
                          <p className="text-sm text-muted-foreground">
                            {earlyPaymentDiscount.percentage}% discount {earlyPaymentDiscount.is_enabled ? 'enabled' : 'disabled'}
                          </p>
                        </div>
                        <Switch 
                          checked={earlyPaymentDiscount.is_enabled}
                          onCheckedChange={() => handleToggleDiscount('early_payment', earlyPaymentDiscount.is_enabled)}
                        />
                      </div>
                    )}
                    {bursaryDiscount && (
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">Bursary</p>
                          <p className="text-sm text-muted-foreground">
                            Bursary program {bursaryDiscount.is_enabled ? 'enabled' : 'disabled'}
                          </p>
                        </div>
                        <Switch 
                          checked={bursaryDiscount.is_enabled}
                          onCheckedChange={() => handleToggleDiscount('bursary', bursaryDiscount.is_enabled)}
                        />
                      </div>
                    )}
                  </div>
                )}
                <Button onClick={() => setDiscountDialogOpen(true)}>
                  Configure Discounts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Admissions</p>
                    <p className="text-sm text-muted-foreground">Notify when new learners are admitted</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Fee Payments</p>
                    <p className="text-sm text-muted-foreground">Notify on payment receipts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Outstanding Balances</p>
                    <p className="text-sm text-muted-foreground">Weekly balance reminders</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security and access control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Backup Schedule</Label>
                  <Button variant="outline" className="w-full">Configure Automated Backups</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DiscountSettingsDialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen} />
        <SetFeeStructureDialogEnhanced 
          open={feeStructureDialogOpen} 
          onOpenChange={setFeeStructureDialogOpen}
          onSuccess={() => setFeeStructureDialogOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
