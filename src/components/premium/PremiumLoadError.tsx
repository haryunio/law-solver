import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

interface PremiumLoadErrorProps {
  message: string;
  onRetry: () => void;
  backTo?: string;
}

export function PremiumLoadError({ message, onRetry, backTo }: PremiumLoadErrorProps) {
  return (
    <section className="app-card rounded-2xl border p-6 text-center" role="alert">
      <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">정보를 불러오지 못했습니다</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="primary" className="rounded-xl" onClick={onRetry}>다시 시도</Button>
        {backTo ? <Link to={backTo} className="app-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold">목록으로</Link> : null}
      </div>
    </section>
  );
}
