import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ManageLearningAreasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LearningArea {
  id: string;
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
}

const ManageLearningAreasDialog = ({ open, onOpenChange }: ManageLearningAreasDialogProps) => {
  const { toast } = useToast();
  
  const [areas, setAreas] = useState<LearningArea[]>([
    { id: "1", code: "MATH", name: "Mathematics", teacherId: "T001", teacherName: "Mr. James Mwangi" },
    { id: "2", code: "ENG", name: "English", teacherId: "T002", teacherName: "Mrs. Grace Njeri" },
    { id: "3", code: "KIS", name: "Kiswahili", teacherId: "T003", teacherName: "Mr. David Omondi" },
    { id: "4", code: "SCI", name: "Science", teacherId: "T004", teacherName: "Mrs. Mary Akinyi" },
  ]);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");

  // Mock teachers list
  const teachers = [
    { id: "T001", name: "Mr. James Mwangi" },
    { id: "T002", name: "Mrs. Grace Njeri" },
    { id: "T003", name: "Mr. David Omondi" },
    { id: "T004", name: "Mrs. Mary Akinyi" },
    { id: "T005", name: "Ms. Sarah Wanjiku" },
  ];

  const handleAdd = () => {
    if (!newCode || !newName || !newTeacherId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const teacher = teachers.find(t => t.id === newTeacherId);
    const newArea: LearningArea = {
      id: Date.now().toString(),
      code: newCode.toUpperCase(),
      name: newName,
      teacherId: newTeacherId,
      teacherName: teacher?.name || "",
    };

    setAreas([...areas, newArea]);
    setNewCode("");
    setNewName("");
    setNewTeacherId("");

    toast({
      title: "Learning Area Added",
      description: `${newName} (${newCode.toUpperCase()}) has been added`,
    });
  };

  const handleDelete = (id: string) => {
    setAreas(areas.filter(area => area.id !== id));
    toast({
      title: "Learning Area Removed",
      description: "The learning area has been deleted",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Learning Areas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Add New Learning Area</h3>
            <div className="grid grid-cols-3 gap-4 border border-border rounded-lg p-4 bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="code">
                  <Code className="h-3 w-3 inline mr-1" />
                  Code *
                </Label>
                <Input 
                  id="code" 
                  placeholder="e.g., MATH" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="uppercase font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaName">Learning Area Name *</Label>
                <Input 
                  id="areaName" 
                  placeholder="e.g., Mathematics" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher">Assigned Teacher *</Label>
                <Select value={newTeacherId} onValueChange={setNewTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Learning Area
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">
              Existing Learning Areas ({areas.length})
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {areas.map((area) => (
                <div key={area.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono text-sm">
                      {area.code}
                    </Badge>
                    <div>
                      <p className="font-medium text-foreground">{area.name}</p>
                      <p className="text-sm text-muted-foreground">{area.teacherName}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(area.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ManageLearningAreasDialog };
