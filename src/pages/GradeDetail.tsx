import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, Users, ArrowUp } from "lucide-react";
import { PromoteLearnerDialog } from "@/components/PromoteLearnerDialog";
import { Checkbox } from "@/components/ui/checkbox";

const GradeDetail = () => {
  const { grade } = useParams();
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);

  const streams = [
    { name: "Green", learners: 35, capacity: 40 },
    { name: "Red", learners: 38, capacity: 40 },
    { name: "Blue", learners: 32, capacity: 40 },
    { name: "Yellow", learners: 36, capacity: 40 },
  ];

  const learners = [
    { admissionNo: "ADM001", name: "John Kamau Mwangi", stream: "Green", gender: "Male", feeBalance: 15000 },
    { admissionNo: "ADM003", name: "David Omondi Otieno", stream: "Blue", gender: "Male", feeBalance: 8500 },
    { admissionNo: "ADM007", name: "Sarah Njoki Kariuki", stream: "Green", gender: "Female", feeBalance: 12000 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/grades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Grade {grade}</h1>
            <p className="text-muted-foreground">View all learners and streams in this grade</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export List
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Learners</CardDescription>
              <CardTitle className="text-3xl">141</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Across 4 streams</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Male</CardDescription>
              <CardTitle className="text-3xl">72</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">51% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Female</CardDescription>
              <CardTitle className="text-3xl">69</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">49% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Capacity</CardDescription>
              <CardTitle className="text-3xl">88%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Utilization rate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Streams in Grade {grade}</CardTitle>
            <CardDescription>Click on a stream to view learners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {streams.map((stream) => (
                <Link key={stream.name} to={`/grades/${grade}/${stream.name.toLowerCase()}`}>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground">{stream.name}</h3>
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Learners:</span>
                          <span className="font-semibold text-foreground">{stream.learners}/{stream.capacity}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(stream.learners / stream.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Learners in Grade {grade}</CardTitle>
                <CardDescription>{learners.length} total learners • {selectedLearners.length} selected</CardDescription>
              </div>
              <Button 
                onClick={() => setPromoteDialogOpen(true)}
                disabled={selectedLearners.length === 0}
                className="gap-2"
              >
                <ArrowUp className="h-4 w-4" />
                Promote Selected
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">
                      <Checkbox 
                        checked={selectedLearners.length === learners.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLearners(learners.map(l => l.admissionNo));
                          } else {
                            setSelectedLearners([]);
                          }
                        }}
                      />
                    </th>
                    <th className="pb-3 pr-4">Admission No.</th>
                    <th className="pb-3 pr-4">Learner Name</th>
                    <th className="pb-3 pr-4">Stream</th>
                    <th className="pb-3 pr-4">Gender</th>
                    <th className="pb-3">Fee Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {learners.map((learner) => (
                    <tr key={learner.admissionNo} className="text-sm">
                      <td className="py-4 pr-4">
                        <Checkbox 
                          checked={selectedLearners.includes(learner.admissionNo)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLearners([...selectedLearners, learner.admissionNo]);
                            } else {
                              setSelectedLearners(selectedLearners.filter(id => id !== learner.admissionNo));
                            }
                          }}
                        />
                      </td>
                      <td className="py-4 pr-4">
                        <span className="font-mono font-medium text-foreground">{learner.admissionNo}</span>
                      </td>
                      <td className="py-4 pr-4 font-medium text-foreground">{learner.name}</td>
                      <td className="py-4 pr-4">
                        <Badge variant="secondary">{learner.stream}</Badge>
                      </td>
                      <td className="py-4 pr-4 text-foreground">{learner.gender}</td>
                      <td className="py-4">
                        {learner.feeBalance > 0 ? (
                          <span className="font-semibold text-warning">KES {learner.feeBalance.toLocaleString()}</span>
                        ) : (
                          <span className="font-semibold text-success">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <PromoteLearnerDialog 
          open={promoteDialogOpen} 
          onOpenChange={setPromoteDialogOpen}
          selectedLearners={selectedLearners}
          currentGrade={`Grade ${grade}`}
        />
      </div>
    </DashboardLayout>
  );
};

export default GradeDetail;
