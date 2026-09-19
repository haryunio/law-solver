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

export function TimestampTag({ value, label, title }: { value: string; label: string; title?: string }) {
  const valid = Number.isFinite(Date.parse(value));
  return (
    <span
      title={title}
      className="app-neutral-box inline-flex h-6 max-w-full items-center gap-1.5 rounded-md border px-2 text-[10px] leading-3 text-stone-500 dark:text-stone-400"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-3 w-3 shrink-0">
        <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
        <path d="M5 2v3M11 2v3M2.5 7h11" />
      </svg>
      <span className="shrink-0">{label}</span>
      <time dateTime={valid ? value : undefined} className="truncate tabular-nums">{formatTimestamp(value)}</time>
    </span>
  );
}
