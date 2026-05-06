import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Please enter a valid email address" })
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password is too long" })
  .regex(/[0-9]/, { message: "Password must include at least one number" });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, { message: "Please enter your full name" }).max(100),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    companyName: z.string().trim().max(100).optional().or(z.literal("")),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms & Conditions" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const resetSchema = z.object({ email: emailSchema });

export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
