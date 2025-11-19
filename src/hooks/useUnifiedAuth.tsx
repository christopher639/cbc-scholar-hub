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

        if (learnerSession && learnerSession.learner) {
          setUser({
            id: learnerSession.learner.id,
            role: "learner",
            data: learnerSession.learner,
          });
          setLoading(false);
          return;
        } else {
          // Cleanup invalid token
          localStorage.removeItem(LEARNER_SESSION_KEY);
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

        if (teacherSession && teacherSession.teacher) {
          setUser({
            id: teacherSession.teacher.id,
            role: "teacher",
            data: teacherSession.teacher,
          });
          setLoading(false);
          return;
        } else {
          localStorage.removeItem(TEACHER_SESSION_KEY);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Session check error:", error);
      setLoading(false);
    }
  };

  const unifiedLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      const uname = username.trim();
      const pwd = password.trim();

      // Try admin login (email format)
      if (uname.includes("@")) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: uname.toLowerCase(),
          password: pwd,
        });

        if (!error && data.user) {
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

            return { success: true, role: roleData.role };
          }
        }
      }

      // Try learner login (admission number + birth certificate)
      const { data: learnerData, error: learnerError } = await supabase
        .rpc("validate_learner_credentials", {
          _admission: uname,
          _birth: pwd,
        });

      if (!learnerError && learnerData && learnerData.length > 0) {
        const learner = learnerData[0];
        const sessionToken = `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Set session to expire in 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error: sessionError } = await supabase.from("parent_sessions").insert({
          learner_id: learner.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

        if (!sessionError) {
          localStorage.setItem(LEARNER_SESSION_KEY, sessionToken);
          setUser({ id: learner.id, role: "learner", data: learner });

          toast({
            title: "Welcome!",
            description: `Welcome back, ${learner.first_name}`,
          });

          return { success: true, role: "learner" };
        }
      }

      // Try teacher login (TSC/employee number + ID number)
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("employee_number", uname)
        .eq("id_number", pwd)
        .maybeSingle();

      if (teacherData) {
        const sessionToken = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Set session to expire in 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await supabase.from("teacher_sessions").insert({
          teacher_id: teacherData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

        localStorage.setItem(TEACHER_SESSION_KEY, sessionToken);
        setUser({ id: teacherData.id, role: "teacher", data: teacherData });

        toast({
          title: "Welcome!",
          description: `Welcome back, ${teacherData.first_name}`,
        });

        return { success: true, role: "teacher" };
      }

      // No match found
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please check your username and password.",
        variant: "destructive",
      });

      return { success: false, role: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, role: null };
    } finally {
      setLoading(false);
    }
  };

  const loginLearner = async (admissionNumber: string, birthCertificate: string) => {
    return await unifiedLogin(admissionNumber, birthCertificate);
  };

  const loginTeacher = async (employeeNumber: string, idNumber: string) => {
    return await unifiedLogin(employeeNumber, idNumber);
  };

  const loginAdmin = async (email: string, password: string) => {
    return await unifiedLogin(email, password);
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
    unifiedLogin,
    loginLearner,
    loginTeacher,
    loginAdmin,
    logout,
  };
}
