import { describe, expect, it } from "vitest";
import { getPrecedentUrl, normalizePrecedentLinkProvider, splitPrecedentText } from "./precedentLinks";

describe("precedent links", () => {
  it("recognizes civil, family, criminal, administrative and constitutional citations", () => {
    const text = "99다1234,2001므1250 및 2020도123, 2019두456, 2022헌바7, 92다카123, 2023가합500.";
    const parts = splitPrecedentText(text);
    expect(parts.map((part) => part.text).join("")).toBe(text);
    expect(parts.filter((part) => part.caseNumber).map((part) => part.caseNumber)).toEqual([
      "99다1234", "2001므1250", "2020도123", "2019두456", "2022헌바7", "92다카123", "2023가합500",
    ]);
  });

  it("preserves spacing and Korean particles but normalizes the destination case number", () => {
    const text = "대판99 다 1234는 (2001\u00a0므\t1250)과 같다.";
    const parts = splitPrecedentText(text);
    expect(parts.map((part) => part.text).join("")).toBe(text);
    expect(parts.filter((part) => part.caseNumber)).toEqual([
      { text: "99 다 1234", caseNumber: "99다1234" },
      { text: "2001\u00a0므\t1250", caseNumber: "2001므1250" },
    ]);
  });

  it("does not link dates, money, article numbers, partial identifiers or incomplete citations", () => {
    const text = "2024년1월2일, 99명1234원, 제123조, 12399다1234, abc99다1234, 99다1234x, 2001므, 99\n다1234";
    expect(splitPrecedentText(text)).toEqual([{ text }]);
    expect(splitPrecedentText("")).toEqual([]);
  });

  it("builds encoded, fixed-origin URLs without adding a court name", () => {
    expect(getPrecedentUrl("2005다73105", "law-go-kr")).toBe("https://www.law.go.kr/LSW/precInfoP.do?mode=0&evtNo=2005%EB%8B%A473105");
    expect(getPrecedentUrl("2001므1250", "casenote")).toBe("https://casenote.kr/search/?q=2001%EB%AF%801250");
    expect(getPrecedentUrl("2004헌나1", "law-go-kr")).toBe("https://www.law.go.kr/detcSc.do?query=2004%ED%97%8C%EB%82%981");
  });

  it("defaults missing and invalid preferences to the national law center", () => {
    for (const value of [undefined, null, "invalid", {}, "law-go-kr"]) expect(normalizePrecedentLinkProvider(value)).toBe("law-go-kr");
    expect(normalizePrecedentLinkProvider("off")).toBe("off");
    expect(normalizePrecedentLinkProvider("casenote")).toBe("casenote");
  });
});
