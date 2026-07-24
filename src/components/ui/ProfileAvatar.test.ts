import { describe, expect, it } from "vitest";
import { getProfileInitial, getProfilePaletteIndex } from "./ProfileAvatar";

describe("ProfileAvatar", () => {
  it("uses the first visible character of the display name", () => {
    expect(getProfileInitial(" 하윤 ")).toBe("하");
    expect(getProfileInitial("alice")).toBe("A");
    expect(getProfileInitial("   ")).toBe("학");
  });

  it("keeps the same palette for the same display name", () => {
    expect(getProfilePaletteIndex("하윤")).toBe(getProfilePaletteIndex("하윤"));
    expect(getProfilePaletteIndex(" 하윤 ")).toBe(getProfilePaletteIndex("하윤"));
    expect(getProfilePaletteIndex("하윤")).toBeGreaterThanOrEqual(0);
    expect(getProfilePaletteIndex("하윤")).toBeLessThan(8);
  });
});
