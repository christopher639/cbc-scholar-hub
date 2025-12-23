import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { School, Users, Bell, Shield, DollarSign, Moon, Sun, Image as ImageIcon, Loader2, X, Plus, Upload, Save, User, BellRing } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DiscountSettingsDialog } from "@/components/DiscountSettingsDialog";
import { AppearanceSettingsCard } from "@/components/AppearanceSettingsCard";
import { UIStyleSettingsCard } from "@/components/UIStyleSettingsCard";
import { ThemeSettingsCard } from "@/components/ThemeSettingsCard";
import { SetFeeStructureDialogEnhanced } from "@/components/SetFeeStructureDialogEnhanced";
import { useTheme } from "next-themes";
import { useDiscountSettings } from "@/hooks/useDiscountSettings";
import { useAdmissionNumberSettings } from "@/hooks/useAdmissionNumberSettings";
import { useToast } from "@/hooks/use-toast";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useVisitorAccess } from "@/hooks/useVisitorAccess";
import { useNotifications, requestNotificationPermission, isPushNotificationsEnabled, setPushNotificationsEnabled } from "@/hooks/useNotifications";

// Push Notification Toggle Component
const PushNotificationToggle = () => {
  const [enabled, setEnabled] = useState(isPushNotificationsEnabled());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default");
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus("unsupported");
    }
  }, []);

  const handleToggle = async () => {
    if (permissionStatus === "unsupported") {
      toast({
        title: "Not Supported",
        description: "Your browser does not support push notifications.",
        variant: "destructive",
      });
      return;
    }

    if (!enabled) {
      // Enable push notifications
      const granted = await requestNotificationPermission();
      if (granted) {
        setPushNotificationsEnabled(true);
        setEnabled(true);
        setPermissionStatus("granted");
        toast({
          title: "Push Notifications Enabled",
          description: "You will now receive browser notifications for important updates.",
        });
      } else {
        setPermissionStatus(Notification.permission);
        toast({
          title: "Permission Required",
          description: "Please allow notifications in your browser to enable this feature.",
          variant: "destructive",
        });
      }
    } else {
      // Disable push notifications
      setPushNotificationsEnabled(false);
      setEnabled(false);
      toast({
        title: "Push Notifications Disabled",
        description: "You will no longer receive browser notifications.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BellRing className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Browser Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              {permissionStatus === "unsupported" 
                ? "Your browser does not support push notifications"
                : permissionStatus === "denied"
                ? "Notifications are blocked. Please update your browser settings."
                : enabled 
                ? "You will receive real-time notifications"
                : "Enable to receive real-time browser alerts"}
            </p>
          </div>
        </div>
        <Switch 
          checked={enabled && permissionStatus === "granted"}
          onCheckedChange={handleToggle}
          disabled={permissionStatus === "unsupported" || permissionStatus === "denied"}
        />
      </div>
      {permissionStatus === "denied" && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          Notifications are blocked by your browser. To enable them, click the lock icon in your browser's address bar and allow notifications for this site.
        </div>
      )}
    </div>
  );
};

