import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { School, Upload, Save } from "lucide-react";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";

const SchoolInfo = () => {
  const { toast } = useToast();
  const { schoolInfo, loading: dataLoading, updateSchoolInfo } = useSchoolInfo();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("/placeholder.svg");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    school_name: "",
    motto: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (schoolInfo) {
      setFormData({
        school_name: schoolInfo.school_name || "",
        motto: schoolInfo.motto || "",
        email: schoolInfo.email || "",
        phone: schoolInfo.phone || "",
        address: schoolInfo.address || "",
      });
      if (schoolInfo.logo_url) {
        setLogoPreview(schoolInfo.logo_url);
      }
    }
  }, [schoolInfo]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let logoUrl = schoolInfo?.logo_url;

      if (logoFile) {
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(logoFile.type)) {
          throw new Error('Please upload a PNG, JPG, or JPEG file');
        }

        // Validate file size (max 5MB)
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
      
      await updateSchoolInfo({
        school_name: formData.school_name,
        motto: formData.motto,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        logo_url: logoUrl,
      });
      
      setLogoFile(null);
      
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
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <School className="h-8 w-8" />
            School Information
          </h1>
          <p className="text-muted-foreground">Manage your school's profile and branding</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Branding</CardTitle>
              <CardDescription>Upload your school logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="logo">School Logo</Label>
                <div className="flex flex-col items-center gap-4 border-2 border-dashed border-border rounded-lg p-6">
                  <img
                    src={logoPreview}
                    alt="School Logo"
                    className="h-32 w-32 object-contain rounded-lg"
                  />
                  <div className="text-center">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="logo"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>School identification and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  placeholder="Enter school name"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motto">School Motto</Label>
                <Input
                  id="motto"
                  placeholder="Enter school motto"
                  value={formData.motto}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="school@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254 700 000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Physical address and location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter school's physical address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="gap-2" disabled={loading}>
              <Save className="h-4 w-4" />
              Save School Information
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SchoolInfo;
