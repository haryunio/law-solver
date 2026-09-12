// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePremiumResource } from "./usePremiumResource";

afterEach(cleanup);

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
};

describe("Premium resource lifecycle", () => {
  it("hides the previous resource and ignores a response arriving after navigation", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const firstLoad = () => first.promise;
    const secondLoad = () => second.promise;
    const { result, rerender } = renderHook(
      ({ id, load }) => usePremiumResource(id, load, "다시 시도해 주세요."),
      { initialProps: { id: "first", load: firstLoad } },
    );
    rerender({ id: "second", load: secondLoad });
    await act(async () => first.resolve("previous result"));
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
    await act(async () => second.resolve("current result"));
    expect(result.current.data).toBe("current result");
  });

  it("clears loaded data on key change and rejects a stale mutation response", async () => {
    const load = vi.fn().mockResolvedValue("first result");
    const pending = deferred<string>();
    const nextLoad = () => pending.promise;
    const { result, rerender } = renderHook(
      ({ id, request }) => usePremiumResource(id, request, "다시 시도해 주세요."),
      { initialProps: { id: "first", request: load as () => Promise<string> } },
    );
    await waitFor(() => expect(result.current.data).toBe("first result"));
    const staleSetData = result.current.setData;
    rerender({ id: "second", request: nextLoad });
    expect(result.current.data).toBeNull();
    act(() => staleSetData("late saved note"));
    expect(result.current.data).toBeNull();
    await act(async () => pending.resolve("second result"));
    expect(result.current.data).toBe("second result");
  });

  it("retains failure independently of toast dismissal and supports retry", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("private detail")).mockResolvedValueOnce([]);
    const { result } = renderHook(() => usePremiumResource("items", load, "목록을 다시 불러와 주세요."));
    await waitFor(() => expect(result.current.error).toBe("목록을 다시 불러와 주세요."));
    expect(result.current.isLoading).toBe(false);
    act(() => result.current.reload());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(result.current.error).toBeNull();
  });
});
