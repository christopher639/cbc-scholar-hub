import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  GraduationCap, 
  Heart, 
  IdCard,
  ExternalLink,
  X,
  Home,
  Clock,
  BookOpen,
  Wallet,
  AlertCircle,
  MapPin,
  Droplet,
  Users,
  FileText,
  TrendingUp
} from "lucide-react";
import { useLearnerDetail } from "@/hooks/useLearnerDetail";
import { useUIStyles } from "@/hooks/useUIStyles";
import { formatCurrency } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

interface LearnerQuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerId: string | null;
}

export const LearnerQuickViewDialog = ({ 
  open, 
  onOpenChange, 
  learnerId 
}: LearnerQuickViewDialogProps) => {
  const { learner, loading } = useLearnerDetail(learnerId || "");
  const { getHeroGradientClass } = useUIStyles();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

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

  const handleViewFullProfile = () => {
    if (learnerId) {
      onOpenChange(false);
      navigate(`/learner/${learnerId}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[800px] xl:max-w-[900px] p-0 overflow-hidden border-border max-h-[90vh] my-4">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !learner ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Learner Not Found</h3>
            <p className="text-muted-foreground text-sm">The learner you're looking for doesn't exist or has been removed.</p>
          </div>
        ) : (
          <div className="flex flex-col max-h-[90vh]">
            {/* Hero Section with Gradient */}
            <div className={`relative ${getHeroGradientClass()} px-4 sm:px-6 pt-5 pb-20 sm:pb-24 shrink-0`}>
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-white/5 rounded-full" />
                <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white/5 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white z-10"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Profile Info */}
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {learner.photo_url ? (
                    <img 
                      src={learner.photo_url} 
                      alt={`${learner.first_name} ${learner.last_name}`}
                      className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-2xl ring-4 ring-white/30 shadow-2xl"
                    />
                  ) : (
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl ring-4 ring-white/30 shadow-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-white">
                        {learner.first_name[0]}{learner.last_name[0]}
                      </span>
                    </div>
                  )}
                  <Badge 
                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs px-3 py-0.5 shadow-lg capitalize ${
                      learner.status === "alumni" 
                        ? "bg-purple-600 text-white" 
                        : learner.status === "active"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {learner.status || "Active"}
                  </Badge>
                </div>

                {/* Name and Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left text-white">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">
                    {learner.first_name} {learner.last_name}
                  </h2>
                  <p className="text-white/80 font-mono text-sm mb-3">
                    #{learner.admission_number}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {learner.current_grade?.name || "N/A"}
                    </Badge>
                    {learner.current_stream?.name && (
                      <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">
                        {learner.current_stream.name}
                      </Badge>
                    )}
                    {learner.house && (
                      <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">
                        <Home className="h-3 w-3 mr-1" />
                        {learner.house.name}
                      </Badge>
                    )}
                    {learner.is_staff_child && (
                      <Badge className="bg-amber-500/80 text-white border-0 text-xs backdrop-blur-sm">
                        Staff Child
                      </Badge>
                    )}
                  </div>
                </div>

                {/* View Full Profile Button - Desktop */}
                <div className="hidden sm:block shrink-0">
                  <Button 
                    onClick={handleViewFullProfile} 
                    size="sm"
                    className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Full Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards - Overlapping */}
            <div className="px-4 sm:px-6 -mt-12 sm:-mt-14 relative z-10 shrink-0">
              <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                <div className="bg-card rounded-xl border p-2 sm:p-3 text-center shadow-lg">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-1">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Age</p>
                  <p className="font-semibold text-xs sm:text-sm">{calculateAge(learner.date_of_birth)} yrs</p>
                </div>
                <div className="bg-card rounded-xl border p-2 sm:p-3 text-center shadow-lg">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-1">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Gender</p>
                  <p className="font-semibold text-xs sm:text-sm capitalize">{learner.gender}</p>
                </div>
                <div className="bg-card rounded-xl border p-2 sm:p-3 text-center shadow-lg">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
                    <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Boarding</p>
                  <p className="font-semibold text-xs sm:text-sm capitalize">{learner.boarding_status || "Day"}</p>
                </div>
                <div className="bg-card rounded-xl border p-2 sm:p-3 text-center shadow-lg">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Enrolled</p>
                  <p className="font-semibold text-xs sm:text-sm">{new Date(learner.enrollment_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</p>
                </div>
                <div className="hidden lg:block bg-card rounded-xl border p-2 sm:p-3 text-center shadow-lg">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto mb-1">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Year</p>
                  <p className="font-semibold text-xs sm:text-sm">{learner.currentAcademicYear?.split('/')[0] || "N/A"}</p>
                </div>
                <div className="hidden lg:block bg-card rounded-xl border p-2 sm:p-3 text-center shadow-lg">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-1">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Balance</p>
                  <p className="font-semibold text-xs sm:text-sm">{formatCurrency(learner.feeInfo?.totalBalance || 0)}</p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="px-4 sm:px-6 pt-4 shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto flex-nowrap">
                  <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden">Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="parent" className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Users className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Parent</span>
                    <span className="sm:hidden">Parent</span>
                  </TabsTrigger>
                  <TabsTrigger value="academic" className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Academic</span>
                    <span className="sm:hidden">Grades</span>
                  </TabsTrigger>
                  <TabsTrigger value="fees" className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Fees</span>
                  </TabsTrigger>
                  <TabsTrigger value="health" className="gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Heart className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Health</span>
                    <span className="sm:hidden">Health</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Scrollable Tab Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 sm:px-6 py-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          Personal Details
                        </h4>
                        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Full Name</span>
                            <span className="text-sm font-medium">{learner.first_name} {learner.last_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Date of Birth</span>
                            <span className="text-sm font-medium">{formatDate(learner.date_of_birth)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Gender</span>
                            <span className="text-sm font-medium capitalize">{learner.gender}</span>
                          </div>
                          {learner.religion && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Religion</span>
                              <span className="text-sm font-medium">{learner.religion}</span>
                            </div>
                          )}
                          {learner.birth_certificate_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Birth Cert No.</span>
                              <span className="text-sm font-medium font-mono">{learner.birth_certificate_number}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5" />
                          Academic Details
                        </h4>
                        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Admission No.</span>
                            <span className="text-sm font-medium font-mono">#{learner.admission_number}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Grade</span>
                            <Badge variant="outline" className="text-xs">{learner.current_grade?.name || "N/A"}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Stream</span>
                            <Badge variant="secondary" className="text-xs">{learner.current_stream?.name || "N/A"}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Boarding Status</span>
                            <span className="text-sm font-medium capitalize">{learner.boarding_status || "Day"}</span>
                          </div>
                          {learner.house && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">House</span>
                              <Badge className="text-xs bg-purple-500/10 text-purple-600 border-0">{learner.house.name}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Previous School Info */}
                    {(learner.previous_school || learner.previous_grade) && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          Previous Education
                        </h4>
                        <div className="bg-muted/30 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {learner.previous_school && (
                            <div>
                              <p className="text-xs text-muted-foreground">Previous School</p>
                              <p className="text-sm font-medium">{learner.previous_school}</p>
                            </div>
                          )}
                          {learner.previous_grade && (
                            <div>
                              <p className="text-xs text-muted-foreground">Previous Grade</p>
                              <p className="text-sm font-medium">{learner.previous_grade}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Parent Tab */}
                  <TabsContent value="parent" className="mt-0 space-y-4">
                    {learner.parent ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 sm:p-5">
                          <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="h-7 w-7 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold">
                                {learner.parent.first_name} {learner.parent.last_name}
                              </h3>
                              {learner.parent.relationship && (
                                <Badge variant="secondary" className="mt-1 text-xs capitalize">
                                  {learner.parent.relationship}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                              <Phone className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Phone Number</p>
                              <p className="text-sm font-medium">{learner.parent.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                              <Mail className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">Email Address</p>
                              <p className="text-sm font-medium truncate">{learner.parent.email}</p>
                            </div>
                          </div>
                          {learner.parent.occupation && (
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                              <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Occupation</p>
                                <p className="text-sm font-medium">{learner.parent.occupation}</p>
                              </div>
                            </div>
                          )}
                          {learner.parent.address && (
                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                              <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">Address</p>
                                <p className="text-sm font-medium truncate">{learner.parent.address}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Emergency Contact */}
                        {(learner.emergency_contact || learner.emergency_phone) && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Emergency Contact</h4>
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                  <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{learner.emergency_contact || "Not specified"}</p>
                                  <p className="text-xs text-muted-foreground">{learner.emergency_phone || "No phone"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No parent information available</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Academic Tab */}
                  <TabsContent value="academic" className="mt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 text-center">
                        <GraduationCap className="h-8 w-8 mx-auto text-primary mb-2" />
                        <p className="text-xs text-muted-foreground">Current Grade</p>
                        <p className="text-lg font-bold">{learner.current_grade?.name || "N/A"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 text-center">
                        <BookOpen className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <p className="text-xs text-muted-foreground">Academic Year</p>
                        <p className="text-lg font-bold">{learner.currentAcademicYear || "N/A"}</p>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Term</span>
                        <Badge variant="outline">{learner.currentTerm?.replace("_", " ").toUpperCase() || "N/A"}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Stream</span>
                        <span className="text-sm font-medium">{learner.current_stream?.name || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Enrollment Date</span>
                        <span className="text-sm font-medium">{formatDate(learner.enrollment_date)}</span>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm" onClick={handleViewFullProfile} className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        View Performance Reports
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Fees Tab */}
                  <TabsContent value="fees" className="mt-0 space-y-4">
                    {learner.feeInfo ? (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-xl p-3 sm:p-4 text-center">
                            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Fees</p>
                            <p className="text-sm sm:text-lg font-bold text-emerald-600">{formatCurrency(learner.feeInfo.totalAccumulatedFees || 0)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-3 sm:p-4 text-center">
                            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Paid</p>
                            <p className="text-sm sm:text-lg font-bold text-blue-600">{formatCurrency(learner.feeInfo.totalPaid || 0)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-xl p-3 sm:p-4 text-center">
                            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Balance</p>
                            <p className="text-sm sm:text-lg font-bold text-destructive">{formatCurrency(learner.feeInfo.totalBalance || 0)}</p>
                          </div>
                        </div>

                        {learner.is_staff_child && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center">
                                <Users className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-amber-700">Staff Child Discount</p>
                                <p className="text-xs text-amber-600/80">Special fee structure may apply</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-center pt-2">
                          <Button variant="outline" size="sm" onClick={handleViewFullProfile} className="gap-2">
                            <Wallet className="h-4 w-4" />
                            View Fee Details
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No fee information available</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Health Tab */}
                  <TabsContent value="health" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {learner.blood_type && (
                        <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                          <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                            <Droplet className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Blood Type</p>
                            <p className="text-lg font-bold">{learner.blood_type}</p>
                          </div>
                        </div>
                      )}
                      {learner.allergies && (
                        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card sm:col-span-2">
                          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Allergies</p>
                            <p className="text-sm font-medium">{learner.allergies}</p>
                          </div>
                        </div>
                      )}
                      {learner.medical_info && (
                        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card sm:col-span-2">
                          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Heart className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Medical Information</p>
                            <p className="text-sm font-medium">{learner.medical_info}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {!learner.blood_type && !learner.allergies && !learner.medical_info && (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No health information available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            {/* Footer - Mobile View Full Profile Button */}
            <div className="sm:hidden px-4 pb-4 pt-2 border-t shrink-0">
              <Button onClick={handleViewFullProfile} className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                View Full Profile
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
