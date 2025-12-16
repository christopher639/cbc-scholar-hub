import { useOutletContext } from "react-router-dom";
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

      <div className="pt-6">
        <div className="flex flex-col items-center gap-6">
          <Avatar className="h-48 w-48 sm:h-56 sm:w-56 rounded-lg">
            <AvatarImage src={learnerDetails?.photo_url} alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} className="object-cover" />
            <AvatarFallback className="text-5xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold rounded-lg">
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

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <p className="text-xs text-muted-foreground">Gender</p>
            <p className="font-medium text-sm capitalize">{learnerDetails?.gender || "N/A"}</p>
          </div>
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <p className="text-xs text-muted-foreground">Date of Birth</p>
            <p className="font-medium text-sm">
              {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"}
              {learnerDetails?.date_of_birth && ` (${calculateAge(learnerDetails.date_of_birth)}y)`}
            </p>
          </div>
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <p className="text-xs text-muted-foreground">Enrolled</p>
            <p className="font-medium text-sm">
              {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <p className="text-xs text-muted-foreground">Grade & Stream</p>
            <p className="font-medium text-sm">{learnerDetails?.current_grade?.name || "N/A"} {learnerDetails?.current_stream?.name || ""}</p>
          </div>
          {learnerDetails?.house && (
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <p className="text-xs text-muted-foreground">House</p>
              <div className="flex items-center gap-1">
                {learnerDetails.house.color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: learnerDetails.house.color }} />}
                <p className="font-medium text-sm">{learnerDetails.house.name}</p>
              </div>
            </div>
          )}
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className="bg-success text-success-foreground text-xs h-5">
              {learnerDetails?.status || "Active"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
