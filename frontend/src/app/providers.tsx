"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { AuthProvider } from "@/auth/AuthContext";

// Single client-side provider tree. HeroUIProvider supplies the design-system
// context (theme, overlays, etc.); wiring Next's router lets HeroUI's `Link`-based
// components navigate. ToastProvider renders transient notifications (e.g. a failed
// vote). AuthProvider stays nested so token state is shared app-wide.
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider placement="bottom-center" toastOffset={12} />
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
