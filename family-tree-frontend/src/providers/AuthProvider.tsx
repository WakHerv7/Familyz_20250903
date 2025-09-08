"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  loginSuccess,
  logout,
  setProfile,
  setLoading,
} from "@/store/slices/authSlice";
import { apiClient } from "@/lib/api";
import { MemberWithRelationships, User } from "@/types";
import { ClipLoader } from "react-spinners";

interface AuthContextType {
  user: User | null;
  profile: MemberWithRelationships | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    user: User
  ) => Promise<void>;
  logoutUser: () => void;
  saveRedirectUrl: (url: string) => void;
  clearRedirectUrl: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  REDIRECT_URL: "pendingRedirectUrl",
} as const;

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const { user, profile, isAuthenticated, loading } = useAppSelector(
    (state) => state.auth
  );

  const [isInitialized, setIsInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [shouldRedirectAfterLogin, setShouldRedirectAfterLogin] =
    useState(false);

  // Set client-side flag
  useEffect(() => {
    console.log("[AuthProvider] Setting isClient to true");
    setIsClient(true);
  }, []);

  // Initialize authentication on mount (only on client)
  useEffect(() => {
    console.log("[AuthProvider] Initialize useEffect triggered", {
      isClient,
      isInitialized,
      loading,
      isAuthenticated,
      pathname,
    });
    if (isClient) {
      initializeAuth();
    }
  }, [isClient]);

  // Handle redirects after authentication is initialized (only on client)
  useEffect(() => {
    console.log("[AuthProvider] Route protection useEffect triggered", {
      isClient,
      isInitialized,
      loading,
      isAuthenticated,
      pathname,
      shouldRedirectAfterLogin,
    });
    if (isClient && isInitialized && !loading) {
      handleRouteProtection();
    }
  }, [isClient, isInitialized, loading, isAuthenticated, pathname]);

  // Handle post-login redirect when authentication state changes (only on client)
  useEffect(() => {
    console.log("[AuthProvider] Post-login redirect useEffect triggered", {
      isClient,
      isInitialized,
      isAuthenticated,
      pathname,
      shouldRedirectAfterLogin,
      isPublicRoute: pathname ? PUBLIC_ROUTES.includes(pathname) : false,
    });
    if (
      isClient &&
      isInitialized &&
      isAuthenticated &&
      pathname &&
      PUBLIC_ROUTES.includes(pathname)
    ) {
      console.log(
        "[AuthProvider] Calling handlePostLoginRedirect from useEffect"
      );
      handlePostLoginRedirect();
    }
  }, [isClient, isAuthenticated, isInitialized, pathname]);

  // Handle immediate redirect after login
  useEffect(() => {
    console.log("[AuthProvider] Immediate redirect useEffect triggered", {
      shouldRedirectAfterLogin,
      isAuthenticated,
      loading,
      pathname,
      isPublicRoute: pathname ? PUBLIC_ROUTES.includes(pathname) : false,
    });
    if (shouldRedirectAfterLogin && isAuthenticated && !loading) {
      console.log("[AuthProvider] Conditions met for immediate redirect");
      setShouldRedirectAfterLogin(false);
      if (pathname && PUBLIC_ROUTES.includes(pathname)) {
        console.log(
          "[AuthProvider] Calling handlePostLoginRedirect from immediate redirect"
        );
        handlePostLoginRedirect();
      } else {
        console.log("[AuthProvider] Not on public route, skipping redirect", {
          pathname,
        });
      }
    }
  }, [shouldRedirectAfterLogin, isAuthenticated, loading, pathname]);

  const initializeAuth = async () => {
    console.log("[AuthProvider] initializeAuth called");
    dispatch(setLoading(true));

    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      console.log("[AuthProvider] initializeAuth - tokens found:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });

      if (!accessToken || !refreshToken) {
        console.log("[AuthProvider] initializeAuth - no tokens, logging out");
        dispatch(logout());
        setIsInitialized(true);
        return;
      }

      // Validate token by fetching user profile
      console.log("[AuthProvider] initializeAuth - fetching profile");
      const profile = await apiClient.get<MemberWithRelationships>(
        "/members/profile"
      );

      // If we reach here, token is valid
      console.log(
        "[AuthProvider] initializeAuth - profile fetched successfully"
      );
      dispatch(setProfile(profile));

      // Create a user object based on the member profile
      const userData: User = {
        id: profile.id,
        email: profile.personalInfo?.email,
        phone: profile.personalInfo?.phoneNumber,
        memberId: profile.id,
        member: profile,
      };

      console.log("[AuthProvider] initializeAuth - dispatching loginSuccess");
      dispatch(
        loginSuccess({
          user: userData,
          accessToken,
          refreshToken,
        })
      );
    } catch (error) {
      console.error("Auth initialization failed:", error);
      // Clear invalid tokens
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      dispatch(logout());
    }

    console.log(
      "[AuthProvider] initializeAuth - setting isInitialized to true"
    );
    setIsInitialized(true);
  };

  const handleRouteProtection = () => {
    console.log("[AuthProvider] handleRouteProtection called", {
      pathname,
      isAuthenticated,
      isPublicRoute: PUBLIC_ROUTES.includes(pathname),
    });

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!isAuthenticated) {
      // User is not authenticated
      if (!isPublicRoute) {
        // Save current URL for redirect after login
        console.log(
          "[AuthProvider] User not authenticated, saving redirect URL and going to login"
        );
        saveRedirectUrl(pathname);
        router.replace("/login");
      } else {
        console.log(
          "[AuthProvider] User not authenticated but on public route, no action needed"
        );
      }
    } else {
      // User is authenticated
      if (isPublicRoute && pathname !== "/") {
        // Redirect authenticated users away from auth pages
        console.log(
          "[AuthProvider] User authenticated on auth page, redirecting to dashboard"
        );
        handlePostLoginRedirect();
      } else {
        console.log(
          "[AuthProvider] User authenticated on appropriate page, no redirect needed"
        );
      }
    }
  };

  const handlePostLoginRedirect = () => {
    console.log("[AuthProvider] handlePostLoginRedirect called", {
      pathname,
      pendingUrl: localStorage.getItem(STORAGE_KEYS.REDIRECT_URL),
    });

    const pendingUrl = localStorage.getItem(STORAGE_KEYS.REDIRECT_URL);

    if (pendingUrl && pendingUrl !== pathname) {
      console.log(
        "[AuthProvider] Found pending URL, validating and redirecting",
        { pendingUrl }
      );
      clearRedirectUrl();

      // Validate the redirect URL is safe
      if (pendingUrl.startsWith("/") && !PUBLIC_ROUTES.includes(pendingUrl)) {
        console.log("[AuthProvider] Redirecting to pending URL", {
          pendingUrl,
        });
        router.replace(pendingUrl);
        return;
      } else {
        console.log(
          "[AuthProvider] Pending URL is not safe or is public route",
          { pendingUrl }
        );
      }
    } else {
      console.log(
        "[AuthProvider] No pending URL or same as current path, redirecting to dashboard"
      );
    }

    // Default redirect to dashboard
    console.log("[AuthProvider] Redirecting to /dashboard");
    router.replace("/dashboard");
  };

  const login = async (
    accessToken: string,
    refreshToken: string,
    user: User
  ) => {
    console.log("[AuthProvider] login called", {
      userId: user.id,
      userEmail: user.email,
      pathname,
    });

    // Store tokens
    console.log("[AuthProvider] login - storing tokens in localStorage");
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

    // Update Redux state
    console.log("[AuthProvider] login - dispatching loginSuccess to Redux");
    dispatch(loginSuccess({ user, accessToken, refreshToken }));

    // Fetch user profile
    console.log("[AuthProvider] login - fetching user profile");
    try {
      const profile = await apiClient.get<MemberWithRelationships>(
        "/members/profile"
      );
      console.log("[AuthProvider] login - profile fetched successfully");
      dispatch(setProfile(profile));
    } catch (error) {
      console.error("Failed to fetch profile after login:", error);
    }

    // Mark that we should redirect after login
    console.log(
      "[AuthProvider] login - setting shouldRedirectAfterLogin to true"
    );
    setShouldRedirectAfterLogin(true);
  };

  const logoutUser = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    clearRedirectUrl();

    dispatch(logout());
    router.replace("/");
  };

  const saveRedirectUrl = (url: string) => {
    if (url && url !== "/" && !PUBLIC_ROUTES.includes(url)) {
      localStorage.setItem(STORAGE_KEYS.REDIRECT_URL, url);
    }
  };

  const clearRedirectUrl = () => {
    localStorage.removeItem(STORAGE_KEYS.REDIRECT_URL);
  };

  // Show loading screen while initializing or until client-side is confirmed
  if (!isClient || !isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {!isClient ? (
            // Simple loading indicator for SSR to prevent hydration mismatch
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          ) : (
            // Full ClipLoader only after client-side confirmation
            <ClipLoader size={50} color="#10b981" />
          )}
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const contextValue: AuthContextType = {
    user,
    profile,
    isAuthenticated,
    isLoading: loading,
    login,
    logoutUser,
    saveRedirectUrl,
    clearRedirectUrl,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Route protection component
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ClipLoader size={50} color="#10b981" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // AuthProvider will handle redirect
  }

  return <>{children}</>;
}
