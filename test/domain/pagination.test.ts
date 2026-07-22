import { describe, expect, it } from "vitest";
import {
  acceptLoadedPage,
  completePageTransition,
  initialPaginationState,
  resetPagination,
} from "@/domain/pagination";

describe("cursor pagination", () => {
  it("records a next cursor only for the currently displayed page", () => {
    expect(acceptLoadedPage(initialPaginationState, null, "page-2")).toEqual({
      currentCursor: null,
      previousCursors: [],
      nextCursor: "page-2",
    });

    expect(
      acceptLoadedPage(initialPaginationState, "stale-page", "wrong-next"),
    ).toBe(initialPaginationState);
  });

  it("commits a successful forward transition and records the return cursor", () => {
    const withNextPage = acceptLoadedPage(
      initialPaginationState,
      null,
      "page-2",
    );

    expect(
      completePageTransition(
        withNextPage,
        {
          direction: "next",
          fromCursor: null,
          targetCursor: "page-2",
        },
        "page-3",
      ),
    ).toEqual({
      currentCursor: "page-2",
      previousCursors: [null],
      nextCursor: "page-3",
    });
  });

  it("commits a successful backward transition", () => {
    const secondPage = {
      currentCursor: "page-2",
      previousCursors: [null],
      nextCursor: "page-3",
    } as const;

    expect(
      completePageTransition(
        secondPage,
        {
          direction: "previous",
          fromCursor: "page-2",
          targetCursor: null,
        },
        "page-2",
      ),
    ).toEqual({
      currentCursor: null,
      previousCursors: [],
      nextCursor: "page-2",
    });
  });

  it("ignores duplicate, unavailable, and out-of-order completions", () => {
    const secondPage = {
      currentCursor: "page-2",
      previousCursors: [null],
      nextCursor: "page-3",
    } as const;
    const staleTransition = {
      direction: "next",
      fromCursor: null,
      targetCursor: "page-2",
    } as const;

    expect(completePageTransition(secondPage, staleTransition, "page-3")).toBe(
      secondPage,
    );
    expect(
      completePageTransition(
        initialPaginationState,
        {
          direction: "next",
          fromCursor: null,
          targetCursor: "page-2",
        },
        null,
      ),
    ).toBe(initialPaginationState);
    expect(
      completePageTransition(
        secondPage,
        {
          direction: "previous",
          fromCursor: "page-2",
          targetCursor: "wrong-page",
        },
        null,
      ),
    ).toBe(secondPage);
  });

  it("treats a duplicate completion as stale after the first commit", () => {
    const withNextPage = acceptLoadedPage(
      initialPaginationState,
      null,
      "page-2",
    );
    const transition = {
      direction: "next",
      fromCursor: null,
      targetCursor: "page-2",
    } as const;
    const committed = completePageTransition(
      withNextPage,
      transition,
      "page-3",
    );

    expect(completePageTransition(committed, transition, "page-3")).toBe(
      committed,
    );
  });

  it("resets cursor history when a new search starts", () => {
    const pagedState = {
      currentCursor: "page-2",
      previousCursors: [null],
      nextCursor: "page-3",
    } as const;

    expect(resetPagination()).toEqual(initialPaginationState);
    expect(resetPagination()).not.toEqual(pagedState);
  });
});
