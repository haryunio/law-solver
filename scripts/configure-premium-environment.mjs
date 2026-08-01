import { execFileSync } from "node:child_process";
import { chmodSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const productionProjectRef = "dpbklhfqdnrktgulvszs";
const productionUrl = `https://${productionProjectRef}.supabase.co`;
const frontendRepository = "haryunio/law-solver";

function command(commandName, args) {
  return execFileSync(commandName, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function requirePublishableKey(value) {
  const key = value?.trim();
  if (!key) {
    throw new Error("Supabase publishable key를 찾지 못했습니다.");
  }
  if (key.startsWith("sb_publishable_")) return key;
  if (key.startsWith("sb_secret_")) {
    throw new Error("브라우저 환경에는 Supabase service role/secret key를 사용할 수 없습니다.");
  }

  const payload = key.split(".")[1];
  if (!payload) {
    throw new Error("Supabase publishable key 형식을 확인해 주세요.");
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.role !== "anon") {
      throw new Error("브라우저 환경에는 anon 역할의 공개 key만 사용할 수 있습니다.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("anon 역할")) throw error;
    throw new Error("Supabase publishable key 형식을 확인해 주세요.");
  }
  return key;
}

const providedKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const publishableKey = requirePublishableKey(
  providedKey ||
    command("gh", [
      "variable",
      "get",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "--repo",
      frontendRepository,
    ]),
);
const outputPath = fileURLToPath(new URL("../.env.hosted.local", import.meta.url));
writeFileSync(
  outputPath,
  `VITE_SUPABASE_URL=${productionUrl}\nVITE_SUPABASE_PUBLISHABLE_KEY=${publishableKey}\n`,
  { encoding: "utf8", mode: 0o600 },
);
chmodSync(outputPath, 0o600);

console.log(`Web production environment ready: ${outputPath}`);
console.log(`API URL: ${productionUrl}`);
console.log("Web URL: http://127.0.0.1:5174");
