// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CloudBackupInfoModal } from "./CloudBackupInfoModal";

describe("CloudBackupInfoModal", () => {
  afterEach(cleanup);

  it("explains encrypted synchronization and links to both policies", () => {
    render(<CloudBackupInfoModal onClose={() => undefined} />);

    expect(screen.getByText(/다른 기기 간 오프라인 문제 풀이 데이터 동기화/)).toBeTruthy();
    expect(screen.getByText(/백업 비밀번호와 복호화된 내용은 Law Solver 서버로 전송되지 않으며/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "이용약관" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "개인정보처리방침" })).toBeTruthy();
  });

  it("closes from the footer action", () => {
    const onClose = vi.fn();
    render(<CloudBackupInfoModal onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
