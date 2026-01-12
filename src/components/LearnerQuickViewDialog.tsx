import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Heart, 
  IdCard,
  ExternalLink,
  X,
  Loader2,
  Home,
  Clock,
  BookOpen
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !learner ? (
          <div className="p-6 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Learner not found</p>
          </div>
        ) : (
          <>
            {/* Hero Section with Gradient */}
            <div className={`relative ${getHeroGradientClass()} px-6 pt-6 pb-16`}>
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/5 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Profile Info */}
              <div className="relative flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {learner.photo_url ? (
                    <img 
                      src={learner.photo_url} 
                      alt={`${learner.first_name} ${learner.last_name}`}
                      className="h-20 w-20 object-cover rounded-xl ring-4 ring-white/30 shadow-xl"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl ring-4 ring-white/30 shadow-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {learner.first_name[0]}{learner.last_name[0]}
                      </span>
                    </div>
                  )}
                  <Badge 
                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 shadow-lg ${
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
                <div className="flex-1 min-w-0 text-white">
                  <h2 className="text-xl font-bold truncate">
                    {learner.first_name} {learner.last_name}
                  </h2>
                  <p className="text-white/80 font-mono text-sm">
                    #{learner.admission_number}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className="bg-white/20 text-white border-0 text-xs">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {learner.current_grade?.name || "N/A"}
                    </Badge>
                    {learner.current_stream?.name && (
                      <Badge className="bg-white/20 text-white border-0 text-xs">
                        {learner.current_stream.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="px-6 -mt-10 relative z-10">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card rounded-xl border p-3 text-center shadow-sm">
                  <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-1.5">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Age</p>
                  <p className="font-semibold text-sm">{calculateAge(learner.date_of_birth)} yrs</p>
                </div>
                <div className="bg-card rounded-xl border p-3 text-center shadow-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-1.5">
                    <User className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Gender</p>
                  <p className="font-semibold text-sm capitalize">{learner.gender}</p>
                </div>
                <div className="bg-card rounded-xl border p-3 text-center shadow-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
                    <Home className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Boarding</p>
                  <p className="font-semibold text-sm capitalize">{learner.boarding_status || "Day"}</p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="px-6 py-4 space-y-4">
              {/* Parent/Guardian Info */}
              {learner.parent && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parent/Guardian</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">
                        {learner.parent.first_name} {learner.parent.last_name}
                        {learner.parent.relationship && (
                          <span className="text-muted-foreground"> ({learner.parent.relationship})</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{learner.parent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{learner.parent.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {learner.house && (
                  <div className="flex items-center gap-2 p-2 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">House</p>
                      <p className="text-sm font-medium truncate">{learner.house.name}</p>
                    </div>
                  </div>
                )}
                
                {learner.religion && (
                  <div className="flex items-center gap-2 p-2 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Religion</p>
                      <p className="text-sm font-medium truncate">{learner.religion}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-2 rounded-lg border">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">Enrolled</p>
                    <p className="text-sm font-medium">
                      {new Date(learner.enrollment_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {learner.birth_certificate_number && (
                  <div className="flex items-center gap-2 p-2 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-slate-500/10 text-slate-600 flex items-center justify-center shrink-0">
                      <IdCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Birth Cert</p>
                      <p className="text-sm font-medium truncate">{learner.birth_certificate_number}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fee Balance */}
              {learner.feeInfo && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fee Balance</p>
                        <p className="text-sm font-semibold">{formatCurrency(learner.feeInfo.totalBalance || 0)}</p>
                      </div>
                    </div>
                    {learner.is_staff_child && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
                        Staff Child
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Action */}
            <div className="px-6 pb-6">
              <Button 
                onClick={handleViewFullProfile} 
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Full Profile
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
