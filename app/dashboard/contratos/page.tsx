import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContratosView from "@/components/dashboard-contratos/contratos-view";
import AbaPagamentos from "@/components/dashboard-contratos/aba-pagamentos";

export default function ContratosPage() {
  return (
    <section className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Comunidades terapêuticas contratadas e a execução financeira dos contratos.
          </p>
        </div>

        <Tabs defaultValue="comunidades">
          <TabsList>
            <TabsTrigger value="comunidades">Comunidades</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>
          <TabsContent value="comunidades">
            <ContratosView />
          </TabsContent>
          <TabsContent value="pagamentos">
            <AbaPagamentos />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
