import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNonTeachingStaff } from "@/hooks/useNonTeachingStaff";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AddNonTeachingStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNonTeachingStaffDialog({ open, onOpenChange }: AddNonTeachingStaffDialogProps) {
  const { toast } = useToast();
  const { addStaff } = useNonTeachingStaff();
  const { user } = useUnifiedAuth();
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.job_title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newStaff = await addStaff({
        employee_number: formData.employee_number || null,
        id_number: formData.id_number || null,
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
      });

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
          details: { employee_number: formData.employee_number, job_title: formData.job_title }
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
      });

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
              <Label htmlFor="employeeNumber">Employee Number</Label>
              <Input 
                id="employeeNumber" 
                placeholder="Enter employee number" 
                value={formData.employee_number}
                onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input 
                id="idNumber" 
                placeholder="Enter ID number" 
                value={formData.id_number}
                onChange={(e) => setFormData({...formData, id_number: e.target.value})}
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Staff Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
