interface TitleProps {
  title: string;
  subtitle?: string;
  filterComponent?: React.ReactNode;
}

export default function Title(props: TitleProps) {
  return (
    <div className="relative mb-6 border-b border-border/40 bg-gradient-to-r from-background via-background to-primary/[0.03]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="max-w-3xl text-sm text-muted-foreground/80">
              {props.subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {props.filterComponent}
        </div>
      </div>
      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
