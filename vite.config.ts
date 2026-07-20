import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  getCanonicalUrl,
  getSeoMetadata,
  INDEXABLE_PATHS,
  SITE_ORIGIN,
  STATIC_APP_SHELL_PATHS,
} from "./src/lib/seo";

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/"/g, "&quot;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

const replaceMeta = (
  html: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) => html.replace(
  new RegExp(`<meta ${attribute}="${key}" content="[^"]*"\\s*/?>`),
  `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`,
);

const renderSeoShell = (source: string, pathname: string) => {
  const metadata = getSeoMetadata(pathname);
  const canonicalUrl = getCanonicalUrl(metadata);
  let html = source.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`);
  html = replaceMeta(html, "name", "description", metadata.description);
  html = replaceMeta(
    html,
    "name",
    "robots",
    metadata.indexable ? "index,follow,max-image-preview:large" : "noindex",
  );
  html = replaceMeta(html, "property", "og:title", metadata.title);
  html = replaceMeta(html, "property", "og:description", metadata.description);
  html = replaceMeta(html, "name", "twitter:title", metadata.title);
  html = replaceMeta(html, "name", "twitter:description", metadata.description);

  if (canonicalUrl) {
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${canonicalUrl}" />`,
    );
    html = replaceMeta(html, "property", "og:url", canonicalUrl);
    html = replaceMeta(html, "name", "twitter:url", canonicalUrl);
  } else {
    html = html.replace(/\s*<link rel="canonical" href="[^"]*"\s*\/?>/, "");
    html = html.replace(/\s*<meta property="og:url" content="[^"]*"\s*\/?>/, "");
    html = html.replace(/\s*<meta name="twitter:url" content="[^"]*"\s*\/?>/, "");
  }

  return html;
};

const seoArtifactsPlugin = () => ({
  name: "law-solver-seo-artifacts",
  apply: "build" as const,
  async closeBundle() {
    const distDir = resolve("dist");
    const sourceHtml = await readFile(resolve(distDir, "index.html"), "utf8");

    await Promise.all(STATIC_APP_SHELL_PATHS.map(async (pathname) => {
      const outputPath = resolve(distDir, pathname.slice(1), "index.html");
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, renderSeoShell(sourceHtml, pathname), "utf8");
    }));

    const sitemapUrls = INDEXABLE_PATHS.map((pathname) => {
      const canonicalUrl = getCanonicalUrl(getSeoMetadata(pathname));
      if (!canonicalUrl) throw new Error(`Missing canonical URL for ${pathname}`);
      return `  <url><loc>${canonicalUrl}</loc></url>`;
    });
    await writeFile(
      resolve(distDir, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join("\n")}\n</urlset>\n`,
      "utf8",
    );
    await writeFile(
      resolve(distDir, "robots.txt"),
      `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
      "utf8",
    );
    await copyFile(resolve("favicon.png"), resolve(distDir, "favicon.png"));
  },
});

export default defineConfig(({ command }) => ({
  plugins: [react(), seoArtifactsPlugin()],
  base: "/",
}));
