import { useOutletContext } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar } from "lucide-react";

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Your personal information</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6">
            <Avatar className="h-32 w-32 rounded-lg border-2 border-primary/20">
              <AvatarImage src={learnerDetails?.photo_url} alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} className="object-cover" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold rounded-lg">
                {learnerDetails?.first_name?.[0]}{learnerDetails?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">
                {learnerDetails?.first_name} {learnerDetails?.last_name}
              </h2>
              <p className="text-muted-foreground">
                Admission No: <span className="font-semibold text-primary">{learnerDetails?.admission_number}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary">
                {learnerDetails?.current_grade?.name} {learnerDetails?.current_stream?.name}
              </Badge>
              <Badge className="bg-success text-success-foreground">Active</Badge>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{learnerDetails?.gender}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"}
                    {learnerDetails?.date_of_birth && ` (${calculateAge(learnerDetails.date_of_birth)} years)`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment Date</p>
                  <p className="font-medium">
                    {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Academic Information</h3>
              
              <div>
                <p className="text-sm text-muted-foreground">Current Grade</p>
                <p className="font-medium">{learnerDetails?.current_grade?.name || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Stream</p>
                <p className="font-medium">{learnerDetails?.current_stream?.name || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-success text-success-foreground">
                  {learnerDetails?.status || "Active"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
