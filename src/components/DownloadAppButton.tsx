import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function DownloadAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed/running as standalone
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isStandalone) {
        toast({
          title: "Already Installed",
          description: "You're viewing the app from your device. No need to install again!",
        });
      } else {
        toast({
          title: "Installation Not Available",
          description: "To install: tap your browser's menu and select 'Add to Home Screen' or 'Install App'.",
          duration: 5000,
        });
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      toast({
        title: "Success!",
        description: "App has been installed on your device.",
      });
    }
  };

  // Don't show if user dismissed it or if already in standalone mode
  if (dismissed || isStandalone) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Get the Mobile App</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Install our app on your smartphone for quick access, offline viewing, and a better experience!
            </p>
            
            <div className="flex gap-3">
              <Button onClick={handleInstall} className="gap-2">
                <Download className="h-4 w-4" />
                Download App
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4 mr-1" />
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
