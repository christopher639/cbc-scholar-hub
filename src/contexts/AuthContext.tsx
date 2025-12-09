import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserRole = "admin" | "teacher" | "learner" | "parent" | "student" | "finance" | "visitor";

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
  loginTeacher: (tscNumber: string, idNumber: string) => Promise<{ success: boolean; role: string | null }>;
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

  const loginAdmin = async (email: string, password: string, silent = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (!error && data.user) {
        // Check if user is activated
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_activated, activation_status")
          .eq("id", data.user.id)
          .maybeSingle();

        // If user exists but is not activated, deny login
        if (profileData && profileData.is_activated === false) {
          await supabase.auth.signOut();
          if (!silent) {
            toast({
              title: "Account Pending",
              description: "Your account is pending admin approval. Please wait for activation.",
              variant: "destructive",
            });
          }
          return { success: false, role: null };
        }

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

          if (!silent) {
            toast({
              title: "Welcome!",
              description: "Successfully logged in",
            });
          }

          return { success: true, role: roleData.role };
        }
      }

      return { success: false, role: null };
    } catch (error: any) {
      console.error("Admin login error:", error);
      return { success: false, role: null };
    }
  };

  const loginLearner = async (admissionNumber: string, birthCertificate: string, silent = false) => {
    try {
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

          if (!silent) {
            toast({
              title: "Welcome!",
              description: `Welcome back, ${learner.first_name}`,
            });
          }

          return { success: true, role: "learner" as UserRole };
        }
      }

      return { success: false, role: null };
    } catch (error: any) {
      console.error("Learner login error:", error);
      return { success: false, role: null };
    }
  };

  const loginTeacher = async (employeeNumber: string, idNumber: string, silent = false) => {
    try {
      // Try case-insensitive search using ilike for employee number and ID number
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .ilike("employee_number", employeeNumber.trim())
        .ilike("id_number", idNumber.trim())
        .maybeSingle();

      if (teacherData) {
        const sessionToken = `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error: sessionError } = await supabase.from("teacher_sessions").insert({
          teacher_id: teacherData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

        if (!sessionError) {
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

          if (!silent) {
            toast({
              title: "Welcome!",
              description: `Welcome back, ${teacherData.first_name}`,
            });
          }

          return { success: true, role: "teacher" as UserRole };
        }
      }

      return { success: false, role: null };
    } catch (error: any) {
      console.error("Teacher login error:", error);
      return { success: false, role: null };
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);

      // Try teacher login first (TSC/employee number + ID number)
      const teacherResult = await loginTeacher(username, password, true);
      if (teacherResult.success) {
        toast({
          title: "Welcome!",
          description: "Successfully logged in as Teacher",
        });
        return teacherResult;
      }

      // Try learner login (admission number + birth certificate)
      const learnerResult = await loginLearner(username, password, true);
      if (learnerResult.success) {
        toast({
          title: "Welcome!",
          description: "Successfully logged in as Learner",
        });
        return learnerResult;
      }

      // Try admin/staff login (email + password via Supabase auth)
      const adminResult = await loginAdmin(username, password, true);
      if (adminResult.success) {
        toast({
          title: "Welcome!",
          description: "Successfully logged in",
        });
        return adminResult;
      }

      // Only show error after trying all authentication methods
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please verify your username and password.",
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
