import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { School, Upload, Save } from "lucide-react";

const SchoolInfo = () => {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string>("/placeholder.svg");
  const [bannerPreview, setBannerPreview] = useState<string>("/placeholder.svg");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "School Information Saved",
      description: "School details have been updated successfully",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <School className="h-8 w-8" />
            School Information
          </h1>
          <p className="text-muted-foreground">Manage your school's profile and branding</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* School Branding */}
          <Card>
            <CardHeader>
              <CardTitle>School Branding</CardTitle>
              <CardDescription>Upload your school logo and banner image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Logo Upload */}
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

                {/* Banner Upload */}
                <div className="space-y-3">
                  <Label htmlFor="banner">School Banner</Label>
                  <div className="flex flex-col items-center gap-4 border-2 border-dashed border-border rounded-lg p-6">
                    <img
                      src={bannerPreview}
                      alt="School Banner"
                      className="h-32 w-full object-cover rounded-lg"
                    />
                    <div className="text-center">
                      <Input
                        id="banner"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="banner"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Banner
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>School identification and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input id="schoolName" defaultValue="CBC Primary School" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">School Code *</Label>
                  <Input id="schoolCode" defaultValue="CBC001" required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" defaultValue="+254 712 345 678" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" defaultValue="info@cbcschool.ac.ke" required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="www.cbcschool.ac.ke" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Name</Label>
                  <Input id="principal" placeholder="Enter principal's name" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Physical address and location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="physicalAddress">Physical Address *</Label>
                <Input id="physicalAddress" defaultValue="123 Education Road, Nairobi" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalAddress">Postal Address</Label>
                <Input id="postalAddress" placeholder="P.O. Box 12345-00100" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="county">County *</Label>
                  <Input id="county" defaultValue="Nairobi" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subCounty">Sub-County *</Label>
                  <Input id="subCounty" defaultValue="Westlands" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Input id="ward" placeholder="Enter ward" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* School Description */}
          <Card>
            <CardHeader>
              <CardTitle>School Description</CardTitle>
              <CardDescription>About your school, mission, and vision</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mission">Mission Statement</Label>
                <Textarea
                  id="mission"
                  placeholder="Enter your school's mission statement"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision">Vision Statement</Label>
                <Textarea
                  id="vision"
                  placeholder="Enter your school's vision statement"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motto">School Motto</Label>
                <Input id="motto" placeholder="Enter school motto" />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" className="gap-2">
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
