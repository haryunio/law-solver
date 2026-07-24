// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PurchaseMethodModal } from "./PurchaseMethodModal";

afterEach(cleanup);

describe("PurchaseMethodModal", () => {
  it("keeps unfinished payment methods disabled and transitions to promotion entry", async () => {
    const onRedeemPromotion = vi.fn().mockResolvedValue(undefined);
    render(
      <PurchaseMethodModal
        product={{ productCode: "premium_30d", title: "Premium 30일", price: "9,900원" }}
        isProcessing={false}
        onClose={() => undefined}
        onRedeemPromotion={onRedeemPromotion}
      />,
    );

    expect((screen.getByRole("button", { name: /무통장입금/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /토스페이먼츠 결제/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /프로모션 코드 입력/ }));
    const input = screen.getByRole("textbox", { name: "프로모션 코드" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "abcd 2345 efgh 6789" } });

    expect(input.value).toBe("ABCD-2345-EFGH-6789");
    fireEvent.click(screen.getByRole("button", { name: "프로모션 코드 적용" }));
    await waitFor(() => expect(onRedeemPromotion).toHaveBeenCalledWith("ABCD-2345-EFGH-6789"));
  });
});
