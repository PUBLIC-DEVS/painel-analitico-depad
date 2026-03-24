"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Comunidade {
  contrato_ano: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  processo_mae: string;
  cidade: string;
  uf: string;
  contrato: string;
  ano: number;
  endereco: string;
  telefone: string;
  email: string;
  vagas_contratadas: number | null;
  adulto_masc: number | null;
  adulto_feminino: number | null;
  maes: number | null;
  recurso_anual: string;
  recurso_mensal: string;
  status_ct: "ATIVO" | "FINALIZADO" | "RESCINDIDO" | string;
  data_inicial_ct: string;
  data_vencimento_ct: string;
  diminuicao_vagas: string;
  sei_assinatura: string;
  assinado: string;
  latitude: string;
  longitude: string;
}

// ---------------------------------------------------------------------------
// Fetch — substitua o setTimeout por fetch real
// ---------------------------------------------------------------------------
async function fetchData(): Promise<Comunidade[]> {
  return new Promise((resolve) => setTimeout(() => resolve([]), 1800));
  // Exemplo real:
  // const res = await fetch("/api/comunidades");
  // return res.json();
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ATIVO: "default",
    FINALIZADO: "secondary",
    RESCINDIDO: "destructive",
  };
  return (
    <Badge
      variant={variants[status] ?? "outline"}
      className="whitespace-nowrap"
    >
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const COLUMNS: { key: keyof Comunidade; label: string }[] = [
  { key: "contrato_ano", label: "Contrato/Ano" },
  { key: "razao_social", label: "Razão Social" },
  { key: "nome_fantasia", label: "Nome Fantasia" },
  { key: "cnpj", label: "CNPJ" },
  { key: "processo_mae", label: "Processo Mãe" },
  { key: "cidade", label: "Cidade" },
  { key: "uf", label: "UF" },
  { key: "contrato", label: "Contrato" },
  { key: "ano", label: "Ano" },
  { key: "endereco", label: "Endereço" },
  { key: "telefone", label: "Telefone" },
  { key: "email", label: "E-mail" },
  { key: "vagas_contratadas", label: "Vagas Contratadas" },
  { key: "adulto_masc", label: "Adulto Masc." },
  { key: "adulto_feminino", label: "Adulto Fem." },
  { key: "maes", label: "Mães" },
  { key: "recurso_anual", label: "Recurso/Ano" },
  { key: "recurso_mensal", label: "Recurso/Mensal" },
  { key: "status_ct", label: "Status" },
  { key: "data_inicial_ct", label: "Data Início" },
  { key: "data_vencimento_ct", label: "Data Vencimento" },
  { key: "diminuicao_vagas", label: "Dim. de Vagas" },
  { key: "sei_assinatura", label: "Nº SEI Assinatura" },
  { key: "assinado", label: "Assinado" },
  { key: "latitude", label: "Latitude" },
  { key: "longitude", label: "Longitude" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function TabelaSkeleton() {
  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-36 mt-1" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 min-w-0 overflow-hidden">
        {/* filters skeleton */}
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 flex-1 min-w-40 rounded-md" />
          <Skeleton className="h-9 w-40 shrink-0 rounded-md" />
          <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
          <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
        </div>
        {/* rows skeleton */}
        <div className="rounded-md border overflow-hidden">
          {/* header row */}
          <div className="flex gap-3 border-b bg-muted/40 px-3 py-2">
            {[120, 200, 150, 120, 80, 80].map((w, i) => (
              <Skeleton key={i} className="h-4 shrink-0" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 border-b px-3 py-2 last:border-0"
            >
              {[120, 200, 150, 120, 80, 80].map((w, j) => (
                <Skeleton
                  key={j}
                  className="h-4 shrink-0"
                  style={{ width: w }}
                />
              ))}
            </div>
          ))}
        </div>
        {/* pagination skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TabelaComunidades() {
  const [data, setData] = useState<Comunidade[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ufFilter, setUfFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  if (!data) return <TabelaSkeleton />;

  const ufs = Array.from(new Set(data.map((r) => r.uf).filter(Boolean))).sort();
  const statuses = Array.from(
    new Set(data.map((r) => r.status_ct).filter(Boolean)),
  ).sort();

  const filtered = data.filter((row) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      row.razao_social?.toLowerCase().includes(q) ||
      row.nome_fantasia?.toLowerCase().includes(q) ||
      row.cnpj?.includes(search) ||
      row.cidade?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" || row.status_ct === statusFilter;
    const matchUF = ufFilter === "all" || row.uf === ufFilter;
    return matchSearch && matchStatus && matchUF;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Comunidades Terapêuticas</CardTitle>
        <CardDescription>
          {filtered.length} comunidade{filtered.length !== 1 ? "s" : ""}{" "}
          encontrada
          {filtered.length !== 1 ? "s" : ""}
          {data.length > 0 && ` de ${data.length} no total`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 min-w-0 overflow-hidden">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, cidade…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 w-full"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={ufFilter}
            onValueChange={(v) => {
              setUfFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-24 shrink-0">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {ufs.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-24 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / pág
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full overflow-x-auto rounded-md border">
          <Table style={{ width: "max-content", minWidth: "100%" }}>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap px-3">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, idx) => (
                  <TableRow key={`${row.contrato_ano}-${idx}`}>
                    {COLUMNS.map((col) => {
                      const value = row[col.key];
                      if (col.key === "status_ct" && value) {
                        return (
                          <TableCell key={col.key} className="px-3">
                            <StatusBadge status={String(value)} />
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={col.key}
                          className="whitespace-nowrap px-3"
                        >
                          {value != null && value !== "" ? (
                            String(value)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages}
            {filtered.length > 0 &&
              ` — exibindo ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                filtered.length,
              )} de ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
