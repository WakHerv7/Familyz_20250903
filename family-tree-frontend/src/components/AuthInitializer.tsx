"use client";

import { useNavigationRedirect } from "@/hooks/useNavigationPersistence";

export function AuthInitializer() {
  // Handle navigation persistence redirects (now state-free)
  useNavigationRedirect();

  // Auth initialization is now handled directly in the useAuthGuard hook
  // This component now only handles navigation persistence
  return null;
}
