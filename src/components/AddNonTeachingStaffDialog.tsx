import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNonTeachingStaff } from "@/hooks/useNonTeachingStaff";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AddNonTeachingStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNonTeachingStaffDialog({ open, onOpenChange }: AddNonTeachingStaffDialogProps) {
  const { toast } = useToast();
  const { addStaff } = useNonTeachingStaff();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: "",
    id_number: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    department: "",
    hired_date: "",
    salary: "",
    address: "",
    emergency_contact: "",
    emergency_phone: "",
    photo_url: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatingNumber, setGeneratingNumber] = useState(false);

  // Auto-generate employee number when dialog opens
  useEffect(() => {
    const generateEmployeeNumber = async () => {
      if (open && !formData.employee_number) {
        setGeneratingNumber(true);
        try {
          const { data: genNumber } = await supabase.rpc('generate_employee_number');
          if (genNumber) {
            setFormData(prev => ({ ...prev, employee_number: genNumber }));
          }
        } catch (error) {
          console.error("Failed to generate employee number:", error);
        } finally {
          setGeneratingNumber(false);
        }
      }
    };
    generateEmployeeNumber();
  }, [open]);

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

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.job_title || !formData.id_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (including ID Number for login)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const employeeNumber = formData.employee_number;
      let photoUrl = formData.photo_url;

      // Upload photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `staff/${fileName}`;

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

      const newStaff = await addStaff({
        employee_number: employeeNumber,
        id_number: formData.id_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        job_title: formData.job_title,
        department: formData.department || null,
        hired_date: formData.hired_date || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        photo_url: photoUrl || null,
      });

      // Send credentials via SMS and Email
      if (newStaff && (formData.phone || formData.email)) {
        try {
          await supabase.functions.invoke("send-credentials-sms", {
            body: {
              type: "staff",
              phone: formData.phone || null,
              email: formData.email || null,
              credentials: {
                employeeNumber: employeeNumber,
                idNumber: formData.id_number,
                name: `${formData.first_name} ${formData.last_name}`,
                jobTitle: formData.job_title,
                portalUrl: window.location.origin + "/auth"
              }
            }
          });
        } catch (smsError) {
          console.log("Credentials sending failed:", smsError);
        }
      }

      // Log activity
      if (newStaff && user) {
        await supabase.from("activity_logs").insert({
          user_id: user.role === "admin" ? user.id : null,
          user_role: user.role,
          user_name: user.role === "admin" 
            ? (user.data as any).email 
            : `${(user.data as any).first_name} ${(user.data as any).last_name}`,
          action: "created",
          entity_type: "non_teaching_staff",
          entity_id: newStaff.id,
          entity_name: `${formData.first_name} ${formData.last_name}`,
          details: { employee_number: employeeNumber, job_title: formData.job_title }
        });
      }

      setFormData({
        employee_number: "",
        id_number: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        job_title: "",
        department: "",
        hired_date: "",
        salary: "",
        address: "",
        emergency_contact: "",
        emergency_phone: "",
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Non-Teaching Staff</DialogTitle>
          <DialogDescription>Enter staff member information and employment details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeNumber">Employee Number (Auto-generated)</Label>
              <Input 
                id="employeeNumber" 
                placeholder={generatingNumber ? "Generating..." : "Employee number"}
                value={formData.employee_number}
                readOnly
                className="bg-muted"
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
                placeholder="staff@school.ac.ke" 
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
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input 
                id="jobTitle" 
                placeholder="e.g., Librarian, Accountant" 
                value={formData.job_title}
                onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input 
                id="department" 
                placeholder="e.g., Administration, Finance" 
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hiredDate">Hired Date</Label>
              <Input 
                id="hiredDate" 
                type="date" 
                value={formData.hired_date}
                onChange={(e) => setFormData({...formData, hired_date: e.target.value})}
              />
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

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address" 
              placeholder="Enter residential address" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
              <Input 
                id="emergencyContact" 
                placeholder="Contact person name" 
                value={formData.emergency_contact}
                onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input 
                id="emergencyPhone" 
                placeholder="+254 712 345 678" 
                value={formData.emergency_phone}
                onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingPhoto}>
              {(loading || uploadingPhoto) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Staff Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
