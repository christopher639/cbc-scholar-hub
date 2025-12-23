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
import { useHouses } from "@/hooks/useHouses";
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { StaffChildVerificationDialog } from "./StaffChildVerificationDialog";

interface EditLearnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: any;
  onSuccess?: () => void;
}

export function EditLearnerDialog({ open, onOpenChange, learner, onSuccess }: EditLearnerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const { grades } = useGrades();
  const { streams } = useStreams();
  const { houses } = useHouses();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  // Staff child verification state
  const [showStaffVerification, setShowStaffVerification] = useState(false);
  const [verifiedStaffInfo, setVerifiedStaffInfo] = useState<{
    name: string;
    employeeNumber: string;
    type: string;
  } | null>(null);
  
  // Transfer state
  const [showTransferSection, setShowTransferSection] = useState(false);
  const [transferData, setTransferData] = useState({
    destination_school: "",
    transfer_date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  
  const [formData, setFormData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    current_grade_id: "",
    current_stream_id: "",
    house_id: "",
    medical_info: "",
    birth_certificate_number: "",
    is_staff_child: false,
    previous_school: "",
    previous_grade: "",
    reason_for_transfer: "",
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
        admission_number: learner.admission_number || "",
        first_name: learner.first_name || "",
        last_name: learner.last_name || "",
        date_of_birth: learner.date_of_birth || "",
        gender: learner.gender || "",
        current_grade_id: learner.current_grade_id || "",
        current_stream_id: learner.current_stream_id || "",
        house_id: learner.house_id || "",
        medical_info: learner.medical_info || "",
        birth_certificate_number: learner.birth_certificate_number || "",
        is_staff_child: learner.is_staff_child || false,
        previous_school: learner.previous_school || "",
        previous_grade: learner.previous_grade || "",
        reason_for_transfer: learner.reason_for_transfer || "",
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
      
      // Reset transfer state
      setShowTransferSection(false);
      setTransferData({
        destination_school: "",
        transfer_date: new Date().toISOString().split("T")[0],
        reason: "",
      });
      
      // Reset staff verification state
      setVerifiedStaffInfo(null);
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
          admission_number: formData.admission_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender as "male" | "female" | "other",
          current_grade_id: formData.current_grade_id || null,
          current_stream_id: formData.current_stream_id || null,
          house_id: formData.house_id || null,
          medical_info: formData.medical_info || null,
          birth_certificate_number: formData.birth_certificate_number || null,
          is_staff_child: formData.is_staff_child,
          previous_school: formData.previous_school || null,
          previous_grade: formData.previous_grade || null,
          reason_for_transfer: formData.reason_for_transfer || null,
          allergies: formData.allergies || null,
          blood_type: formData.blood_type || null,
          emergency_contact: formData.emergency_contact || null,
          emergency_phone: formData.emergency_phone || null,
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

  const handleTransfer = async () => {
    if (!transferData.destination_school.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the destination school",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransferring(true);

      // Create transfer record
      const { error: transferError } = await supabase
        .from("transfer_records")
        .insert({
          learner_id: learner.id,
          destination_school: transferData.destination_school,
          reason: transferData.reason || null,
          transfer_date: transferData.transfer_date,
        });

      if (transferError) throw transferError;

      // Update learner status to transferred
      const { error: updateError } = await supabase
        .from("learners")
        .update({ status: "transferred" })
        .eq("id", learner.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Learner has been marked as transferred. They will no longer receive messages.",
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
      setTransferring(false);
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="parent">Parent Info</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="transfer" className="text-destructive">Transfer</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="admission_number">Admission Number *</Label>
                <Input
                  id="admission_number"
                  value={formData.admission_number}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">You can manually edit the admission number if needed</p>
              </div>

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
                <Label htmlFor="house_id">House (Optional)</Label>
                <Select
                  value={formData.house_id}
                  onValueChange={(value) => setFormData({ ...formData, house_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select house" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No House</SelectItem>
                    {houses.map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_certificate_number">Birth Certificate Number</Label>
                <Input
                  id="birth_certificate_number"
                  value={formData.birth_certificate_number}
                  onChange={(e) => setFormData({ ...formData, birth_certificate_number: e.target.value })}
                  placeholder="For learner portal access (used as password)"
                />
                <p className="text-xs text-muted-foreground">This will be used as password for learner login</p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_staff_child"
                    checked={formData.is_staff_child}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Show verification dialog when checking the box
                        setShowStaffVerification(true);
                      } else {
                        // Allow unchecking without verification
                        setFormData({ ...formData, is_staff_child: false });
                        setVerifiedStaffInfo(null);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_staff_child" className="cursor-pointer">
                    This learner is a child of a staff member (discount applies)
                  </Label>
                </div>
                
                {/* Show verified staff info */}
                {formData.is_staff_child && verifiedStaffInfo && (
                  <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-2 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      Verified: <strong>{verifiedStaffInfo.name}</strong> ({verifiedStaffInfo.type}) - {verifiedStaffInfo.employeeNumber}
                    </span>
                  </div>
                )}
                
                {/* Show info for previously marked staff children */}
                {formData.is_staff_child && !verifiedStaffInfo && learner?.is_staff_child && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span>Previously verified as staff child</span>
                  </div>
                )}
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

            <TabsContent value="academic" className="space-y-4 mt-4">
              <h3 className="font-medium mb-4">Previous School Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previous_school">Previous School</Label>
                  <Input
                    id="previous_school"
                    value={formData.previous_school}
                    onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                    placeholder="Enter previous school name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previous_grade">Previous Grade</Label>
                  <Input
                    id="previous_grade"
                    value={formData.previous_grade}
                    onChange={(e) => setFormData({ ...formData, previous_grade: e.target.value })}
                    placeholder="Enter previous grade"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason_for_transfer">Reason for Transfer</Label>
                <Textarea
                  id="reason_for_transfer"
                  value={formData.reason_for_transfer}
                  onChange={(e) => setFormData({ ...formData, reason_for_transfer: e.target.value })}
                  placeholder="Enter reason for transferring schools"
                  rows={3}
                />
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="Any known allergies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_type">Blood Type</Label>
                  <Input
                    id="blood_type"
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    placeholder="e.g., A+, O-, B+"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Emergency contact person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                    placeholder="Emergency phone number"
                  />
                </div>
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

            {/* Transfer Tab */}
            <TabsContent value="transfer" className="space-y-4 mt-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Transfer Learner to Another School</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This action will mark the learner as transferred. They will be removed from active learners 
                      and their parent will no longer receive messages from the system.
                    </p>
                  </div>
                </div>
              </div>

              {learner?.status === "transferred" ? (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground">This learner has already been transferred.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="destination_school">Destination School *</Label>
                    <Input
                      id="destination_school"
                      value={transferData.destination_school}
                      onChange={(e) => setTransferData({ ...transferData, destination_school: e.target.value })}
                      placeholder="Enter the name of the school"
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
                    {transferring ? "Processing Transfer..." : "Transfer Learner"}
                  </Button>
                </>
              )}
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
        
        {/* Staff Child Verification Dialog */}
        <StaffChildVerificationDialog
          open={showStaffVerification}
          onOpenChange={setShowStaffVerification}
          onVerified={(staffInfo) => {
            setFormData({ ...formData, is_staff_child: true });
            setVerifiedStaffInfo(staffInfo);
          }}
          onCancel={() => {
            // Don't change the checkbox state if cancelled
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
