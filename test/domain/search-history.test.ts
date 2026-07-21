import { describe, expect, it } from "vitest";
import { addRecentSearch } from "@/domain/search-history";

describe("addRecentSearch", () => {
  it("deduplicates case-insensitively and moves the latest search to the top", () => {
    expect(addRecentSearch(["Ambient", "Jazz"], "  jazz  ")).toEqual([
      "jazz",
      "Ambient",
    ]);
  });

  it("keeps at most five recent searches", () => {
    expect(
      addRecentSearch(["two", "three", "four", "five", "six"], "one"),
    ).toEqual(["one", "two", "three", "four", "five"]);
  });

  it("ignores an empty search", () => {
    expect(addRecentSearch(["Ambient"], "   ")).toEqual(["Ambient"]);
  });
});
