import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";

interface DashboardHeaderTitleProps {
  title: string;
  description: string;
  logoTo: string;
  logoLabel: string;
}

export function DashboardHeaderTitle({
  title,
  description,
  logoTo,
  logoLabel,
}: DashboardHeaderTitleProps) {
  return (
    <div className="space-y-1.5">
      <Link
        to={logoTo}
        className="group flex w-fit items-center gap-2 text-sm font-semibold leading-5 text-stone-800 transition hover:text-red-600 dark:text-stone-200 dark:hover:text-red-400"
        aria-label={logoLabel}
      >
        <BrandMark size="small" className="shadow-[0_6px_16px_rgba(239,68,68,0.18)]" />
        <span>Law Solver</span>
      </Link>
      <h1 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-stone-900 md:text-3xl dark:text-stone-100">
        {title}
      </h1>
      <p className="text-sm leading-5 text-stone-500 dark:text-stone-500">{description}</p>
    </div>
  );
}
