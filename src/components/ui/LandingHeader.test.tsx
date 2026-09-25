// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingHeader } from "./LandingHeader";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("LandingHeader scroll state", () => {
  const scrollTo = (y: number) => { vi.stubGlobal("scrollY", y); fireEvent.scroll(window); };

  it("floats after scrolling and avoids flickering around the threshold", () => {
    vi.stubGlobal("scrollY", 0);
    render(<MemoryRouter><LandingHeader /></MemoryRouter>);
    const header = screen.getByRole("banner");
    expect(header.dataset.floating).toBe("false");
    scrollTo(49);
    expect(header.dataset.floating).toBe("true");
    scrollTo(32);
    expect(header.dataset.floating).toBe("true");
    scrollTo(16);
    expect(header.dataset.floating).toBe("false");
    scrollTo(32);
    expect(header.dataset.floating).toBe("false");
  });

  it("starts floating when the page opens at a restored scroll position", () => {
    vi.stubGlobal("scrollY", 200);
    const onOpenCsvGuide = vi.fn();
    render(<MemoryRouter><LandingHeader onOpenCsvGuide={onOpenCsvGuide} /></MemoryRouter>);
    expect(screen.getByRole("banner").dataset.floating).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "CSV 가이드" }));
    expect(onOpenCsvGuide).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "시작하기" }).getAttribute("href")).toBe("/home");
  });
});
