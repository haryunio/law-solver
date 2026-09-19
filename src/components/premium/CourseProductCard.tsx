import type { MarketplaceProduct } from "../../lib/premiumApi";
import { getPremiumSubjectCoverStyle, premiumOrangeAccentColor } from "../../lib/subjectCover";
import { BookCover } from "../ui/BookCover";
import { Button } from "../ui/Button";
import { PremiumBadge } from "../ui/PremiumBadge";

interface CourseProductCardProps {
  product: MarketplaceProduct;
  priceLabel: string;
  actionLabel: string;
  active: boolean;
  disabled: boolean;
  pending: boolean;
  onAction: () => void;
}

/** Product presentation only. Account and purchase decisions remain in the page. */
export function CourseProductCard({
  product,
  priceLabel,
  actionLabel,
  active,
  disabled,
  pending,
  onAction,
}: CourseProductCardProps) {
  return (
    <article className="flex min-w-0 flex-col gap-3">
      <BookCover
        title={product.name}
        coverStyle={getPremiumSubjectCoverStyle(product.courseName ?? product.name)}
        accentColor={premiumOrangeAccentColor}
        eyebrow="과목 이용권"
        topRight={<PremiumBadge />}
      />

      <div className="app-card flex flex-1 flex-col rounded-xl border p-3">
        <dl className="min-w-0">
          <div className="mb-3 border-b border-stone-200 pb-3 dark:border-stone-700">
            <dt className="text-[11px] text-stone-500 dark:text-stone-400">금액</dt>
            <dd className="mt-1 break-words text-lg font-bold leading-6 tabular-nums text-stone-900 dark:text-stone-100">{priceLabel}</dd>
          </div>
          {[
            ["이용 기간", `${product.durationDays}일`],
            ["다시 풀기", product.maxAttempts === null ? "무제한" : `문제별 ${product.maxAttempts}회`],
          ].map(([label, value]) => (
            <div key={label} className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs leading-5">
              <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
              <dd className="font-semibold text-stone-900 dark:text-stone-100">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto pt-4">
          <Button
            size="sm"
            onClick={onAction}
            disabled={disabled}
            pending={pending}
            pendingLabel="결제 처리 중"
            variant={active ? "secondary" : "primary"}
            className="h-12 w-full leading-4"
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
