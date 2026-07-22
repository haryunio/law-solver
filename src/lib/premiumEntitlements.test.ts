import { describe, expect, it } from "vitest";
import type { PremiumEntitlement } from "./premiumApi";
import { getPremiumMembershipPeriod } from "./premiumEntitlements";

const entitlement = (
  id: string,
  status: PremiumEntitlement["status"],
  startsAt: string,
  endsAt: string,
): PremiumEntitlement => ({
  id,
  product_code: "premium_30d",
  kind: "premium",
  course_id: null,
  status,
  starts_at: startsAt,
  ends_at: endsAt,
});

describe("getPremiumMembershipPeriod", () => {
  it("shows the active start and final scheduled renewal end", () => {
    expect(getPremiumMembershipPeriod([
      entitlement("expired", "expired", "2026-06-01T00:00:00Z", "2026-07-01T00:00:00Z"),
      entitlement("active", "active", "2026-07-01T00:00:00Z", "2026-07-31T00:00:00Z"),
      entitlement("scheduled", "scheduled", "2026-07-31T00:00:00Z", "2026-08-30T00:00:00Z"),
    ])).toEqual({
      startsAt: "2026-07-01T00:00:00Z",
      endsAt: "2026-08-30T00:00:00Z",
    });
  });

  it("does not report a current period when only a scheduled entitlement exists", () => {
    expect(getPremiumMembershipPeriod([
      entitlement("scheduled", "scheduled", "2026-08-01T00:00:00Z", "2026-08-31T00:00:00Z"),
    ])).toBeNull();
  });
});
