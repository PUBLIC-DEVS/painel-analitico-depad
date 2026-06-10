/**
 * Fonte única de verdade para as variáveis de ambiente.
 *
 * Todo o `.env` passa por aqui — o resto do código importa deste arquivo em vez
 * de ler `process.env` espalhado. Se uma variável faltar, o erro aparece num
 * lugar só. É código de servidor: não importe num componente client (os
 * segredos não vão pro bundle do navegador).
 */

export const config = {
  auth: {
    secret: process.env.AUTH_SECRET,
    url: process.env.AUTH_URL,
    entraId: {
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
    },
  },

  sharepoint: {
    hostname: process.env.SHAREPOINT_HOSTNAME,
    sitePath: process.env.SHAREPOINT_SITE_PATH,
    tenantId: process.env.SHAREPOINT_TENANT_ID,
    clientId: process.env.SHAREPOINT_CLIENT_ID,
  },

  database: {
    url: process.env.DATABASE_URL,
    urlUnpooled: process.env.DATABASE_URL_UNPOOLED,
    pg: {
      host: process.env.PGHOST,
      hostUnpooled: process.env.PGHOST_UNPOOLED,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    },
    postgres: {
      url: process.env.POSTGRES_URL,
      urlNonPooling: process.env.POSTGRES_URL_NON_POOLING,
      urlNoSsl: process.env.POSTGRES_URL_NO_SSL,
      prismaUrl: process.env.POSTGRES_PRISMA_URL,
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
    },
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  dashboard: {
    /** Em dev, com a flag ligada, o painel renderiza dados fake sem exigir login. */
    devPreview:
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_DASHBOARD_DEV_PREVIEW === "1",
    useLocalFiles: process.env.USE_LOCAL_FILES === "1",
    dadosGeral: process.env.DADOS_GERAL,
  },
} as const;
