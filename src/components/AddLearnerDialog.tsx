import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { User, Users as UsersIcon, FileText, Heart, Loader2 } from "lucide-react";
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
  // Basic Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  photoFile: File | null;
  birthCertificateNumber: string;
  isStaffChild: boolean;
  
  // Parent Info
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
  parentEmail: string;
  parentOccupation: string;
  parentAddress: string;
  
  // Academic Info
  gradeId: string;
  streamId: string;
  enrollmentDate: string;
  previousSchool: string;
  previousGrade: string;
  reasonForTransfer: string;
  
  // Medical Info
  medicalInfo: string;
  allergies: string;
  bloodType: string;
  emergencyContact: string;
  emergencyPhone: string;
}

const FORM_STORAGE_KEY = "learner_form_draft";

export function AddLearnerDialog({ open, onOpenChange }: AddLearnerDialogProps) {
  const [currentTab, setCurrentTab] = useState("basic");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    photoFile: null,
    birthCertificateNumber: "",
    isStaffChild: false,
    parentFirstName: "",
    parentLastName: "",
    parentPhone: "",
    parentEmail: "",
    parentOccupation: "",
    parentAddress: "",
    gradeId: "",
    streamId: "",
    enrollmentDate: new Date().toISOString().split('T')[0],
    previousSchool: "",
    previousGrade: "",
    reasonForTransfer: "",
    medicalInfo: "",
    allergies: "",
    bloodType: "",
    emergencyContact: "",
    emergencyPhone: "",
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
      dateOfBirth: "",
      gender: "",
      photoFile: null,
      birthCertificateNumber: "",
      isStaffChild: false,
      parentFirstName: "",
      parentLastName: "",
      parentPhone: "",
      parentEmail: "",
      parentOccupation: "",
      parentAddress: "",
      gradeId: "",
      streamId: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
      previousSchool: "",
      previousGrade: "",
      reasonForTransfer: "",
      medicalInfo: "",
      allergies: "",
      bloodType: "",
      emergencyContact: "",
      emergencyPhone: "",
    });
    setImagePreview(null);
    setCurrentTab("basic");
    localStorage.removeItem(FORM_STORAGE_KEY);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - Required fields
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Missing information",
        description: "Please enter both first and last name",
        variant: "destructive",
      });
      setCurrentTab("basic");
      return;
    }

    if (!formData.dateOfBirth || !formData.gender) {
      toast({
        title: "Missing information",
        description: "Please enter date of birth and gender",
        variant: "destructive",
      });
      setCurrentTab("basic");
      return;
    }

    if (!formData.gradeId || !formData.streamId) {
      toast({
        title: "Missing information",
        description: "Please select both grade and stream",
        variant: "destructive",
      });
      setCurrentTab("academic");
      return;
    }

    if (!formData.photoFile) {
      toast({
        title: "Missing photo",
        description: "Please upload a learner photo",
        variant: "destructive",
      });
      setCurrentTab("basic");
      return;
    }

    setSubmitting(true);

    try {
      // Upload photo
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

      // Create or find parent
      let parentId = null;
      if (formData.parentPhone) {
        const { data: existingParent } = await supabase
          .from("parents")
          .select("id")
          .eq("phone", formData.parentPhone)
          .maybeSingle();

        if (existingParent) {
          parentId = existingParent.id;
        } else {
          const { data: newParent, error: parentError } = await supabase
            .from("parents")
            .insert({
              first_name: formData.parentFirstName,
              last_name: formData.parentLastName,
              phone: formData.parentPhone,
              email: formData.parentEmail,
              occupation: formData.parentOccupation,
              address: formData.parentAddress,
            })
            .select()
            .single();

          if (parentError) throw parentError;
          parentId = newParent.id;
        }
      }

      // Add learner (admission number auto-generated)
      await addLearner({
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        current_grade_id: formData.gradeId,
        current_stream_id: formData.streamId,
        photo_url: publicUrl,
        parent_id: parentId,
        enrollment_date: formData.enrollmentDate,
        birth_certificate_number: formData.birthCertificateNumber || null,
        is_staff_child: formData.isStaffChild,
        previous_school: formData.previousSchool || null,
        previous_grade: formData.previousGrade || null,
        reason_for_transfer: formData.reasonForTransfer || null,
        allergies: formData.allergies || null,
        blood_type: formData.bloodType || null,
        emergency_contact: formData.emergencyContact || null,
        emergency_phone: formData.emergencyPhone || null,
        medical_info: formData.medicalInfo || null,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Learner</DialogTitle>
          <DialogDescription>
            Complete all sections to register a new learner
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
              <TabsTrigger value="parents" className="text-xs">Parents</TabsTrigger>
              <TabsTrigger value="academic" className="text-xs">Academic</TabsTrigger>
              <TabsTrigger value="medical" className="text-xs">Medical</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Learner Information</h3>
                  </div>

                  <div className="flex flex-col items-center gap-4 mb-6">
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
                      <Label htmlFor="photo">Learner Photo *</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })} required>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthCertificateNumber">Birth Certificate Number</Label>
                      <Input
                        id="birthCertificateNumber"
                        placeholder="Enter birth certificate number"
                        value={formData.birthCertificateNumber}
                        onChange={(e) => setFormData({ ...formData, birthCertificateNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                    <input
                      type="checkbox"
                      id="isStaffChild"
                      checked={formData.isStaffChild}
                      onChange={(e) => setFormData({ ...formData, isStaffChild: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isStaffChild" className="cursor-pointer">
                      This learner is a child of a staff member (discount applies)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setCurrentTab("parents")}>Next: Parent Details</Button>
              </div>
            </TabsContent>

            {/* Parent Information */}
            <TabsContent value="parents" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <UsersIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Parent/Guardian Information</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="parentFirstName">First Name</Label>
                      <Input
                        id="parentFirstName"
                        placeholder="Enter first name"
                        value={formData.parentFirstName}
                        onChange={(e) => setFormData({ ...formData, parentFirstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentLastName">Last Name</Label>
                      <Input
                        id="parentLastName"
                        placeholder="Enter last name"
                        value={formData.parentLastName}
                        onChange={(e) => setFormData({ ...formData, parentLastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Phone Number</Label>
                      <Input
                        id="parentPhone"
                        placeholder="+254..."
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Email Address</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        placeholder="Enter email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentOccupation">Occupation</Label>
                      <Input
                        id="parentOccupation"
                        placeholder="Enter occupation"
                        value={formData.parentOccupation}
                        onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="parentAddress">Address</Label>
                      <Textarea
                        id="parentAddress"
                        placeholder="Enter full address"
                        value={formData.parentAddress}
                        onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentTab("basic")}>Previous</Button>
                <Button type="button" onClick={() => setCurrentTab("academic")}>Next: Academic Details</Button>
              </div>
            </TabsContent>

            {/* Academic Information */}
            <TabsContent value="academic" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Academic Information</h3>
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
                    <div className="space-y-2">
                      <Label htmlFor="enrollmentDate">Enrollment Date</Label>
                      <Input
                        id="enrollmentDate"
                        type="date"
                        value={formData.enrollmentDate}
                        onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4 text-sm text-muted-foreground">Previous School Information (Optional)</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="previousSchool">Previous School</Label>
                        <Input
                          id="previousSchool"
                          placeholder="Enter previous school name"
                          value={formData.previousSchool}
                          onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="previousGrade">Previous Grade</Label>
                        <Input
                          id="previousGrade"
                          placeholder="Enter previous grade"
                          value={formData.previousGrade}
                          onChange={(e) => setFormData({ ...formData, previousGrade: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="reasonForTransfer">Reason for Transfer</Label>
                        <Textarea
                          id="reasonForTransfer"
                          placeholder="Enter reason for transferring schools"
                          value={formData.reasonForTransfer}
                          onChange={(e) => setFormData({ ...formData, reasonForTransfer: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentTab("parents")}>Previous</Button>
                <Button type="button" onClick={() => setCurrentTab("medical")}>Next: Medical Info</Button>
              </div>
            </TabsContent>

            {/* Medical Information */}
            <TabsContent value="medical" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Medical Information</h3>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Allergies</Label>
                      <Input
                        id="allergies"
                        placeholder="List any allergies"
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodType">Blood Type</Label>
                      <Select value={formData.bloodType} onValueChange={(value) => setFormData({ ...formData, bloodType: value })}>
                        <SelectTrigger id="bloodType">
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
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                        <Input
                          id="emergencyContact"
                          placeholder="Enter contact name"
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyPhone"
                          placeholder="+254..."
                          value={formData.emergencyPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medicalInfo">Additional Medical Information</Label>
                      <Textarea
                        id="medicalInfo"
                        placeholder="Any other medical conditions or notes..."
                        value={formData.medicalInfo}
                        onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentTab("academic")}>Previous</Button>
                <div className="flex gap-3">
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
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
