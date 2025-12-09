import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Upload, User, ShieldCheck, DollarSign, GraduationCap, Eye } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User session not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone_number, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile load error:", error);
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: user.email || "",
            phone_number: "",
            avatar_url: null,
          });
        
        if (!insertError) {
          setFullName(user.email || "");
          setPhoneNumber("");
          setAvatarUrl("");
        }
      } else if (data) {
        setFullName(data.full_name || "");
        setPhoneNumber(data.phone_number || "");
        setAvatarUrl(data.avatar_url || "");
      } else {
        // Profile doesn't exist, use email as fallback
        setFullName(user.email || "");
      }
    } catch (error: any) {
      console.error("Profile load error:", error);
      toast({
        title: "Error loading profile",
        description: error.message || "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User session not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Error uploading avatar",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User session not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!fullName) {
      // Try to use email first letter
      if (user?.email) {
        return user.email[0].toUpperCase();
      }
      return "U";
    }
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    const role = user?.role;
    if (!role) return null;
    
    const roleConfig: Record<string, { icon: React.ReactNode; className: string }> = {
      admin: { icon: <ShieldCheck className="h-3 w-3" />, className: "bg-primary text-primary-foreground" },
      finance: { icon: <DollarSign className="h-3 w-3" />, className: "border-green-500 text-green-600 bg-green-50 dark:bg-green-950" },
      teacher: { icon: <GraduationCap className="h-3 w-3" />, className: "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950" },
      visitor: { icon: <Eye className="h-3 w-3" />, className: "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950" },
      learner: { icon: <User className="h-3 w-3" />, className: "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950" },
      parent: { icon: <User className="h-3 w-3" />, className: "border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950" },
    };
    
    const config = roleConfig[role] || roleConfig.learner;
    
    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.icon}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
          {getRoleBadge()}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Picture Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:border-primary transition-colors">
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                      <span className="text-sm">
                        {uploading ? "Uploading..." : "Upload Photo"}
                      </span>
                    </div>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
