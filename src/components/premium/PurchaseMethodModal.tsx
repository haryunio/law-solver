import { useEffect, useState, type FormEvent } from "react";
import { ButtonLoadingContent } from "../ui/AsyncLoading";
import { IconCloseButton } from "../ui/IconCloseButton";

export interface PurchaseModalProduct {
  productCode: string;
  title: string;
  price: string;
}

interface PurchaseMethodModalProps {
  product: PurchaseModalProduct;
  isProcessing: boolean;
  onClose: () => void;
  onRedeemPromotion: (promotionCode: string) => Promise<void>;
}

const formatPromotionInput = (value: string) => {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return compact.match(/.{1,4}/g)?.join("-") ?? "";
};

export function PurchaseMethodModal({
  product,
  isProcessing,
  onClose,
  onRedeemPromotion,
}: PurchaseMethodModalProps) {
  const [step, setStep] = useState<"methods" | "promotion">("methods");
  const [promotionCode, setPromotionCode] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isProcessing) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isProcessing, onClose]);

  const submitPromotion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (promotionCode.replaceAll("-", "").length !== 16) {
      setInputError("16자리 프로모션 코드를 입력해 주세요.");
      return;
    }
    setInputError(null);
    try {
      await onRedeemPromotion(promotionCode);
      onClose();
    } catch {
      // The account toast displays the sanitized server message.
    }
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="purchase-modal-title">
      <button
        type="button"
        className="app-modal-backdrop absolute inset-0"
        onClick={isProcessing ? undefined : onClose}
        aria-label="결제 방법 선택 닫기"
      />
      <div className="absolute left-1/2 top-1/2 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="app-modal-surface overflow-hidden rounded-2xl border shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.12em] text-amber-700 dark:text-amber-400">PURCHASE</p>
              <h2 id="purchase-modal-title" className="mt-1 truncate text-lg font-bold text-stone-950 dark:text-stone-100">
                {step === "methods" ? "결제 방법 선택" : "프로모션 코드 입력"}
              </h2>
            </div>
            <IconCloseButton onClick={onClose} label="결제창 닫기" disabled={isProcessing} />
          </div>

          <div className="app-subtle-surface mx-5 mt-5 rounded-xl border px-4 py-3">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{product.title}</p>
            <p className="mt-1 text-xs font-semibold text-stone-500 dark:text-stone-400">{product.price}</p>
          </div>

          <div className="overflow-hidden px-5 pb-5 pt-4">
            <div key={step} className="purchase-modal-slide-forward">
              {step === "methods" ? (
                <div className="grid gap-2.5">
                  {[
                    { id: "bank", title: "무통장입금", description: "입금 확인 기능 준비 중", enabled: false },
                    { id: "toss", title: "토스페이먼츠 결제", description: "온라인 결제 기능 준비 중", enabled: false },
                    { id: "promotion", title: "프로모션 코드 입력", description: "일회용 프로모션 코드 사용", enabled: true },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      disabled={!method.enabled}
                      onClick={() => method.enabled && setStep("promotion")}
                      className={[
                        "flex min-h-[68px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left",
                        method.enabled
                          ? "border-amber-300 bg-amber-50 text-amber-950 transition-colors hover:bg-amber-100 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50"
                          : "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400 opacity-70 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-600",
                      ].join(" ")}
                    >
                      <span>
                        <strong className="block text-sm">{method.title}</strong>
                        <span className="mt-1 block text-xs opacity-75">{method.description}</span>
                      </span>
                      <span className="text-xs font-bold" aria-hidden="true">
                        {method.enabled ? "입력 →" : "준비 중"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={submitPromotion}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("methods");
                      setInputError(null);
                    }}
                    disabled={isProcessing}
                    className="mb-4 text-sm font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-200"
                  >
                    ← 결제 방법으로
                  </button>
                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">프로모션 코드</span>
                    <input
                      autoFocus
                      value={promotionCode}
                      onChange={(event) => {
                        setPromotionCode(formatPromotionInput(event.target.value));
                        setInputError(null);
                      }}
                      placeholder="0000-0000-0000-0000"
                      autoComplete="one-time-code"
                      inputMode="text"
                      className="app-control mt-2 w-full rounded-xl px-4 py-3 text-center font-mono text-base font-bold uppercase tracking-[0.08em]"
                      aria-invalid={Boolean(inputError)}
                      aria-describedby={inputError ? "promotion-code-error" : undefined}
                      disabled={isProcessing}
                    />
                  </label>
                  {inputError ? (
                    <p id="promotion-code-error" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                      {inputError}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
                      코드는 한 번만 사용할 수 있으며 적용 즉시 이용권이 발급됩니다.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessing || promotionCode.replaceAll("-", "").length !== 16}
                    className="app-button-primary mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? <ButtonLoadingContent label="코드 확인 중" /> : "프로모션 코드 적용"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
