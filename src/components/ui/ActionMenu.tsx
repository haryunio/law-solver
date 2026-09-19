import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

interface ActionMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

export function ActionMenu({ label, items, size = "compact" }: { label: string; items: ActionMenuItem[]; size?: "compact" | "session" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!items.length) return;
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive(open ? (active + direction + items.length) % items.length : direction === 1 ? 0 : items.length - 1);
      setOpen(true);
    } else if (open && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : items.length - 1);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={`app-button-secondary inline-flex items-center justify-center rounded-full text-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${size === "session" ? "h-8 w-8 lg:h-7 lg:w-7" : "h-8 w-8"}`}
        onClick={() => {
          setActive(0);
          setOpen(!open);
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
          <circle cx="8" cy="3" r="1.25" /><circle cx="8" cy="8" r="1.25" /><circle cx="8" cy="13" r="1.25" />
        </svg>
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label={label} className="app-select-menu absolute right-0 top-full z-50 mt-1.5 min-w-32 rounded-xl p-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { itemRefs.current[index] = element; }}
              type="button"
              role="menuitem"
              tabIndex={index === active ? 0 : -1}
              className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-medium outline-none focus:bg-stone-100 dark:focus:bg-stone-800 ${item.danger ? "text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" : "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"}`}
              onClick={() => {
                close();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
