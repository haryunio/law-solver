import { createId } from "../id";
import { PremiumApiError } from "./errors";
import { apiRequest, publicApiRequest } from "./transport";
import type { AccountData, MarketplaceProduct } from "./types";

export const getAccount = () => apiRequest<AccountData>("account-api");

export const listMarketplaceProducts = () =>
  publicApiRequest<MarketplaceProduct[]>("marketplace-api");

export async function purchaseProduct(productCode: string) {
  const checkout = await apiRequest<{
    order: {
      checkoutOrderId: string;
      orderId: string;
      amount: number;
      currency: string;
      status: string;
    };
    payment: { provider: "local" | "toss"; clientKey?: string };
  }>("checkout", "", {
    method: "POST",
    body: JSON.stringify({ productCode, idempotencyKey: `web-${createId()}` }),
  });

  if (checkout.payment.provider !== "local") {
    throw new PremiumApiError(
      "현재 프론트 연동 테스트는 로컬 결제만 지원합니다. Toss 결제창 연동은 운영 키 설정 후 진행해 주세요.",
      "TOSS_FRONTEND_NOT_CONFIGURED",
    );
  }

  return apiRequest<{ order: { status: string } }>("confirm-payment", "", {
    method: "POST",
    body: JSON.stringify({
      checkoutOrderId: checkout.order.checkoutOrderId,
      orderId: checkout.order.orderId,
      amount: checkout.order.amount,
    }),
  });
}

export const redeemPromotionCode = (productCode: string, promotionCode: string) =>
  apiRequest<{ order: { status: string; purchaseNumber?: string }; paymentMethod: "promotion" }>(
    "promotion-api",
    "",
    {
      method: "POST",
      body: JSON.stringify({ productCode, promotionCode }),
    },
  );

