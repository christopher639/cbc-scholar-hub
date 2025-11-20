import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Plus } from "lucide-react";

export default function AcademicSettings() {
  const { academicYears, currentYear, refetch: refetchYears } = useAcademicYears();
  const { academicPeriods, currentPeriod, refetch: refetchPeriods } = useAcademicPeriods();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [newTermYear, setNewTermYear] = useState("");
  const [newTerm, setNewTerm] = useState<"term_1" | "term_2" | "term_3">("term_1");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);

  const handleSetActiveYear = async (yearId: string) => {
    try {
      setLoading(true);
      
      // Set all years to inactive
      await supabase
        .from("academic_years")
        .update({ is_active: false })
        .neq("id", yearId);
      
      // Set selected year to active
      const { error } = await supabase
        .from("academic_years")
        .update({ is_active: true })
        .eq("id", yearId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Active academic year updated successfully",
      });
      
      refetchYears();
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

  const handleSetActivePeriod = async (periodId: string) => {
    try {
      setLoading(true);
      
      // Set all periods to not current
      await supabase
        .from("academic_periods")
        .update({ is_current: false })
        .neq("id", periodId);
      
      // Set selected period to current
      const { error } = await supabase
        .from("academic_periods")
        .update({ is_current: true })
        .eq("id", periodId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Active term updated successfully",
      });
      
      refetchPeriods();
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

  const handleCreateYear = async () => {
    if (!newYear) {
      toast({
        title: "Error",
        description: "Please enter an academic year",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("academic_years")
        .insert({ year: newYear, is_active: false });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academic year created successfully",
      });
      
      setNewYear("");
      setYearDialogOpen(false);
      refetchYears();
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

  const handleCreateTerm = async () => {
    if (!newTermYear || !newStartDate || !newEndDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("academic_periods")
        .insert({
          academic_year: newTermYear,
          term: newTerm,
          start_date: newStartDate,
          end_date: newEndDate,
          is_current: false,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Term created successfully",
      });
      
      setNewTermYear("");
      setNewStartDate("");
      setNewEndDate("");
      setTermDialogOpen(false);
      refetchPeriods();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Academic Settings</h1>
          <p className="text-muted-foreground">
            Configure active academic year and term for fee calculations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Academic Year */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Active Academic Year
                  </CardTitle>
                  <CardDescription>
                    Set the current academic year for all fee calculations
                  </CardDescription>
                </div>
                <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Year
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Academic Year</DialogTitle>
                      <DialogDescription>
                        Add a new academic year to the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Academic Year</Label>
                        <Input
                          placeholder="e.g., 2024-2025"
                          value={newYear}
                          onChange={(e) => setNewYear(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setYearDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateYear} disabled={loading}>
                        Create Year
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Academic Year</Label>
                <Select
                  value={currentYear?.id}
                  onValueChange={handleSetActiveYear}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentYear && (
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Current Year: {currentYear.year}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Term */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Active Term
                  </CardTitle>
                  <CardDescription>
                    Set the current term for fee assignments and payments
                  </CardDescription>
                </div>
                <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Term
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Term</DialogTitle>
                      <DialogDescription>
                        Add a new term to the academic calendar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Academic Year</Label>
                        <Select value={newTermYear} onValueChange={setNewTermYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year.id} value={year.year}>
                                {year.year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Term</Label>
                        <Select value={newTerm} onValueChange={(val: any) => setNewTerm(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="term_1">Term 1</SelectItem>
                            <SelectItem value="term_2">Term 2</SelectItem>
                            <SelectItem value="term_3">Term 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={newStartDate}
                            onChange={(e) => setNewStartDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={newEndDate}
                            onChange={(e) => setNewEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTermDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTerm} disabled={loading}>
                        Create Term
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Term</Label>
                <Select
                  value={currentPeriod?.id}
                  onValueChange={handleSetActivePeriod}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicPeriods
                      .filter(p => p.academic_year === currentYear?.year)
                      .map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.term.replace("_", " ").toUpperCase()} - {period.academic_year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentPeriod && (
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Current Term: {currentPeriod.term.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Academic Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Academic Year</p>
                <p className="text-2xl font-bold">{currentYear?.year || "Not Set"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Term</p>
                <p className="text-2xl font-bold">
                  {currentPeriod?.term.replace("_", " ").toUpperCase() || "Not Set"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold text-primary">
                  {currentYear && currentPeriod ? "Active" : "Incomplete"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
