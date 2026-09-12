import type { ReactNode } from "react";
import { PremiumBadge } from "../ui/PremiumBadge";

interface LandingFeatureCardProps {
  label: string;
  title: string;
  description: string;
  icon: string;
  compact?: boolean;
  premium?: boolean;
  children?: ReactNode;
}

export function LandingFeatureCard({
  label,
  title,
  description,
  icon,
  compact = false,
  premium = false,
  children,
}: LandingFeatureCardProps) {
  return (
    <article className={[
      "landing-bento-card",
      compact ? "landing-feature-card landing-feature-card-compact" : "flex flex-col",
    ].join(" ")}>
      {compact ? null : (
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="app-subtle-surface flex h-11 w-11 items-center justify-center rounded-xl border text-xl text-red-600 dark:text-red-400" aria-hidden="true">{icon}</span>
          {premium ? <PremiumBadge /> : null}
        </div>
      )}
      <div>
        <p className="landing-feature-eyebrow">{label}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">{description}</p>
      </div>
      {compact ? <span className="landing-feature-icon" aria-hidden="true">{icon}</span> : null}
      {children}
    </article>
  );
}
