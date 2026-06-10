"use client";

import { SessionProvider } from "next-auth/react";

/** Disponibiliza a sessão (useSession, signIn, signOut) para os componentes client. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
