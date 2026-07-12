import { createContext } from "react";
import type { CurrentUser, LoginRequest } from "../types/auth";

export interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
