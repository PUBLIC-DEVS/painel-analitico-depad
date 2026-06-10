import { Skeleton } from "@/components/ui/skeleton";

/** Exibido automaticamente pelo Next.js enquanto a rota do dashboard carrega. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
      <Skeleton className="h-[360px] rounded-xl" />
    </div>
  );
}
