import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, X, ChevronRight, ChevronLeft, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TourStep {
  title: string;
  description: string;
  targetSelector: string;
  placement: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Your Portal",
    description: "Let's take a quick tour of all the features available to you. Click Next to continue or Skip to exit the tour.",
    targetSelector: "body",
    placement: "bottom"
  },
  {
    title: "School Logo & Name",
    description: "Your school's logo and name are displayed here. On mobile devices, you can see the school name next to the logo.",
    targetSelector: "[data-tour='school-logo']",
    placement: "bottom"
  },
  {
    title: "Navigation Menu",
    description: "Use this navigation bar to quickly access different sections of your portal. On mobile, this menu appears at the bottom of the screen.",
    targetSelector: "[data-tour='navigation']",
    placement: "bottom"
  },
  {
    title: "Install App",
    description: "Click this download icon to install the portal as an app on your device for offline access and quick launch.",
    targetSelector: "[data-tour='install-button']",
    placement: "left"
  },
  {
    title: "Profile Menu",
    description: "Click your profile photo to access your profile, change password, or logout. This is your personal account menu.",
    targetSelector: "[data-tour='profile-menu']",
    placement: "left"
  },
  {
    title: "Dashboard",
    description: "Your dashboard shows an overview of your academic performance, including strengths, weaknesses, peer comparison, and fees balance.",
    targetSelector: "body",
    placement: "bottom"
  }
];

export function TourGuide() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isActive && currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.targetSelector);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isActive, currentStep]);

  const handleStart = () => {
    setShowStartDialog(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsActive(false);
    setCurrentStep(0);
    setTargetRect(null);
  };

  const currentTour = tourSteps[currentStep];

  const getCardPosition = () => {
    if (!targetRect) return {};

    const padding = 20;
    const cardWidth = 320;
    const cardHeight = 200;

    switch (currentTour.placement) {
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - cardWidth - padding)),
        };
      case "top":
        return {
          top: Math.max(padding, targetRect.top - cardHeight - padding),
          left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - cardWidth - padding)),
        };
      case "right":
        return {
          top: Math.max(padding, targetRect.top),
          left: targetRect.right + padding,
        };
      case "left":
        return {
          top: Math.max(padding, targetRect.top),
          left: Math.max(padding, targetRect.left - cardWidth - padding),
        };
      default:
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
  };

  return (
    <>
      {/* Tour Trigger Button */}
      {!isActive && (
        <Button
          onClick={() => setShowStartDialog(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          title="Start Portal Tour"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Start Tour Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Your Portal Tour!</DialogTitle>
            <DialogDescription>
              Let us guide you through all the features and functionality of your learner portal. 
              This tour will take approximately 2 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Not Now
            </Button>
            <Button onClick={handleStart}>
              Start Tour
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Overlay and Spotlight */}
      {isActive && (
        <>
          {/* Dark Overlay */}
          <div className="fixed inset-0 bg-black/60 z-[60] pointer-events-none" />

          {/* Spotlight on Target Element */}
          {targetRect && currentTour.targetSelector !== "body" && (
            <div
              className="fixed z-[61] pointer-events-none"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                transition: "all 0.3s ease",
              }}
            />
          )}

          {/* Tour Card */}
          <Card
            className="fixed z-[62] w-[90vw] md:w-80 shadow-2xl"
            style={getCardPosition()}
          >
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  Step {currentStep + 1} of {tourSteps.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-lg mt-2">{currentTour.title}</CardTitle>
            </CardHeader>

            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentTour.description}
              </p>
            </CardContent>

            <CardFooter className="border-t pt-4 flex justify-between">
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
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      index === currentStep 
                        ? "bg-primary w-3" 
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                >
                  {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </>
  );
}
