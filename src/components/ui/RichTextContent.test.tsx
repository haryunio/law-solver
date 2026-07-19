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
});
