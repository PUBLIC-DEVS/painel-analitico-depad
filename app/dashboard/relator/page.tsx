"use client";

/**
 * Relator — chat do painel-analitico-depad.
 *
 * Reescrita focada em três coisas, nessa ordem:
 *   1. layout estável  — composer grudado embaixo, a lista rola sozinha pro fim
 *                        e nada "pula" quando chega mensagem nova.
 *   2. responsividade   — funciona de ~320px até wide, respeita o teclado do
 *                        mobile (safe-area) e o overscroll não vaza pra página.
 *   3. manutenção       — tipos no topo, dados estáticos isolados, dois hooks
 *                        pequenos e subcomponentes burros. Cada peça faz uma
 *                        coisa só, dá pra ler de cima a baixo.
 *
 * Mantém o design system de vocês (tokens shadcn: background, card, primary,
 * muted, accent…). Nenhuma cor/fonte nova de propósito — "melhor" aqui é
 * coerência e estabilidade, não enfeite.
 *
 * ⚠️ Pré-requisito de layout: TODO ancestral até o viewport precisa ter altura.
 * O padrão que funciona é cravar a altura uma vez no shell do dashboard e deixar
 * herdar via flex:
 *
 *   <div className="flex h-dvh flex-col overflow-hidden">     // crava o viewport
 *     <header className="shrink-0">…</header>
 *     <nav className="shrink-0">…</nav>
 *     <main className="min-h-0 flex-1 overflow-hidden">       // min-h-0 é essencial
 *       <Relator />                                           // aqui o h-full resolve
 *     </main>
 *   </div>
 *
 * Sem isso, `h-full` vira `height:100%` de um pai sem altura (= auto), o `flex-1`
 * cresce com o conteúdo em vez de rolar, e o composer é empurrado pra fora da tela.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  ArrowUp,
  Plus,
  X,
  Sparkles,
  FileText,
  BarChart3,
  Building2,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* ──────────────────────────────── tipos ──────────────────────────────── */

type Autor = "user" | "bot";

interface Mensagem {
  id: string;
  autor: Autor;
  texto: string;
}

interface Ferramenta {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

/* ───────────────────────────── dados estáticos ───────────────────────── */

const FERRAMENTAS: readonly Ferramenta[] = [
  { id: "relatorio",   label: "Gerar relatório",       desc: "Monta um relatório ABNT a partir dos dados.", icon: FileText },
  { id: "repasses",    label: "Analisar repasses",     desc: "Cruza emendas e pagamentos por período.",     icon: BarChart3 },
  { id: "comunidades", label: "Consultar comunidades", desc: "Busca CTs por status, UF ou CNPJ.",           icon: Building2 },
  { id: "planilha",    label: "Exportar planilha",     desc: "Gera um .xlsx formatado pra download.",        icon: Table2 },
];

const SUGESTOES: readonly string[] = [
  "Resuma os repasses do último trimestre",
  "Comunidades com cadastro ativo por UF",
  "Contratos vencendo nos próximos 30 dias",
];

const RESPOSTA_EXEMPLO =
  "Entendido. (resposta de exemplo do Relator — pluga a tua API aqui.)";

const ALTURA_MAX_TEXTAREA = 200; // px; depois disso o textarea rola por dentro
const DELAY_RESPOSTA = 650;      // ms; só simula a latência do back

const novoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/* ──────────────────────────────── hooks ──────────────────────────────── */

/** Cresce/encolhe o textarea conforme o conteúdo, até um teto. */
function useAutosize(
  ref: RefObject<HTMLTextAreaElement | null>,
  valor: string,
  max = ALTURA_MAX_TEXTAREA,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [ref, valor, max]);
}

/** Rola pro fim da lista sempre que `dep` muda (mensagem nova ou "digitando"). */
function useScrollParaFim(dep: unknown) {
  const fimRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dep]);
  return fimRef;
}

/* ───────────────────────────── subcomponentes ────────────────────────── */

function AvatarBot() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
      <Sparkles className="h-4 w-4 text-primary-foreground" />
    </div>
  );
}

