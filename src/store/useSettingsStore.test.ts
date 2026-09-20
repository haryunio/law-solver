// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./useSettingsStore";

beforeEach(() => {
  useSettingsStore.setState(useSettingsStore.getInitialState());
  localStorage.clear();
});

describe("problem sorting preferences", () => {
  it("restores old settings with registration descending defaults", async () => {
    localStorage.setItem("law-solver-settings", JSON.stringify({
      state: { darkMode: true, fontFamily: "nanum-myeongjo" }, version: 0,
    }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState()).toMatchObject({
      darkMode: true, fontFamily: "nanum-myeongjo", problemSortKey: "created_at", problemSortDirection: "desc",
    });
  });

  it("persists both choices and restores them on hydration", async () => {
    useSettingsStore.getState().setProblemSortKey("title");
    useSettingsStore.getState().setProblemSortDirection("asc");
    const saved = localStorage.getItem("law-solver-settings")!;
    useSettingsStore.setState(useSettingsStore.getInitialState());
    localStorage.setItem("law-solver-settings", saved);
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState()).toMatchObject({ problemSortKey: "title", problemSortDirection: "asc" });
  });

  it("falls back safely for invalid saved sorting options", async () => {
    localStorage.setItem("law-solver-settings", JSON.stringify({
      state: { problemSortKey: "unknown", problemSortDirection: null }, version: 0,
    }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState()).toMatchObject({ problemSortKey: "created_at", problemSortDirection: "desc" });
  });
});
