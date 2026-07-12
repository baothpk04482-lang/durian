export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user?: CurrentUser;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
