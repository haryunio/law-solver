// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MiniAppEntryScrollReset } from "./MiniAppEntryScrollReset";

describe("MiniAppEntryScrollReset", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("scrolls to the top when entering a mini app from the app catalog", async () => {
    render(
      <MemoryRouter initialEntries={["/apps"]}>
        <MiniAppEntryScrollReset />
        <Routes>
          <Route path="/apps" element={<Link to="/apps/lbti">LBTI 열기</Link>} />
          <Route path="/apps/lbti" element={<p>LBTI</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(window.scrollTo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("link", { name: "LBTI 열기" }));

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    });
  });

  it("does not reset scroll within a mini app subroute", () => {
    render(
      <MemoryRouter initialEntries={["/apps/lbti/test"]}>
        <MiniAppEntryScrollReset />
      </MemoryRouter>,
    );

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
