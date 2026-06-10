import BaseUnificada from "@/components/dashboard-geral/base-unificada";

export default function BaseDeDados() {
  return (
    <section className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Base de dados</h1>
          <p className="text-sm text-muted-foreground">
            Todas as comunidades unificadas por CNPJ — contratadas, com repasse (termo de fomento) ou ambos.
          </p>
        </div>
        <BaseUnificada />
      </div>
    </section>
  );
}
