import type { PremiumEntitlement } from "./premiumApi";

export interface PremiumMembershipPeriod {
  startsAt: string;
  endsAt: string;
}

export function getPremiumMembershipPeriod(
  entitlements: PremiumEntitlement[],
): PremiumMembershipPeriod | null {
  const active = entitlements.filter((entitlement) =>
    entitlement.kind === "premium" && entitlement.status === "active"
  );
  if (active.length === 0) return null;

  const scheduledOrActive = entitlements.filter((entitlement) =>
    entitlement.kind === "premium" &&
    (entitlement.status === "active" || entitlement.status === "scheduled")
  );
  const startsAt = active.reduce((earliest, entitlement) =>
    Date.parse(entitlement.starts_at) < Date.parse(earliest)
      ? entitlement.starts_at
      : earliest, active[0]!.starts_at);
  const endsAt = scheduledOrActive.reduce((latest, entitlement) =>
    Date.parse(entitlement.ends_at) > Date.parse(latest)
      ? entitlement.ends_at
      : latest, active[0]!.ends_at);

  return { startsAt, endsAt };
}
