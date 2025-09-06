"use client";

import { useAuthGuard } from "@/hooks/api";
import { ClipLoader } from "react-spinners";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { profile, isAuthenticated, hasProfile } = useAuthGuard();

  // Show loading while checking authentication
  if (isAuthenticated === null || (isAuthenticated && !hasProfile)) {
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

  // If not authenticated or profile is missing, the useAuthGuard hook will handle redirection
  if (!isAuthenticated || !hasProfile) {
    return null; // Will redirect via useAuthGuard hook
  }

  return <>{children}</>;
}
