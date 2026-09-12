// @vitest-environment jsdom
import { lazy, Suspense } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { RouteAnchorScroll } from "./RouteAnchorScroll";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("scrolls to an anchor after a delayed destination mounts", async () => {
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scroll });
  let resolve!: (value: { default: () => JSX.Element }) => void;
  const Page = lazy(() => new Promise<{ default: () => JSX.Element }>((complete) => { resolve = complete; }));
  render(<MemoryRouter initialEntries={["/#features"]}><Suspense fallback={<p>불러오는 중</p>}>
    <Page /><RouteAnchorScroll />
  </Suspense></MemoryRouter>);
  expect(scroll).not.toHaveBeenCalled();
  await act(async () => resolve({ default: () => <section id="features">기능 소개</section> }));
  await screen.findByText("기능 소개");
  await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1));
  expect(scroll.mock.instances[0]).toBe(document.getElementById("features"));
});
