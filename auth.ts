import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          // offline_access é obrigatório para receber o refresh_token
          scope: "openid profile email User.Read offline_access Sites.Read.All Files.Read.All",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // No login inicial, salva access + refresh token e expiração
      if (account) {
        return {
          ...token,
          accessToken:  account.access_token,
          refreshToken: account.refresh_token,
          expiresAt:    account.expires_at, // Unix timestamp em segundos
        };
      }

      // Token ainda válido (com 1 min de margem)? Retorna sem fazer nada
      if (Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token;
      }

      // Token expirado — renova usando o refresh_token
      try {
        const url =
          `https://login.microsoftonline.com/` +
          `${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/oauth2/v2.0/token`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id:     process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
            client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
            grant_type:    "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });

        const refreshed = await response.json();

        if (!response.ok) throw refreshed;

        return {
          ...token,
          accessToken:  refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
          expiresAt:    Math.floor(Date.now() / 1000) + refreshed.expires_in,
        };
      } catch (err) {
        console.error("[auth] Erro ao renovar token:", err);
        // Marca o erro na sessão para tratar no frontend se precisar
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
});