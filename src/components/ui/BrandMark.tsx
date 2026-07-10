interface BrandMarkProps {
  size?: "small" | "default";
  className?: string;
}

export function BrandMark({ size = "default", className = "" }: BrandMarkProps) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
      className={[
        "shrink-0 rounded-[28%] object-contain",
        size === "small" ? "h-7 w-7" : "h-9 w-9",
        className,
      ].join(" ")}
    />
  );
}
