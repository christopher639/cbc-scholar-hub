import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFeeStructures() {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fee_structures")
        .select(`
          *,
          grade:grades(name),
          category:fee_categories(name)
        `)
        .order("academic_year", { ascending: false });

      if (error) throw error;
      setStructures(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  return { structures, loading, fetchStructures };
}