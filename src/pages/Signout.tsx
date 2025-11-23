import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Signout() {
  const navigate = useNavigate();

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem("teacher_auth");
      localStorage.removeItem("learner_auth");
      navigate("/auth", { replace: true });
    };

    signOut();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
}
