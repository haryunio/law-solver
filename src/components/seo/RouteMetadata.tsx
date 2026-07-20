import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getCanonicalUrl, getSeoMetadata, SITE_ORIGIN } from "../../lib/seo";

type MetaAttribute = "name" | "property";

const upsertMeta = (attribute: MetaAttribute, key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const removeMeta = (attribute: MetaAttribute, key: string) => {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
};

export function RouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const metadata = getSeoMetadata(location.pathname);
    const canonicalUrl = getCanonicalUrl(metadata);

    document.title = metadata.title;
    upsertMeta("name", "description", metadata.description);
    upsertMeta("name", "robots", metadata.indexable
      ? "index,follow,max-image-preview:large"
      : "noindex");
    upsertMeta("property", "og:title", metadata.title);
    upsertMeta("property", "og:description", metadata.description);
    upsertMeta("name", "twitter:title", metadata.title);
    upsertMeta("name", "twitter:description", metadata.description);
    upsertMeta("property", "og:image", `${SITE_ORIGIN}/favicon.png`);
    upsertMeta("name", "twitter:image", `${SITE_ORIGIN}/favicon.png`);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
      upsertMeta("property", "og:url", canonicalUrl);
      upsertMeta("name", "twitter:url", canonicalUrl);
    } else {
      canonical?.remove();
      removeMeta("property", "og:url");
      removeMeta("name", "twitter:url");
    }
  }, [location.pathname]);

  return null;
}
