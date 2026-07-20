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
    expect(metadata.title).toContain("PWRS");
    expect(metadata.canonicalPath).toBe("/apps/lbti/result/pwrs/");
  });

  it("keeps tests, private learning routes, and invalid results out of the index", () => {
    expect(getSeoMetadata("/apps/lbti/test").indexable).toBe(false);
    expect(getSeoMetadata("/solve/private-session").indexable).toBe(false);
    expect(getSeoMetadata("/apps/lbti/result/invalid").indexable).toBe(false);
  });

  it("only includes canonical public pages in the sitemap path list", () => {
    expect(INDEXABLE_PATHS).toContain("/");
    expect(INDEXABLE_PATHS).toContain("/apps/lbti/result/tcod");
    expect(INDEXABLE_PATHS).not.toContain("/apps/lbti/test");
    expect(new Set(INDEXABLE_PATHS).size).toBe(INDEXABLE_PATHS.length);
  });

  it("creates a refreshable shell for the non-indexed LBTI test without adding it to the sitemap", () => {
    expect(STATIC_APP_SHELL_PATHS).toContain("/apps/lbti/test");
    expect(INDEXABLE_PATHS).not.toContain("/apps/lbti/test");
  });
});
