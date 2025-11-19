import { z } from "zod";

export const learnerSchema = z.object({
  // Basic Info
  firstName: z.string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  
  lastName: z.string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  
  dateOfBirth: z.string()
    .min(1, "Date of birth is required"),
  
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a valid gender" }),
  }),
  
  birthCertificateNumber: z.string()
    .trim()
    .min(1, "Birth certificate number is required")
    .max(50, "Birth certificate number must be less than 50 characters")
    .regex(/^[A-Z0-9-]+$/i, "Birth certificate number can only contain letters, numbers, and hyphens"),
  
  boardingStatus: z.enum(["day_scholar", "boarder"]),
  
  // Parent Info
  parentFirstName: z.string()
    .trim()
    .min(1, "Parent first name is required")
    .max(100, "Parent first name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Parent first name can only contain letters, spaces, hyphens, and apostrophes"),
  
  parentLastName: z.string()
    .trim()
    .min(1, "Parent last name is required")
    .max(100, "Parent last name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Parent last name can only contain letters, spaces, hyphens, and apostrophes"),
  
  parentPhone: z.string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Phone number must be 10-15 digits and can optionally start with +"),
  
  parentEmail: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  
  parentOccupation: z.string()
    .trim()
    .max(200, "Occupation must be less than 200 characters")
    .optional(),
  
  parentAddress: z.string()
    .trim()
    .max(500, "Address must be less than 500 characters")
    .optional(),
  
  // Academic Info
  gradeId: z.string()
    .min(1, "Please select a grade"),
  
  streamId: z.string()
    .min(1, "Please select a stream"),
  
  enrollmentDate: z.string()
    .min(1, "Enrollment date is required"),
  
  previousSchool: z.string()
    .trim()
    .max(200, "Previous school name must be less than 200 characters")
    .optional(),
  
  previousGrade: z.string()
    .trim()
    .max(50, "Previous grade must be less than 50 characters")
    .optional(),
  
  reasonForTransfer: z.string()
    .trim()
    .max(500, "Reason for transfer must be less than 500 characters")
    .optional(),
  
  // Medical Info
  medicalInfo: z.string()
    .trim()
    .max(2000, "Medical information must be less than 2000 characters")
    .optional(),
  
  allergies: z.string()
    .trim()
    .max(500, "Allergies information must be less than 500 characters")
    .optional(),
  
  bloodType: z.string()
    .trim()
    .max(10, "Blood type must be less than 10 characters")
    .optional(),
  
  emergencyContact: z.string()
    .trim()
    .max(200, "Emergency contact name must be less than 200 characters")
    .optional(),
  
  emergencyPhone: z.string()
    .trim()
    .regex(/^(\+?[0-9]{10,15})?$/, "Emergency phone must be 10-15 digits and can optionally start with +")
    .optional(),
});

export type LearnerFormData = z.infer<typeof learnerSchema>;
