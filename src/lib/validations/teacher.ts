import { z } from "zod";

export const teacherSchema = z.object({
  employee_number: z.string()
    .trim()
    .min(1, "Employee number is required")
    .max(50, "Employee number must be less than 50 characters")
    .regex(/^[A-Z0-9-/]+$/i, "Employee number can only contain letters, numbers, hyphens, and slashes"),
  
  id_number: z.string()
    .trim()
    .min(1, "ID number is required")
    .max(50, "ID number must be less than 50 characters")
    .regex(/^[A-Z0-9]+$/i, "ID number can only contain letters and numbers"),
  
  first_name: z.string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  
  last_name: z.string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  
  phone: z.string()
    .trim()
    .regex(/^(\+?[0-9]{10,15})?$/, "Phone number must be 10-15 digits and can optionally start with +")
    .optional()
    .or(z.literal("")),
  
  specialization: z.string()
    .trim()
    .max(200, "Specialization must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  
  hired_date: z.string()
    .optional()
    .or(z.literal("")),
  
  salary: z.string()
    .optional()
    .refine(
      (val) => !val || !isNaN(parseFloat(val)),
      "Salary must be a valid number"
    )
    .refine(
      (val) => !val || parseFloat(val) >= 0,
      "Salary must be a positive number"
    )
    .or(z.literal("")),
});

export type TeacherFormData = z.infer<typeof teacherSchema>;
