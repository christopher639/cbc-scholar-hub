import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartments } from "@/hooks/useDepartments";
import { Loader2, AlertTriangle } from "lucide-react";

interface EditTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  onSuccess: () => void;
}

export function EditTeacherDialog({ open, onOpenChange, teacher, onSuccess }: EditTeacherDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { departments } = useDepartments();
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Transfer state
  const [transferData, setTransferData] = useState({
    destination_school: "",
    transfer_date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  
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
    department_id: "",
  });

  useEffect(() => {
    if (teacher && open) {
      setFormData({
        tsc_number: teacher.tsc_number || "",
        employee_number: teacher.employee_number || "",
        id_number: teacher.id_number || "",
        first_name: teacher.first_name || "",
        last_name: teacher.last_name || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        specialization: teacher.specialization || "",
        hired_date: teacher.hired_date || "",
        salary: teacher.salary?.toString() || "",
        photo_url: teacher.photo_url || "",
        department_id: teacher.department_id || "",
      });
      
      // Reset transfer state
      setTransferData({
        destination_school: "",
        transfer_date: new Date().toISOString().split("T")[0],
        reason: "",
      });
    }
  }, [teacher, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

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

      const updateData: any = {
        tsc_number: formData.tsc_number || null,
        employee_number: formData.employee_number || null,
        id_number: formData.id_number || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        hired_date: formData.hired_date || null,
        photo_url: photoUrl || null,
        department_id: formData.department_id || null,
      };

      // Only update salary if user is admin
      if (user?.role === "admin" && formData.salary) {
        updateData.salary = parseFloat(formData.salary);
      }

      const { error } = await supabase
        .from("teachers")
        .update(updateData)
        .eq("id", teacher.id);

      if (error) throw error;

      // Log activity
      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.role === "admin" ? user.id : teacher.id,
          user_role: user.role,
          user_name: user.role === "admin" 
            ? (user.data as any).email 
            : `${(user.data as any).first_name} ${(user.data as any).last_name}`,
          action: "updated",
          entity_type: "teacher",
          entity_id: teacher.id,
          entity_name: `${formData.first_name} ${formData.last_name}`,
          details: { changes: updateData }
        });
      }

      toast({
        title: "Success",
        description: "Teacher profile updated successfully",
      });

      onSuccess();
      onOpenChange(false);
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

  const handleTransfer = async () => {
    if (!transferData.destination_school.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the destination school/institution",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransferring(true);

      // Update teacher status to transferred
      const { error: updateError } = await supabase
        .from("teachers")
        .update({ status: "transferred" } as any)
        .eq("id", teacher.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Teacher has been marked as transferred.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher Profile</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Teacher Info</TabsTrigger>
            <TabsTrigger value="transfer" className="text-destructive">Transfer</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tsc_number">TSC Number (Username)</Label>
                  <Input
                    id="tsc_number"
                    name="tsc_number"
                    value={formData.tsc_number}
                    onChange={handleChange}
                    placeholder="TSC123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number (Password)</Label>
                  <Input
                    id="id_number"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    placeholder="12345678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_number">Employment Number</Label>
                <Input
                  id="employee_number"
                  name="employee_number"
                  value={formData.employee_number}
                  onChange={handleChange}
                  placeholder="EMP001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+254700000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Mathematics, Science, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hired_date">Hired Date</Label>
                  <Input
                    id="hired_date"
                    name="hired_date"
                    type="date"
                    value={formData.hired_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department_id">Department (Optional)</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, department_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {formData.photo_url && !photoFile && (
                  <p className="text-sm text-muted-foreground">Current photo will be kept unless you select a new one</p>
                )}
              </div>

              {user?.role === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (KES)</Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="50000"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploadingPhoto}>
                  {(loading || uploadingPhoto) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="transfer" className="mt-4 space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Transfer Teacher to Another Institution</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action will mark the teacher as transferred. They will be removed from active teachers.
                  </p>
                </div>
              </div>
            </div>

            {teacher?.status === "transferred" ? (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">This teacher has already been transferred.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="destination_school">Destination School/Institution *</Label>
                  <Input
                    id="destination_school"
                    value={transferData.destination_school}
                    onChange={(e) => setTransferData({ ...transferData, destination_school: e.target.value })}
                    placeholder="Enter the name of the school/institution"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_date">Transfer Date</Label>
                  <Input
                    id="transfer_date"
                    type="date"
                    value={transferData.transfer_date}
                    onChange={(e) => setTransferData({ ...transferData, transfer_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_reason">Reason for Transfer (Optional)</Label>
                  <Textarea
                    id="transfer_reason"
                    value={transferData.reason}
                    onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                    placeholder="Enter reason for transfer"
                    rows={3}
                  />
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleTransfer}
                  disabled={transferring || !transferData.destination_school.trim()}
                  className="w-full"
                >
                  {transferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {transferring ? "Processing Transfer..." : "Transfer Teacher"}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
