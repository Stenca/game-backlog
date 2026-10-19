import { z } from "zod";

const usernameRule = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(20)
  .regex(
    /^[a-z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores",
  );

const displayNameRule = z.string().trim().min(1).max(20);

const emailRule = z.email("Invalid email").trim().toLowerCase();

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  username: usernameRule,
  displayName: displayNameRule,
  email: emailRule,
  password: passwordRule,
});

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z
  .object({
    username: usernameRule.optional(),
    displayName: displayNameRule.optional(),
    email: emailRule.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordRule,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });
