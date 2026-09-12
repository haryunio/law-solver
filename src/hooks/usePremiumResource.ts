import { useCallback, useEffect, useState } from "react";
import { getPremiumErrorMessage } from "../lib/premiumApi";

type ResourceState<T> = {
  key: string;
  load: () => Promise<T>;
  revision: number;
  data: T | null;
  error: string | null;
  status: "loading" | "ready" | "error";
};

/** Pass a useCallback loader. A new key hides old data before effects run. */
export function usePremiumResource<T>(key: string, load: () => Promise<T>, failureMessage: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<ResourceState<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const identity = { key, load, revision };
    setState({ ...identity, data: null, error: null, status: "loading" });
    void Promise.resolve().then(load).then(
      (data) => {
        if (!cancelled) setState({ ...identity, data, error: null, status: "ready" });
      },
      (cause: unknown) => {
        if (!cancelled) setState({
          ...identity, data: null, status: "error",
          error: getPremiumErrorMessage(cause, failureMessage),
        });
      },
    );
    return () => { cancelled = true; };
  }, [key, load, revision, failureMessage]);

  const reload = useCallback(() => setRevision((current) => current + 1), []);
  const setData = useCallback((data: T) => {
    setState((current) => current?.key === key && current.load === load && current.revision === revision
      ? { ...current, data }
      : current);
  }, [key, load, revision]);
  const current = state?.key === key && state.load === load && state.revision === revision ? state : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    isLoading: !current || current.status === "loading",
    reload,
    setData,
  };
}
