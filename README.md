# Sound Search Exam

A responsive React + TypeScript single-page application for searching, paging
through, selecting, and playing sounds. Mixcloud is the initial provider, but its
payloads, paging URLs, and widget construction stay isolated from UI and client state.

## Live Demo

[Open the sound search application](https://sound-search-exam.vercel.app/)

## Features

- Debounced search with immediate Go/Enter submission and up to six results.
- Provider-cursor Previous/Next navigation with loading, empty, error, and Retry states.
- Five deduplicated recent searches persisted in localStorage.
- Keyboard-accessible selection with Framer Motion artwork travel/fade.
- Focus transfer to the selected artwork, reduced-motion support, and mobile/tablet preview centering.
- Persisted compact List and responsive artwork Tile layouts.
- Player iframe mounted only after explicit selected-artwork activation.
- Responsive three-panel desktop layout that stacks cleanly across tablet and phone widths.
- Pagination preserves scroll position and keyboard focus while a page transition is pending.

## Setup and Commands

Requirements: Node.js 18+, npm, and the latest stable Chrome for browser verification.

```bash
npm install
npm run dev
```

| Command              | Purpose                       |
| -------------------- | ----------------------------- |
| `npm run dev`        | Start Vite development mode   |
| `npm run build`      | Type-check and create `dist/` |
| `npm run preview`    | Serve the production build    |
| `npm run lint`       | Run TypeScript validation     |
| `npm test`           | Run Vitest once               |
| `npm run test:watch` | Run Vitest in watch mode      |

## Architecture and Provider Boundary

- `src/api/`: provider contract, shared Axios client, composition, and Mixcloud adapter.
- `src/domain/`: provider-neutral types and pure history/pagination logic.
- `src/storage/`: the only localStorage access.
- `src/store/`: Redux client state and persistence wiring.
- `src/hooks/`: React Query and Redux orchestration for UI actions.
- `src/components/`: reusable provider-neutral presentation.
- `src/pages/`: page composition and transient selection/player coordination.
- `src/styles/`: shared responsive runtime constants.
- `test/`: unit and focused UI tests mirroring source responsibilities.

The active provider is composed in `src/api/provider.ts`. `SoundSearchPage`
combines the search/results, preview/player, and recent-search panels. Components
receive provider-neutral `Sound` values and callbacks, not Mixcloud types or HTTP
access.

```ts
interface SoundProvider {
  readonly id: string;
  search(input: SoundSearchInput): Promise<SoundSearchResult>;
}
```

The Mixcloud adapter maps native responses to `Sound`, validates and preserves
paging URLs as opaque cursors, and derives `Sound.embedUrl`. The UI uses that URL
unchanged. Replacing Mixcloud requires a new provider and composition-root change,
not changes to UI, domain logic, Redux, or cursor history.

The shared Axios client owns JSON headers, timeout behavior, normalized transport
errors, and cancellation mapping. Provider requests receive React Query's
`AbortSignal`.

## State Ownership

| Owner             | State                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| React Query       | Fetched pages, loading/errors, retry, cache, cancellation, stale isolation |
| Redux Toolkit     | Recent searches, opaque cursor history, List/Tile preference               |
| `SoundSearchPage` | Selected `Sound` and whether its iframe is mounted                         |
| Storage adapters  | Validated localStorage reads/writes for history and view preference        |

Fetched results are never copied into Redux. Transient selection/player state
clears on input changes, searches, Retry, paging, empty input, and result identity
replacement; an input edit does not alter the currently displayed results.

Recent searches are recorded only after a successful current first-page response.
Storage failures and malformed persisted values fall back safely.

## Data Flow

1. The user submits a query through the search form, a recent-search button, or
   pagination controls.
2. `useSoundSearch` normalizes the input and coordinates Redux cursor state with
   a React Query key containing the provider ID, query, and opaque cursor.
3. React Query invokes the active `SoundProvider` with an `AbortSignal`.
4. The Mixcloud adapter maps provider payloads into provider-neutral `Sound`
   values and returns validated next/previous cursor URLs.
5. `SoundSearchPage` passes data and callbacks to presentation components.
6. Successful first-page searches update the persisted recent-search history;
   successful pagination transitions update cursor history.

## Async and Cursor Safety

- Input is normalized and searched after about 300ms; Go, Enter, and recent
  searches execute immediately.
- Empty normalized input cancels work and resets search/pagination without a request.
- Query keys include provider ID, normalized query, and opaque cursor.
- Superseded work is cancelled and its signal reaches Axios.
- Query-key isolation prevents stale responses replacing the active query/page.
- Navigation locks reject rapid duplicate Previous/Next actions.
- Cursor history changes only after the matching transition succeeds, so failed,
  duplicate, or out-of-order completions cannot corrupt it.

## Selection and Player Behavior

Results are semantic buttons supporting click, Enter, and Space. Framer Motion
uses `LayoutGroup`, `AnimatePresence`, and matching `layoutId` values to move the
selected artwork while removing only its source. A new selection restores the
previous source.

Destination focus uses `preventScroll: true`; reduced-motion users get an
immediate transition with the same keyboard behavior. Below the desktop breakpoint,
selecting a result centers the focused preview artwork in the viewport. On desktop,
selection transfers focus without programmatic scrolling.

The selected artwork is the only control that mounts the iframe. It uses
`Sound.embedUrl` unchanged, a provider-neutral title, and `allow="autoplay"`.
Repeated activation is idempotent. A null embed URL shows "Playback unavailable"
and mounts no iframe.

On mobile and tablet widths, activating a recent search scrolls to the top while
preserving keyboard focus on the activated button. Previous and Next preserve both
scroll position and button focus at every viewport width.

## Testing

The current Vitest suite contains 39 tests across nine files using React Testing
Library, user-event, and jsdom. Coverage includes:

- history normalization/deduplication and storage validation;
- cursor transitions, resets, and stale completion rejection;
- Axios cancellation/error normalization and Mixcloud response mapping;
- debounce, immediate search, stale isolation, history, and navigation locks;
- List/Tile semantics, keyboard selection, focus transfer, mobile scroll behavior,
  media fallbacks, lazy/idempotent player mounting, preview resets, and preference
  persistence.

UI tests assert behavior and accessibility rather than pixel-level animation
transforms.

## Mixcloud and Browser Limitations

- The adapter requests autoplay, but Chrome policy, iframe permissions, user
  settings, or the widget can block audible playback. The visible player Play
  control is the manual fallback.
- The cross-origin iframe prevents the parent page from inspecting playback state
  or reliably detecting internal widget failures.
- Mixcloud may change its API, CORS policy, paging URL shape, or widget parameters.
- Remote artwork may fail or load slowly; fixed aspect ratios and fallbacks avoid
  making layout stability depend on image success.

### Search Availability Note

During QA tests on 23 July 2026, Mixcloud's public REST search endpoint and
Mixcloud's own web-search request returned empty result sets for multiple common
queries across independent networks. Profile cloudcast endpoints still returned
data.

The application handles this as a normal empty-result state; no mock data,
unrelated fallback results, or undocumented API integration is used.
