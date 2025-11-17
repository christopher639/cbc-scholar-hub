import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { School, Upload, Save, User } from "lucide-react";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SchoolInfo = () => {
  const { toast } = useToast();
  const { schoolInfo, loading: dataLoading, updateSchoolInfo } = useSchoolInfo();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("/placeholder.svg");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [directorPhotoPreview, setDirectorPhotoPreview] = useState<string>("/placeholder.svg");
  const [directorPhotoFile, setDirectorPhotoFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    if (schoolInfo) {
      setFormData({
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
      });
      if (schoolInfo.logo_url) {
        setLogoPreview(schoolInfo.logo_url);
      }
      if (schoolInfo.director_photo_url) {
        setDirectorPhotoPreview(schoolInfo.director_photo_url);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
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
        school_name: formData.school_name,
        motto: formData.motto,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        logo_url: logoUrl,
        director_name: formData.director_name,
        director_email: formData.director_email,
        director_phone: formData.director_phone,
        director_photo_url: directorPhotoUrl,
        director_qualification: formData.director_qualification,
        director_message: formData.director_message,
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
          <p className="text-muted-foreground">Manage your school's basic information and settings</p>
        </div>

        <form onSubmit={handleSave}>
          <Tabs defaultValue="school" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="school">School Details</TabsTrigger>
              <TabsTrigger value="director">Director Information</TabsTrigger>
            </TabsList>

            <TabsContent value="school" className="space-y-6">
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
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      placeholder="Enter school name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motto">School Motto</Label>
                    <Input
                      id="motto"
                      value={formData.motto}
                      onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                      placeholder="Enter school motto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="school@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+254 XXX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            </TabsContent>

            <TabsContent value="director" className="space-y-6">
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
                      value={formData.director_name}
                      onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                      placeholder="Enter director's full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="director_email">Director Email</Label>
                      <Input
                        id="director_email"
                        type="email"
                        value={formData.director_email}
                        onChange={(e) => setFormData({ ...formData, director_email: e.target.value })}
                        placeholder="director@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="director_phone">Director Phone</Label>
                      <Input
                        id="director_phone"
                        value={formData.director_phone}
                        onChange={(e) => setFormData({ ...formData, director_phone: e.target.value })}
                        placeholder="+254 XXX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="director_qualification">Qualifications</Label>
                    <Input
                      id="director_qualification"
                      value={formData.director_qualification}
                      onChange={(e) => setFormData({ ...formData, director_qualification: e.target.value })}
                      placeholder="e.g., PhD in Education, M.Ed."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="director_message">Director's Message</Label>
                    <Textarea
                      id="director_message"
                      value={formData.director_message}
                      onChange={(e) => setFormData({ ...formData, director_message: e.target.value })}
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SchoolInfo;
