import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Banknote, Landmark, FileStack, MapPin, Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getComunidadePorCnpj } from "@/lib/dashboard-data";
import { fBRL } from "@/lib/formatters";

const CORES_TIPO: Record<string, string> = {
  Contratada: "border-transparent bg-primary/15 text-primary",
  Repasse: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Ambos: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export async function generateMetadata({ params }: { params: Promise<{ cnpj: string }> }): Promise<Metadata> {
  const { cnpj } = await params;
  const d = await getComunidadePorCnpj(cnpj);
  return { title: d ? `${d.unificada.nome} — DEPAD` : "Comunidade não encontrada" };
}

function Linha({ icone: Icone, valor }: { icone: typeof Mail; valor: string }) {
  if (!valor) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icone className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{valor}</span>
    </div>
  );
}

export default async function ComunidadePage({ params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj } = await params;
  const detalhe = await getComunidadePorCnpj(cnpj);
  if (!detalhe) notFound();

  const { unificada: u, contratos, ponto } = detalhe;
  // dados de contato vêm do contrato cru mais recente, se existir.
  const contato = [...contratos].sort((a, b) => (b.ano || 0) - (a.ano || 0))[0];

  return (
    <section className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-3">
        <Button asChild variant="ghost" size="sm" className="w-fit gap-1.5 text-muted-foreground">
          <Link href="/dashboard/base">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a base
          </Link>
        </Button>

        {/* Cabeçalho */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{u.nome || "Comunidade"}</h1>
            <Badge className={CORES_TIPO[u.tipo]}>{u.tipo}</Badge>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <Linha icone={MapPin} valor={[contato?.endereco, u.cidade, u.uf].filter(Boolean).join(", ")} />
            <Linha icone={Phone} valor={contato?.telefone ?? ""} />
            <Linha icone={Mail} valor={contato?.email ?? ""} />
            <span className="text-xs">CNPJ {u.cnpj || "—"}</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard icone={BedDouble} rotulo="Vagas contratadas" valor={u.vagas_contratadas || 0} />
          <KpiCard icone={Banknote} rotulo="Recurso anual" valor={u.recurso_anual_contrato ? fBRL(u.recurso_anual_contrato) : "—"} />
          <KpiCard icone={Landmark} rotulo="Repasse (emendas)" valor={u.valor_repasse_total ? fBRL(u.valor_repasse_total) : "—"} />
          <KpiCard icone={FileStack} rotulo="Qtd emendas" valor={u.qtd_emendas || 0} />
        </div>

        {/* Composição de vagas */}
        {u.vagas_contratadas > 0 && (
          <Card className="gap-0 p-4">
            <div className="mb-2 text-sm font-medium">Composição das vagas</div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>Masculinas: <strong className="tabular-nums">{u.adulto_masc}</strong></span>
              <span>Femininas: <strong className="tabular-nums">{u.adulto_feminino}</strong></span>
              <span>Mães: <strong className="tabular-nums">{u.maes}</strong></span>
            </div>
          </Card>
        )}

        {/* Contratos */}
        {contratos.length > 0 && (
          <Card className="min-w-0 p-0">
            <div className="border-b px-4 py-3 text-sm font-medium">
              Contratos ({contratos.length})
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Contrato/Ano", "Vagas", "Recurso/ano", "Situação", "Início", "Vencimento"].map((h) => (
                      <TableHead key={h} className="px-3">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((c, i) => (
                    <TableRow key={`${c.contrato_ano}-${i}`}>
                      <TableCell className="px-3 font-medium">{c.contrato_ano}</TableCell>
                      <TableCell className="px-3 tabular-nums">{c.vagas_contratadas || "—"}</TableCell>
                      <TableCell className="px-3 tabular-nums">{c.recurso_anual || "—"}</TableCell>
                      <TableCell className="px-3">
                        {c.status_ct ? <Badge variant="secondary">{c.status_ct}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="px-3">{c.data_inicial_ct || "—"}</TableCell>
                      <TableCell className="px-3">{c.data_vencimento_ct || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Emendas */}
        {u.tem_repasse && (
          <Card className="gap-0 p-4">
            <div className="mb-2 text-sm font-medium">Emendas parlamentares</div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Modalidades</span>
                <div>{u.modalidades || "—"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Parlamentares</span>
                <div>{u.parlamentares || "—"}</div>
              </div>
            </div>
          </Card>
        )}

        {ponto && (
          <p className="text-xs text-muted-foreground">
            Geolocalização: {ponto.lat.toFixed(5)}, {ponto.lng.toFixed(5)}
          </p>
        )}
      </div>
    </section>
  );
}
