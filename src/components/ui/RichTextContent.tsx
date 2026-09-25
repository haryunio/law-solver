import { createElement, Fragment, useMemo, type ReactNode } from "react";
import { getPrecedentUrl, splitPrecedentText, type PrecedentLinkProvider } from "../../lib/precedentLinks";

const supportedMarkupPattern =
  /<\/?(?:table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col|br|p|div|blockquote|ul|ol|li|strong|b|em|i|u|s|del|ins|sup|sub|small|mark|code|pre|hr|span|a|h[1-6])\b/i;

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

const renderText = (text: string, provider: PrecedentLinkProvider): ReactNode => {
  if (provider === "off") return text;
  const destination = provider === "casenote" ? "케이스노트" : "국가법령정보센터";
  return splitPrecedentText(text).map((part, index) => part.caseNumber ? (
    <a
      key={index}
      href={getPrecedentUrl(part.caseNumber, provider)}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      className="app-precedent-link"
      aria-label={`${part.text}, ${destination}에서 새 탭으로 열기`}
      title={`${destination}에서 새 탭으로 열기`}
    >{part.text}</a>
  ) : part.text);
};

const renderPlainTextWithLineBreaks = (text: string, provider: PrecedentLinkProvider): ReactNode => {
  const lines = text.split(/\r\n?|\n|\u2028|\u2029/);
  if (lines.length === 1) return renderText(text, provider);

  return lines.flatMap((line, index) =>
    index === 0 ? [renderText(line, provider)] : [<br key={`plain-line-break-${index}`} />, renderText(line, provider)],
  );
};

const renderSafeNode = (node: Node, key: string, provider: PrecedentLinkProvider): ReactNode => {
  if (node.nodeType === 3) return <Fragment key={key}>{renderText(node.textContent ?? "", provider)}</Fragment>;
  if (node.nodeType !== 1) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  if (blockedTags.has(tagName)) return null;

  const children = Array.from(element.childNodes).map((child, index) =>
    renderSafeNode(child, `${key}-${index}`, provider),
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
    return (
      <div key={key} className="app-rich-table-wrap">
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

export interface RichTextContentProps {
  content: string;
  className?: string;
  as?: "div" | "span";
  plainText?: boolean;
  precedentLinkProvider?: PrecedentLinkProvider;
}

export function RichTextContent({ content, className = "", as = "div", plainText = false, precedentLinkProvider = "off" }: RichTextContentProps) {
  const renderedContent = useMemo(() => {
    if (plainText || !supportedMarkupPattern.test(content) || typeof DOMParser === "undefined") {
      return renderPlainTextWithLineBreaks(content, precedentLinkProvider);
    }

    const document = new DOMParser().parseFromString(content, "text/html");
    return Array.from(document.body.childNodes).map((node, index) =>
      renderSafeNode(node, `rich-content-${index}`, precedentLinkProvider),
    );
  }, [content, plainText, precedentLinkProvider]);

  return createElement(
    as,
    { className: ["app-rich-text", className].filter(Boolean).join(" ") },
    renderedContent,
  );
}
