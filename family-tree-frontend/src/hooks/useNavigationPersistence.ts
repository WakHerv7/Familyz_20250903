import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const useNavigationPersistence = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Save current URL to localStorage when navigating to protected routes
    if (typeof window !== "undefined" && pathname) {
      const isProtectedRoute =
        !pathname.startsWith("/login") &&
        !pathname.startsWith("/signup") &&
        pathname !== "/";

      if (isProtectedRoute) {
        localStorage.setItem("savedNavigationUrl", pathname);
      }
    }
  }, [pathname]);

  return {
    saveCurrentUrl: (url: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("savedNavigationUrl", url);
      }
    },
    getSavedUrl: () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("savedNavigationUrl");
      }
      return null;
    },
    clearSavedUrl: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("savedNavigationUrl");
      }
    },
  };
};

// Hook for handling navigation persistence redirects (state-free approach)
export const useNavigationRedirect = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (typeof window === "undefined") return;

      try {
        // Check for tokens in localStorage
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!accessToken || !refreshToken) {
          setIsAuthenticated(false);
          setAuthChecked(true);
          return;
        }

        // Try to fetch profile to verify token validity
        try {
          const response = await fetch("/api/members/profile", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Auth check error:", error);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsAuthenticated(false);
      }

      setAuthChecked(true);
    };

    checkAuthAndRedirect();
  }, []);

  useEffect(() => {
    // Only handle redirects when user is authenticated
    if (typeof window !== "undefined" && authChecked && isAuthenticated) {
      const savedUrl = localStorage.getItem("savedNavigationUrl");
      const currentPath = window.location.pathname;

      // Only redirect if we have a saved URL and we're not already on it
      if (savedUrl && savedUrl !== currentPath && savedUrl.startsWith("/")) {
        // Clear the saved URL immediately to prevent infinite redirects
        localStorage.removeItem("savedNavigationUrl");

        // Only redirect to protected routes
        const isProtectedRoute =
          !savedUrl.startsWith("/login") &&
          !savedUrl.startsWith("/signup") &&
          savedUrl !== "/";

        if (isProtectedRoute) {
          // Small delay to ensure auth state is fully loaded
          setTimeout(() => {
            window.location.href = savedUrl;
          }, 100);
        }
      }
    }
  }, [isAuthenticated, authChecked]);
};
