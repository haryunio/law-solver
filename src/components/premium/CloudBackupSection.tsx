import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CloudBackupCryptoError,
  CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION,
  decryptCloudBackupJson,
  encryptCloudBackupJson,
  validateCloudBackupPassword,
} from "../../lib/cloudBackupCrypto";
import {
  getDashboardBackupStats,
  parseDashboardBackup,
  parseDashboardBackupJson,
} from "../../lib/dashboardBackup";
import {
  commitCloudBackupUpload,
  createCloudBackupRestoreTicket,
  createCloudBackupUploadIntent,
  deleteCloudBackup,
  downloadCloudBackupObject,
  getCloudBackupMetadata,
  getPremiumErrorMessage,
  uploadCloudBackupObject,
  type CloudBackupMetadata,
} from "../../lib/premiumApi";
import { useAccountStore } from "../../store/useAccountStore";
import { useTestStore } from "../../store/useTestStore";
import type { DashboardBackupData } from "../../types/test";
import { ButtonLoadingContent, SkeletonBlock } from "../ui/AsyncLoading";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { IconCloseButton } from "../ui/IconCloseButton";
import { PremiumBadge } from "../ui/PremiumBadge";
import { Toast, type ToastTone } from "../ui/Toast";
import {
  CloudBackupComparisonWarnings,
  getCloudBackupComparisonWarnings,
} from "./CloudBackupComparisonWarnings";
import { CloudBackupInfoModal } from "./CloudBackupInfoModal";

type ModalMode = "upload" | "restore" | null;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

