import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, GraduationCap, User, Heart, FileText, CheckCircle, ArrowLeft, ArrowRight, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { PageMeta } from "@/components/SEO/PageMeta";

const applicationSchema = z.object({
  // Learner info
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["male", "female"], { required_error: "Please select gender" }),
  birthCertificateNumber: z.string().optional(),
  religion: z.string().optional(),
  previousSchool: z.string().optional(),
  previousGrade: z.string().optional(),
  // Parent info
  parentFirstName: z.string().min(2, "Parent first name is required"),
  parentLastName: z.string().min(2, "Parent last name is required"),
  parentEmail: z.string().email("Valid email is required"),
  parentPhone: z.string().min(10, "Valid phone number is required"),
  parentOccupation: z.string().optional(),
  parentAddress: z.string().optional(),
  parentRelationship: z.string().min(1, "Please select your relationship to the learner"),
  // Academic info
  applyingForGradeId: z.string().min(1, "Please select a grade"),
  boardingStatus: z.enum(["day", "boarding"], { required_error: "Please select boarding status" }),
  // Medical info
  medicalInfo: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  // Residence
  residence: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const steps = [
  { id: 1, title: "Learner Information", icon: User },
  { id: 2, title: "Parent/Guardian", icon: User },
  { id: 3, title: "Academic Details", icon: GraduationCap },
  { id: 4, title: "Medical Information", icon: Heart },
  { id: 5, title: "Review & Submit", icon: FileText },
];

export default function Apply() {
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolInfo } = useSchoolInfo();
  
  // Check if returning from privacy policy
  const returnToReview = location.state?.returnToReview === true;
  
  const [currentStep, setCurrentStep] = useState(returnToReview ? 5 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [feeSettings, setFeeSettings] = useState<{ 
    fee_enabled: boolean; 
    fee_amount: number; 
    applications_open: boolean;
    interview_enabled: boolean;
    interview_date: string | null;
    interview_time: string | null;
    interview_location: string | null;
    interview_requirements: string | null;
    interview_fee: number | null;
    interview_fee_note: string | null;
  } | null>(null);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: undefined,
      birthCertificateNumber: "",
      religion: "",
      previousSchool: "",
      previousGrade: "",
      parentFirstName: "",
      parentLastName: "",
      parentEmail: "",
      parentPhone: "",
      parentOccupation: "",
      parentAddress: "",
      parentRelationship: "",
      applyingForGradeId: "",
      boardingStatus: "day",
      medicalInfo: "",
      allergies: "",
      emergencyContact: "",
      emergencyPhone: "",
      residence: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch grades
      const { data: gradesData } = await supabase
        .from("grades")
        .select("id, name")
        .order("name");
      if (gradesData) setGrades(gradesData);

      // Fetch application settings
      const { data: settingsData } = await supabase
        .from("application_settings")
        .select("*")
        .single();
      if (settingsData) setFeeSettings(settingsData);
    };
    fetchData();
  }, []);

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof ApplicationFormData)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "dateOfBirth", "gender"];
        break;
      case 2:
        fieldsToValidate = ["parentFirstName", "parentLastName", "parentEmail", "parentPhone", "parentRelationship"];
        break;
      case 3:
        fieldsToValidate = ["applyingForGradeId", "boardingStatus"];
        break;
      case 4:
        // Medical info is optional
        return true;
      default:
        return true;
    }
    
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      // Generate application number
      const { data: appNumData, error: appNumError } = await supabase.rpc("generate_application_number");
      if (appNumError) throw appNumError;
      
      const appNumber = appNumData as string;
      const selectedGrade = grades.find(g => g.id === data.applyingForGradeId);
      
      // Insert application
      const { error: insertError } = await supabase.from("applications").insert({
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: format(data.dateOfBirth, "yyyy-MM-dd"),
        gender: data.gender,
        birth_certificate_number: data.birthCertificateNumber || null,
        religion: data.religion || null,
        previous_school: data.previousSchool || null,
        previous_grade: data.previousGrade || null,
        parent_first_name: data.parentFirstName,
        parent_last_name: data.parentLastName,
        parent_email: data.parentEmail,
        parent_phone: data.parentPhone,
        parent_occupation: data.parentOccupation || null,
        parent_address: data.parentAddress || null,
        parent_relationship: data.parentRelationship || null,
        residence: data.residence || null,
        applying_for_grade_id: data.applyingForGradeId,
        applying_for_grade_name: selectedGrade?.name || "",
        boarding_status: data.boardingStatus,
        medical_info: data.medicalInfo || null,
        allergies: data.allergies || null,
        emergency_contact: data.emergencyContact || null,
        emergency_phone: data.emergencyPhone || null,
        application_number: appNumber,
        fee_paid: !feeSettings?.fee_enabled,
        fee_amount: feeSettings?.fee_enabled ? feeSettings.fee_amount : 0,
      });

      if (insertError) throw insertError;

      // Send confirmation email with interview details if enabled
      await supabase.functions.invoke("send-application-confirmation", {
        body: {
          parentEmail: data.parentEmail,
          parentName: `${data.parentFirstName} ${data.parentLastName}`,
          childName: `${data.firstName} ${data.lastName}`,
          applicationNumber: appNumber,
          gradeName: selectedGrade?.name || "",
          schoolName: schoolInfo?.school_name || "School",
          interviewEnabled: feeSettings?.interview_enabled,
          interviewDate: feeSettings?.interview_date,
          interviewTime: feeSettings?.interview_time,
          interviewLocation: feeSettings?.interview_location,
          interviewRequirements: feeSettings?.interview_requirements,
          interviewFee: feeSettings?.interview_fee,
          interviewFeeNote: feeSettings?.interview_fee_note,
          applicationFee: feeSettings?.fee_enabled ? feeSettings.fee_amount : null,
        },
      });

      setApplicationNumber(appNumber);
      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      console.error("Application error:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formValues = form.watch();

  // Show closed message if applications are not open
  if (feeSettings && !feeSettings.applications_open) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <PageMeta 
          title="Applications Closed"
          description="Applications are currently closed"
        />
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Applications Currently Closed</CardTitle>
            <CardDescription className="text-base mt-2">
              We are not accepting applications at this time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Thank you for your interest in {schoolInfo?.school_name || "our school"}. 
              Please check back later or contact us for more information about upcoming admission periods.
            </p>
            <Button onClick={() => navigate("/")} className="w-full mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <PageMeta 
          title="Application Submitted"
          description="Your application has been submitted successfully"
        />
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">Application Submitted!</CardTitle>
            <CardDescription className="text-base mt-2">
              Thank you for applying to {schoolInfo?.school_name || "our school"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Your Application Number</p>
              <p className="text-2xl font-bold text-primary">{applicationNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address. 
              We will review your application and get back to you soon.
            </p>
            {feeSettings?.fee_enabled && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Application Fee: KES {feeSettings.fee_amount.toLocaleString()}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Please pay the application fee to complete your application process.
                </p>
              </div>
            )}
            <Button onClick={() => navigate("/")} className="w-full mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <PageMeta 
        title={`Apply for Admission - ${schoolInfo?.school_name || "School"}`}
        description={`Apply for admission at ${schoolInfo?.school_name}. Complete our online application form to enroll your child.`}
        keywords="school admission, apply online, school enrollment, learner application"
      />
      
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            {schoolInfo?.logo_url ? (
              <img src={schoolInfo.logo_url} alt="School Logo" className="h-10 w-10 object-contain" />
            ) : (
              <GraduationCap className="h-10 w-10 text-primary" />
            )}
            <div>
              <h1 className="font-bold text-lg">{schoolInfo?.school_name || "School"}</h1>
              <p className="text-xs text-muted-foreground">Online Application</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{step.id}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "hidden sm:block w-12 lg:w-24 h-1 mx-2 rounded",
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-1 text-center hidden sm:block max-w-[80px]",
                  currentStep >= step.id ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center sm:hidden">
            <h2 className="text-xl font-semibold">{steps[currentStep - 1].title}</h2>
            <p className="text-sm text-muted-foreground">Step {currentStep} of {steps.length}</p>
          </div>
        </div>

        {/* Application Fee Notice */}
        {feeSettings?.fee_enabled && currentStep === 1 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Application Fee:</strong> KES {feeSettings.fee_amount.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Payment details will be provided after submission.
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent className="pt-6">
                {/* Step 1: Learner Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Child's first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Child's last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : "Select date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  captionLayout="dropdown-buttons"
                                  fromYear={2005}
                                  toYear={new Date().getFullYear()}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="birthCertificateNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Certificate Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Birth certificate number (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Christian, Muslim, Hindu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="previousSchool"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous School</FormLabel>
                            <FormControl>
                              <Input placeholder="Previous school name (if any)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="previousGrade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Grade/Class</FormLabel>
                            <FormControl>
                              <Input placeholder="Last completed grade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Parent/Guardian Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="parentFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="parentEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="0712345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="parentOccupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                              <Input placeholder="Your occupation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentRelationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to Learner *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mother">Mother</SelectItem>
                                <SelectItem value="father">Father</SelectItem>
                                <SelectItem value="guardian">Guardian</SelectItem>
                                <SelectItem value="grandparent">Grandparent</SelectItem>
                                <SelectItem value="uncle">Uncle</SelectItem>
                                <SelectItem value="aunt">Aunt</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="parentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Your physical address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="residence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Residence / Estate</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Westlands, Karen, Kileleshwa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Academic Details */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="applyingForGradeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Applying for Grade *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade to apply for" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boardingStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boarding Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select boarding status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="day">Day Scholar</SelectItem>
                              <SelectItem value="boarding">Boarding</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Medical Information */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      This information helps us ensure your child's safety and well-being. All fields are optional.
                    </p>
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Known Allergies</FormLabel>
                          <FormControl>
                            <Textarea placeholder="List any allergies (food, medication, etc.)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Conditions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any medical conditions we should be aware of" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Emergency contact person" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergencyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Emergency phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Submit */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Please review the information below before submitting your application.
                    </p>
                    
                    <div className="grid gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" /> Learner Information
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {formValues.firstName} {formValues.lastName}</p>
                          <p><span className="text-muted-foreground">DOB:</span> {formValues.dateOfBirth ? format(formValues.dateOfBirth, "PPP") : "-"}</p>
                          <p><span className="text-muted-foreground">Gender:</span> {formValues.gender}</p>
                          <p><span className="text-muted-foreground">Religion:</span> {formValues.religion || "-"}</p>
                          <p><span className="text-muted-foreground">Birth Cert:</span> {formValues.birthCertificateNumber || "-"}</p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <User className="h-4 w-4" /> Parent/Guardian
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {formValues.parentFirstName} {formValues.parentLastName}</p>
                          <p><span className="text-muted-foreground">Relationship:</span> {formValues.parentRelationship || "-"}</p>
                          <p><span className="text-muted-foreground">Email:</span> {formValues.parentEmail}</p>
                          <p><span className="text-muted-foreground">Phone:</span> {formValues.parentPhone}</p>
                          <p><span className="text-muted-foreground">Occupation:</span> {formValues.parentOccupation || "-"}</p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" /> Academic Details
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="text-muted-foreground">Applying for:</span> {grades.find(g => g.id === formValues.applyingForGradeId)?.name || "-"}</p>
                          <p><span className="text-muted-foreground">Boarding:</span> {formValues.boardingStatus === "boarding" ? "Boarding" : "Day Scholar"}</p>
                          <p><span className="text-muted-foreground">Previous School:</span> {formValues.previousSchool || "-"}</p>
                          <p><span className="text-muted-foreground">Previous Grade:</span> {formValues.previousGrade || "-"}</p>
                        </div>
                      </div>

                      {(formValues.allergies || formValues.medicalInfo) && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Heart className="h-4 w-4" /> Medical Information
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="text-muted-foreground">Allergies:</span> {formValues.allergies || "-"}</p>
                            <p><span className="text-muted-foreground">Medical Conditions:</span> {formValues.medicalInfo || "-"}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {feeSettings?.fee_enabled && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Application Fee: KES {feeSettings.fee_amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                          Payment details will be sent to your email after submission.
                        </p>
                      </div>
                    )}

                    {/* Data Privacy Agreement */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="privacy-agreement"
                          checked={privacyAgreed}
                          onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="privacy-agreement" className="text-sm cursor-pointer">
                          I have read and agree to the{" "}
                          <Link 
                            to="/privacy-policy" 
                            state={{ fromApply: true }}
                            className="text-primary font-medium hover:underline"
                          >
                            Data Protection & Privacy Policy
                          </Link>
                          {" "}in accordance with the Kenya Data Protection Act, 2019. I consent to the collection, 
                          processing, and use of personal data as described therein.
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting || !privacyAgreed}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
