# Sound Search Exam — Agent Instructions

## Project Context

This is a frontend take-home assignment for Priority Software.

Build a React + TypeScript single-page Sound Search application.
The first data provider is Mixcloud, but the application must support
replacing the provider without changing UI components or application state logic.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Redux Toolkit + React Redux for client state only
- TanStack React Query for server/API state
- Framer Motion for selection animation
- Vitest + React Testing Library + jsdom
- Axios through a shared API client with base request and response interceptors

## Architecture Rules

- `src/api/`: provider contracts and provider-specific implementations
- `src/domain/`: provider-agnostic types and pure business logic
- `src/storage/`: localStorage access only
- `src/store/`: Redux Toolkit store and client-state slices
- `src/hooks/`: UI-facing orchestration hooks
- `src/components/`: reusable presentational components
- `src/pages/`: page composition
- `test/`: tests mirroring relevant source folders

- UI components must not import Mixcloud-specific types or make HTTP requests.
- API adapters must map provider payloads to provider-agnostic domain types.
- API adapters must use the shared Axios client; interceptors own cross-cutting
  request headers and normalized transport errors.
- Do not duplicate fetched API result data in Redux.
- React Query manages server state: fetching, loading, errors, retry, and cancellation.
- Redux Toolkit manages client state: recent searches, pagination cursor history,
  view mode, and selected sound when needed.

## TypeScript Type Conventions

| Situation                                           | Prefer      |
| --------------------------------------------------- | ----------- |
| Object contract / API payload / props / state shape | `interface` |
| Union such as `"list" \| "tile"`                    | `type`      |
| Primitive alias such as `Cursor`                    | `type`      |
| Tuple or function signature composition             | `type`      |
| Public provider contract                            | `interface` |
| Mapped, conditional, intersection types             | `type`      |

## Assignment Requirements

### Mandatory

1. Search the Sound API for the submitted text, show result names below the
   search input, and fetch and display no more than 6 results at a time.
2. Provide matching Previous and Next controls using API cursors, never numeric
   offsets. Disable Next when the provider returns no next cursor.
3. Persist the last 5 searches in localStorage. Deduplicate terms; repeating a
   search moves it to the top rather than creating another entry.
4. Clicking a recent-search item must initiate a new search for that term.
5. When a result is selected, animate it flying to the image container, fade
   the result out, and fade its artwork into the image container.
6. Clicking the central artwork must embed the selected track below the image
   and start playback.
7. Debounce search input by approximately 300ms. Propagate
   `AbortController.signal` to Axios requests, prevent stale responses from overwriting
   the current query or page, and ensure rapid Previous/Next actions while a
   request is pending cannot corrupt the displayed page or cursor history.
8. Handle loading, empty, and error states visibly and provide Retry for
   network or provider failures.
9. Use properly typed TypeScript with no `any`. Keep history deduplication,
   cursor pagination, and storage logic separate from views and cover that core
   logic with unit tests.
10. Keep API/data, reusable UI, state, and business-logic layers decoupled so a
    provider can be replaced by changing only the data layer. Document setup
    and run instructions, architecture decisions, reasoning, and trade-offs in
    the README.

- Support the latest Chrome release; legacy-browser compatibility is not
  required.
- Use the Mixcloud search and embedded-player APIs as the initial provider
  targets while preserving the provider-agnostic boundary.

### Bonus

11. Support list and tile result views, with the selected view persisted for
    subsequent visits.
12. Make the full flow keyboard-navigable with semantic HTML, appropriate ARIA,
    and focus management when a result moves to the image container.
13. Provide a polished design with well-structured CSS.

## Testing Rules

- Place all tests under the root-level `test/` directory, mirroring the
  relevant source folders.
- Cover pure history deduplication/max-5 logic.
- Cover cursor pagination transitions and reset behavior.
- Cover localStorage read/write and malformed persisted data.
- Add focused UI tests for essential user flows.
- Run `npm run build` and `npm test` after every implementation milestone.

## Working Rules

- Inspect existing code before changing it.
- Work in small milestones and state planned file changes first.
- Do not rewrite working configuration without a concrete reason.
- Do not add packages beyond the approved Axios dependency, React Router,
  redux-thunk, or a backend without approval.
- Do not use destructive commands.
- Do not commit, push, deploy, or change Git configuration; the developer does this manually.
- The developer is responsible for repository delivery and a clean,
  incremental Git history.
- Do not expose or request private employer data.
- Do not copy private contact details from assignment materials into the repository.
- Before completing a milestone, report changed files, design decisions,
  build/test results, and remaining risks.
