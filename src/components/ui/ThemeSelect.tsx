import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

export interface ThemeSelectOption {
  value: string;
  label: string;
}

interface ThemeSelectProps {
  value: string;
  options: ThemeSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function ThemeSelect({
  value,
  options,
  onChange,
  ariaLabel = "옵션 선택",
  className = "",
}: ThemeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setActiveIndex(selectedIndex);
  }, [isOpen, selectedIndex]);

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const selectOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setActiveIndex(index);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + direction + options.length) % options.length);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      if (!isOpen) return;
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) selectOption(activeIndex);
      else openMenu();
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={["relative", className].join(" ")}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? `${listboxId}-option-${activeIndex}` : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className="app-select-trigger flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm"
      >
        <span className="min-w-0 flex-1 truncate font-medium">{selectedOption?.label ?? "선택하세요"}</span>
        <span
          aria-hidden="true"
          className={[
            "grid h-5 w-5 shrink-0 origin-center place-items-center transition-transform duration-150",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        >
          <span className="block h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-current" />
        </span>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="app-select-menu absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl p-1.5"
        >
          {options.map((option, optionIndex) => {
            const isSelected = option.value === value;
            const isActive = optionIndex === activeIndex;
            return (
              <button
                key={option.value}
                id={`${listboxId}-option-${optionIndex}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(optionIndex)}
                onClick={() => selectOption(optionIndex)}
                className={[
                  "app-select-option flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm",
                  isActive ? "is-active" : "",
                  isSelected ? "is-selected" : "",
                ].join(" ")}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                <span className="w-4 shrink-0 text-center font-bold" aria-hidden="true">
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
