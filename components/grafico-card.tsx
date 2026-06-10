"use client";

/**
 * Card de gráfico com botão de "baixar como PNG" no canto.
 *
 * Captura o próprio card (título + gráfico) via html-to-image e dispara o
 * download. O botão é excluído da imagem (data-export="skip"). Use no lugar de
 * <Card> quando quiser que o gráfico seja exportável.
 */

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GraficoCard({
  titulo,
  descricao,
  arquivo,
  children,
}: {
  titulo: string;
  descricao?: string;
  arquivo: string; // nome base do arquivo baixado, sem extensão
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    if (!ref.current) return;
    setExportando(true);
    try {
      const png = await toPng(ref.current, {
        pixelRatio: 2,
        // fundo sólido (o card é translúcido em alguns temas) + ignora o botão.
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        filter: (node) => !(node instanceof HTMLElement && node.dataset.export === "skip"),
      });
      const a = document.createElement("a");
      a.href = png;
      a.download = `${arquivo}.png`;
      a.click();
    } catch (err) {
      console.error("[grafico] falha ao exportar:", err);
    } finally {
      setExportando(false);
    }
  }

  return (
    <Card ref={ref} className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="grid gap-1">
            <CardTitle>{titulo}</CardTitle>
            {descricao && <CardDescription>{descricao}</CardDescription>}
          </div>
          <Button
            data-export="skip"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={exportar}
            disabled={exportando}
            aria-label="Baixar gráfico como imagem"
            title="Baixar PNG"
          >
            {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
