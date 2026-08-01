import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const packageJson = JSON.parse(read("../../package.json"));
const productionConfigurator = read("../../scripts/configure-premium-environment.mjs");

describe("local and production web launchers", () => {
  it("keeps local and production web servers on distinct strict ports", () => {
    expect(packageJson.scripts["dev:local"]).toContain("--port 5164");
    expect(packageJson.scripts["dev:local"]).toContain("--strictPort");
    expect(packageJson.scripts["dev:production"]).toContain("--port 5174");
    expect(packageJson.scripts["dev:production"]).toContain("--mode hosted");
    expect(packageJson.scripts["dev:production"]).toContain("env:production");
  });

  it("pins production to the hosted project using only a publishable browser key", () => {
    expect(productionConfigurator).toContain('const productionProjectRef = "dpbklhfqdnrktgulvszs"');
    expect(productionConfigurator).toContain('const frontendRepository = "haryunio/law-solver"');
    expect(productionConfigurator).toContain('key.startsWith("sb_secret_")');
    expect(productionConfigurator).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
