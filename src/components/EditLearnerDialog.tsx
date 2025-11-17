import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    current_grade_id: "",
    current_stream_id: "",
    medical_info: "",
    birth_certificate_number: "",
    allergies: "",
    blood_type: "",
    emergency_contact: "",
    emergency_phone: "",
  });

  const [parentData, setParentData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    occupation: "",
    address: "",
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
        allergies: learner.allergies || "",
        blood_type: learner.blood_type || "",
        emergency_contact: learner.emergency_contact || "",
        emergency_phone: learner.emergency_phone || "",
      });
      
      if (learner.photo_url) {
        setPhotoPreview(learner.photo_url);
      }

      if (learner.parent_id) {
        loadParentData(learner.parent_id);
      }
    }
  }, [learner, open]);

  const loadParentData = async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from("parents")
        .select("*")
        .eq("id", parentId)
        .single();

      if (error) throw error;
      
      if (data) {
        setParentData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          email: data.email || "",
          occupation: data.occupation || "",
          address: data.address || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading parent data:", error);
    }
  };

  const filteredStreams = formData.current_grade_id
    ? streams.filter((stream) => stream.grade_id === formData.current_grade_id)
    : streams;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

      let photoUrl = learner.photo_url;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${learner.id}-${Date.now()}.${fileExt}`;
        const filePath = `learner-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      const { error: learnerError } = await supabase
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
          photo_url: photoUrl,
        })
        .eq("id", learner.id);

      if (learnerError) throw learnerError;

      if (learner.parent_id && (parentData.first_name || parentData.last_name || parentData.phone || parentData.email)) {
        const { error: parentError } = await supabase
          .from("parents")
          .update({
            first_name: parentData.first_name,
            last_name: parentData.last_name,
            phone: parentData.phone,
            email: parentData.email,
            occupation: parentData.occupation || null,
            address: parentData.address || null,
          })
          .eq("id", learner.parent_id);

        if (parentError) throw parentError;
      }

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Learner Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="parent">Parent Info</TabsTrigger>
              <TabsTrigger value="medical">Medical Info</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
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
                <Label>Learner Photo</Label>
                <div className="flex items-center gap-4">
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="h-24 w-24 rounded-full object-cover" />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Upload a photo (optional)</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parent" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent First Name</Label>
                  <Input
                    value={parentData.first_name}
                    onChange={(e) => setParentData({ ...parentData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Last Name</Label>
                  <Input
                    value={parentData.last_name}
                    onChange={(e) => setParentData({ ...parentData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={parentData.phone}
                    onChange={(e) => setParentData({ ...parentData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={parentData.email}
                    onChange={(e) => setParentData({ ...parentData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input
                  value={parentData.occupation}
                  onChange={(e) => setParentData({ ...parentData, occupation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={parentData.address}
                  onChange={(e) => setParentData({ ...parentData, address: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="medical" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Medical Information</Label>
                <Textarea
                  value={formData.medical_info}
                  onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
                  placeholder="Any medical conditions..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Allergies</Label>
                <Textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="List any allergies..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Blood Type</Label>
                <Select
                  value={formData.blood_type}
                  onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
