import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSearchHistory,
  saveSearchHistory,
} from "@/storage/search-history-storage";
import { loadViewMode, saveViewMode } from "@/storage/preferences-storage";

describe("local storage adapters", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips recent searches and limits persisted history", () => {
    saveSearchHistory(["one", "two", "three", "four", "five", "six"]);

    expect(loadSearchHistory()).toEqual([
      "one",
      "two",
      "three",
      "four",
      "five",
    ]);
  });

  it("round-trips a valid view preference", () => {
    saveViewMode("tile");

    expect(loadViewMode()).toBe("tile");
  });

  it("falls back safely when stored data is invalid", () => {
    window.localStorage.setItem("sound-search:recent-searches", "not-json");
    window.localStorage.setItem(
      "sound-search:preferences",
      JSON.stringify({ viewMode: "grid" }),
    );

    expect(loadSearchHistory()).toEqual([]);
    expect(loadViewMode()).toBe("list");
  });
});
