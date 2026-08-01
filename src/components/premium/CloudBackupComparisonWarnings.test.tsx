// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  CloudBackupComparisonWarnings,
  getCloudBackupComparisonWarnings,
} from "./CloudBackupComparisonWarnings";

const olderAndSmaller = {
  dataModifiedAt: "2026-08-01T00:00:00.000Z",
  questionCount: 20,
};

const newerAndLarger = {
  dataModifiedAt: "2026-08-02T00:00:00.000Z",
  questionCount: 40,
};

describe("cloud backup comparison warnings", () => {
  afterEach(cleanup);

  it("warns before an older and smaller local backup overwrites cloud data", () => {
    const warnings = getCloudBackupComparisonWarnings({
      mode: "upload",
      source: olderAndSmaller,
      target: newerAndLarger,
    });

    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain("백업하려는 문제 풀이 데이터의 마지막 수정 시각");
    expect(warnings[1]).toContain("백업하려는 문제 풀이 데이터의 문제 수");
  });

  it("warns before an older and smaller cloud backup replaces browser data", () => {
    const warnings = getCloudBackupComparisonWarnings({
      mode: "restore",
      source: olderAndSmaller,
      target: newerAndLarger,
    });

    render(<CloudBackupComparisonWarnings warnings={warnings} />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/내려받으려는 문제 풀이 데이터의 마지막 수정 시각/)).toBeTruthy();
    expect(screen.getByText(/내려받으려는 문제 풀이 데이터의 문제 수/)).toBeTruthy();
  });

  it("does not warn when the source is at least as recent and has as many questions", () => {
    expect(getCloudBackupComparisonWarnings({
      mode: "restore",
      source: newerAndLarger,
      target: olderAndSmaller,
    })).toEqual([]);
  });
});