const formatBytes = (value: number) => {
  if (value < 1_000) return `${value.toLocaleString("ko-KR")} B`;
  if (value < 1_000_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${(value / 1_000_000).toFixed(1)} MB`;
};

const operationLabel: Record<string, string> = {
  encrypting: "압축·암호화하는 중",
  uploading: "암호화된 백업을 올리는 중",
  downloading: "클라우드 데이터를 내려받는 중",
  decrypting: "내려받은 데이터를 복호화·검증하는 중",
  deleting: "클라우드 데이터를 삭제하는 중",
};

function comparisonCard({
  label,
  dataModifiedAt,
  subjectCount,
  sessionCount,
  questionCount,
}: {
  label: string;
  dataModifiedAt: string;
  subjectCount: number;
  sessionCount: number;
  questionCount: number;
}) {
  return (
    <article className="app-neutral-box rounded-xl border p-3">
      <p className="text-[11px] font-bold tracking-[0.08em] text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-stone-900 dark:text-stone-100">
        {formatDate(dataModifiedAt)}
      </p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        과목 {subjectCount.toLocaleString("ko-KR")}개 · 세션 {sessionCount.toLocaleString("ko-KR")}개 · 문제 {questionCount.toLocaleString("ko-KR")}개
      </p>
    </article>
  );
}

export function CloudBackupSection() {
  const configured = useAccountStore((state) => state.configured);
  const initialized = useAccountStore((state) => state.initialized);
  const isSignedIn = useAccountStore((state) => state.isSignedIn);
  const accountPremiumActive = useAccountStore((state) => state.isPremiumActive);
  const getDashboardBackupData = useTestStore((state) => state.getDashboardBackupData);
  const importDashboardData = useTestStore((state) => state.importDashboardData);
  const sessions = useTestStore((state) => state.sessions);
  const subjects = useTestStore((state) => state.subjects);
  const dataUpdatedAt = useTestStore((state) => state.dataUpdatedAt);
  const localStats = useMemo(() => ({
    subjectCount: subjects.length,
    sessionCount: sessions.length,
    questionCount: sessions.reduce((total, session) => total + session.questions.length, 0),
    dataModifiedAt: dataUpdatedAt,
  }), [dataUpdatedAt, sessions, subjects.length]);

  const [metadata, setMetadata] = useState<CloudBackupMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [operation, setOperation] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [cachedRestore, setCachedRestore] = useState<Uint8Array | null>(null);
  const [restoredData, setRestoredData] = useState<DashboardBackupData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const loadMetadata = async () => {
    if (!configured || !isSignedIn) {
      setMetadata(null);
      return;
    }
    setLoading(true);
    try {
      setMetadata(await getCloudBackupMetadata());
    } catch (error) {
      setToast({
        message: getPremiumErrorMessage(error, "클라우드 백업 정보를 불러오지 못했습니다."),
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized) void loadMetadata();
  }, [configured, initialized, isSignedIn]);

  const resetModal = () => {
    setModalMode(null);
    setPassword("");
    setPasswordConfirm("");
    setModalError(null);
    setCachedRestore(null);
    setRestoredData(null);
  };

  const closeModal = () => {
    if (operation) return;
    resetModal();
  };

  useEffect(() => {
    if (!isSignedIn) resetModal();
  }, [isSignedIn]);

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    setModalError(null);
    try {
      validateCloudBackupPassword(password);
      if (password !== passwordConfirm) {
        setModalError("백업 비밀번호가 서로 일치하지 않습니다.");
        return;
      }
      setOperation("encrypting");
      const snapshot = parseDashboardBackup(getDashboardBackupData());
      const stats = getDashboardBackupStats(snapshot);
      const encrypted = await encryptCloudBackupJson(JSON.stringify(snapshot), password);
      setOperation("uploading");
      const intent = await createCloudBackupUploadIntent({
        expectedRevision: metadata?.backup?.revision ?? null,
        dataModifiedAt: stats.dataModifiedAt,
        subjectCount: stats.subjectCount,
        sessionCount: stats.sessionCount,
        questionCount: stats.questionCount,
        encryptedSizeBytes: encrypted.byteLength,
        backupFormatVersion: snapshot.version,
        encryptionFormatVersion: CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION,
      });
      await uploadCloudBackupObject(intent, encrypted);
      const nextMetadata = await commitCloudBackupUpload(intent.uploadId);
      setMetadata(nextMetadata);
      resetModal();
      setToast({ message: "오프라인 문제 풀이 데이터를 안전하게 클라우드에 백업했습니다.", tone: "success" });
    } catch (error) {
      setModalError(
        error instanceof CloudBackupCryptoError
          ? error.message
          : getPremiumErrorMessage(error, "클라우드 백업을 완료하지 못했습니다."),
      );
    } finally {
      setOperation(null);
    }
  };

  const decryptRestore = async (event: FormEvent) => {
    event.preventDefault();
    setModalError(null);
    try {
      validateCloudBackupPassword(password);
      let encrypted = cachedRestore;
      let restoreMetadata = metadata;
      if (!encrypted) {
        setOperation("downloading");
        const ticket = await createCloudBackupRestoreTicket();
        encrypted = await downloadCloudBackupObject(ticket);
        restoreMetadata = ticket.metadata;
        setCachedRestore(encrypted);
        setMetadata(ticket.metadata);
      }
      setOperation("decrypting");
      const parsed = parseDashboardBackupJson(await decryptCloudBackupJson(encrypted, password));
      const stats = getDashboardBackupStats(parsed);
      const remote = restoreMetadata?.backup;
      if (
        !remote || remote.subjectCount !== stats.subjectCount ||
        remote.sessionCount !== stats.sessionCount || remote.questionCount !== stats.questionCount ||
        Date.parse(remote.dataModifiedAt) !== Date.parse(stats.dataModifiedAt)
      ) {
        throw new CloudBackupCryptoError(
          "백업 파일과 서버 정보가 일치하지 않습니다. 다시 시도해 주세요.",
          "DECRYPTION_FAILED",
        );
      }
      setRestoredData(parsed);
      setPassword("");
    } catch (error) {
      setPassword("");
      setModalError(
        error instanceof CloudBackupCryptoError
          ? error.message
          : getPremiumErrorMessage(error, "클라우드 데이터를 확인하지 못했습니다."),
      );
    } finally {
      setOperation(null);
    }
  };

  const applyRestore = () => {
    if (!restoredData) return;
    importDashboardData({
      sessions: restoredData.sessions,
      subjects: restoredData.subjects,
      sessionSubjectMap: restoredData.sessionSubjectMap,
      dataModifiedAt: restoredData.data_modified_at,
    });
    closeModal();
    setToast({ message: "클라우드의 오프라인 문제 풀이 데이터를 이 브라우저에 반영했습니다.", tone: "success" });
  };

  const removeBackup = async () => {
    setDeleteConfirm(false);
    setOperation("deleting");
    try {
      await deleteCloudBackup();
      await loadMetadata();
      setToast({ message: "클라우드 데이터를 완전히 삭제했습니다.", tone: "success" });
    } catch (error) {
      setToast({
        message: getPremiumErrorMessage(error, "클라우드 백업을 삭제하지 못했습니다."),
        tone: "error",
      });
    } finally {
      setOperation(null);
    }
  };

  const activePremium = Boolean(metadata?.activePremium && accountPremiumActive);
  const transferDisabled = loading || Boolean(operation) || !activePremium;
  const uploadRemaining = metadata
    ? metadata.limits.dailyUploadLimit - metadata.limits.uploadsUsed
    : 0;
  const restoreRemaining = metadata
    ? metadata.limits.dailyRestoreLimit - metadata.limits.restoresUsed
    : 0;
  const comparisonWarnings = modalMode && metadata?.backup
    ? getCloudBackupComparisonWarnings({
      mode: modalMode,
      source: modalMode === "upload" ? localStats : metadata.backup,
      target: modalMode === "upload" ? metadata.backup : localStats,
    })
    : [];

  return (
    <>
      <Toast
        message={toast?.message}
        tone={toast?.tone}
        onDismiss={() => setToast(null)}
      />
      <article className="app-card rounded-2xl border p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold tracking-[0.14em] text-red-600 dark:text-red-400">
                CLOUD BACKUP
              </p>
              <PremiumBadge />
            </div>
            <h2 className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100">
              클라우드에 문제 풀이 데이터 백업하기
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-stone-500 dark:text-stone-400">
              Law Solver Premium 사용자는 오프라인 문제 풀이 데이터를 Law Solver 클라우드 서버에 백업하고 복구할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              className="mt-1.5 text-xs font-semibold text-red-600 underline decoration-red-200 underline-offset-4 transition-colors hover:text-red-700 dark:text-red-400 dark:decoration-red-900 dark:hover:text-red-300"
            >
              자세히 알아보기
            </button>
          </div>
          {loading ? (
            <div className="w-full max-w-[220px]" role="status" aria-label="클라우드 백업 정보를 불러오는 중">
              <SkeletonBlock className="h-20 rounded-xl" />
            </div>
          ) : (
            <div className="app-neutral-box shrink-0 rounded-xl border px-4 py-3 text-sm">
              <p className="text-xs text-stone-500 dark:text-stone-400">이용 상태</p>
              <p className="mt-1 font-bold text-stone-900 dark:text-stone-100">
                {!isSignedIn ? "로그인 필요" : activePremium ? "클라우드 사용 가능" : "Premium 이용 기간 아님"}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {comparisonCard({ label: "이 브라우저", ...localStats })}
          {metadata?.backup
            ? comparisonCard({
              label: "클라우드 최신본",
              dataModifiedAt: metadata.backup.dataModifiedAt,
              subjectCount: metadata.backup.subjectCount,
              sessionCount: metadata.backup.sessionCount,
              questionCount: metadata.backup.questionCount,
            })
            : (
              <article className="app-neutral-box flex min-h-[82px] items-center justify-center rounded-xl border p-3 text-center text-xs text-stone-500 dark:text-stone-400">
                {isSignedIn ? "아직 저장된 클라우드 백업이 없습니다." : "로그인하면 클라우드 백업 정보를 확인할 수 있습니다."}
              </article>
            )}
        </div>

        {metadata?.backup?.deletionScheduledAt ? (
          <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400">
            Premium 만료로 백업·내려받기가 중지되었습니다. 이 데이터는 {formatDate(metadata.backup.deletionScheduledAt)} 이후 자동 삭제될 수 있습니다.
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-end sm:justify-between dark:border-stone-700">
          <div className="text-xs leading-5 text-stone-500 dark:text-stone-400">
            <p>암호화 최종본 최대 15MB · 비밀번호 최소 8자</p>
            {metadata ? (
              <p>
                오늘 남은 백업 {Math.max(0, uploadRemaining)}회 · 내려받기 {Math.max(0, restoreRemaining)}회 · 초기화 {formatDate(metadata.limits.resetsAt)}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:flex">
            {metadata?.backup ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                disabled={Boolean(operation)}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400"
              >클라우드 데이터 삭제</button>
            ) : null}
            <button
              type="button"
              onClick={() => setModalMode("restore")}
              disabled={transferDisabled || !metadata?.backup || restoreRemaining <= 0}
              className="app-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >클라우드에서 내려받기</button>
            <button
              type="button"
              onClick={() => setModalMode("upload")}
              disabled={transferDisabled || uploadRemaining <= 0}
              className="app-button-primary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >{metadata?.backup ? "클라우드에 다시 백업하기" : "클라우드에 백업하기"}</button>
          </div>
        </div>
      </article>

      {modalMode ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            onClick={closeModal}
            className="app-modal-backdrop absolute inset-0"
            aria-label="클라우드 백업 대화상자 닫기"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2">
            <section className="app-modal-surface max-h-[88vh] overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <PremiumBadge />
                  <h2 className="mt-3 text-lg font-bold text-stone-950 dark:text-stone-100">
                    {modalMode === "upload"
                      ? metadata?.backup ? "클라우드에 다시 백업하기" : "클라우드에 백업하기"
                      : restoredData ? "내려받은 데이터 최종 확인" : "클라우드에서 내려받기"}
                  </h2>
                </div>
                <IconCloseButton onClick={closeModal} label="클라우드 백업 닫기" />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                {comparisonCard({ label: "현재 브라우저", ...localStats })}
                <span
                  aria-hidden="true"
                  className="flex h-5 items-center justify-center text-sm font-bold text-stone-400 dark:text-stone-500 sm:h-auto sm:w-4"
                >
                  <span className="sm:hidden">{modalMode === "upload" ? "↓" : "↑"}</span>
                  <span className="hidden sm:inline">{modalMode === "upload" ? "→" : "←"}</span>
                </span>
                {modalMode === "upload"
                  ? metadata?.backup
                    ? comparisonCard({
                      label: "덮어쓸 클라우드 최신본",
                      dataModifiedAt: metadata.backup.dataModifiedAt,
                      subjectCount: metadata.backup.subjectCount,
                      sessionCount: metadata.backup.sessionCount,
                      questionCount: metadata.backup.questionCount,
                    })
                    : (
                      <article className="app-neutral-box flex items-center justify-center rounded-xl border p-3 text-xs text-stone-500">
                        저장된 백업 없음
                      </article>
                    )
                  : restoredData
                  ? comparisonCard({
                    label: "내려받은 클라우드 데이터",
                    ...getDashboardBackupStats(restoredData),
                  })
                  : metadata?.backup
                  ? comparisonCard({
                    label: "내려받을 클라우드 최신본",
                    dataModifiedAt: metadata.backup.dataModifiedAt,
                    subjectCount: metadata.backup.subjectCount,
                    sessionCount: metadata.backup.sessionCount,
                    questionCount: metadata.backup.questionCount,
                  })
                  : null}
              </div>

              <CloudBackupComparisonWarnings warnings={comparisonWarnings} />

              {restoredData ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-400">
                    복호화와 구조 검증이 완료되었습니다. 적용하면 현재 브라우저의 과목, 문제, 풀이 내역과 오답노트가 위 클라우드 데이터로 한 번에 교체됩니다.
                  </p>
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={closeModal} className="app-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold">취소</button>
                    <button type="button" onClick={applyRestore} className="app-button-primary rounded-xl px-4 py-2.5 text-sm font-semibold">이 데이터로 교체</button>
                  </div>
                </>
              ) : (
                <form onSubmit={modalMode === "upload" ? upload : decryptRestore} className="mt-5">
                  <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
                    {modalMode === "upload"
                      ? "이 비밀번호로 브라우저에서 암호화합니다. Law Solver는 비밀번호를 저장하지 않으며, 비밀번호를 잊으면 절대로 복구할 수 없습니다."
                      : cachedRestore
                      ? "암호문은 이 대화상자의 메모리에 보관 중입니다. 비밀번호를 다시 입력해도 내려받기 횟수가 추가로 차감되지 않습니다."
                      : "내려받기를 시작하면 암호문을 한 번 내려받아 이 대화상자 메모리에만 보관합니다. 올바른 비밀번호가 있어야 내용을 확인할 수 있습니다."}
                  </p>
                  {modalError ? (
                    <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                      {modalError}
                    </p>
                  ) : null}
                  <label className="mt-4 block text-sm font-semibold text-stone-800 dark:text-stone-200">
                    백업 비밀번호
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="app-control mt-2 w-full rounded-xl border px-3 py-3 text-sm"
                      placeholder="8자 이상 입력"
                    />
                  </label>
                  {modalMode === "upload" ? (
                    <label className="mt-3 block text-sm font-semibold text-stone-800 dark:text-stone-200">
                      백업 비밀번호 확인
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={passwordConfirm}
                        onChange={(event) => setPasswordConfirm(event.target.value)}
                        className="app-control mt-2 w-full rounded-xl border px-3 py-3 text-sm"
                        placeholder="같은 비밀번호 다시 입력"
                      />
                    </label>
                  ) : null}
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={closeModal} disabled={Boolean(operation)} className="app-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50">취소</button>
                    <button type="submit" disabled={Boolean(operation)} className="app-button-primary min-w-[150px] rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
                      {operation
                        ? <ButtonLoadingContent label={operationLabel[operation] ?? "처리 중"} />
                        : modalMode === "upload" ? "암호화하고 백업하기" : cachedRestore ? "비밀번호 다시 확인" : "내려받고 확인하기"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {deleteConfirm ? (
        <ConfirmDialog
          title="클라우드 데이터를 삭제할까요?"
          description="서버에 보관된 암호화 데이터와 임시 업로드를 삭제합니다. 현재 브라우저의 오프라인 문제 풀이 데이터는 삭제되지 않으며, 이 작업은 되돌릴 수 없습니다."
          confirmLabel="클라우드 데이터 삭제"
          variant="danger"
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={() => void removeBackup()}
        />
      ) : null}

      {isInfoOpen ? (
        <CloudBackupInfoModal onClose={() => setIsInfoOpen(false)} />
      ) : null}
    </>
  );
}
