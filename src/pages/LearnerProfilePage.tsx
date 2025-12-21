import { useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Calendar, 
  GraduationCap, 
  Home, 
  Phone, 
  Mail, 
  Briefcase,
  Heart,
  Shield,
  AlertCircle,
  Droplets,
  Clock,
  Building2,
  UserCircle,
  MapPin,
  Cake,
  Users
} from "lucide-react";

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
        return "bg-emerald-500 text-white";
      case "inactive":
        return "bg-rose-500 text-white";
      case "transferred":
        return "bg-amber-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getBoardingBadge = (status: string) => {
    return status === "boarder" 
      ? "bg-indigo-500/10 text-indigo-600 border-indigo-200" 
      : "bg-sky-500/10 text-sky-600 border-sky-200";
  };

  // Get the hero gradient from document attribute
  const getHeroGradientClass = () => {
    const heroGradient = document.documentElement.getAttribute("data-hero-gradient") || "primary";
    const gradientMap: Record<string, string> = {
      "primary": "bg-gradient-to-br from-primary/90 via-primary to-primary/80",
      "blue-purple": "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
      "green-teal": "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
      "rose-orange": "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500",
      "dark-elegant": "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
      "golden": "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600",
    };
    return gradientMap[heroGradient] || gradientMap["primary"];
  };

  return (
    <div className="min-h-full pb-8 px-1">
      {/* Hero Section with Gradient Background */}
      <div className={`relative overflow-hidden rounded-2xl ${getHeroGradientClass()} p-6 md:p-8 mb-6`}>
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white rounded-full" />
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Large Avatar */}
          <div className="relative">
            <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-white/30 shadow-2xl">
              <AvatarImage 
                src={learnerDetails?.photo_url} 
                alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} 
                className="object-cover" 
              />
              <AvatarFallback className="text-3xl md:text-4xl bg-white/20 text-white font-bold backdrop-blur-sm">
                {learnerDetails?.first_name?.[0]}{learnerDetails?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${getStatusColor(learnerDetails?.status)} shadow-lg text-xs px-3`}>
              {learnerDetails?.status || "Active"}
            </Badge>
          </div>

          {/* Hero Info */}
          <div className="flex-1 text-center md:text-left text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {learnerDetails?.first_name} {learnerDetails?.last_name}
            </h1>
            <p className="text-white/80 font-mono text-sm mb-4">
              #{learnerDetails?.admission_number}
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                {learnerDetails?.current_grade?.name || "N/A"}
                {learnerDetails?.current_stream?.name && ` • ${learnerDetails.current_stream.name}`}
              </Badge>
              
              {learnerDetails?.house && (
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Home className="h-3.5 w-3.5 mr-1.5" />
                  {learnerDetails.house.name}
                </Badge>
              )}
              
              <Badge className={`${getBoardingBadge(learnerDetails?.boarding_status)} backdrop-blur-sm`}>
                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                {learnerDetails?.boarding_status === "boarder" ? "Boarder" : "Day Scholar"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickStatCard 
              icon={<Cake className="h-5 w-5" />}
              label="Age"
              value={learnerDetails?.date_of_birth ? `${calculateAge(learnerDetails.date_of_birth)} years` : "N/A"}
              color="bg-rose-500/10 text-rose-600"
            />
            <QuickStatCard 
              icon={<Calendar className="h-5 w-5" />}
              label="Enrolled"
              value={learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "N/A"}
              color="bg-blue-500/10 text-blue-600"
            />
            <QuickStatCard 
              icon={<Droplets className="h-5 w-5" />}
              label="Blood Type"
              value={learnerDetails?.blood_type || "N/A"}
              color="bg-red-500/10 text-red-600"
            />
            <QuickStatCard 
              icon={<UserCircle className="h-5 w-5" />}
              label="Gender"
              value={learnerDetails?.gender ? learnerDetails.gender.charAt(0).toUpperCase() + learnerDetails.gender.slice(1) : "N/A"}
              color="bg-purple-500/10 text-purple-600"
            />
          </div>

          {/* Personal Information Section */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-5 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailRow 
                  icon={<User className="h-4 w-4" />}
                  label="Full Name"
                  value={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`}
                />
                <DetailRow 
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date of Birth"
                  value={learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}
                />
                <DetailRow 
                  icon={<UserCircle className="h-4 w-4" />}
                  label="Gender"
                  value={learnerDetails?.gender}
                  capitalize
                />
                <DetailRow 
                  icon={<Droplets className="h-4 w-4" />}
                  label="Blood Type"
                  value={learnerDetails?.blood_type || "Not specified"}
                />
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-5 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Academic Information
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailRow 
                  icon={<span className="text-xs font-mono font-bold">#</span>}
                  label="Admission Number"
                  value={learnerDetails?.admission_number}
                  mono
                />
                <DetailRow 
                  icon={<Clock className="h-4 w-4" />}
                  label="Enrollment Date"
                  value={learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}
                />
                <DetailRow 
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Current Grade"
                  value={learnerDetails?.current_grade?.name || "Not assigned"}
                />
                <DetailRow 
                  icon={<Users className="h-4 w-4" />}
                  label="Stream"
                  value={learnerDetails?.current_stream?.name || "Not assigned"}
                />
                <DetailRow 
                  icon={<Building2 className="h-4 w-4" />}
                  label="Boarding Status"
                  value={learnerDetails?.boarding_status === "boarder" ? "Boarder" : "Day Scholar"}
                />
                <DetailRow 
                  icon={<Home className="h-4 w-4" />}
                  label="House"
                  value={learnerDetails?.house?.name || "Not assigned"}
                />
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-5 py-4 border-b">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Health & Medical
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailRow 
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Allergies"
                  value={learnerDetails?.allergies || "None reported"}
                />
                <DetailRow 
                  icon={<Heart className="h-4 w-4" />}
                  label="Medical Information"
                  value={learnerDetails?.medical_info || "None reported"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Emergency & Parent Info */}
        <div className="space-y-6">
          {/* Emergency Contact Card */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 rounded-xl border border-rose-200/50 dark:border-rose-800/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-rose-200/50 dark:border-rose-800/30">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-rose-600" />
                Emergency Contact
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Contact Name</p>
                <p className="font-medium text-foreground">
                  {learnerDetails?.emergency_contact || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                <a 
                  href={`tel:${learnerDetails?.emergency_phone}`}
                  className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {learnerDetails?.emergency_phone || "Not specified"}
                </a>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Card */}
          {learnerDetails?.parent && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200/50 dark:border-blue-800/30 overflow-hidden">
              <div className="px-5 py-4 border-b border-blue-200/50 dark:border-blue-800/30">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Parent / Guardian
                </h2>
              </div>
              <div className="p-5">
                {/* Parent Avatar & Name */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-blue-200/50 dark:border-blue-800/30">
                  <Avatar className="h-12 w-12 bg-blue-500/20">
                    <AvatarFallback className="bg-blue-500/20 text-blue-700 font-semibold">
                      {learnerDetails.parent.first_name?.[0]}{learnerDetails.parent.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {learnerDetails.parent.first_name} {learnerDetails.parent.last_name}
                    </p>
                    {learnerDetails.parent.occupation && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {learnerDetails.parent.occupation}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <a 
                    href={`tel:${learnerDetails.parent.phone}`}
                    className="flex items-center gap-3 text-sm text-foreground hover:text-blue-600 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>{learnerDetails.parent.phone}</span>
                  </a>
                  
                  <a 
                    href={`mailto:${learnerDetails.parent.email}`}
                    className="flex items-center gap-3 text-sm text-foreground hover:text-blue-600 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="truncate">{learnerDetails.parent.email}</span>
                  </a>
                  
                  {learnerDetails.parent.address && (
                    <div className="flex items-start gap-3 text-sm text-foreground">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>{learnerDetails.parent.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Staff Child Badge */}
          {learnerDetails?.is_staff_child && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/30 p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Staff Child</p>
                  <p className="text-xs text-muted-foreground">Eligible for staff discount</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-4 text-center">
      <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-sm text-foreground">{value}</p>
    </div>
  );
}

function DetailRow({ 
  icon, 
  label, 
  value, 
  capitalize = false, 
  mono = false 
}: { 
  icon: React.ReactNode;
  label: string; 
  value?: string | null; 
  capitalize?: boolean; 
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-foreground ${capitalize ? "capitalize" : ""} ${mono ? "font-mono" : ""}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}
