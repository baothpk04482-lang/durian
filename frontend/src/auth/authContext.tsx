import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { CurrentUser, LoginRequest } from "../types/auth";
import { authService } from "../services/auth.service";
import * as tokenStorage from "./tokenStorage";
import { AuthContext } from "./context";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = tokenStorage.getAccessToken();

    const checkAuth = async () => {
      // Force execution to run asynchronously in next microtask
      await Promise.resolve();
      
      if (!token) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        tokenStorage.clearTokens();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      tokenStorage.saveAccessToken(response.access_token);
      if (response.refresh_token) {
        tokenStorage.saveRefreshToken(response.refresh_token);
      }
      if (response.user) {
        setUser(response.user);
      } else {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout().catch(() => {});
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setLoading(false);
    }
  };

  const refresh = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token stored");
    }
    const response = await authService.refreshToken({ refresh_token: refreshToken });
    tokenStorage.saveAccessToken(response.access_token);
    if (response.refresh_token) {
      tokenStorage.saveRefreshToken(response.refresh_token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
