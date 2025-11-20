import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Loader2 } from "lucide-react";

interface EditTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  onSuccess: () => void;
}

export function EditTeacherDialog({ open, onOpenChange, teacher, onSuccess }: EditTeacherDialogProps) {
  const { toast } = useToast();
  const { user } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (teacher) {
      setFormData({
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
      });
    }
  }, [teacher]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

      const updateData: any = {
        employee_number: formData.employee_number || null,
        id_number: formData.id_number || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        hired_date: formData.hired_date || null,
        photo_url: formData.photo_url || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_number">Employee Number</Label>
              <Input
                id="employee_number"
                name="employee_number"
                value={formData.employee_number}
                onChange={handleChange}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_number">ID Number</Label>
              <Input
                id="id_number"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                placeholder="12345678"
              />
            </div>
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
            <Label htmlFor="photo_url">Photo URL</Label>
            <Input
              id="photo_url"
              name="photo_url"
              type="url"
              value={formData.photo_url}
              onChange={handleChange}
              placeholder="Enter photo URL"
            />
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
