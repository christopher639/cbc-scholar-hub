import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";

const StreamDetail = () => {
  const { grade, stream } = useParams();

  const learners = [
    { admissionNo: "ADM001", name: "John Kamau Mwangi", gender: "Male", dateOfBirth: "2015-03-15", feeBalance: 15000, photo: null },
    { admissionNo: "ADM007", name: "Sarah Njoki Kariuki", gender: "Female", dateOfBirth: "2015-06-22", feeBalance: 12000, photo: null },
    { admissionNo: "ADM009", name: "James Kipchoge Rotich", gender: "Male", dateOfBirth: "2015-01-10", feeBalance: 0, photo: null },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/grades/${grade}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Grade {grade} - {stream} Stream</h1>
            <p className="text-muted-foreground">All learners in this stream</p>
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
              <CardTitle className="text-3xl">35</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Out of 40 capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Male Learners</CardDescription>
              <CardTitle className="text-3xl">18</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">51% of stream</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Female Learners</CardDescription>
              <CardTitle className="text-3xl">17</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">49% of stream</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Fee Collection</CardDescription>
              <CardTitle className="text-3xl">82%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Payment rate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Learners</CardTitle>
            <CardDescription>{learners.length} learners in this stream</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Admission No.</th>
                    <th className="pb-3 pr-4">Learner Name</th>
                    <th className="pb-3 pr-4">Gender</th>
                    <th className="pb-3 pr-4">Date of Birth</th>
                    <th className="pb-3">Fee Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {learners.map((learner) => (
                    <tr key={learner.admissionNo} className="text-sm hover:bg-muted/50 transition-colors">
                      <td className="py-4 pr-4">
                        <span className="font-mono font-medium text-foreground">{learner.admissionNo}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <Link to={`/learner/${learner.admissionNo}`}>
                          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {learner.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium text-foreground hover:text-primary transition-colors">{learner.name}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-foreground">{learner.gender}</td>
                      <td className="py-4 pr-4 text-foreground">{learner.dateOfBirth}</td>
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
      </div>
    </DashboardLayout>
  );
};

export default StreamDetail;
