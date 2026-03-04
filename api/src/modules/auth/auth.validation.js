const { z } = require("zod");

/**
 * Common reusable validators
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long");

const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Company name must be at least 2 characters")
  .max(100, "Company name too long");

/**
 * Register validation schema
 */
const registerSchema = z.object({
  companyName: companyNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Login validation schema
 */
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Refresh schema (optional for future extension)
 */
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};