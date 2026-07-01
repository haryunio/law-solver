import { ElementType, useEffect, useRef, useState } from "react";

interface OverflowTooltipTitleProps {
  text: string;
  as?: ElementType;
  className?: string;
  tooltipClassName?: string;
}

export function OverflowTooltipTitle({
  text,
  as: Tag = "h1",
  className = "",
  tooltipClassName = "max-w-sm",
}: OverflowTooltipTitleProps) {
  const textRef = useRef<HTMLElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const updateOverflow = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    };

    updateOverflow();

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [text]);

  return (
    <div className="group relative min-w-0">
      <Tag ref={textRef} className={["truncate", className].filter(Boolean).join(" ")}>
        {text}
      </Tag>
      {isOverflowing ? (
        <div
          className={[
            "pointer-events-none absolute left-0 top-full z-20 mt-1 hidden rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-700 shadow-lg group-hover:block dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200",
            tooltipClassName,
          ].join(" ")}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}
