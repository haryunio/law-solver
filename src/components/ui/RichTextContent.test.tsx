// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RichTextContent } from "./RichTextContent";

afterEach(cleanup);

describe("RichTextContent", () => {
  it("renders legal excerpts, line breaks, nested tables, and cell spans", () => {
    const { container } = render(
      <RichTextContent
        content={'<table><tr><th>법령 발췌<br>제43조 내용<table><tr><th rowspan="2">위반사항</th><th colspan="3">행정처분기준</th></tr><tr><td>1차</td><td>2차</td><td>3차</td></tr></table></th></tr></table>'}
      />,
    );

    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(container.textContent).toContain("제43조 내용");
    expect(container.querySelector("br")).not.toBeNull();
    expect(screen.getByText("위반사항").getAttribute("rowspan")).toBe("2");
    expect(screen.getByText("행정처분기준").getAttribute("colspan")).toBe("3");
  });

  it("drops executable elements and unsafe attributes", () => {
    const { container } = render(
      <RichTextContent content={'안전<script>alert(1)</script><img src="x" onerror="alert(2)"><strong onclick="alert(3)">강조</strong>'} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).not.toContain("alert");
    expect(screen.getByText("강조").hasAttribute("onclick")).toBe(false);
  });

  it("keeps ordinary angle-bracket markers as text", () => {
    render(<RichTextContent content="다음 <보기> 중 옳은 것을 고르시오." />);
    expect(screen.getByText("다음 <보기> 중 옳은 것을 고르시오.")).toBeTruthy();
  });

  it("renders line breaks in plain explanations as explicit breaks", () => {
    const { container } = render(
      <RichTextContent content={"ㄱ. 틀리다.\r\nㄴ. 맞다.\n따라서 정답은 4번."} />,
    );

    expect(container.querySelectorAll("br")).toHaveLength(2);
    expect(container.textContent).toBe("ㄱ. 틀리다.ㄴ. 맞다.따라서 정답은 4번.");
  });

  it("links only opted-in text, keeps line breaks and updates provider without changing content", () => {
    const content = "99다1234 참조\r\n2001므1250 참조";
    const { container, rerender } = render(<RichTextContent content={content} />);
    expect(screen.queryByRole("link")).toBeNull();
    rerender(<RichTextContent content={content} precedentLinkProvider="law-go-kr" />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    const first = screen.getByRole("link", { name: /99다1234/ });
    expect(first.getAttribute("href")).toContain("evtNo=99%EB%8B%A41234");
    expect(first.getAttribute("target")).toBe("_blank");
    expect(first.getAttribute("rel")).toBe("noopener noreferrer");
    expect(first.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(container.querySelectorAll("br")).toHaveLength(1);
    rerender(<RichTextContent content={content} precedentLinkProvider="casenote" />);
    expect(screen.getByRole("link", { name: /2001므1250/ }).getAttribute("href")).toBe("https://casenote.kr/search/?q=2001%EB%AF%801250");
    rerender(<RichTextContent content={content} precedentLinkProvider="off" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.textContent).toBe("99다1234 참조2001므1250 참조");
  });

  it("links sanitized HTML text while keeping tables and discarding untrusted links and attributes", () => {
    const { container } = render(<RichTextContent precedentLinkProvider="law-go-kr" content={'<p><strong>99다1234</strong></p><table><tr><td colspan="2"><a href="javascript:alert(1)" onclick="alert(2)">2001므1250</a></td></tr></table><script>2000다999</script><img alt="2002다888" src="x"><p title="2003다777">설명</p>'} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(container.querySelector("strong a")?.textContent).toBe("99다1234");
    expect(container.querySelector('td[colspan="2"] a')?.textContent).toBe("2001므1250");
    expect(container.querySelector("a a, [onclick], img, script, [title='2003다777']")).toBeNull();
    expect(container.textContent).toBe("99다12342001므1250설명");
  });

  it("never trusts an existing anchor's destination even without other formatting", () => {
    render(<RichTextContent precedentLinkProvider="casenote" content={'<a href="https://untrusted.example">99다1234</a>'} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://casenote.kr/search/?q=99%EB%8B%A41234");
  });

  it("keeps source markup literal when explicitly rendered as plain text", () => {
    const content = "<strong>출처</strong> 99다1234";
    const { container } = render(<RichTextContent content={content} plainText precedentLinkProvider="law-go-kr" />);
    expect(container.textContent).toBe(content);
    expect(container.querySelector("strong")).toBeNull();
    expect(screen.getByRole("link", { name: /99다1234/ })).toBeTruthy();
  });
});
