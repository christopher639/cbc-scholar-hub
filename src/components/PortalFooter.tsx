import { GraduationCap, Phone, Mail, MapPin } from "lucide-react";

interface PortalFooterProps {
  schoolInfo?: {
    school_name?: string;
    logo_url?: string;
    phone?: string;
    email?: string;
    address?: string;
    motto?: string;
  } | null;
}

export function PortalFooter({ schoolInfo }: PortalFooterProps) {
  return (
    <footer className="bg-card border-t border-border py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* School Info */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              {schoolInfo?.logo_url ? (
                <img src={schoolInfo.logo_url} alt="Logo" className="h-10 w-10 object-contain rounded-full" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div>
                <span className="font-bold text-foreground text-sm md:text-base">
                  {schoolInfo?.school_name || "School"}
                </span>
                {schoolInfo?.motto && (
                  <p className="text-xs text-muted-foreground">{schoolInfo.motto}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <h3 className="font-semibold text-sm text-foreground">Contact Us</h3>
            <div className="space-y-1.5 text-center md:text-left">
              {schoolInfo?.phone && (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{schoolInfo.phone}</span>
                </div>
              )}
              {schoolInfo?.email && (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{schoolInfo.email}</span>
                </div>
              )}
              {schoolInfo?.address && (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{schoolInfo.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-center md:items-end justify-center">
            <p className="text-xs text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "School"}
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}