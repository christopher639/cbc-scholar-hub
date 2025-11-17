import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ManageLearningAreasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageLearningAreasDialog = ({ open, onOpenChange }: ManageLearningAreasDialogProps) => {
  const [areas, setAreas] = useState([
    { id: 1, name: "Mathematics", teacher: "Mr. James Mwangi" },
    { id: 2, name: "English", teacher: "Mrs. Grace Njeri" },
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Learning Areas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Add New Learning Area</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaName">Learning Area Name *</Label>
                <Input id="areaName" placeholder="e.g., Mathematics" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher">Assigned Teacher *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Mr. James Mwangi</SelectItem>
                    <SelectItem value="2">Mrs. Grace Njeri</SelectItem>
                    <SelectItem value="3">Mr. David Omondi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Learning Area
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Existing Learning Areas</h3>
            <div className="space-y-2">
              {areas.map((area) => (
                <div key={area.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{area.name}</p>
                    <p className="text-sm text-muted-foreground">{area.teacher}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ManageLearningAreasDialog };
