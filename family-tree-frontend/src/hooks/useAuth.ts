"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api";
import { LoginRequest, RegisterRequest, AuthResponse } from "@/types";
import toast from "react-hot-toast";

// Simplified login hook using the new AuthProvider
export const useLogin = () => {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      console.log(
        "[useLogin] mutationFn called with credentials:",
        credentials
      );
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      console.log("[useLogin] API response received:", response);
      return response;
    },
    onSuccess: async (data: any) => {
      console.log("[useLogin] onSuccess called with data:", data);
      if (data?.accessToken && data?.refreshToken && data?.user) {
        console.log("[useLogin] Calling AuthProvider login method");
        // Use the new AuthProvider's login method
        await login(data.accessToken, data.refreshToken, data.user);

        // Invalidate queries to trigger fresh data fetching
        queryClient.invalidateQueries();

        toast.success("Login successful!");
      } else {
        console.log("[useLogin] Missing required data in response:", {
          hasAccessToken: !!data?.accessToken,
          hasRefreshToken: !!data?.refreshToken,
          hasUser: !!data?.user,
          dataKeys: Object.keys(data || {}),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed");
    },
  });
};

// Simplified register hook using the new AuthProvider
export const useRegister = () => {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        data
      );
      return response;
    },
    onSuccess: async (data) => {
      if (data?.accessToken && data?.refreshToken && data?.user) {
        // Use the new AuthProvider's login method
        await login(data.accessToken, data.refreshToken, data.user);

        // Invalidate queries to trigger fresh data fetching
        queryClient.invalidateQueries();

        toast.success("Registration successful!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Registration failed");
    },
  });
};

// Simplified logout hook using the new AuthProvider
export const useLogout = () => {
  const { logoutUser } = useAuth();
  const queryClient = useQueryClient();

  return () => {
    // Clear all cached data
    queryClient.clear();

    // Use the new AuthProvider's logout method
    logoutUser();

    toast.success("Logged out successfully");
  };
};

// Simple wrapper to access auth state
export const useAuthState = () => {
  const { user, profile, isAuthenticated, isLoading } = useAuth();

  return {
    user,
    profile,
    isAuthenticated,
    hasProfile: !!profile,
    loading: isLoading,
  };
};
