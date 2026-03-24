"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UFEntry {
  uf: string;
  total: number;
}

// ---------------------------------------------------------------------------
// Fetch — substitua o setTimeout por fetch real
// ---------------------------------------------------------------------------
async function fetchData(): Promise<UFEntry[]> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          { uf: "RS", total: 84 }, { uf: "MG", total: 84 },
          { uf: "SP", total: 57 }, { uf: "PR", total: 53 },
          { uf: "SC", total: 48 }, { uf: "CE", total: 36 },
          { uf: "AL", total: 30 }, { uf: "RJ", total: 29 },
          { uf: "GO", total: 25 }, { uf: "PI", total: 22 },
          { uf: "MA", total: 18 }, { uf: "RN", total: 17 },
          { uf: "BA", total: 13 }, { uf: "PE", total: 12 },
          { uf: "MS", total: 12 }, { uf: "DF", total: 11 },
          { uf: "PA", total: 11 }, { uf: "AM", total: 9  },
          { uf: "MT", total: 8  }, { uf: "TO", total: 7  },
          { uf: "AC", total: 6  }, { uf: "ES", total: 6  },
          { uf: "PB", total: 5  }, { uf: "SE", total: 4  },
          { uf: "RO", total: 3  }, { uf: "RR", total: 2  },
          { uf: "AP", total: 1  },
        ]),
      1800,
    ),
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function BarPorUFSkeleton() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-6 shrink-0" />
            <Skeleton
              className="h-5 rounded"
              style={{ width: `${Math.max(15, 90 - i * 7)}%` }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Chart config — fora do componente para evitar recriação
// ---------------------------------------------------------------------------
const chartConfig = {
  total: { label: "Comunidades", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BarPorUF() {
  const [data, setData] = useState<UFEntry[] | null>(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  if (!data) return <BarPorUFSkeleton />;

  return (
    <Card className="min-w-0 overflow-hidden" >
      <CardHeader>
        <CardTitle>Comunidades por UF</CardTitle>
        <CardDescription>Número de CTs registradas por estado</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[420px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 40, top: 0, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="uf"
              type="category"
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fontSize: 12 }}
            />
            <XAxis dataKey="total" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={4}
              isAnimationActive={true}
              animationDuration={350}
              animationEasing="ease-out"
              animationBegin={0}
            >
              <LabelList
                dataKey="total"
                position="right"
                offset={6}
                className="fill-foreground"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}