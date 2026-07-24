const avatarPalettes = [
  "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300",
  "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/50 dark:text-orange-300",
  "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300",
  "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300",
  "border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/50 dark:text-teal-300",
  "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300",
  "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300",
  "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-300",
] as const;

export const getProfileInitial = (displayName: string) =>
  Array.from(displayName.trim())[0]?.toLocaleUpperCase("ko-KR") ?? "학";

export const getProfilePaletteIndex = (displayName: string) => {
  let hash = 2166136261;
  for (const character of displayName.trim()) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % avatarPalettes.length;
};

export function ProfileAvatar({
  displayName,
  className = "h-11 w-11 text-sm",
}: {
  displayName: string;
  className?: string;
}) {
  const palette = avatarPalettes[getProfilePaletteIndex(displayName)];
  return (
    <span
      className={[
        "flex shrink-0 items-center justify-center rounded-full border font-black",
        palette,
        className,
      ].join(" ")}
      aria-label={`${displayName || "학습자"} 프로필`}
    >
      {getProfileInitial(displayName)}
    </span>
  );
}
