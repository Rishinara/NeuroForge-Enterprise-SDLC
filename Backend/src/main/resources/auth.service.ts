import api from '../lib/api';
import {
  SignInRequest,
  SignUpRequest,
  JwtAuthenticationResponse,
  jwtAuthResponseSchema,
} from '../schemas/auth.schemas';

const signIn = async (data: SignInRequest): Promise<JwtAuthenticationResponse> => {
  const response = await api.post('/auth/signin', data);
  return jwtAuthResponseSchema.parse(response.data);
};

const signUp = async (data: SignUpRequest): Promise<JwtAuthenticationResponse> => {
  const response = await api.post('/auth/signup', data);
  return jwtAuthResponseSchema.parse(response.data);
};

const refreshToken = async (token: string): Promise<JwtAuthenticationResponse> => {
  // Use a separate, non-intercepted axios instance for refresh to avoid circular dependency
  const response = await axios.post('/auth/refresh', { refreshToken: token }, { baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api/v1' });
  return jwtAuthResponseSchema.parse(response.data);
};

export const authService = {
  signIn,
  signUp,
  refreshToken,
};