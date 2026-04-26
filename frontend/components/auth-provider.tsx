"use client";

import { useAuth } from "@/lib/use-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}
