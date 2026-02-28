"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CapabilityProvider } from "@/components/capabilities/CapabilityProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CapabilityProvider>{children}</CapabilityProvider>
    </AuthProvider>
  );
}
