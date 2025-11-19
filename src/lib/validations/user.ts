import { z } from "zod";

export const userSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Full name must be less than 200 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  
  role: z.enum(["admin", "teacher", "parent", "student", "learner"]),
});

export type UserFormData = z.infer<typeof userSchema>;
