export type ProblemSortKey = "title" | "created_at";
export type ProblemSortDirection = "asc" | "desc";

const titleCollator = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });

/** Sort the visible problem list without changing persisted records or session order. */
export function sortProblemSets<T extends { title: string; created_at: string }>(
  problems: readonly T[],
  key: ProblemSortKey,
  direction: ProblemSortDirection,
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...problems].sort((a, b) => sign * (key === "title"
    ? titleCollator.compare(a.title, b.title)
    : Date.parse(a.created_at) - Date.parse(b.created_at)));
}
