import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, GraduationCap, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Alumni() {
  const [searchQuery, setSearchQuery] = useState("");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const searchAlumni = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter an admission number to search",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: learnerData, error } = await supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades(name),
          current_stream:streams(name),
          alumni:alumni(*)
        `)
        .eq("status", "alumni")
        .or(`admission_number.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);

      if (error) throw error;
      setAlumni(learnerData || []);

      if (!learnerData || learnerData.length === 0) {
        toast({
          title: "No Results",
          description: "No alumni found matching your search",
        });
      }
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

  const fetchAllAlumni = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades(name),
          current_stream:streams(name),
          alumni:alumni(*)
        `)
        .eq("status", "alumni")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlumni(data || []);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Alumni</h1>
          <p className="text-muted-foreground">
            View and search graduated learners
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Alumni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admission number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchAlumni()}
                  className="pl-9"
                />
              </div>
              <Button onClick={searchAlumni}>Search</Button>
              <Button variant="outline" onClick={fetchAllAlumni}>
                View All
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-4 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alumni.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alumni.map((alum) => (
              <Card
                key={alum.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/learners/${alum.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      {alum.photo_url ? (
                        <img
                          src={alum.photo_url}
                          alt={`${alum.first_name} ${alum.last_name}`}
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {alum.first_name} {alum.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {alum.admission_number}
                      </p>
                    </div>
                    <div className="w-full space-y-2 text-sm">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span>
                          {alum.current_grade?.name || "N/A"}
                          {alum.current_stream?.name && ` - ${alum.current_stream.name}`}
                        </span>
                      </div>
                      {alum.alumni?.[0] && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Graduated: {alum.alumni[0].graduation_year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Alumni Found</h3>
              <p className="text-muted-foreground">
                Search for alumni by admission number or name
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
