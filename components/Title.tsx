import { Separator } from "./ui/separator";

interface TitleProps {
  title: string;
  subtitle?: string;
  filterComponent?: React.ReactNode;
}

export default function Title(props: TitleProps) {
  return (
    <div className="">
      {/* Faixa listrada */}

      <div
        style={{
          background: `repeating-linear-gradient(
                -45deg,
                #fafafa,
                #fafafa 10px,
                #f0f0f0 10px,
                #f0f0f0 20px
                )`,
        }}
        className="px-4 py-1  flex justify-between items-center"
      >
        <h2 className="relative rounded px-[0.3rem] py-[0.2rem] font-mono font-semibold text-sm">
          {props.title}
        </h2>
        <div className="flex items-center gap-4">
          <h2 className="relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {props.subtitle}
          </h2>
          {props.filterComponent}
        </div>
      </div>
      <Separator />
    </div>
  );
}
