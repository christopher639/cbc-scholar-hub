import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimetableGrid } from "@/components/TimetableGrid";
import { AddTimetableEntryDialog } from "@/components/AddTimetableEntryDialog";
import { CloneTimetableDialog } from "@/components/CloneTimetableDialog";
import { useTimetable, TimetableEntry } from "@/hooks/useTimetable";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useTeachers } from "@/hooks/useTeachers";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Copy, Printer, Trash2, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useReactToPrint } from "react-to-print";

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export default function Timetable() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { grades } = useGrades();
  const { streams } = useStreams();
  const { teachers } = useTeachers();
  const { academicYears } = useAcademicYears();

  const activeYear = academicYears.find(y => y.is_active)?.year || new Date().getFullYear().toString();
  
  const [selectedYear, setSelectedYear] = useState(activeYear);
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grade' | 'teacher'>('grade');
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<TimetableEntry | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Timetable-${selectedYear}-${selectedTerm}`,
  });

  const filters = {
    academicYear: selectedYear,
    term: selectedTerm,
    ...(viewMode === 'grade' && selectedGrade && { gradeId: selectedGrade }),
    ...(viewMode === 'grade' && selectedStream && { streamId: selectedStream }),
    ...(viewMode === 'teacher' && selectedTeacher && { teacherId: selectedTeacher }),
  };

  const {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry: removeEntry,
    cloneTimetable,
    isAdding,
    isUpdating,
    isDeleting,
    isCloning,
  } = useTimetable(filters);

  const filteredStreams = streams.filter(s => s.grade_id === selectedGrade);

  const handleEntryClick = (entry: TimetableEntry) => {
    if (isAdmin) {
      setEditingEntry(entry);
      setAddDialogOpen(true);
    }
  };

  const handleSubmit = (data: any) => {
    if (editingEntry) {
      updateEntry(data, {
        onSuccess: () => {
          setAddDialogOpen(false);
          setEditingEntry(null);
        },
      });
    } else {
      addEntry(data, {
        onSuccess: () => {
          setAddDialogOpen(false);
        },
      });
    }
  };

  const handleDelete = () => {
    if (deleteEntry) {
      removeEntry(deleteEntry.id, {
        onSuccess: () => {
          setDeleteEntry(null);
          setAddDialogOpen(false);
          setEditingEntry(null);
        },
      });
    }
  };

  const handleClone = (params: any) => {
    cloneTimetable(params, {
      onSuccess: () => {
        setCloneDialogOpen(false);
      },
    });
  };

  const getViewTitle = () => {
    if (viewMode === 'grade' && selectedGrade && selectedStream) {
      const grade = grades.find(g => g.id === selectedGrade);
      const stream = streams.find(s => s.id === selectedStream);
      return `${grade?.name || ''} - ${stream?.name || ''}`;
    }
    if (viewMode === 'teacher' && selectedTeacher) {
      const teacher = teachers.find(t => t.id === selectedTeacher);
      return `${teacher?.first_name || ''} ${teacher?.last_name || ''}`;
    }
    return 'Select filters to view timetable';
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timetable
            </h1>
            <p className="text-sm text-muted-foreground">Manage class schedules and timetables</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCloneDialogOpen(true)}>
                <Copy className="h-4 w-4 mr-1" />
                Clone
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button size="sm" onClick={() => { setEditingEntry(null); setAddDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={year.year}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map(term => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grade' | 'teacher')} className="ml-auto">
                <TabsList>
                  <TabsTrigger value="grade">By Grade/Stream</TabsTrigger>
                  <TabsTrigger value="teacher">By Teacher</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-wrap gap-3 mt-3">
              {viewMode === 'grade' ? (
                <>
                  <Select value={selectedGrade} onValueChange={(v) => { setSelectedGrade(v); setSelectedStream(''); }}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(grade => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStream} onValueChange={setSelectedStream} disabled={!selectedGrade}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select Stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStreams.map(stream => (
                        <SelectItem key={stream.id} value={stream.id}>
                          {stream.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div ref={printRef} className="print:p-4">
              <div className="hidden print:block mb-4">
                <h2 className="text-lg font-bold">{getViewTitle()}</h2>
                <p className="text-sm">{selectedYear} - {selectedTerm}</p>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Loading timetable...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {(!selectedGrade && viewMode === 'grade') || (!selectedTeacher && viewMode === 'teacher')
                      ? 'Select filters to view the timetable'
                      : 'No timetable entries found'}
                  </p>
                  {isAdmin && selectedGrade && selectedStream && (
                    <Button className="mt-4" variant="outline" onClick={() => setAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Entry
                    </Button>
                  )}
                </div>
              ) : (
                <TimetableGrid
                  entries={entries}
                  onEntryClick={handleEntryClick}
                  viewMode={viewMode}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddTimetableEntryDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditingEntry(null);
        }}
        onSubmit={handleSubmit}
        academicYear={selectedYear}
        term={selectedTerm}
        editingEntry={editingEntry}
        isLoading={isAdding || isUpdating}
      />

      {editingEntry && isAdmin && (
        <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Timetable Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this timetable entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {addDialogOpen && editingEntry && isAdmin && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteEntry(editingEntry)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Entry
          </Button>
        </div>
      )}

      <CloneTimetableDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        onClone={handleClone}
        isLoading={isCloning}
      />
    </DashboardLayout>
  );
}
