interface ThemeToggleButtonProps {
  darkMode: boolean;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggleButton({ darkMode, onToggle, className = "landing-theme-button shrink-0" }: ThemeToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={className}
      aria-label={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
    </button>
  );
}
