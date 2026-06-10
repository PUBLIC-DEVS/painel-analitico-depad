import Calendario from "@/components/calendario";

export default function CalendarioPage() {
  return (
    <section className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Meu calendário de eventos</h1>
          <p className="text-sm text-muted-foreground">
            Reuniões e compromissos do seu calendário do Teams/Outlook.
          </p>
        </div>
        <Calendario />
      </div>
    </section>
  );
}
