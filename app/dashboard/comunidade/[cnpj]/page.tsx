import { notFound } from "next/navigation";
import { auth } from "@/auth";
import type { Comunidade } from "@/app/api/dashboard/contratos/_types";
import { fetchGeralRows } from "@/app/api/dashboard/contratos/_fetchers";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Promise<{…}> cobre Next.js 15; o Promise.resolve() no corpo cobre Next.js 14
interface Props {
  params: Promise<{ cnpj: string }>;
}

export async function generateStaticParams() {
  return []; // SSR puro
}

async function getComunidade(cnpj: string): Promise<Comunidade | null> {
  const session = await auth();
  const token = session?.user?.accessToken;
  if (!token) return null;

  const rows = await fetchGeralRows(token);
  return rows.find((r) => r.cnpj.replace(/\D/g, "") === cnpj) ?? null;
}

export default async function ComunidadePage({ params }: Props) {
  // Promise.resolve() garante compatibilidade com Next.js 14 (síncrono) e 15 (assíncrono)
  const resolved = await Promise.resolve(params);
  const cnpj = (resolved?.cnpj ?? "").replace(/\D/g, "");
  if (!cnpj) notFound();

  const c = await getComunidade(cnpj);
  if (!c) notFound();

  const statusColor =
    c.status_ct?.toLowerCase().includes("ativo") ? "default" : "secondary";

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold leading-tight">
          {c.nome_fantasia || c.razao_social}
        </h1>
        {c.nome_fantasia && (
          <p className="text-sm text-muted-foreground mt-0.5">{c.razao_social}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={statusColor}>{c.status_ct || "Sem status"}</Badge>
          <span className="text-xs text-muted-foreground font-mono">
            CNPJ: {c.cnpj}
          </span>
        </div>
      </div>

      <Separator />

      {/* Localização */}
      <Section title="Localização">
        <Row label="Cidade / UF"    value={`${c.cidade} / ${c.uf}`} />
        <Row label="Endereço"       value={c.endereco} />
        <Row label="Processo-mãe"   value={c.processo_mae} />
      </Section>

      {/* Contrato */}
      <Section title="Contrato">
        <Row label="Contrato"       value={c.contrato} />
        <Row label="Contrato / Ano" value={c.contrato_ano} />
        <Row label="Ano / Edital"   value={String(c.ano)} />
        <Row label="Início"         value={c.data_inicial_ct} />
        <Row label="Vencimento"     value={c.data_vencimento_ct} />
        <Row label="Assinado"       value={c.assinado} />
        <Row label="SEI assinatura" value={c.sei_assinatura} />
      </Section>

      {/* Vagas */}
      <Section title="Vagas contratadas">
        <Row label="Total"          value={String(c.vagas_contratadas ?? "—")} />
        <Row label="Masculino"      value={String(c.adulto_masc       ?? "—")} />
        <Row label="Feminino"       value={String(c.adulto_feminino   ?? "—")} />
        <Row label="Mães c/ filhos" value={String(c.maes              ?? "—")} />
        {c.diminuicao_vagas && (
          <Row label="Diminuição"   value={c.diminuicao_vagas} />
        )}
      </Section>

      {/* Recursos */}
      <Section title="Recursos">
        <Row label="Recurso anual"  value={c.recurso_anual}  />
        <Row label="Recurso mensal" value={c.recurso_mensal} />
      </Section>

      {/* Contato */}
      <Section title="Contato">
        <Row label="Telefone" value={c.telefone} />
        <Row label="E-mail"   value={c.email}    />
      </Section>

    </main>
  );
}

// ─── Helpers de layout ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h2>
      <dl className="divide-y divide-border rounded-lg border">
        {children}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline gap-4 px-4 py-2.5 text-sm">
      <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1 font-medium">{value || "—"}</dd>
    </div>
  );
}