function EstadoInicial({ onSugestao }: { onSugestao: (s: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        Como posso ajudar, João?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pergunte sobre comunidades, contratos e repasses do DEPAD.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGESTOES.map((s) => (
          <Button
            key={s}
            variant="outline"
            size="sm"
            className="h-auto rounded-full px-3.5 py-1.5 text-xs font-normal text-muted-foreground"
            onClick={() => onSugestao(s)}
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}

function BolhaMensagem({ mensagem }: { mensagem: Mensagem }) {
  const ehUser = mensagem.autor === "user";
  return (
    <div
      className={cn(
        "flex animate-in fade-in slide-in-from-bottom-1 duration-300",
        ehUser ? "justify-end" : "gap-3",
      )}
    >
      {!ehUser && <AvatarBot />}
      {ehUser ? (
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-sm sm:max-w-[80%]">
          {mensagem.texto}
        </div>
      ) : (
        <div className="flex-1 whitespace-pre-wrap pt-0.5 text-sm leading-relaxed text-foreground">
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}

function Digitando() {
  return (
    <div className="flex gap-3" aria-label="Relator está digitando">
      <AvatarBot />
      <div className="flex items-center gap-1 pt-2 text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-300ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
      </div>
    </div>
  );
}

function ChipFerramenta({
  ferramenta,
  onRemover,
}: {
  ferramenta: Ferramenta;
  onRemover: () => void;
}) {
  const Icone = ferramenta.icon;
  return (
    <Badge variant="secondary" className="gap-1.5 pr-1">
      <Icone className="h-3 w-3" />
      {ferramenta.label}
      <button
        type="button"
        onClick={onRemover}
        className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-background/60"
        aria-label={`Remover ferramenta ${ferramenta.label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

function SeletorFerramentas({
  ativa,
  onSelecionar,
}: {
  ativa: string | null;
  onSelecionar: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Ferramentas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Ferramentas do dashboard
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FERRAMENTAS.map((f) => {
          const Icone = f.icon;
          return (
            <DropdownMenuItem
              key={f.id}
              className={cn("items-start gap-2 text-sm", ativa === f.id && "bg-accent")}
              onSelect={() => onSelecionar(f.id)}
            >
              <Icone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{f.label}</span>
                <span className="text-xs text-muted-foreground">{f.desc}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Composer({
  input,
  onInput,
  onEnviar,
  pensando,
  ferramentaAtiva,
  onSelecionarFerramenta,
  onRemoverFerramenta,
  taRef,
}: {
  input: string;
  onInput: (v: string) => void;
  onEnviar: () => void;
  pensando: boolean;
  ferramentaAtiva: Ferramenta | undefined;
  onSelecionarFerramenta: (id: string) => void;
  onRemoverFerramenta: () => void;
  taRef: RefObject<HTMLTextAreaElement | null>;
}) {
  useAutosize(taRef, input);

  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envia; Shift+Enter quebra linha.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnviar();
    }
  };

  const podeEnviar = input.trim().length > 0 && !pensando;

  return (
    <div className="shrink-0">
      {/* fade pra última mensagem sumir suavemente atrás do composer */}
      <div className="pointer-events-none h-6 bg-gradient-to-t from-background to-transparent" />

      <div className="mx-auto w-full max-w-3xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="rounded-2xl border bg-card shadow-sm transition-all focus-within:border-ring/60 focus-within:shadow-md">
          {ferramentaAtiva && (
            <div className="px-3 pt-3">
              <ChipFerramenta ferramenta={ferramentaAtiva} onRemover={onRemoverFerramenta} />
            </div>
          )}

          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={aoTeclar}
            rows={1}
            placeholder="Pergunte ao Relator…"
            aria-label="Mensagem"
            className="max-h-[200px] min-h-0 resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          />

          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label="Anexar arquivo"
            >
              <Plus className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5">
              <SeletorFerramentas
                ativa={ferramentaAtiva?.id ?? null}
                onSelecionar={onSelecionarFerramenta}
              />
              <Button
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!podeEnviar}
                onClick={onEnviar}
                aria-label="Enviar mensagem"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          O Relator é uma inteligência artificial e pode cometer erros. Confira
          informações importantes antes de tomar decisões.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────── componente principal ───────────────────── */

export default function Relator() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [ferramenta, setFerramenta] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<number | null>(null);

  const fimRef = useScrollParaFim(`${mensagens.length}:${pensando}`);

  const ativa = FERRAMENTAS.find((f) => f.id === ferramenta);
  const vazio = mensagens.length === 0;

  // limpa o timer da resposta simulada se o componente desmontar no meio
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const focarTextarea = () => requestAnimationFrame(() => taRef.current?.focus());

  const enviar = () => {
    const texto = input.trim();
    if (!texto || pensando) return;

    const prefixo = ativa ? `[${ativa.label}] ` : "";
    setMensagens((m) => [...m, { id: novoId(), autor: "user", texto: prefixo + texto }]);
    setInput("");
    setFerramenta(null);
    setPensando(true);

    // 👉 troque este setTimeout pela chamada real à sua API
    timerRef.current = window.setTimeout(() => {
      setMensagens((m) => [...m, { id: novoId(), autor: "bot", texto: RESPOSTA_EXEMPLO }]);
      setPensando(false);
    }, DELAY_RESPOSTA);
  };

  const usarSugestao = (s: string) => {
    setInput(s);
    focarTextarea();
  };

  const selecionarFerramenta = (id: string) => {
    setFerramenta(id);
    focarTextarea();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* área rolável */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        role="log"
        aria-live="polite"
        aria-busy={pensando}
      >
        {vazio ? (
          <EstadoInicial onSugestao={usarSugestao} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            {mensagens.map((m) => (
              <BolhaMensagem key={m.id} mensagem={m} />
            ))}
            {pensando && <Digitando />}
            <div ref={fimRef} />
          </div>
        )}
      </div>

      <Composer
        input={input}
        onInput={setInput}
        onEnviar={enviar}
        pensando={pensando}
        ferramentaAtiva={ativa}
        onSelecionarFerramenta={selecionarFerramenta}
        onRemoverFerramenta={() => setFerramenta(null)}
        taRef={taRef}
      />
    </div>
  );
}