interface HeroBackground {
  id: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

const Settings = () => {
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [feeStructureDialogOpen, setFeeStructureDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, loading, updateSettings } = useDiscountSettings();
  const { settings: admissionSettings, loading: admissionLoading, updateSettings: updateAdmissionSettings } = useAdmissionNumberSettings();
  const { schoolInfo, loading: schoolInfoLoading, updateSchoolInfo } = useSchoolInfo();
  const { toast } = useToast();
  const { checkAccess, isVisitor } = useVisitorAccess();
  
  const [admissionPrefix, setAdmissionPrefix] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [admissionPadding, setAdmissionPadding] = useState("4");
  
  // School info form state
  const [savingSchoolInfo, setSavingSchoolInfo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("/placeholder.svg");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [directorPhotoPreview, setDirectorPhotoPreview] = useState<string>("/placeholder.svg");
  const [directorPhotoFile, setDirectorPhotoFile] = useState<File | null>(null);
  
  const [schoolFormData, setSchoolFormData] = useState({
    school_name: "",
    motto: "",
    email: "",
    phone: "",
    address: "",
    director_name: "",
    director_email: "",
    director_phone: "",
    director_qualification: "",
    director_message: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_branch: "",
    mpesa_paybill: "",
    mpesa_account_name: "",
    payment_instructions: "",
    mission: "",
    vision: "",
    core_values: "",
  });
  
  // Hero background images state
  const [heroBackgrounds, setHeroBackgrounds] = useState<HeroBackground[]>([]);
  const [loadingBackgrounds, setLoadingBackgrounds] = useState(true);
  const [uploadingBackground, setUploadingBackground] = useState(false);

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

  // Update local state when school info loads
  useEffect(() => {
    if (schoolInfo) {
      setSchoolFormData({
        school_name: schoolInfo.school_name || "",
        motto: schoolInfo.motto || "",
        email: schoolInfo.email || "",
        phone: schoolInfo.phone || "",
        address: schoolInfo.address || "",
        director_name: schoolInfo.director_name || "",
        director_email: schoolInfo.director_email || "",
        director_phone: schoolInfo.director_phone || "",
        director_qualification: schoolInfo.director_qualification || "",
        director_message: schoolInfo.director_message || "",
        bank_name: schoolInfo.bank_name || "",
        bank_account_name: schoolInfo.bank_account_name || "",
        bank_account_number: schoolInfo.bank_account_number || "",
        bank_branch: schoolInfo.bank_branch || "",
        mpesa_paybill: schoolInfo.mpesa_paybill || "",
        mpesa_account_name: schoolInfo.mpesa_account_name || "",
        payment_instructions: schoolInfo.payment_instructions || "",
        mission: schoolInfo.mission || "",
        vision: schoolInfo.vision || "",
        core_values: schoolInfo.core_values || "",
      });
      if (schoolInfo.logo_url) {
        setLogoPreview(schoolInfo.logo_url);
      }
      if (schoolInfo.director_photo_url) {
        setDirectorPhotoPreview(schoolInfo.director_photo_url);
      }
    }
  }, [schoolInfo]);

  // Fetch hero backgrounds
  useEffect(() => {
    const fetchHeroBackgrounds = async () => {
      setLoadingBackgrounds(true);
      try {
        const { data, error } = await supabase
          .from("hero_backgrounds")
          .select("*")
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        setHeroBackgrounds(data || []);
      } catch (error: any) {
        console.error("Error fetching hero backgrounds:", error);
      } finally {
        setLoadingBackgrounds(false);
      }
    };
    fetchHeroBackgrounds();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectorPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDirectorPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDirectorPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSchoolInfo = async () => {
    if (!checkAccess("update school information")) return;
    setSavingSchoolInfo(true);
    
    try {
      let logoUrl = schoolInfo?.logo_url;
      let directorPhotoUrl = schoolInfo?.director_photo_url;

      if (logoFile) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(logoFile.type)) {
          throw new Error('Please upload a PNG, JPG, or JPEG file');
        }

        if (logoFile.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5MB');
        }

        const fileExt = logoFile.name.split('.').pop();
        const fileName = `school-logo-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        logoUrl = publicUrl;
      }

      if (directorPhotoFile) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(directorPhotoFile.type)) {
          throw new Error('Please upload a PNG, JPG, or JPEG file for director photo');
        }

        if (directorPhotoFile.size > 5 * 1024 * 1024) {
          throw new Error('Director photo size must be less than 5MB');
        }

        const fileExt = directorPhotoFile.name.split('.').pop();
        const fileName = `director-photo-${Date.now()}.${fileExt}`;
        const filePath = `director/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, directorPhotoFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        directorPhotoUrl = publicUrl;
      }
      
      await updateSchoolInfo({
        ...schoolFormData,
        logo_url: logoUrl,
        director_photo_url: directorPhotoUrl,
      });
      
      setLogoFile(null);
      setDirectorPhotoFile(null);
      
      toast({
        title: "Success",
        description: "School information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingSchoolInfo(false);
    }
  };

  const handleUploadHeroImage = async (file: File) => {
    if (!checkAccess("upload hero images")) return;
    
    if (heroBackgrounds.length >= 4) {
      toast({ 
        title: "Maximum reached", 
        description: "You can only have up to 4 hero background images. Delete one to add another.",
        variant: "destructive" 
      });
      return;
    }

    setUploadingBackground(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-background-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const { data: newBackground, error: insertError } = await supabase
        .from("hero_backgrounds")
        .insert({
          image_url: publicUrl,
          display_order: heroBackgrounds.length,
          is_active: true
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      setHeroBackgrounds([...heroBackgrounds, newBackground]);
      toast({ title: "Success", description: "Hero background image added" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleDeleteHeroImage = async (id: string) => {
    if (!checkAccess("delete hero images")) return;
    try {
      const { error } = await supabase
        .from("hero_backgrounds")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setHeroBackgrounds(heroBackgrounds.filter(bg => bg.id !== id));
      toast({ title: "Deleted", description: "Hero background image removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleHeroActive = async (id: string, isActive: boolean) => {
    if (!checkAccess("update hero images")) return;
    try {
      const { error } = await supabase.from("hero_backgrounds").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
      setHeroBackgrounds(heroBackgrounds.map((bg) => bg.id === id ? { ...bg, is_active: isActive } : bg));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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
          <p className="text-muted-foreground">Manage system configuration, school information, and preferences</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="school-info" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="school-info" className="gap-2">
              <School className="h-4 w-4" />
              School Info
            </TabsTrigger>
            <TabsTrigger value="director" className="gap-2">
              <User className="h-4 w-4" />
              Director
            </TabsTrigger>
            <TabsTrigger value="hero-images" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Hero Images
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Payment
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
            <TabsTrigger value="appearance" className="gap-2">
              <Sun className="h-4 w-4" />
              Appearance
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

          {/* School Info Tab */}
          <TabsContent value="school-info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your school's basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school_name">School Name *</Label>
                  <Input
                    id="school_name"
                    value={schoolFormData.school_name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, school_name: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motto">School Motto</Label>
                  <Input
                    id="motto"
                    value={schoolFormData.motto}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, motto: e.target.value })}
                    placeholder="Enter school motto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={schoolFormData.email}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, email: e.target.value })}
                      placeholder="school@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={schoolFormData.phone}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, phone: e.target.value })}
                      placeholder="+254 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={schoolFormData.address}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, address: e.target.value })}
                    placeholder="Enter school address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>School Logo</CardTitle>
                <CardDescription>Upload your school's logo (PNG, JPG, or JPEG - Max 5MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <img 
                      src={logoPreview} 
                      alt="School Logo" 
                      className="h-32 w-32 rounded-lg object-contain border border-border"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="logo" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-primary hover:text-primary/80">
                        <Upload className="h-4 w-4" />
                        <span>Choose Logo</span>
                      </div>
                    </Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended size: 200x200px
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mission, Vision & Core Values</CardTitle>
                <CardDescription>Set your school's mission, vision, and core values for the public website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea 
                    id="mission" 
                    placeholder="Enter your school's mission statement..."
                    value={schoolFormData.mission}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, mission: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision">Vision Statement</Label>
                  <Textarea 
                    id="vision" 
                    placeholder="Enter your school's vision statement..."
                    value={schoolFormData.vision}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, vision: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coreValues">Core Values</Label>
                  <Textarea 
                    id="coreValues" 
                    placeholder="Enter your school's core values..."
                    value={schoolFormData.core_values}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, core_values: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSchoolInfo} disabled={savingSchoolInfo} className="gap-2">
                <Save className="h-4 w-4" />
                {savingSchoolInfo ? "Saving..." : "Save School Information"}
              </Button>
            </div>
          </TabsContent>

          {/* Director Tab */}
          <TabsContent value="director" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Director Information</CardTitle>
                <CardDescription>Manage school director's details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="director_name">Director Name</Label>
                  <Input
                    id="director_name"
                    value={schoolFormData.director_name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, director_name: e.target.value })}
                    placeholder="Enter director's full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="director_email">Director Email</Label>
                    <Input
                      id="director_email"
                      type="email"
                      value={schoolFormData.director_email}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, director_email: e.target.value })}
                      placeholder="director@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="director_phone">Director Phone</Label>
                    <Input
                      id="director_phone"
                      value={schoolFormData.director_phone}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, director_phone: e.target.value })}
                      placeholder="+254 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="director_qualification">Qualifications</Label>
                  <Input
                    id="director_qualification"
                    value={schoolFormData.director_qualification}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, director_qualification: e.target.value })}
                    placeholder="e.g., PhD in Education, M.Ed."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="director_message">Director's Message</Label>
                  <Textarea
                    id="director_message"
                    value={schoolFormData.director_message}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, director_message: e.target.value })}
                    placeholder="Welcome message from the director..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Director Photo</CardTitle>
                <CardDescription>Upload director's photo (PNG, JPG, or JPEG - Max 5MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <img 
                      src={directorPhotoPreview} 
                      alt="Director Photo" 
                      className="h-32 w-32 rounded-full object-cover border border-border"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="director_photo" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-primary hover:text-primary/80">
                        <Upload className="h-4 w-4" />
                        <span>Choose Photo</span>
                      </div>
                    </Label>
                    <Input
                      id="director_photo"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleDirectorPhotoChange}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Professional headshot recommended
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSchoolInfo} disabled={savingSchoolInfo} className="gap-2">
                <Save className="h-4 w-4" />
                {savingSchoolInfo ? "Saving..." : "Save Director Information"}
              </Button>
            </div>
          </TabsContent>

          {/* Hero Images Tab */}
          <TabsContent value="hero-images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Homepage Hero Background
                </CardTitle>
                <CardDescription>
                  Upload up to 4 background images that will rotate every 3 seconds on the homepage hero section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingBackgrounds ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading hero backgrounds...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {heroBackgrounds.map((bg, index) => (
                        <div key={bg.id} className="relative group">
                          <img
                            src={bg.image_url}
                            alt={`Hero background ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteHeroImage(bg.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <span className="absolute bottom-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <div className="absolute top-1 left-1 flex items-center gap-1 bg-background/80 px-1.5 py-0.5 rounded">
                            <span className="text-[10px]">{bg.is_active ? "Active" : "Off"}</span>
                            <Switch
                              checked={bg.is_active}
                              onCheckedChange={(checked) => handleToggleHeroActive(bg.id, checked)}
                              className="scale-75"
                            />
                          </div>
                        </div>
                      ))}
                      
                      {heroBackgrounds.length < 4 && (
                        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                          {uploadingBackground ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Plus className="h-6 w-6 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-1">Add Image</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingBackground}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadHeroImage(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {heroBackgrounds.length}/4 images uploaded. Recommended size: 1920x1080px. Images will rotate every 3 seconds.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>Configure bank payment information for invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={schoolFormData.bank_name}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, bank_name: e.target.value })}
                      placeholder="e.g., Equity Bank"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_branch">Bank Branch</Label>
                    <Input
                      id="bank_branch"
                      value={schoolFormData.bank_branch}
                      onChange={(e) => setSchoolFormData({ ...schoolFormData, bank_branch: e.target.value })}
                      placeholder="e.g., Nairobi Branch"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_name">Account Name</Label>
                  <Input
                    id="bank_account_name"
                    value={schoolFormData.bank_account_name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, bank_account_name: e.target.value })}
                    placeholder="Enter bank account name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={schoolFormData.bank_account_number}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, bank_account_number: e.target.value })}
                    placeholder="Enter bank account number"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>M-Pesa Payment Details</CardTitle>
                <CardDescription>Configure M-Pesa payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa_paybill">Paybill Number</Label>
                  <Input
                    id="mpesa_paybill"
                    value={schoolFormData.mpesa_paybill}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, mpesa_paybill: e.target.value })}
                    placeholder="Enter M-Pesa paybill number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mpesa_account_name">Account Name</Label>
                  <Input
                    id="mpesa_account_name"
                    value={schoolFormData.mpesa_account_name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, mpesa_account_name: e.target.value })}
                    placeholder="Enter M-Pesa account name"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Instructions</CardTitle>
                <CardDescription>Additional payment instructions to display on invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="payment_instructions"
                  value={schoolFormData.payment_instructions}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, payment_instructions: e.target.value })}
                  placeholder="Enter any additional payment instructions (e.g., payment deadlines, late fees policy)"
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSchoolInfo} disabled={savingSchoolInfo} className="gap-2">
                <Save className="h-4 w-4" />
                {savingSchoolInfo ? "Saving..." : "Save Payment Settings"}
              </Button>
            </div>
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
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-primary/5">
                    <div>
                      <p className="font-medium">Finance Officers</p>
                      <p className="text-sm text-muted-foreground">Fee management, invoices, and payments only</p>
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

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Mode</CardTitle>
                <CardDescription>Choose between light and dark mode</CardDescription>
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

            {/* Application Theme - One-click themes */}
            <ThemeSettingsCard />

            {/* Primary Color Customization */}
            <AppearanceSettingsCard />

            {/* UI Style Settings - Sidebar, Cards, Hero */}
            <UIStyleSettingsCard />
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Enable browser notifications to receive real-time alerts even when the app is in the background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PushNotificationToggle />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage which notifications you receive</CardDescription>
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
                    <p className="font-medium">User Registration Requests</p>
                    <p className="text-sm text-muted-foreground">Notify when new users request account approval</p>
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
                    <p className="font-medium">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-muted-foreground">Require OTP verification for all logins</p>
                  </div>
                  <Switch 
                    checked={schoolInfo?.two_factor_enabled || false}
                    onCheckedChange={async (checked) => {
                      if (!checkAccess("update security settings")) return;
                      try {
                        await updateSchoolInfo({ two_factor_enabled: checked });
                        toast({
                          title: checked ? "2FA Enabled" : "2FA Disabled",
                          description: checked 
                            ? "All users will now need to verify via OTP when logging in" 
                            : "Two-factor authentication has been disabled",
                        });
                      } catch (error: any) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      }
                    }}
                  />
                </div>
                
                {/* 2FA Method Selection */}
                {schoolInfo?.two_factor_enabled && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                    <div>
                      <p className="font-medium text-sm">Verification Method</p>
                      <p className="text-xs text-muted-foreground">Choose how users receive their OTP codes</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={(schoolInfo?.two_factor_method || 'both') === 'sms' ? 'default' : 'outline'}
                        size="sm"
                        onClick={async () => {
                          if (!checkAccess("update security settings")) return;
                          try {
                            await updateSchoolInfo({ two_factor_method: 'sms' });
                            toast({ title: "2FA Method Updated", description: "OTP will be sent via SMS only" });
                          } catch (error: any) {
                            toast({ title: "Error", description: error.message, variant: "destructive" });
                          }
                        }}
                      >
                        SMS Only
                      </Button>
                      <Button
                        variant={(schoolInfo?.two_factor_method || 'both') === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={async () => {
                          if (!checkAccess("update security settings")) return;
                          try {
                            await updateSchoolInfo({ two_factor_method: 'email' });
                            toast({ title: "2FA Method Updated", description: "OTP will be sent via Email only" });
                          } catch (error: any) {
                            toast({ title: "Error", description: error.message, variant: "destructive" });
                          }
                        }}
                      >
                        Email Only
                      </Button>
                      <Button
                        variant={(schoolInfo?.two_factor_method || 'both') === 'both' ? 'default' : 'outline'}
                        size="sm"
                        onClick={async () => {
                          if (!checkAccess("update security settings")) return;
                          try {
                            await updateSchoolInfo({ two_factor_method: 'both' });
                            toast({ title: "2FA Method Updated", description: "OTP will be sent via both SMS and Email" });
                          } catch (error: any) {
                            toast({ title: "Error", description: error.message, variant: "destructive" });
                          }
                        }}
                      >
                        Both (SMS + Email)
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(schoolInfo?.two_factor_method || 'both') === 'sms' && "Users will receive OTP via SMS to their registered phone number"}
                      {(schoolInfo?.two_factor_method || 'both') === 'email' && "Users will receive OTP via Email to their registered email address"}
                      {(schoolInfo?.two_factor_method || 'both') === 'both' && "Users will receive OTP via both SMS and Email for maximum reliability"}
                    </p>
                  </div>
                )}
                
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