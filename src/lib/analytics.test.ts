import { describe, expect, it } from "vitest";
import {
  getAnalyticsPage,
  toAnalyticsQuestionType,
} from "./analytics";

describe("analytics helpers", () => {
  it("normalizes dynamic routes into page types without identifiers", () => {
    expect(getAnalyticsPage("/")?.pageType).toBe("main");
    expect(getAnalyticsPage("/apps")?.pageType).toBe("mini_apps");
    expect(getAnalyticsPage("/apps/lbti/result/private-result")?.pagePath).toBe("/apps/mini-app");
    expect(getAnalyticsPage("/dashboard")?.pageType).toBe("subject_dashboard");
    expect(getAnalyticsPage("/dashboard/private-subject-id")?.pagePath).toBe(
      "/dashboard/subject",
    );
    expect(getAnalyticsPage("/solve/private-session-id")?.pagePath).toBe("/solve");
    expect(getAnalyticsPage("/result/private-session-id")?.pageType).toBe("result");
    expect(getAnalyticsPage("/wrong/private-session-id")?.pageType).toBe("review");
    expect(getAnalyticsPage("/review/private-session-id")?.pagePath).toBe("/review");
  });

  it("maps domain values to bounded analytics dimensions", () => {
    expect(toAnalyticsQuestionType("OX")).toBe("ox");
    expect(toAnalyticsQuestionType("5-choice")).toBe("multiple_choice");
    expect(toAnalyticsQuestionType("short")).toBe("short_answer");
  });
});
