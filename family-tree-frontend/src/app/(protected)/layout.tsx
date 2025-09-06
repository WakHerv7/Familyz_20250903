"use client";

import { ReactNode } from "react";
import { useAuthGuard } from "@/hooks/api";
import { ClipLoader } from "react-spinners";
import Navigation from "@/components/Navigation";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { profile, isAuthenticated, hasProfile } = useAuthGuard();

  // Show loading while checking authentication
  if (isAuthenticated === null || (isAuthenticated && !hasProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ClipLoader size={50} color="#10b981" />
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or profile is missing, the useAuthGuard hook will handle redirection
  if (!isAuthenticated || !hasProfile) {
    return null; // Will redirect via useAuthGuard hook
  }

  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
