import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserRole = "admin" | "teacher" | "learner" | "parent" | "student";

interface AuthUser {
  id: string;
  role: UserRole;
  data: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; role: string | null }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; role: string | null }>;
  loginTeacher: (employeeNumber: string, idNumber: string) => Promise<{ success: boolean; role: string | null }>;
  loginLearner: (admissionNumber: string, birthCertificate: string) => Promise<{ success: boolean; role: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LEARNER_SESSION_KEY = "learner_session";
const TEACHER_SESSION_KEY = "teacher_session";

export function AuthProvider({ children }: { children: ReactNode }) {
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
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

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
          .from("learner_sessions")
          .select("*, learner:learners(*)")
          .eq("session_token", learnerToken)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (learnerSession && learnerSession.learner) {
          setUser({
            id: learnerSession.learner.id,
            role: "learner",
            data: learnerSession.learner,
          });
          setLoading(false);
          return;
        } else {
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
          .maybeSingle();

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

  const loginAdmin = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (!error && data.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleData) {
          setUser({
            id: data.user.id,
            role: roleData.role as UserRole,
            data: data.user,
          });

          await supabase.from("activity_logs").insert({
            action: "login",
            entity_type: "authentication",
            entity_name: data.user.email,
            user_id: data.user.id,
            user_name: data.user.email,
            user_role: roleData.role,
          });

          toast({
            title: "Welcome!",
            description: "Successfully logged in",
          });

          return { success: true, role: roleData.role };
        }
      }

      toast({
        title: "Login Failed",
        description: "Invalid email or password",
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
    try {
      setLoading(true);
      const { data: learnerData, error: learnerError } = await supabase
        .rpc("validate_learner_credentials", {
          _admission: admissionNumber.trim(),
          _birth: birthCertificate.trim(),
        });

      if (!learnerError && learnerData && learnerData.length > 0) {
        const learner = learnerData[0];
        const sessionToken = `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error: sessionError } = await supabase.from("learner_sessions").insert({
          learner_id: learner.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

        if (!sessionError) {
          localStorage.setItem(LEARNER_SESSION_KEY, sessionToken);
          setUser({ id: learner.id, role: "learner", data: learner });

          await supabase.from("activity_logs").insert({
            action: "login",
            entity_type: "authentication",
            entity_name: `${learner.first_name} ${learner.last_name}`,
            entity_id: learner.id,
            user_name: `${learner.first_name} ${learner.last_name}`,
            user_role: "learner",
          });

          toast({
            title: "Welcome!",
            description: `Welcome back, ${learner.first_name}`,
          });

          return { success: true, role: "learner" as UserRole };
        }
      }

      toast({
        title: "Login Failed",
        description: "Invalid admission number or birth certificate",
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

  const loginTeacher = async (employeeNumber: string, idNumber: string) => {
    try {
      setLoading(true);
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("employee_number", employeeNumber.trim())
        .eq("id_number", idNumber.trim())
        .maybeSingle();

      if (teacherData) {
        const sessionToken = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await supabase.from("teacher_sessions").insert({
          teacher_id: teacherData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

        localStorage.setItem(TEACHER_SESSION_KEY, sessionToken);
        setUser({ id: teacherData.id, role: "teacher", data: teacherData });

        await supabase.from("activity_logs").insert({
          action: "login",
          entity_type: "authentication",
          entity_name: `${teacherData.first_name} ${teacherData.last_name}`,
          entity_id: teacherData.id,
          user_name: `${teacherData.first_name} ${teacherData.last_name}`,
          user_role: "teacher",
        });

        toast({
          title: "Welcome!",
          description: `Welcome back, ${teacherData.first_name}`,
        });

        return { success: true, role: "teacher" as UserRole };
      }

      toast({
        title: "Login Failed",
        description: "Invalid employee number or ID number",
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

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);

      // Try learner login first (admission number + birth certificate)
      const learnerResult = await loginLearner(username, password);
      if (learnerResult.success) {
        return learnerResult;
      }

      // Try teacher login (employee number + id number)
      const teacherResult = await loginTeacher(username, password);
      if (teacherResult.success) {
        return teacherResult;
      }

      // Try admin/staff login (email + password via Supabase auth)
      const adminResult = await loginAdmin(username, password);
      if (adminResult.success) {
        return adminResult;
      }

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

  const logout = async () => {
    try {
      const learnerToken = localStorage.getItem(LEARNER_SESSION_KEY);
      const teacherToken = localStorage.getItem(TEACHER_SESSION_KEY);

      if (learnerToken) {
        await supabase
          .from("learner_sessions")
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

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAdmin, loginTeacher, loginLearner, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
