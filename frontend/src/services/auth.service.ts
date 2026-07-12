import api from "../api";
import type { LoginRequest, LoginResponse, CurrentUser, AuthTokens, RefreshTokenRequest } from "../types/auth";

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const payload = {
      email: data.username,
      password: data.password,
    };
    const response = await api.post<LoginResponse>("/auth/login", payload);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async refreshToken(data: RefreshTokenRequest): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>("/auth/refresh", data);
    return response.data;
  },

  async getCurrentUser(): Promise<CurrentUser> {
    const response = await api.get<CurrentUser>("/auth/me");
    return response.data;
  },
};
