import type { CSSProperties, ReactNode } from "react";

interface BookCoverProps {
  title: string;
  coverStyle: CSSProperties;
  accentColor: string;
  eyebrow?: ReactNode;
  topRight?: ReactNode;
  titleLines?: 2 | 3;
  children?: ReactNode;
}

export const bookLinkClassName =
  "block min-w-0 rounded-l-md rounded-r-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500";

/** A 224px book surface. The caller supplies navigation and domain-specific details. */
export function BookCover({
  title,
  coverStyle,
  accentColor,
  eyebrow,
  topRight,
  titleLines = 3,
  children,
}: BookCoverProps) {
  return (
    <div
      className="app-card app-subject-card app-subject-book relative isolate flex h-56 min-w-0 overflow-hidden rounded-l-md rounded-r-xl border transition-[border-color,box-shadow] duration-150"
      style={{ "--subject-accent": accentColor } as CSSProperties}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={coverStyle}>
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.20),transparent_60%)] dark:bg-black/20" />
        <div className="absolute inset-y-0 left-0 w-2.5 border-r border-white/25 bg-black/10 shadow-[2px_0_4px_rgba(0,0,0,0.08)]" />
        <div className="absolute left-5 right-3 top-3 h-px bg-white/30" />
      </div>
      {topRight ? <div className="absolute right-3 top-5">{topRight}</div> : null}

      <div className="app-subject-book-label relative mb-[3px] ml-3 mr-[3px] mt-14 flex min-w-0 flex-1 flex-col rounded-br-lg rounded-tl-sm px-3 pb-3 pt-3">
        {eyebrow ? <p className="shrink-0 text-[11px] leading-4 text-stone-500 dark:text-stone-400">{eyebrow}</p> : null}
        <h2
          title={title}
          className={[
            "mt-1.5 shrink-0 break-keep text-[17px] font-semibold leading-[22px] tracking-tight text-stone-900 [overflow-wrap:anywhere] dark:text-stone-100",
            titleLines === 2 ? "line-clamp-2" : "line-clamp-3",
          ].join(" ")}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
