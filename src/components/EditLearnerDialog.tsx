import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";

interface EditLearnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: any;
  onSuccess?: () => void;
}

export function EditLearnerDialog({ open, onOpenChange, learner, onSuccess }: EditLearnerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { grades } = useGrades();
  const { streams } = useStreams();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    current_grade_id: "",
    current_stream_id: "",
    medical_info: "",
    birth_certificate_number: "",
  });

  useEffect(() => {
    if (learner && open) {
      setFormData({
        first_name: learner.first_name || "",
        last_name: learner.last_name || "",
        date_of_birth: learner.date_of_birth || "",
        gender: learner.gender || "",
        current_grade_id: learner.current_grade_id || "",
        current_stream_id: learner.current_stream_id || "",
        medical_info: learner.medical_info || "",
        birth_certificate_number: learner.birth_certificate_number || "",
      });
    }
  }, [learner, open]);

  const filteredStreams = formData.current_grade_id
    ? streams.filter((stream) => stream.grade_id === formData.current_grade_id)
    : streams;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth || !formData.gender) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("learners")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender as "male" | "female" | "other",
          current_grade_id: formData.current_grade_id || null,
          current_stream_id: formData.current_stream_id || null,
          medical_info: formData.medical_info || null,
          birth_certificate_number: formData.birth_certificate_number || null,
        })
        .eq("id", learner.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Learner information updated successfully",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
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
          <DialogTitle>Edit Learner Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_grade_id">Grade</Label>
              <Select
                value={formData.current_grade_id}
                onValueChange={(value) => setFormData({ ...formData, current_grade_id: value, current_stream_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_stream_id">Stream</Label>
              <Select
                value={formData.current_stream_id}
                onValueChange={(value) => setFormData({ ...formData, current_stream_id: value })}
                disabled={!formData.current_grade_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStreams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_certificate_number">Birth Certificate Number</Label>
            <Input
              id="birth_certificate_number"
              value={formData.birth_certificate_number}
              onChange={(e) => setFormData({ ...formData, birth_certificate_number: e.target.value })}
              placeholder="For parent portal access"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_info">Medical Information</Label>
            <Textarea
              id="medical_info"
              value={formData.medical_info}
              onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
              placeholder="Any medical conditions or allergies..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
