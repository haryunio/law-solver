import { Link } from "react-router-dom";

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
    <div className="space-y-1">
      <Link
        to={logoTo}
        className="block w-fit text-sm font-bold leading-5 text-red-600 hover:underline dark:text-red-500"
        aria-label={logoLabel}
      >
        Law Solver
      </Link>
      <h1 className="text-2xl font-semibold leading-tight text-stone-900 md:text-3xl dark:text-stone-100">
        {title}
      </h1>
      <p className="text-sm leading-5 text-stone-500 dark:text-stone-500">{description}</p>
    </div>
  );
}
