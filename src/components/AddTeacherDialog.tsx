import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTeachers } from "@/hooks/useTeachers";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { teacherSchema } from "@/lib/validations/teacher";
import { useVisitorAccess } from "@/hooks/useVisitorAccess";

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeacherDialog({ open, onOpenChange }: AddTeacherDialogProps) {
  const { toast } = useToast();
  const { addTeacher } = useTeachers();
  const { user } = useAuth();
  const { checkAccess } = useVisitorAccess();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tsc_number: "",
    employee_number: "",
    id_number: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: "",
    hired_date: "",
    salary: "",
    photo_url: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkAccess("add teachers")) return;
    
    // Validate form data using Zod schema
    const validationResult = teacherSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let photoUrl = formData.photo_url;

      // Upload photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `teachers/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
        setUploadingPhoto(false);
      }

      const newTeacher = await addTeacher({
        tsc_number: formData.tsc_number,
        employee_number: formData.employee_number,
        id_number: formData.id_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        hired_date: formData.hired_date || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        photo_url: photoUrl || null,
      });

      // Send credentials via SMS and Email
      if (newTeacher && (formData.phone || formData.email)) {
        try {
          await supabase.functions.invoke("send-credentials-sms", {
            body: {
              type: "teacher",
              phone: formData.phone || null,
              email: formData.email || null,
              credentials: {
                tscNumber: formData.tsc_number,
                idNumber: formData.id_number,
                portalUrl: window.location.origin + "/auth"
              }
            }
          });
        } catch (smsError) {
          console.log("Credentials sending failed:", smsError);
        }
      }

      // Log activity
      if (newTeacher && user) {
        await supabase.from("activity_logs").insert({
          user_id: user.role === "admin" ? user.id : null,
          user_role: user.role,
          user_name: user.role === "admin" 
            ? (user.data as any).email 
            : `${(user.data as any).first_name} ${(user.data as any).last_name}`,
          action: "created",
          entity_type: "teacher",
          entity_id: newTeacher.id,
          entity_name: `${formData.first_name} ${formData.last_name}`,
          details: { employee_number: formData.employee_number }
        });
      }

      setFormData({
        tsc_number: "",
        employee_number: "",
        id_number: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        specialization: "",
        hired_date: "",
        salary: "",
        photo_url: "",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      
      onOpenChange(false);
    } catch (error) {
      // Error toast is already shown in the hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogDescription>Enter teacher information and contact details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tscNumber">TSC Number (Username) *</Label>
              <Input 
                id="tscNumber" 
                placeholder="Enter TSC number" 
                value={formData.tsc_number}
                onChange={(e) => setFormData({...formData, tsc_number: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number (Password) *</Label>
              <Input 
                id="idNumber" 
                placeholder="Enter ID number" 
                value={formData.id_number}
                onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeNumber">Employment Number *</Label>
            <Input 
              id="employeeNumber" 
              placeholder="Enter employment number" 
              value={formData.employee_number}
              onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                placeholder="First name" 
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName" 
                placeholder="Last name" 
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="teacher@school.ac.ke" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="+254 712 345 678" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input 
                id="specialization" 
                placeholder="e.g., Mathematics, English" 
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hiredDate">Hired Date</Label>
              <Input 
                id="hiredDate" 
                type="date" 
                value={formData.hired_date}
                onChange={(e) => setFormData({...formData, hired_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Monthly Salary (KES)</Label>
            <Input 
              id="salary" 
              type="number" 
              placeholder="Enter monthly salary" 
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <Input 
              id="photo" 
              type="file" 
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={loading || uploadingPhoto}
            />
            {uploadingPhoto && <p className="text-sm text-muted-foreground">Uploading photo...</p>}
            {photoPreview && (
              <div className="mt-2">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingPhoto}>
              {(loading || uploadingPhoto) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Teacher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
