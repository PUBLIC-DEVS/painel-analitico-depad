import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getComunidadesUnificadas } from "@/lib/dashboard-data";

const soDigitos = (s: string) => s.replace(/\D/g, "");

const CORES_TIPO: Record<string, string> = {
  Contratada: "border-transparent bg-primary/15 text-primary",
  Repasse: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Ambos: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q = "" } = await searchParams;
  return { title: `Busca: ${q} — DEPAD` };
}

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const termo = q.trim();
  if (termo.length < 2) redirect("/dashboard");

  const todas = await getComunidadesUnificadas();
  const qLower = termo.toLowerCase();
  const qDigitos = soDigitos(termo);

  // Exato: CNPJ idêntico (com/sem formatação) ou nome idêntico. Um só → vai direto.
  const exatos = todas.filter(
    (c) => (qDigitos.length >= 11 && soDigitos(c.cnpj) === qDigitos) || c.nome.trim().toLowerCase() === qLower,
  );
  if (exatos.length === 1) redirect(`/dashboard/comunidade/${soDigitos(exatos[0].cnpj)}`);

  // Parecido: nome contém o termo (ou CNPJ contém os dígitos).
  const resultados = todas
    .filter((c) => c.nome.toLowerCase().includes(qLower) || (qDigitos.length >= 3 && soDigitos(c.cnpj).includes(qDigitos)))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <section className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Resultados para “{termo}”</h1>
          <p className="text-sm text-muted-foreground">
            {resultados.length} comunidade{resultados.length !== 1 ? "s" : ""} encontrada
            {resultados.length !== 1 ? "s" : ""}
          </p>
        </div>

        {resultados.length === 0 ? (
          <Card className="flex h-40 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Nenhuma comunidade parecida com “{termo}”.
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {resultados.map((c) => (
              <Link
                key={c.cnpj}
                href={`/dashboard/comunidade/${soDigitos(c.cnpj)}`}
                className="group flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 text-sm font-medium">{c.nome || "—"}</span>
                    <Badge className={CORES_TIPO[c.tipo]}>{c.tipo}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {[c.cidade, c.uf].filter(Boolean).join(" — ") || "Sem localidade"} · CNPJ {c.cnpj || "—"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
