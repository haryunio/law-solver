import { describe, expect, it } from "vitest";
import { getPremiumErrorMessage, PremiumApiError } from "./premiumApi";

describe("Premium user-facing errors", () => {
  it("does not expose an expired-token server message", () => {
    const error = new PremiumApiError("Invalid or expired token", "UNAUTHORIZED", 401);

    expect(getPremiumErrorMessage(error)).toBe("로그인이 만료되었습니다. 다시 로그인해 주세요.");
    expect(getPremiumErrorMessage(error)).not.toContain("token");
  });

  it("translates common authentication failures into actionable guidance", () => {
    expect(getPremiumErrorMessage(
      new PremiumApiError("Invalid login credentials", "LOGIN_FAILED", 400),
    )).toBe("이메일 또는 비밀번호를 확인해 주세요.");
    expect(getPremiumErrorMessage(
      new PremiumApiError("Email not confirmed", "LOGIN_FAILED", 400),
    )).toBe("이메일 인증이 아직 완료되지 않았습니다. 인증 메일을 확인해 주세요.");
    expect(getPremiumErrorMessage(
      new PremiumApiError("Password should be at least 8 characters", "SIGNUP_FAILED", 400),
    )).toBe("비밀번호는 8자 이상 입력해 주세요.");
  });

  it("uses stable codes and statuses instead of server details", () => {
    expect(getPremiumErrorMessage(
      new PremiumApiError("private database detail", "REVISION_CONFLICT", 409),
    )).toBe("다른 창에서 풀이 내용이 변경되었습니다. 페이지를 새로고침해 주세요.");
    expect(getPremiumErrorMessage(
      new PremiumApiError("unknown upstream error", "UNKNOWN", 503),
    )).toBe("서비스가 일시적으로 원활하지 않습니다. 잠시 후 다시 시도해 주세요.");
  });

  it("handles connection errors and unknown values without exposing technical text", () => {
    expect(getPremiumErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
    );
    expect(getPremiumErrorMessage(new Error("technical detail"), "다시 시도해 주세요.")).toBe(
      "다시 시도해 주세요.",
    );
  });
});
