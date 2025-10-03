import { z } from "zod";

export const RoleEnum = z.enum(["USER", "ADMIN"]);
export const GenderEnum = z.enum(["Male", "Female", "Other", "Not Specified"]);

const strongPassword = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character (@$!%*?&)");

// Base schema
const userBaseSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: strongPassword,
    name: z.string().min(1, "Name is required"),

    dob: z.preprocess((val) => (val ? new Date(val) : undefined), z.date().optional()),
    phone: z.string().optional(),
    bio: z.string().optional(),
    gender: GenderEnum.default("Not Specified"),
    profileImage: z.string().url("Invalid profile picture URL").optional(),
});

// Registration schema
export const createUserSchema = userBaseSchema;

//  Login schema
export const loginUserSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});

// Update schema (all optional)
export const updateUserSchema = userBaseSchema.partial();
