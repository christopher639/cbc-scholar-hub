import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useLearners } from "@/hooks/useLearners";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddLearnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  gradeId: string;
  streamId: string;
  photoFile: File | null;
}

const FORM_STORAGE_KEY = "learner_form_draft";

export function AddLearnerDialog({ open, onOpenChange }: AddLearnerDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    gradeId: "",
    streamId: "",
    photoFile: null,
  });

  const { grades, loading: gradesLoading } = useGrades();
  const { streams, loading: streamsLoading } = useStreams();
  const { addLearner, fetchLearners } = useLearners();
  const { toast } = useToast();

  // Filter streams based on selected grade
  const filteredStreams = formData.gradeId
    ? streams.filter((stream) => stream.grade_id === formData.gradeId)
    : [];

  // Load saved form data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData && open) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData({
          ...parsed,
          photoFile: null,
        });
        if (parsed.photoPreview) {
          setImagePreview(parsed.photoPreview);
        }
      } catch (e) {
        console.error("Failed to load saved form data", e);
      }
    }
  }, [open]);

  // Auto-save form data
  useEffect(() => {
    if (open) {
      const dataToSave = {
        ...formData,
        photoFile: null,
        photoPreview: imagePreview,
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [formData, imagePreview, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (PNG, JPG, JPEG)",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, photoFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gradeId: "",
      streamId: "",
      photoFile: null,
    });
    setImagePreview(null);
    localStorage.removeItem(FORM_STORAGE_KEY);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Missing information",
        description: "Please enter both first and last name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gradeId || !formData.streamId) {
      toast({
        title: "Missing information",
        description: "Please select both grade and stream",
        variant: "destructive",
      });
      return;
    }

    if (!formData.photoFile) {
      toast({
        title: "Missing photo",
        description: "Please upload a learner photo",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const fileExt = formData.photoFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `learner-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, formData.photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await addLearner({
        first_name: formData.firstName,
        last_name: formData.lastName,
        current_grade_id: formData.gradeId,
        current_stream_id: formData.streamId,
        photo_url: publicUrl,
        date_of_birth: "2010-01-01",
        gender: "other",
      });

      handleCancel();
      await fetchLearners();

      toast({
        title: "Success",
        description: "Learner added successfully with auto-generated admission number",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Learner</DialogTitle>
          <DialogDescription>
            Enter learner details to register a new student
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Learner" className="h-32 w-32 rounded-full object-cover border-4 border-border" />
              ) : (
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2 text-center">
              <Label htmlFor="photo">Profile Picture *</Label>
              <Input 
                id="photo" 
                type="file" 
                accept="image/png,image/jpeg,image/jpg" 
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">PNG, JPG or JPEG</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Select
                value={formData.gradeId}
                onValueChange={(value) => setFormData({ ...formData, gradeId: value, streamId: "" })}
                required
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder={gradesLoading ? "Loading..." : "Select grade"} />
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
              <Label htmlFor="stream">Stream *</Label>
              <Select
                value={formData.streamId}
                onValueChange={(value) => setFormData({ ...formData, streamId: value })}
                disabled={!formData.gradeId}
                required
              >
                <SelectTrigger id="stream">
                  <SelectValue placeholder={!formData.gradeId ? "Select grade first" : "Select stream"} />
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Learner...
                </>
              ) : (
                "Add Learner"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
