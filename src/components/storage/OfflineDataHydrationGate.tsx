import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  flushOfflineData,
  getOfflineDataInitializationStatus,
  initializeOfflineData,
  offlineDataStorage,
  subscribeOfflineDataInitialization,
} from "../../store/useTestStore";
import { BrandMark } from "../ui/BrandMark";
import { Toast } from "../ui/Toast";

function LoadingScreen() {
  return (
    <main className="app-page flex min-h-screen items-center justify-center px-4">
      <section
        role="status"
        aria-live="polite"
        aria-label="오프라인 문제 풀이 데이터를 준비하는 중"
        className="app-card flex w-full max-w-md flex-col items-center rounded-2xl border px-6 py-10 text-center"
      >
        <BrandMark />
        <span className="app-spinner mt-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        <h1 className="mt-4 text-base font-bold text-stone-900 dark:text-stone-100">
          오프라인 문제 풀이 데이터를 준비하고 있습니다
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
          기존 저장 데이터가 있으면 안전하게 새 브라우저 저장소로 이전합니다.
        </p>
      </section>
    </main>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="app-page flex min-h-screen items-center justify-center px-4">
      <section
        role="alert"
        className="app-card w-full max-w-md rounded-2xl border px-6 py-8 text-center"
      >
        <div className="flex justify-center"><BrandMark /></div>
        <h1 className="mt-4 text-lg font-bold text-stone-900 dark:text-stone-100">
          저장된 데이터를 불러오지 못했습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">{message}</p>
        <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-500">
          기존 데이터는 삭제하지 않았습니다. 다른 Law Solver 탭을 닫은 뒤 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="app-button-primary app-button-primary-standalone mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          다시 시도
        </button>
      </section>
    </main>
  );
}

export function OfflineDataHydrationGate({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(
    subscribeOfflineDataInitialization,
    getOfflineDataInitializationStatus,
    getOfflineDataInitializationStatus,
  );
  const [storageSnapshot, setStorageSnapshot] = useState(offlineDataStorage.getSnapshot);
  const [fallbackDismissed, setFallbackDismissed] = useState(false);

  useEffect(() => {
    return offlineDataStorage.subscribe(() => {
      setStorageSnapshot(offlineDataStorage.getSnapshot());
    });
  }, []);

  useEffect(() => {
    void initializeOfflineData().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (status.phase !== "ready") return;
    const flush = () => {
      if (document.visibilityState === "hidden") {
        void flushOfflineData().catch(() => undefined);
      }
    };
    const flushOnPageHide = () => void flushOfflineData().catch(() => undefined);
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, [status.phase]);

  if (status.phase === "idle" || status.phase === "loading") return <LoadingScreen />;
  if (status.phase === "error") {
    return (
      <ErrorScreen
        message={status.message}
        onRetry={() => void initializeOfflineData().catch(() => undefined)}
      />
    );
  }

  const fallbackMessage = status.backend === "legacy-local-storage" && !fallbackDismissed
    ? "이 브라우저에서 IndexedDB를 사용할 수 없어 기존 저장 방식을 사용 중입니다. 저장 공간이 부족하면 JSON 백업 후 브라우저를 업데이트해 주세요."
    : null;

  return (
    <>
      {children}
      <Toast
        message={fallbackMessage}
        tone="warning"
        durationMs={0}
        onDismiss={() => setFallbackDismissed(true)}
      />
      <Toast
        message={storageSnapshot.writeError?.message}
        tone="error"
        durationMs={0}
        onDismiss={offlineDataStorage.dismissWriteError}
      />
    </>
  );
}
