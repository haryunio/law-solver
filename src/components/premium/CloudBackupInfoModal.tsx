import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconCloseButton } from "../ui/IconCloseButton";
import { PrivacyPolicyLink } from "../ui/PrivacyPolicyLink";
import { TermsOfServiceLink } from "../ui/TermsOfServiceLink";

interface CloudBackupInfoModalProps {
  onClose: () => void;
}

const policyLinkClass =
  "font-semibold text-red-600 underline decoration-red-200 underline-offset-4 transition-colors hover:text-red-700 dark:text-red-400 dark:decoration-red-900 dark:hover:text-red-300";

export function CloudBackupInfoModal({ onClose }: CloudBackupInfoModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-backup-info-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="app-modal-backdrop absolute inset-0"
        aria-label="클라우드 백업 안내 바깥 영역 닫기"
      />
      <div className="absolute left-1/2 top-1/2 w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2">
        <section className="app-modal-surface rounded-2xl border p-5 shadow-2xl sm:p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">
                CLOUD BACKUP
              </p>
              <h2
                id="cloud-backup-info-title"
                className="mt-2 text-lg font-bold text-stone-950 dark:text-stone-100"
              >
                클라우드 백업 자세히 알아보기
              </h2>
            </div>
            <IconCloseButton onClick={onClose} label="클라우드 백업 안내 닫기" />
          </header>

          <div className="mt-5 space-y-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
            <p>
              이 기능을 사용하면 백업과 복구는 물론, 백업한 데이터를 다른 기기에서 복구하는 방식으로 여러 기기 간 오프라인 문제 풀이 데이터 동기화가 가능합니다.
            </p>
            <p>
              데이터는 현재 브라우저에서 자체적으로 압축 및 암호화된 뒤 업로드됩니다. 사용자가 암호화를 위해 설정한 백업 비밀번호와 복호화된 내용은 Law Solver 서버로 전송되지 않으며, 백업 비밀번호를 아는 사용자만 내용을 확인할 수 있습니다.
            </p>
            <p className="app-subtle-surface rounded-xl border p-4 text-xs leading-5 text-stone-500 dark:text-stone-400">
              더욱 자세한 내용은 <TermsOfServiceLink className={policyLinkClass} /> 및{" "}
              <PrivacyPolicyLink className={policyLinkClass} />을 참조해 주세요.
            </p>
          </div>

          <footer className="mt-5 flex justify-end border-t border-stone-200 pt-4 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="app-button-secondary rounded-lg px-5 py-2.5 text-sm font-semibold"
            >
              닫기
            </button>
          </footer>
        </section>
      </div>
    </div>,
    document.body,
  );
}
