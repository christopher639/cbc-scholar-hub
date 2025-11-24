import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HelpStep {
  title: string;
  description: string;
  icon: string;
}

const helpSteps: HelpStep[] = [
  {
    title: "Dashboard",
    description: "View your academic overview including performance summary, strengths & weaknesses analysis, peer comparison, and outstanding fees balance.",
    icon: "📊"
  },
  {
    title: "Performance",
    description: "Check your detailed academic performance with scores for each learning area across different exam types (Opener, Mid-Term, Final). View trends and track your progress over time.",
    icon: "📚"
  },
  {
    title: "My Fees",
    description: "View your complete fee payment history, outstanding balances, and download payment receipts. Track all financial transactions related to your school fees.",
    icon: "💰"
  },
  {
    title: "Fee Structures",
    description: "Review the official fee structure for your grade and stream. See the breakdown of all fee components and their amounts for the current academic term.",
    icon: "📋"
  },
  {
    title: "Settings",
    description: "Customize your portal experience by switching between light and dark themes. Change your account password for security.",
    icon: "⚙️"
  },
  {
    title: "Profile",
    description: "View your complete learner profile including personal information, admission details, current grade & stream, and emergency contact information.",
    icon: "👤"
  },
  {
    title: "PWA Install Button",
    description: "Click the download icon in the top bar to install this portal as an app on your device for quick access even when offline.",
    icon: "📲"
  },
  {
    title: "Profile Menu",
    description: "Click your profile photo to access quick actions: navigate to your profile, change password, or logout from the portal.",
    icon: "🔐"
  }
];

export function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentHelp = helpSteps[currentStep];

  return (
    <>
      {/* Floating Help Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        title="Portal Guide"
      >
        {isOpen ? <X className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
      </Button>

      {/* Help Guide Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-[90vw] md:w-96 shadow-xl z-50">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Portal Guide</CardTitle>
              <Badge variant="secondary">
                {currentStep + 1} / {helpSteps.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-3">{currentHelp.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{currentHelp.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentHelp.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex gap-1">
                {helpSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentStep 
                        ? "bg-primary w-4" 
                        : "bg-muted hover:bg-muted-foreground/30"
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentStep === helpSteps.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
