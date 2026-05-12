"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { DASHBOARD_DEV_PREVIEW } from "@/lib/dashboard-dev-preview";

const devSession: Session = {
  user: {
    name: "Validação local",
    email: "dev-preview@local",
    image: "",
    accessToken: "dev-preview-token",
  },
  expires: "2099-01-01T00:00:00.000Z",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      session={DASHBOARD_DEV_PREVIEW ? devSession : undefined}
      refetchOnWindowFocus={!DASHBOARD_DEV_PREVIEW}
    >
      {children}
    </SessionProvider>
  );
}
