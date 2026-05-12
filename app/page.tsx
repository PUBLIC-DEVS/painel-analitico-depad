'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { GalleryVerticalEndIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-60" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-6">
        <section className="flex flex-col justify-center gap-6 pb-8 lg:pb-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-card shadow-sm">
              <GalleryVerticalEndIcon className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Depad
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Painel Analítico
              </h1>
            </div>
          </div>

          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Acesso corporativo ao conjunto de contratos, mapa, pagamentos e
            indicadores do painel.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Visão consolidada dos contratos",
              "Gráficos e detalhamento por região",
              "Busca e navegação por CNPJ",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center lg:justify-end">
          <Card className="w-full max-w-md border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Entrar</CardTitle>
              <CardDescription>
                Use sua conta Microsoft autorizada para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full gap-3"
                variant="outline"
                onClick={() => signIn("microsoft-entra-id", { redirectTo: "/dashboard" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Continuar com Microsoft
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
