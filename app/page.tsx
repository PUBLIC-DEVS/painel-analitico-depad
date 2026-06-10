"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") return null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Apresentação */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">DEPAD</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Painel Analítico</h1>
            </div>
          </div>

          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Acesso corporativo ao conjunto de contratos, mapa, repasses e indicadores do painel.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Visão consolidada dos contratos",
              "Distribuição regional por UF",
              "Base de dados das comunidades",
            ].map((item) => (
              <div key={item} className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Login */}
        <section className="flex lg:justify-end">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl">Entrar</CardTitle>
              <CardDescription>Use sua conta Microsoft autorizada para continuar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full gap-3"
                onClick={() => signIn("microsoft-entra-id", { redirectTo: "/dashboard" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
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
