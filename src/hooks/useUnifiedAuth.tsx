import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserRole = "admin" | "teacher" | "learner" | "parent";

interface AuthUser {
  id: string;
  role: UserRole;
  data: any;
}

const LEARNER_SESSION_KEY = "learner_session";
const TEACHER_SESSION_KEY = "teacher_session";

export function useUnifiedAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check for admin/regular user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roleData) {
          setUser({
            id: session.user.id,
            role: roleData.role as UserRole,
            data: session.user,
          });
          setLoading(false);
          return;
        }
      }

      // Check for learner session
      const learnerToken = localStorage.getItem(LEARNER_SESSION_KEY);
      if (learnerToken) {
        const { data: learnerSession } = await supabase
          .from("parent_sessions")
          .select("*, learner:learners(*)")
          .eq("session_token", learnerToken)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (learnerSession) {
          setUser({
            id: learnerSession.learner.id,
            role: "learner",
            data: learnerSession.learner,
          });
          setLoading(false);
          return;
        }
      }

      // Check for teacher session
      const teacherToken = localStorage.getItem(TEACHER_SESSION_KEY);
      if (teacherToken) {
        const { data: teacherSession } = await supabase
          .from("teacher_sessions")
          .select("*, teacher:teachers(*)")
          .eq("session_token", teacherToken)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (teacherSession) {
          setUser({
            id: teacherSession.teacher.id,
            role: "teacher",
            data: teacherSession.teacher,
          });
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Session check error:", error);
      setLoading(false);
    }
  };

  const loginLearner = async (admissionNumber: string, birthCertificate: string) => {
    try {
      setLoading(true);

      const { data: learnerData, error } = await supabase
        .from("learners")
        .select("*")
        .eq("admission_number", admissionNumber)
        .eq("birth_certificate_number", birthCertificate)
        .single();

      if (error || !learnerData) {
        toast({
          title: "Login Failed",
          description: "Invalid admission number or birth certificate",
          variant: "destructive",
        });
        return false;
      }

      const sessionToken = `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await supabase.from("parent_sessions").insert({
        learner_id: learnerData.id,
        session_token: sessionToken,
      });

      localStorage.setItem(LEARNER_SESSION_KEY, sessionToken);
      setUser({ id: learnerData.id, role: "learner", data: learnerData });

      toast({
        title: "Welcome!",
        description: `Welcome back, ${learnerData.first_name}`,
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

  const loginTeacher = async (employeeNumber: string, idNumber: string) => {
    try {
      setLoading(true);

      const { data: teacherData, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("employee_number", employeeNumber)
        .eq("id_number", idNumber)
        .single();

      if (error || !teacherData) {
        toast({
          title: "Login Failed",
          description: "Invalid TSC number or ID number",
          variant: "destructive",
        });
        return false;
      }

      const sessionToken = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await supabase.from("teacher_sessions").insert({
        teacher_id: teacherData.id,
        session_token: sessionToken,
      });

      localStorage.setItem(TEACHER_SESSION_KEY, sessionToken);
      setUser({ id: teacherData.id, role: "teacher", data: teacherData });

      toast({
        title: "Welcome!",
        description: `Welcome back, ${teacherData.first_name}`,
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

  const loginAdmin = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();

        if (roleData) {
          setUser({
            id: data.user.id,
            role: roleData.role as UserRole,
            data: data.user,
          });

          toast({
            title: "Welcome!",
            description: "Successfully logged in",
          });

          return true;
        }
      }

      return false;
    } catch (error: any) {
      toast({
        title: "Login Failed",
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
      const learnerToken = localStorage.getItem(LEARNER_SESSION_KEY);
      const teacherToken = localStorage.getItem(TEACHER_SESSION_KEY);

      if (learnerToken) {
        await supabase
          .from("parent_sessions")
          .delete()
          .eq("session_token", learnerToken);
        localStorage.removeItem(LEARNER_SESSION_KEY);
      }

      if (teacherToken) {
        await supabase
          .from("teacher_sessions")
          .delete()
          .eq("session_token", teacherToken);
        localStorage.removeItem(TEACHER_SESSION_KEY);
      }

      await supabase.auth.signOut();
      setUser(null);

      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    loading,
    loginLearner,
    loginTeacher,
    loginAdmin,
    logout,
  };
}
