import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParentAuth } from "@/hooks/useParentAuth";
import { GraduationCap } from "lucide-react";

export default function ParentLogin() {
  const navigate = useNavigate();
  const { login, loading } = useParentAuth();
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [birthCertificate, setBirthCertificate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(admissionNumber, birthCertificate);
    if (success) {
      navigate("/parent-portal");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Parent Portal</CardTitle>
          <CardDescription className="text-center">
            Login to view your child's academic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Learner's Admission Number</Label>
              <Input
                id="admissionNumber"
                placeholder="e.g., 2500001"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthCertificate">Birth Certificate Number</Label>
              <Input
                id="birthCertificate"
                type="password"
                placeholder="Enter birth certificate number"
                value={birthCertificate}
                onChange={(e) => setBirthCertificate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
