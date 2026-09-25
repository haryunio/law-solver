const formatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatTimestamp(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "날짜 기록 없음";
  const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value: part }) => [type, part]));
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

export function TimestampTag({
  value,
  label,
  title,
  compactOnSmallScreens = false,
}: {
  value: string;
  label: string;
  title?: string;
  compactOnSmallScreens?: boolean;
}) {
  const formattedTimestamp = formatTimestamp(value);
  const valid = formattedTimestamp !== "날짜 기록 없음";
  const yearEnd = formattedTimestamp.indexOf(".") + 1;
  return (
    <span
      title={title ?? formattedTimestamp}
      className={`app-neutral-box app-radius-tag inline-flex h-6 max-w-full items-center rounded-md border text-[10px] leading-3 text-stone-500 dark:text-stone-400 ${compactOnSmallScreens ? "gap-1 px-1.5 sm:gap-1.5 sm:px-2" : "gap-1.5 px-2"}`}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-3 w-3 shrink-0">
        <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
        <path d="M5 2v3M11 2v3M2.5 7h11" />
      </svg>
      <span className={compactOnSmallScreens && valid ? "hidden shrink-0 sm:inline" : "shrink-0"}>{label}</span>
      <time dateTime={valid ? value : undefined} aria-label={`${label} ${formattedTimestamp}`} className="truncate whitespace-nowrap tabular-nums">
        {compactOnSmallScreens && valid ? (
          <>
            <span className="hidden sm:inline">{formattedTimestamp.slice(0, yearEnd)}</span>
            {formattedTimestamp.slice(yearEnd, yearEnd + 5)}
            <span className="hidden sm:inline">{formattedTimestamp.slice(yearEnd + 5)}</span>
          </>
        ) : formattedTimestamp}
      </time>
    </span>
  );
}
