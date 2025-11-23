import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRecentMessages = () => {
  return useQuery({
    queryKey: ["recent-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_messages")
        .select(`
          *,
          grades(name),
          streams(name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });
};
