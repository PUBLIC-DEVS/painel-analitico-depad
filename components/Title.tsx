import { Separator } from "./ui/separator";

interface TitleProps {
  title: string;
  subtitle?: string;
  filterComponent?: React.ReactNode;
}

export default function Title(props: TitleProps) {
  return (
    <div className="relative mb-6">
      <div className="px-6 py-4 flex justify-between items-center bg-background/40 backdrop-blur-sm border-b">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="text-sm text-muted-foreground">
              {props.subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {props.filterComponent}
        </div>
      </div>
    </div>
  );
}
