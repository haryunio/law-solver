import type { CSSProperties, ReactNode } from "react";

interface SubjectCardCoverProps {
  title: string;
  coverStyle: CSSProperties;
  badge?: ReactNode;
  topRight?: ReactNode;
  titleLines?: 1 | 2;
}

export function SubjectCardCover({
  title,
  coverStyle,
  badge,
  topRight,
  titleLines = 1,
}: SubjectCardCoverProps) {
  return (
    <div className="relative h-[104px] overflow-hidden" style={coverStyle}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.30),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.20),transparent_28%)]" />
      <div className="absolute inset-0 hidden bg-black/30 dark:block" />
      <div className="absolute left-0 top-0 h-full w-4 bg-black/10" />
      <div className="absolute left-4 top-0 h-full w-px bg-white/25" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/36 via-black/14 to-transparent" />
      {topRight ? <div className="absolute right-3 top-3">{topRight}</div> : null}
      <div className="absolute bottom-4 left-6 right-5 flex items-end justify-between gap-3">
        <h2
          title={title}
          className={[
            "min-w-0 font-semibold text-white drop-shadow-sm",
            titleLines === 2
              ? "line-clamp-2 text-lg leading-6"
              : "truncate text-2xl",
          ].join(" ")}
        >
          {title}
        </h2>
        {badge}
      </div>
    </div>
  );
}
