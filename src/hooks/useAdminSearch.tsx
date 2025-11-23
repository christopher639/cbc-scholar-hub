import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SearchResult {
  id: string;
  type: "learner" | "teacher" | "invoice" | "route" | "staff";
  title: string;
  subtitle?: string;
  route?: string;
  data?: any;
}

export function useAdminSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Define available routes
  const routes: SearchResult[] = [
    { id: "dashboard", type: "route", title: "Dashboard", route: "/" },
    { id: "learners", type: "route", title: "Learners", subtitle: "Manage students", route: "/students" },
    { id: "admissions", type: "route", title: "Admissions", subtitle: "New enrollments", route: "/admissions" },
    { id: "teachers", type: "route", title: "Teachers", subtitle: "Staff management", route: "/teachers" },
    { id: "staff", type: "route", title: "Non-Teaching Staff", subtitle: "Support staff", route: "/non-teaching-staff" },
    { id: "grades", type: "route", title: "Grades & Streams", subtitle: "Class management", route: "/grades" },
    { id: "performance", type: "route", title: "Performance", subtitle: "Academic records", route: "/performance" },
    { id: "fees", type: "route", title: "Fee Management", subtitle: "Payments & balances", route: "/fees" },
    { id: "invoices", type: "route", title: "Invoices", subtitle: "Fee invoices", route: "/invoices" },
    { id: "reports", type: "route", title: "Reports", subtitle: "Analytics & insights", route: "/reports" },
    { id: "communication", type: "route", title: "Communication", subtitle: "Messages & notifications", route: "/communication" },
    { id: "alumni", type: "route", title: "Alumni", subtitle: "Graduated students", route: "/alumni" },
    { id: "settings", type: "route", title: "Settings", subtitle: "System configuration", route: "/settings" },
    { id: "school-info", type: "route", title: "School Information", subtitle: "School details", route: "/school-info" },
    { id: "users", type: "route", title: "Users", subtitle: "User management", route: "/users" },
  ];

  const search = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const searchResults: SearchResult[] = [];

      // Search routes
      const matchingRoutes = routes.filter(
        (route) =>
          route.title.toLowerCase().includes(query.toLowerCase()) ||
          route.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      searchResults.push(...matchingRoutes);

      // Search learners
      const { data: learners } = await supabase
        .from("learners")
        .select(`
          id,
          admission_number,
          first_name,
          last_name,
          current_grade:grades(name),
          current_stream:streams(name)
        `)
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`
        )
        .limit(5);

      if (learners) {
        learners.forEach((learner) => {
          searchResults.push({
            id: learner.id,
            type: "learner",
            title: `${learner.first_name} ${learner.last_name}`,
            subtitle: `${learner.admission_number} • ${learner.current_grade?.name || 'N/A'} - ${learner.current_stream?.name || 'N/A'}`,
            route: `/students`,
            data: learner,
          });
        });
      }

      // Search teachers
      const { data: teachers } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, employee_number, email")
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,employee_number.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(5);

      if (teachers) {
        teachers.forEach((teacher) => {
          searchResults.push({
            id: teacher.id,
            type: "teacher",
            title: `${teacher.first_name} ${teacher.last_name}`,
            subtitle: `${teacher.employee_number || 'No Emp#'} • ${teacher.email}`,
            route: `/teachers`,
            data: teacher,
          });
        });
      }

      // Search invoices
      const { data: invoices } = await supabase
        .from("student_invoices")
        .select(`
          id,
          invoice_number,
          status,
          total_amount,
          learner:learners(first_name, last_name, admission_number)
        `)
        .ilike("invoice_number", `%${query}%`)
        .limit(5);

      if (invoices) {
        invoices.forEach((invoice) => {
          searchResults.push({
            id: invoice.id,
            type: "invoice",
            title: invoice.invoice_number,
            subtitle: `${invoice.learner?.first_name} ${invoice.learner?.last_name} • ${invoice.status}`,
            route: `/invoices`,
            data: invoice,
          });
        });
      }

      // Search non-teaching staff
      const { data: staff } = await supabase
        .from("non_teaching_staff")
        .select("id, first_name, last_name, job_title, email")
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,job_title.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(5);

      if (staff) {
        staff.forEach((member) => {
          searchResults.push({
            id: member.id,
            type: "staff",
            title: `${member.first_name} ${member.last_name}`,
            subtitle: `${member.job_title} • ${member.email}`,
            route: `/non-teaching-staff`,
            data: member,
          });
        });
      }

      setResults(searchResults);
    } catch (error: any) {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
}
