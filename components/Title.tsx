interface TitleProps {
  title: string;
  subtitle?: string;
  filterComponent?: React.ReactNode;
}

export default function Title(props: TitleProps) {
  return (
    <div className="relative mb-6 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {props.subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {props.filterComponent}
        </div>
      </div>
    </div>
  );
}
