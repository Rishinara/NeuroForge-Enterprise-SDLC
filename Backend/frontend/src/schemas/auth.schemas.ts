import { z } from 'zod';

export const signUpSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const tokenRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    userId: z.number(),
    email: z.string(),
    fullName: z.string(),
    orgId: z.number().nullable(),
    orgName: z.string().nullable(),
    role: z.string(),
  }),
});

// Infer TypeScript types from schemas
export type SignUpRequest = z.infer<typeof signUpSchema>;
export type SignInRequest = z.infer<typeof signInSchema>;
export type TokenRefreshRequest = z.infer<typeof tokenRefreshSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;