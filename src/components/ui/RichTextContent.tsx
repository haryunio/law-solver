import { createElement, Fragment, useMemo, type ReactNode } from "react";

const supportedMarkupPattern =
  /<\/?(?:table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col|br|p|div|blockquote|ul|ol|li|strong|b|em|i|u|s|del|ins|sup|sub|small|mark|code|pre|hr|span|h[1-6])\b/i;

const allowedTags = new Set([
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  "br",
  "p",
  "div",
  "blockquote",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "ins",
  "sup",
  "sub",
  "small",
  "mark",
  "code",
  "pre",
  "hr",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

const blockedTags = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "template",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "link",
  "meta",
  "base",
  "img",
  "video",
  "audio",
  "source",
  "track",
]);

const voidTags = new Set(["br", "hr", "col"]);

const getSafePositiveInteger = (element: Element, attribute: string) => {
  const value = Number(element.getAttribute(attribute));
  return Number.isInteger(value) && value >= 1 && value <= 100 ? value : undefined;
};

const getTableColumnCount = (table: Element) => {
  const rows: Element[] = [];

  Array.from(table.children).forEach((child) => {
    const tagName = child.tagName.toLowerCase();
    if (tagName === "tr") {
      rows.push(child);
      return;
    }
    if (["thead", "tbody", "tfoot"].includes(tagName)) {
      rows.push(
        ...Array.from(child.children).filter((row) => row.tagName.toLowerCase() === "tr"),
      );
    }
  });

  return rows.reduce((maximum, row) => {
    const columnCount = Array.from(row.children).reduce((total, cell) => {
      if (!["th", "td"].includes(cell.tagName.toLowerCase())) return total;
      return total + (getSafePositiveInteger(cell, "colspan") ?? 1);
    }, 0);
    return Math.max(maximum, columnCount);
  }, 0);
};

const renderSafeNode = (node: Node, key: string): ReactNode => {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  if (blockedTags.has(tagName)) return null;

  const children = Array.from(element.childNodes).map((child, index) =>
    renderSafeNode(child, `${key}-${index}`),
  );

  if (!allowedTags.has(tagName)) {
    const isKoreanMarker = /^[가-힣]+$/.test(tagName);
    return (
      <Fragment key={key}>
        {isKoreanMarker ? `<${tagName}>` : null}
        {children}
      </Fragment>
    );
  }

  if (tagName === "table") {
    const isWide = getTableColumnCount(element) >= 4;
    return (
      <div
        key={key}
        className={["app-rich-table-wrap", isWide ? "is-wide" : ""].filter(Boolean).join(" ")}
        role="region"
        aria-label="문제에 포함된 표"
        tabIndex={0}
      >
        <table className="app-rich-table">{children}</table>
      </div>
    );
  }

  const props: Record<string, string | number> = { key };
  if (tagName === "th" || tagName === "td") {
    const rowSpan = getSafePositiveInteger(element, "rowspan");
    const colSpan = getSafePositiveInteger(element, "colspan");
    const scope = element.getAttribute("scope");
    if (rowSpan) props.rowSpan = rowSpan;
    if (colSpan) props.colSpan = colSpan;
    if (["row", "col", "rowgroup", "colgroup"].includes(scope ?? "")) props.scope = scope ?? "";
  }
  if (tagName === "ol") {
    const start = getSafePositiveInteger(element, "start");
    if (start) props.start = start;
  }
  if (tagName === "li") {
    const value = getSafePositiveInteger(element, "value");
    if (value) props.value = value;
  }
  if (tagName === "col") {
    const span = getSafePositiveInteger(element, "span");
    if (span) props.span = span;
  }

  const renderedTag = /^h[1-6]$/.test(tagName) ? "strong" : tagName;
  if (voidTags.has(tagName)) return createElement(renderedTag, props);
  return createElement(renderedTag, props, children);
};

interface RichTextContentProps {
  content: string;
  className?: string;
  as?: "div" | "span";
}

export function RichTextContent({ content, className = "", as = "div" }: RichTextContentProps) {
  const renderedContent = useMemo(() => {
    if (!supportedMarkupPattern.test(content) || typeof DOMParser === "undefined") return content;

    const document = new DOMParser().parseFromString(content, "text/html");
    return Array.from(document.body.childNodes).map((node, index) =>
      renderSafeNode(node, `rich-content-${index}`),
    );
  }, [content]);

  return createElement(
    as,
    { className: ["app-rich-text", className].filter(Boolean).join(" ") },
    renderedContent,
  );
}
