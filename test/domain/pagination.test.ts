import { describe, expect, it } from "vitest";
import {
  initialPaginationState,
  moveToNextPage,
  moveToPreviousPage,
  setNextCursor,
} from "@/domain/pagination";

describe("cursor pagination", () => {
  it("moves forward and records the cursor needed to return", () => {
    const withNextPage = setNextCursor(initialPaginationState, "page-2");

    expect(moveToNextPage(withNextPage)).toEqual({
      currentCursor: "page-2",
      previousCursors: [null],
      nextCursor: null,
    });
  });

  it("moves backward and exposes the old current page as next", () => {
    const secondPage = {
      currentCursor: "page-2",
      previousCursors: [null],
      nextCursor: "page-3",
    } as const;

    expect(moveToPreviousPage(secondPage)).toEqual({
      currentCursor: null,
      previousCursors: [],
      nextCursor: "page-2",
    });
  });

  it("does not move when the requested direction is unavailable", () => {
    expect(moveToNextPage(initialPaginationState)).toBe(initialPaginationState);
    expect(moveToPreviousPage(initialPaginationState)).toBe(
      initialPaginationState,
    );
  });
});
