import RepassesView from "@/components/dashboard-repasses/repasses-view";

export default function RepassesPage() {
  return (
    <section className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Repasses</h1>
          <p className="text-sm text-muted-foreground">
            Emendas parlamentares (TransfereGov) — indicações, situação e demanda por técnico.
          </p>
        </div>
        <RepassesView />
      </div>
    </section>
  );
}
