"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/providers/AuthProvider";
import Navigation from "@/components/Navigation";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <Navigation />
      {children}
    </ProtectedRoute>
  );
}
