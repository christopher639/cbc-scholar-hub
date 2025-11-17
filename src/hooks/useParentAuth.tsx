import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SESSION_KEY = "parent_portal_session";

export function useParentAuth() {
  const [learner, setLearner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_KEY);
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      // Verify session and get learner data
      const { data: session } = await supabase
        .from("parent_sessions")
        .select("*, learner:learners(*)")
        .eq("session_token", sessionToken)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (session) {
        // Update last accessed time
        await supabase
          .from("parent_sessions")
          .update({ last_accessed: new Date().toISOString() })
          .eq("session_token", sessionToken);

        setLearner(session.learner);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error("Session check error:", error);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  };

  const login = async (admissionNumber: string, birthCertificate: string) => {
    try {
      setLoading(true);

      // Find learner with matching credentials
      const { data: learnerData, error: learnerError } = await supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades(name, grade_level),
          current_stream:streams(name),
          parent:parents(*)
        `)
        .eq("admission_number", admissionNumber)
        .eq("birth_certificate_number", birthCertificate)
        .single();

      if (learnerError || !learnerData) {
        toast({
          title: "Login Failed",
          description: "Invalid admission number or birth certificate number",
          variant: "destructive",
        });
        return false;
      }

      // Create session token
      const sessionToken = `parent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create session
      const { error: sessionError } = await supabase
        .from("parent_sessions")
        .insert({
          learner_id: learnerData.id,
          session_token: sessionToken,
        });

      if (sessionError) throw sessionError;

      // Store session token
      localStorage.setItem(SESSION_KEY, sessionToken);
      setLearner(learnerData);

      toast({
        title: "Success",
        description: "Welcome to the Parent Portal",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_KEY);
      if (sessionToken) {
        await supabase
          .from("parent_sessions")
          .delete()
          .eq("session_token", sessionToken);
      }
      localStorage.removeItem(SESSION_KEY);
      setLearner(null);
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  return { learner, loading, login, logout };
}
