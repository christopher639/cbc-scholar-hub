import { useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, GraduationCap, Home, Phone, Hash, MapPin } from "lucide-react";

export default function LearnerProfilePage() {
  const { learnerDetails } = useOutletContext<any>();

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "inactive":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "transferred":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar className="h-20 w-20 rounded-lg border-2 border-primary/20">
          <AvatarImage src={learnerDetails?.photo_url} alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} className="object-cover" />
          <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold rounded-lg">
            {learnerDetails?.first_name?.[0]}{learnerDetails?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">
              {learnerDetails?.first_name} {learnerDetails?.last_name}
            </h1>
            <Badge className={`text-xs ${getStatusColor(learnerDetails?.status)}`}>
              {learnerDetails?.status || "Active"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-medium text-primary">{learnerDetails?.admission_number}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              {learnerDetails?.current_grade?.name || "N/A"} {learnerDetails?.current_stream?.name ? `- ${learnerDetails.current_stream.name}` : ""}
            </Badge>
            {learnerDetails?.house && (
              <Badge variant="outline" className="text-xs">
                <Home className="h-3 w-3 mr-1" />
                {learnerDetails.house.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Gender" value={learnerDetails?.gender} capitalize />
              <InfoItem 
                label="Date of Birth" 
                value={learnerDetails?.date_of_birth ? `${new Date(learnerDetails.date_of_birth).toLocaleDateString()} (${calculateAge(learnerDetails.date_of_birth)}y)` : "N/A"} 
              />
              <InfoItem 
                label="Blood Type" 
                value={learnerDetails?.blood_type || "N/A"} 
              />
              <InfoItem 
                label="Boarding Status" 
                value={learnerDetails?.boarding_status} 
                capitalize 
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Academic Information
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Admission Number" value={learnerDetails?.admission_number} mono />
              <InfoItem 
                label="Enrollment Date" 
                value={learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"} 
              />
              <InfoItem label="Grade" value={learnerDetails?.current_grade?.name || "N/A"} />
              <InfoItem label="Stream" value={learnerDetails?.current_stream?.name || "N/A"} />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Contact Name" value={learnerDetails?.emergency_contact || "N/A"} />
              <InfoItem label="Phone" value={learnerDetails?.emergency_phone || "N/A"} />
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Additional Information
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Allergies" value={learnerDetails?.allergies || "None"} />
              <InfoItem label="Medical Info" value={learnerDetails?.medical_info || "None"} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parent/Guardian Information */}
      {learnerDetails?.parent && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Parent/Guardian Information
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoItem label="Name" value={`${learnerDetails.parent.first_name} ${learnerDetails.parent.last_name}`} />
              <InfoItem label="Phone" value={learnerDetails.parent.phone} />
              <InfoItem label="Email" value={learnerDetails.parent.email} />
              <InfoItem label="Occupation" value={learnerDetails.parent.occupation || "N/A"} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ 
  label, 
  value, 
  capitalize = false, 
  mono = false 
}: { 
  label: string; 
  value?: string | null; 
  capitalize?: boolean; 
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${capitalize ? "capitalize" : ""} ${mono ? "font-mono" : ""}`}>
        {value || "N/A"}
      </p>
    </div>
  );
}
