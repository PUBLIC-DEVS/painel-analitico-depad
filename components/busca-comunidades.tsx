"use client";

/**
 * Busca de comunidade na navbar, com autocomplete por nome ou CNPJ.
 *
 * Dois caminhos:
 *   • clicar numa recomendação → vai direto pra comunidade (escolha exata);
 *   • Enter → vai pra /dashboard/busca, que resolve: nome ou CNPJ idêntico
 *     (com/sem formatação) → comunidade; parecido → lista de resultados.
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Sugestao {
  cnpj: string;
  nome: string;
  uf: string;
  cidade: string;
  tipo: string;
}

export function BuscaComunidades() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  // busca com debounce; aborta a requisição anterior
  useEffect(() => {
    if (q.trim().length < 2) {
      setSugestoes([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/comunidades/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: Sugestao[]) => {
          setSugestoes(d);
          setAberto(true);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // fecha ao clicar fora
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (!caixaRef.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  // Recomendação clicada = escolha exata → vai direto.
  const abrir = (cnpj: string) => {
    setAberto(false);
    setQ("");
    router.push(`/dashboard/comunidade/${cnpj}`);
  };

  // Enter → página de busca decide entre ir direto (exato) ou listar parecidos.
  const aoSubmeter = (e: FormEvent) => {
    e.preventDefault();
    const termo = q.trim();
    if (termo.length < 2) return;
    setAberto(false);
    router.push(`/dashboard/busca?q=${encodeURIComponent(termo)}`);
  };

  return (
    <div ref={caixaRef} className="relative w-full">
      <form onSubmit={aoSubmeter}>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="Buscar comunidade por nome ou CNPJ…"
          className="h-8 border-border/60 bg-muted/50 pl-8 text-sm focus-visible:ring-1"
        />
      </form>

      {aberto && sugestoes.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
          {sugestoes.map((s) => (
            <button
              key={s.cnpj}
              type="button"
              onClick={() => abrir(s.cnpj)}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-accent"
            >
              <span className="line-clamp-1 text-sm font-medium leading-tight">{s.nome || "—"}</span>
              <span className="text-xs text-muted-foreground">
                {[s.cidade, s.uf].filter(Boolean).join(" — ") || "Sem localidade"} · {s.tipo}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
