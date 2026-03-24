const dotenv = (key: string): string => process.env[key] || "";

export const GRAPH_API = {
  endpoints: {
    geral: dotenv("DASHBOARD_GERAL"),
    mops: dotenv("DASHBOARD_MOPS"),
    contratos: dotenv("DASHBOARD_CONTRATOS"),
    
    // Bônus: Base URL caso precise montar rotas dinâmicas
    baseUrl: "https://graph.microsoft.com/v1.0",
  },

  // Escopos necessários para essas chamadas
  scopes: [
    "https://graph.microsoft.com/.default",
    "Group.Read.All",
    "Sites.Read.All"
  ]
};

