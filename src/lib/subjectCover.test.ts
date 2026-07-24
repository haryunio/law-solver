import { describe, expect, it } from "vitest";
import { getPremiumSubjectCoverStyle } from "./subjectCover";

describe("online subject cover colors", () => {
  it("keeps the same course name on the same orange gradient", () => {
    expect(getPremiumSubjectCoverStyle("법조윤리")).toEqual(
      getPremiumSubjectCoverStyle(" 법조윤리 "),
    );
  });

  it("varies only the gradient angle while preserving the exact orange colors", () => {
    const courseNames = ["법조윤리", "민법", "형법", "공법"];
    const gradients = courseNames.map((name) => getPremiumSubjectCoverStyle(name).background);

    expect(new Set(gradients).size).toBe(courseNames.length);
    gradients.forEach((gradient) => {
      expect(gradient).toMatch(/^linear-gradient\(\d+deg, hsl\(18 80% 46%\), hsl\(25 88% 54%\) 52%, hsl\(36 94% 59%\)\)$/);
    });
  });
});
