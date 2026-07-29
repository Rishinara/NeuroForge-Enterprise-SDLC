import { z } from 'zod';

export const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const tokenRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const jwtAuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

// Infer TypeScript types from schemas
export type SignUpRequest = z.infer<typeof signUpSchema>;
export type SignInRequest = z.infer<typeof signInSchema>;
export type TokenRefreshRequest = z.infer<typeof tokenRefreshSchema>;
export type JwtAuthenticationResponse = z.infer<typeof jwtAuthResponseSchema>;