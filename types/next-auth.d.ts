import type { DefaultSession } from "next-auth";
import "next-auth/jwt";

// Estende os tipos do next-auth com o accessToken do Graph que guardamos no JWT
// e expomos na sessão (ver callbacks em auth.ts).
declare module "next-auth" {
  interface Session {
    user: {
      accessToken?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
