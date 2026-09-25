export type PrecedentLinkProvider = "off" | "law-go-kr" | "casenote";

export const DEFAULT_PRECEDENT_LINK_PROVIDER: PrecedentLinkProvider = "law-go-kr";

export const PRECEDENT_LINK_OPTIONS: { value: PrecedentLinkProvider; label: string }[] = [
  { value: "off", label: "끔" },
  { value: "law-go-kr", label: "국가법령정보센터" },
  { value: "casenote", label: "케이스노트" },
];

export function normalizePrecedentLinkProvider(value: unknown): PrecedentLinkProvider {
  return value === "off" || value === "casenote" ? value : DEFAULT_PRECEDENT_LINK_PROVIDER;
}

// Explicit case codes avoid turning dates, amounts and article numbers into links.
const caseCodes = [
  "가합", "가단", "가소", "나", "다", "다카", "다기", "라", "마", "그", "바",
  "카합", "카단", "카기", "카명", "카담", "카확", "카불", "카구", "카임", "카조", "카허", "카소", "카열", "카정",
  "고합", "고단", "고정", "고약", "노", "도", "로", "모", "초기", "초적", "초보", "감고", "감노", "감도",
  "구합", "구단", "구", "누", "두", "루", "무", "아", "아합", "아단",
  "드합", "드단", "드", "르", "므", "느합", "느단", "느", "브", "스", "즈합", "즈단", "즈기",
  "허", "후", "추", "수", "수흐",
  "헌가", "헌나", "헌다", "헌라", "헌마", "헌바", "헌사", "헌아", "헌자",
].sort((left, right) => right.length - left.length);

const caseNumberPattern = new RegExp(
  `(^|[^0-9A-Za-z])((?:[0-9]{4}|[0-9]{2})[ \\t\\u00a0]*(?:재)?(?:${caseCodes.join("|")})[ \\t\\u00a0]*[0-9]+)(?![0-9A-Za-z])`,
  "g",
);

export interface PrecedentTextPart {
  text: string;
  caseNumber?: string;
}

/** Keep the original display text; normalize spacing only in the destination. */
export function splitPrecedentText(text: string): PrecedentTextPart[] {
  const parts: PrecedentTextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(caseNumberPattern)) {
    const display = match[2]!;
    const start = match.index! + match[1]!.length;
    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    parts.push({ text: display, caseNumber: display.replace(/[ \t\u00a0]/g, "") });
    cursor = start + display.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

export function getPrecedentUrl(caseNumber: string, provider: Exclude<PrecedentLinkProvider, "off">): string {
  const encoded = encodeURIComponent(caseNumber);
  if (provider === "casenote") return `https://casenote.kr/search/?q=${encoded}`;
  // Constitutional decisions are indexed separately from court judgments.
  if (/헌[가나다라마바사아자]/.test(caseNumber)) return `https://www.law.go.kr/detcSc.do?query=${encoded}`;
  return `https://www.law.go.kr/LSW/precInfoP.do?mode=0&evtNo=${encoded}`;
}
