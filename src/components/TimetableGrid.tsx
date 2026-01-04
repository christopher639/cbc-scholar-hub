import { TimetableEntry } from "@/hooks/useTimetable";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimetableGridProps {
  entries: TimetableEntry[];
  onEntryClick?: (entry: TimetableEntry) => void;
  viewMode: 'grade' | 'teacher' | 'learner';
  isAdmin?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30'
];

const ENTRY_TYPE_COLORS: Record<string, string> = {
  lesson: 'bg-primary/10 border-primary/30 text-primary',
  double_lesson: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  games: 'bg-green-500/10 border-green-500/30 text-green-700',
  cocurricular: 'bg-purple-500/10 border-purple-500/30 text-purple-700',
  break: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
  lunch: 'bg-orange-500/10 border-orange-500/30 text-orange-700',
  assembly: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700',
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getTimeSlotIndex = (time: string) => {
  const timeStr = time.substring(0, 5);
  return TIME_SLOTS.indexOf(timeStr);
};

const calculateSlotSpan = (startTime: string, endTime: string) => {
  const startIndex = getTimeSlotIndex(startTime);
  const endIndex = getTimeSlotIndex(endTime);
  return Math.max(1, endIndex - startIndex);
};

export function TimetableGrid({ entries, onEntryClick, viewMode, isAdmin = false }: TimetableGridProps) {
  // Group entries by day and time slot
  const entriesByDayAndTime: Record<number, Record<string, TimetableEntry[]>> = {};
  
  for (let day = 1; day <= 5; day++) {
    entriesByDayAndTime[day] = {};
    TIME_SLOTS.forEach(slot => {
      entriesByDayAndTime[day][slot] = [];
    });
  }

  entries.forEach(entry => {
    const startSlot = entry.start_time.substring(0, 5);
    if (entriesByDayAndTime[entry.day_of_week] && entriesByDayAndTime[entry.day_of_week][startSlot]) {
      entriesByDayAndTime[entry.day_of_week][startSlot].push(entry);
    }
  });

  // Track which cells should be hidden due to spanning
  const hiddenCells: Record<string, boolean> = {};
  entries.forEach(entry => {
    const startIndex = getTimeSlotIndex(entry.start_time.substring(0, 5));
    const span = calculateSlotSpan(entry.start_time, entry.end_time);
    for (let i = 1; i < span; i++) {
      if (TIME_SLOTS[startIndex + i]) {
        hiddenCells[`${entry.day_of_week}-${TIME_SLOTS[startIndex + i]}`] = true;
      }
    }
  });

  const getEntryLabel = (entry: TimetableEntry) => {
    if (entry.entry_type === 'break') return 'Break';
    if (entry.entry_type === 'lunch') return 'Lunch';
    if (entry.entry_type === 'assembly') return 'Assembly';
    if (entry.entry_type === 'games') return 'Games';
    if (entry.entry_type === 'cocurricular') return entry.subject_name || 'Co-curricular';
    return entry.learning_area?.name || entry.subject_name || 'Lesson';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-border bg-muted p-2 text-left font-medium min-w-[80px]">Time</th>
            {DAYS.map((day, index) => (
              <th key={day} className="border border-border bg-muted p-2 text-center font-medium min-w-[150px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, slotIndex) => (
            <tr key={slot}>
              <td className="border border-border bg-muted/50 p-2 text-xs font-medium">
                {formatTime(slot)}
              </td>
              {DAYS.map((day, dayIndex) => {
                const dayNum = dayIndex + 1;
                const cellKey = `${dayNum}-${slot}`;
                
                if (hiddenCells[cellKey]) {
                  return null;
                }

                const cellEntries = entriesByDayAndTime[dayNum][slot] || [];
                const entry = cellEntries[0];
                const span = entry ? calculateSlotSpan(entry.start_time, entry.end_time) : 1;

                return (
                  <td
                    key={cellKey}
                    rowSpan={span}
                    className={cn(
                      "border border-border p-1 align-top transition-colors",
                      entry && isAdmin && "cursor-pointer hover:bg-accent/50",
                      !entry && isAdmin && "hover:bg-muted/30"
                    )}
                    onClick={() => entry && onEntryClick?.(entry)}
                  >
                    {entry && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "rounded-md border p-2 h-full min-h-[60px]",
                                ENTRY_TYPE_COLORS[entry.entry_type] || ENTRY_TYPE_COLORS.lesson
                              )}
                            >
                              <div className="font-medium text-xs truncate">
                                {getEntryLabel(entry)}
                              </div>
                              {entry.entry_type !== 'break' && entry.entry_type !== 'lunch' && entry.entry_type !== 'assembly' && (
                                <>
                                  {viewMode !== 'teacher' && entry.teacher && (
                                    <div className="text-xs opacity-75 truncate mt-1">
                                      {entry.teacher.first_name} {entry.teacher.last_name}
                                    </div>
                                  )}
                                  {viewMode === 'teacher' && entry.stream && entry.grade && (
                                    <div className="text-xs opacity-75 truncate mt-1">
                                      {entry.grade.name} - {entry.stream.name}
                                    </div>
                                  )}
                                  {entry.room && (
                                    <div className="text-xs opacity-60 truncate">
                                      Room: {entry.room}
                                    </div>
                                  )}
                                </>
                              )}
                              {entry.entry_type === 'double_lesson' && (
                                <Badge variant="outline" className="text-[10px] mt-1 px-1">
                                  Double
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[250px]">
                            <div className="space-y-1">
                              <p className="font-medium">{getEntryLabel(entry)}</p>
                              <p className="text-xs">
                                {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                              </p>
                              {entry.teacher && (
                                <p className="text-xs">
                                  Teacher: {entry.teacher.first_name} {entry.teacher.last_name}
                                </p>
                              )}
                              {entry.grade && entry.stream && (
                                <p className="text-xs">
                                  Class: {entry.grade.name} - {entry.stream.name}
                                </p>
                              )}
                              {entry.room && (
                                <p className="text-xs">Room: {entry.room}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
