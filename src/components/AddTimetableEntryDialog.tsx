import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useTeachers } from "@/hooks/useTeachers";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { TimetableEntry } from "@/hooks/useTimetable";

interface AddTimetableEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  academicYear: string;
  term: string;
  editingEntry?: TimetableEntry | null;
  isLoading?: boolean;
}

const DAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
];

const ENTRY_TYPES = [
  { value: 'lesson', label: 'Lesson' },
  { value: 'double_lesson', label: 'Double Lesson' },
  { value: 'games', label: 'Games' },
  { value: 'cocurricular', label: 'Co-curricular' },
  { value: 'break', label: 'Break' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'assembly', label: 'Assembly' },
];

export function AddTimetableEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  academicYear,
  term,
  editingEntry,
  isLoading,
}: AddTimetableEntryDialogProps) {
  const { grades } = useGrades();
  const { streams } = useStreams();
  const { teachers } = useTeachers();
  const { learningAreas } = useLearningAreas();

  const [formData, setFormData] = useState({
    grade_id: '',
    stream_id: '',
    teacher_id: '',
    learning_area_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    room: '',
    entry_type: 'lesson',
    subject_name: '',
  });

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        grade_id: editingEntry.grade_id,
        stream_id: editingEntry.stream_id,
        teacher_id: editingEntry.teacher_id,
        learning_area_id: editingEntry.learning_area_id || '',
        day_of_week: editingEntry.day_of_week.toString(),
        start_time: editingEntry.start_time.substring(0, 5),
        end_time: editingEntry.end_time.substring(0, 5),
        room: editingEntry.room || '',
        entry_type: editingEntry.entry_type,
        subject_name: editingEntry.subject_name || '',
      });
    } else {
      setFormData({
        grade_id: '',
        stream_id: '',
        teacher_id: '',
        learning_area_id: '',
        day_of_week: '',
        start_time: '',
        end_time: '',
        room: '',
        entry_type: 'lesson',
        subject_name: '',
      });
    }
  }, [editingEntry, open]);

  const filteredStreams = streams.filter(s => s.grade_id === formData.grade_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      day_of_week: parseInt(formData.day_of_week),
      learning_area_id: formData.learning_area_id || null,
      room: formData.room || null,
      subject_name: formData.subject_name || null,
      academic_year: academicYear,
      term: term,
    };

    if (editingEntry) {
      onSubmit({ id: editingEntry.id, ...submitData });
    } else {
      onSubmit(submitData);
    }
  };

  const isBreakType = ['break', 'lunch', 'assembly'].includes(formData.entry_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Entry Type</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Day</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Grade</Label>
            <Select
              value={formData.grade_id}
              onValueChange={(value) => setFormData({ ...formData, grade_id: value, stream_id: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Stream</Label>
            <Select
              value={formData.stream_id}
              onValueChange={(value) => setFormData({ ...formData, stream_id: value })}
              disabled={!formData.grade_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>
              <SelectContent>
                {filteredStreams.map(stream => (
                  <SelectItem key={stream.id} value={stream.id}>
                    {stream.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Teacher</Label>
            <Select
              value={formData.teacher_id}
              onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isBreakType && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Learning Area</Label>
                <Select
                  value={formData.learning_area_id}
                  onValueChange={(value) => setFormData({ ...formData, learning_area_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select learning area" />
                  </SelectTrigger>
                  <SelectContent>
                    {learningAreas.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Subject Name (optional)</Label>
                <Input
                  value={formData.subject_name}
                  onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  placeholder="Custom subject name"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-sm">Room (optional)</Label>
            <Input
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g., Room 101"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingEntry ? 'Update' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
