import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, User, Users, FileText, Heart } from "lucide-react";
import { useState } from "react";

interface AddLearnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLearnerDialog({ open, onOpenChange }: AddLearnerDialogProps) {
  const [currentTab, setCurrentTab] = useState("basic");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Learner</DialogTitle>
          <DialogDescription>
            Complete all sections to register a new learner
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
            <TabsTrigger value="parents" className="text-xs">Parents</TabsTrigger>
            <TabsTrigger value="academic" className="text-xs">Academic</TabsTrigger>
            <TabsTrigger value="medical" className="text-xs">Medical</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Learner Information</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Enter first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" placeholder="Enter middle name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Enter last name" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthCert">Birth Certificate No. *</Label>
                    <Input id="birthCert" placeholder="Enter certificate number" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" placeholder="Enter nationality" defaultValue="Kenyan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input id="religion" placeholder="Enter religion" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homeAddress">Home Address</Label>
                  <Textarea id="homeAddress" placeholder="Enter home address" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentTab("parents")}>Next: Parent Information</Button>
            </div>
          </TabsContent>

          {/* Parent/Guardian Information */}
          <TabsContent value="parents" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Father/Guardian Information</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fatherFirstName">First Name *</Label>
                    <Input id="fatherFirstName" placeholder="Enter first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherLastName">Last Name *</Label>
                    <Input id="fatherLastName" placeholder="Enter last name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherID">ID Number *</Label>
                    <Input id="fatherID" placeholder="Enter ID number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone">Phone Number *</Label>
                    <Input id="fatherPhone" placeholder="+254..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherEmail">Email Address</Label>
                    <Input id="fatherEmail" type="email" placeholder="Enter email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherOccupation">Occupation</Label>
                    <Input id="fatherOccupation" placeholder="Enter occupation" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="fatherIsStaff" className="h-4 w-4" />
                  <Label htmlFor="fatherIsStaff">Parent is school staff (50% discount applies)</Label>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Mother/Guardian Information</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="motherFirstName">First Name *</Label>
                      <Input id="motherFirstName" placeholder="Enter first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherLastName">Last Name *</Label>
                      <Input id="motherLastName" placeholder="Enter last name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherID">ID Number *</Label>
                      <Input id="motherID" placeholder="Enter ID number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherPhone">Phone Number *</Label>
                      <Input id="motherPhone" placeholder="+254..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherEmail">Email Address</Label>
                      <Input id="motherEmail" type="email" placeholder="Enter email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherOccupation">Occupation</Label>
                      <Input id="motherOccupation" placeholder="Enter occupation" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="motherIsStaff" className="h-4 w-4" />
                    <Label htmlFor="motherIsStaff">Parent is school staff (50% discount applies)</Label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input id="county" placeholder="Enter county" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subCounty">Sub-County</Label>
                    <Input id="subCounty" placeholder="Enter sub-county" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalAddress">Postal Address</Label>
                    <Input id="postalAddress" placeholder="P.O. Box..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab("basic")}>Previous</Button>
              <Button onClick={() => setCurrentTab("academic")}>Next: Academic Details</Button>
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
                    <Select>
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Grade 1</SelectItem>
                        <SelectItem value="2">Grade 2</SelectItem>
                        <SelectItem value="3">Grade 3</SelectItem>
                        <SelectItem value="4">Grade 4</SelectItem>
                        <SelectItem value="5">Grade 5</SelectItem>
                        <SelectItem value="6">Grade 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stream">Stream *</Label>
                    <Select>
                      <SelectTrigger id="stream">
                        <SelectValue placeholder="Select stream" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentDate">Enrollment Date *</Label>
                    <Input id="enrollmentDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input id="academicYear" placeholder="e.g., 2025" defaultValue="2025" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousSchool">Previous School (if any)</Label>
                  <Input id="previousSchool" placeholder="Enter previous school name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousGrade">Grade at Previous School</Label>
                  <Input id="previousGrade" placeholder="e.g., Grade 2" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferReason">Reason for Transfer</Label>
                  <Textarea id="transferReason" placeholder="Enter reason if applicable" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab("parents")}>Previous</Button>
              <Button onClick={() => setCurrentTab("medical")}>Next: Medical Information</Button>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select>
                      <SelectTrigger id="bloodGroup">
                        <SelectValue placeholder="Select blood group" />
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
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" placeholder="e.g., 120" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Textarea id="allergies" placeholder="List any known allergies (food, medication, etc.)" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">Existing Medical Conditions</Label>
                  <Textarea id="medicalConditions" placeholder="List any chronic conditions or disabilities" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea id="medications" placeholder="List any medications the learner is taking" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialNeeds">Special Educational Needs</Label>
                  <Textarea id="specialNeeds" placeholder="Describe any special needs or accommodations required" />
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Emergency Contact</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Contact Name</Label>
                      <Input id="emergencyName" placeholder="Enter emergency contact name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Contact Phone</Label>
                      <Input id="emergencyPhone" placeholder="+254..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelationship">Relationship</Label>
                      <Input id="emergencyRelationship" placeholder="e.g., Uncle, Aunt" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctorName">Family Doctor (Optional)</Label>
                      <Input id="doctorName" placeholder="Enter doctor's name" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab("academic")}>Previous</Button>
              <Button onClick={() => setCurrentTab("documents")}>Next: Documents</Button>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Required Documents</h3>
                </div>

                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4">
                    <Label htmlFor="learnerPhoto" className="block mb-2">Learner Photo *</Label>
                    <p className="text-sm text-muted-foreground mb-3">Upload a passport-sized photo</p>
                    <Input id="learnerPhoto" type="file" accept="image/*" />
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <Label htmlFor="birthCertificate" className="block mb-2">Birth Certificate *</Label>
                    <p className="text-sm text-muted-foreground mb-3">Upload a scanned copy of the birth certificate</p>
                    <Input id="birthCertificate" type="file" accept="image/*,application/pdf" />
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <Label htmlFor="reportCard" className="block mb-2">Previous Report Card (if applicable)</Label>
                    <p className="text-sm text-muted-foreground mb-3">Upload report card from previous school</p>
                    <Input id="reportCard" type="file" accept="image/*,application/pdf" />
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <Label htmlFor="parentID" className="block mb-2">Parent/Guardian ID Copy</Label>
                    <p className="text-sm text-muted-foreground mb-3">Upload a copy of parent/guardian ID</p>
                    <Input id="parentID" type="file" accept="image/*,application/pdf" />
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <Label htmlFor="medicalRecords" className="block mb-2">Medical Records (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-3">Upload any relevant medical documents</p>
                    <Input id="medicalRecords" type="file" accept="image/*,application/pdf" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab("medical")}>Previous</Button>
              <Button className="gap-2">
                <User className="h-4 w-4" />
                Complete Registration
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
