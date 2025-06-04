import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const res = await apiRequest("POST", "/api/auth/login", credentials);
    const data = await res.json();
    if (data.user) {
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  },

  async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await apiRequest("GET", "/api/auth/me");
      return res.json();
    } catch (error) {
      return null;
    }
  },
};
