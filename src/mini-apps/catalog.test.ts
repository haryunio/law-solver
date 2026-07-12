import { describe, expect, it } from "vitest";
import { miniApps } from "./catalog";

describe("mini app catalog", () => {
  it("uses unique stable kebab-case IDs", () => {
    const ids = miniApps.map((app) => app.id);

    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));
  });

  it("does not link coming-soon apps", () => {
    miniApps.forEach((app) => {
      if (app.status === "coming-soon") expect(app.route).toBeUndefined();
    });
  });

  it("keeps each released route aligned with its app ID", () => {
    miniApps.forEach((app) => {
      if (app.route) expect(app.route).toBe(`/apps/${app.id}`);
    });
  });
});
