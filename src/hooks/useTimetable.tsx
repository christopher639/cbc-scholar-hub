import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TimetableEntry {
  id: string;
  grade_id: string;
  stream_id: string;
  teacher_id: string;
  learning_area_id: string | null;
  academic_year: string;
  term: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  entry_type: 'lesson' | 'double_lesson' | 'games' | 'cocurricular' | 'break' | 'lunch' | 'assembly';
  subject_name: string | null;
  created_at: string;
  updated_at: string;
  grade?: { name: string };
  stream?: { name: string };
  teacher?: { first_name: string; last_name: string };
  learning_area?: { name: string };
}

interface TimetableFilters {
  gradeId?: string;
  streamId?: string;
  teacherId?: string;
  academicYear: string;
  term: string;
}

const fetchTimetableEntries = async (filters: TimetableFilters): Promise<TimetableEntry[]> => {
  let query = supabase
    .from("timetable_entries")
    .select(`
      *,
      grade:grades(name),
      stream:streams(name),
      teacher:teachers(first_name, last_name),
      learning_area:learning_areas(name)
    `)
    .eq("academic_year", filters.academicYear)
    .eq("term", filters.term);

  if (filters.gradeId) {
    query = query.eq("grade_id", filters.gradeId);
  }
  if (filters.streamId) {
    query = query.eq("stream_id", filters.streamId);
  }
  if (filters.teacherId) {
    query = query.eq("teacher_id", filters.teacherId);
  }

  const { data, error } = await query.order("day_of_week").order("start_time");

  if (error) throw error;
  return (data || []) as TimetableEntry[];
};

export function useTimetable(filters: TimetableFilters) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['timetable', filters],
    queryFn: () => fetchTimetableEntries(filters),
    enabled: !!filters.academicYear && !!filters.term,
  });

  const addEntry = useMutation({
    mutationFn: async (entryData: Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at' | 'grade' | 'stream' | 'teacher' | 'learning_area'>) => {
      // Check for teacher conflict
      const { data: teacherConflict } = await supabase.rpc('check_timetable_teacher_conflict', {
        p_teacher_id: entryData.teacher_id,
        p_academic_year: entryData.academic_year,
        p_term: entryData.term,
        p_day_of_week: entryData.day_of_week,
        p_start_time: entryData.start_time,
        p_end_time: entryData.end_time,
      });

      if (teacherConflict) {
        throw new Error('Teacher is already assigned to another class at this time');
      }

      // Check for stream conflict
      const { data: streamConflict } = await supabase.rpc('check_timetable_stream_conflict', {
        p_stream_id: entryData.stream_id,
        p_academic_year: entryData.academic_year,
        p_term: entryData.term,
        p_day_of_week: entryData.day_of_week,
        p_start_time: entryData.start_time,
        p_end_time: entryData.end_time,
      });

      if (streamConflict) {
        throw new Error('This stream already has a class scheduled at this time');
      }

      const { data, error } = await supabase
        .from("timetable_entries")
        .insert([entryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Timetable entry added successfully" });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...entryData }: Partial<TimetableEntry> & { id: string }) => {
      // Check for teacher conflict (excluding current entry)
      if (entryData.teacher_id && entryData.day_of_week && entryData.start_time && entryData.end_time) {
        const { data: teacherConflict } = await supabase.rpc('check_timetable_teacher_conflict', {
          p_teacher_id: entryData.teacher_id,
          p_academic_year: entryData.academic_year || filters.academicYear,
          p_term: entryData.term || filters.term,
          p_day_of_week: entryData.day_of_week,
          p_start_time: entryData.start_time,
          p_end_time: entryData.end_time,
          p_exclude_id: id,
        });

        if (teacherConflict) {
          throw new Error('Teacher is already assigned to another class at this time');
        }
      }

      // Check for stream conflict (excluding current entry)
      if (entryData.stream_id && entryData.day_of_week && entryData.start_time && entryData.end_time) {
        const { data: streamConflict } = await supabase.rpc('check_timetable_stream_conflict', {
          p_stream_id: entryData.stream_id,
          p_academic_year: entryData.academic_year || filters.academicYear,
          p_term: entryData.term || filters.term,
          p_day_of_week: entryData.day_of_week,
          p_start_time: entryData.start_time,
          p_end_time: entryData.end_time,
          p_exclude_id: id,
        });

        if (streamConflict) {
          throw new Error('This stream already has a class scheduled at this time');
        }
      }

      const { error } = await supabase
        .from("timetable_entries")
        .update(entryData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Timetable entry updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timetable_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Timetable entry deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cloneTimetable = useMutation({
    mutationFn: async (params: {
      sourceAcademicYear: string;
      sourceTerm: string;
      targetAcademicYear: string;
      targetTerm: string;
      gradeId?: string;
    }) => {
      const { data, error } = await supabase.rpc('clone_timetable', {
        p_source_academic_year: params.sourceAcademicYear,
        p_source_term: params.sourceTerm,
        p_target_academic_year: params.targetAcademicYear,
        p_target_term: params.targetTerm,
        p_grade_id: params.gradeId || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      toast({ title: "Success", description: `Cloned ${count} timetable entries successfully` });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    entries,
    isLoading,
    refetch,
    addEntry: addEntry.mutate,
    updateEntry: updateEntry.mutate,
    deleteEntry: deleteEntry.mutate,
    cloneTimetable: cloneTimetable.mutate,
    isAdding: addEntry.isPending,
    isUpdating: updateEntry.isPending,
    isDeleting: deleteEntry.isPending,
    isCloning: cloneTimetable.isPending,
  };
}
