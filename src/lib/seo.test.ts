import { describe, expect, it } from "vitest";
import {
  getCanonicalUrl,
  getSeoMetadata,
  INDEXABLE_PATHS,
  SITE_ORIGIN,
  STATIC_APP_SHELL_PATHS,
} from "./seo";

describe("SEO metadata", () => {
  it("uses the production domain for public canonical URLs", () => {
    const metadata = getSeoMetadata("/apps/lbti/types/");

    expect(metadata.indexable).toBe(true);
    expect(getCanonicalUrl(metadata)).toBe(`${SITE_ORIGIN}/apps/lbti/types/`);
  });

  it("builds indexable metadata for valid LBTI result types", () => {
    const metadata = getSeoMetadata("/apps/lbti/result/pwrs");

    expect(metadata.indexable).toBe(true);
    expect(metadata.title).toBe("Law Solver | LBTI");
    expect(metadata.canonicalPath).toBe("/apps/lbti/result/pwrs/");
  });

  it("keeps the brand first and limits titles to one section depth", () => {
    expect(getSeoMetadata("/").title).toBe("Law Solver");
    expect(getSeoMetadata("/apps").title).toBe("Law Solver | 미니 앱");
    expect(getSeoMetadata("/apps/lbti/types").title).toBe("Law Solver | LBTI");
    expect(getSeoMetadata("/dashboard").title).toBe("Law Solver | 대시보드");
    expect(getSeoMetadata("/result/private-session").title).toBe("Law Solver | 문제 풀이");
  });

  it("keeps tests, private learning routes, and invalid results out of the index", () => {
    expect(getSeoMetadata("/apps/lbti/test").indexable).toBe(false);
    expect(getSeoMetadata("/home").indexable).toBe(false);
    expect(getSeoMetadata("/settings").indexable).toBe(false);
    expect(getSeoMetadata("/account").indexable).toBe(false);
    expect(getSeoMetadata("/premium").indexable).toBe(false);
    expect(getSeoMetadata("/solve/private-session").indexable).toBe(false);
    expect(getSeoMetadata("/apps/lbti/result/invalid").indexable).toBe(false);
  });

  it("includes the shared subject dashboard without exposing subject routes", () => {
    const dashboard = getSeoMetadata("/dashboard");

    expect(dashboard.indexable).toBe(true);
    expect(dashboard.canonicalPath).toBe("/dashboard/");
    expect(getSeoMetadata("/dashboard/private-subject").indexable).toBe(false);
  });

  it("only includes canonical public pages in the sitemap path list", () => {
    expect(INDEXABLE_PATHS).toContain("/");
    expect(INDEXABLE_PATHS).toContain("/dashboard");
    expect(INDEXABLE_PATHS).toContain("/apps/lbti/result/tcod");
    expect(INDEXABLE_PATHS).not.toContain("/apps/lbti/test");
    expect(new Set(INDEXABLE_PATHS).size).toBe(INDEXABLE_PATHS.length);
  });

  it("creates a refreshable shell for the non-indexed LBTI test without adding it to the sitemap", () => {
    expect(STATIC_APP_SHELL_PATHS).toContain("/apps/lbti/test");
    expect(INDEXABLE_PATHS).not.toContain("/apps/lbti/test");
    expect(STATIC_APP_SHELL_PATHS).toContain("/home");
    expect(STATIC_APP_SHELL_PATHS).toContain("/settings");
    expect(STATIC_APP_SHELL_PATHS).toContain("/account");
    expect(STATIC_APP_SHELL_PATHS).toContain("/premium");
    expect(INDEXABLE_PATHS).not.toContain("/premium");
  });
});
