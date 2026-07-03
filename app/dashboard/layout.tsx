import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { config } from "@/config";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Guard server-side: sem sessão, volta pro login (sem flash, sem useEffect).
  // Modo local (dev-preview ou USE_LOCAL_FILES) dispensa login pra trabalhar
  // sem credenciais reais do Azure.
  const session = await auth();
  const modoLocal = config.dashboard.devPreview || config.dashboard.useLocalFiles;
  if (!session && !modoLocal) redirect("/");

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {/* Shell que crava a altura do viewport. É daqui que o h-full das páginas
          herda. h-dvh não depende de html/body terem altura. */}
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        {/* Navbar no topo. O min-height:auto padrão já segura a altura dela;
            se um dia aparecer espremida, põe `shrink-0` na raiz da Navbar. */}
        <Navbar />

        {/* Ocupa o resto da tela. min-h-0 libera o encolhimento (sem ele o main
            se recusa a ficar menor que o conteúdo e empurra); overflow-hidden
            porque quem rola por dentro são as páginas, não o main. */}
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </ThemeProvider>
  );
}