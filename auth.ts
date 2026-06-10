import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { config } from "@/config";

const { clientId, clientSecret, tenantId } = config.auth.entraId;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId,
      clientSecret,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      authorization: {
        // offline_access é obrigatório para receber o refresh_token.
        params: {
          scope: "openid profile email User.Read offline_access Sites.Read.All Files.Read.All Calendars.Read",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // Login inicial: guarda access + refresh token e a expiração.
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at, // Unix em segundos
        };
      }

      // Token ainda válido (1 min de margem)? Devolve sem fazer nada.
      if (Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token;
      }

      // Expirado: renova com o refresh_token.
      try {
        const res = await fetch(
          `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId!,
              client_secret: clientSecret!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          },
        );
        const refreshed = await res.json();
        if (!res.ok) throw refreshed;

        return {
          ...token,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
        };
      } catch (err) {
        console.error("[auth] Erro ao renovar token:", err);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      return session;
    },
  },

  pages: { signIn: "/" },
});
