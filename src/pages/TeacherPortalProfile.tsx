import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { useUIStyles } from "@/hooks/useUIStyles";

interface OutletContext {
  teacher: any;
}

export default function TeacherPortalProfile() {
  const { toast } = useToast();
  const { teacher: initialTeacher } = useOutletContext<OutletContext>();
  const [teacher, setTeacher] = useState<any>(initialTeacher);
  const [loading, setLoading] = useState(!initialTeacher);
  const [isEditing, setIsEditing] = useState(false);
  const { getHeroGradientClass } = useUIStyles();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: "",
  });

  useEffect(() => {
    if (initialTeacher) {
      setTeacher(initialTeacher);
      setFormData({
        first_name: initialTeacher.first_name || "",
        last_name: initialTeacher.last_name || "",
        email: initialTeacher.email || "",
        phone: initialTeacher.phone || "",
        specialization: initialTeacher.specialization || "",
      });
      setLoading(false);
    }
  }, [initialTeacher]);

  const fetchTeacherData = async () => {
    if (!teacher?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", teacher.id)
        .single();

      if (error) throw error;

      setTeacher(data);
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        specialization: data.specialization || "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          specialization: formData.specialization,
        })
        .eq("id", teacher.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Hero Section with Dynamic Gradient */}
      <div className={`relative overflow-hidden rounded-2xl ${getHeroGradientClass()} p-6 md:p-8`}>
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white rounded-full opacity-50" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-6">
          {/* Profile Picture in Hero */}
          {teacher?.photo_url ? (
            <img
              src={teacher.photo_url}
              alt="Teacher"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 shadow-lg">
              <span className="text-3xl md:text-4xl font-bold text-white">
                {teacher?.first_name?.[0]}{teacher?.last_name?.[0]}
              </span>
            </div>
          )}
          
          <div className="text-center md:text-left text-white flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">
              {teacher?.first_name} {teacher?.last_name}
            </h1>
            <p className="text-white/80 mt-1">{teacher?.specialization || "Teacher"}</p>
            <p className="text-sm text-white/60 mt-1">{teacher?.employee_number || ""}</p>
          </div>

          {/* Edit Button in Hero */}
          <div className="md:self-start">
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    fetchTeacherData();
                  }}
                  className="bg-transparent hover:bg-white/10 text-white border-white/30"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{teacher?.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Last Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{teacher?.last_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{teacher?.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{teacher?.phone || "N/A"}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Specialization</Label>
                {isEditing ? (
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{teacher?.specialization || "N/A"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Employee Number</Label>
                <p className="text-sm">{teacher?.employee_number || "N/A"}</p>
              </div>

              <div className="space-y-2">
                <Label>TSC Number</Label>
                <p className="text-sm">{teacher?.tsc_number || "N/A"}</p>
              </div>

              <div className="space-y-2">
                <Label>ID Number</Label>
                <p className="text-sm">{teacher?.id_number || "N/A"}</p>
              </div>

              <div className="space-y-2">
                <Label>Hire Date</Label>
                <p className="text-sm">
                  {teacher?.hired_date
                    ? format(new Date(teacher.hired_date), "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>

              {teacher?.department && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <p className="text-sm">{teacher.department.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
