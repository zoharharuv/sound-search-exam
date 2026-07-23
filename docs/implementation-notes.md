# Implementation Notes

## Delivery sequence

1. Established provider-neutral domain models, Mixcloud adapter, storage boundaries,
   and tested pure history/cursor logic.
2. Added React Query search orchestration with debounce, AbortSignal propagation,
   stale-response isolation, and guarded cursor navigation.
3. Added persisted recent searches and List/Tile preference.
4. Added selected-sound preview, lazy embedded player, accessibility behavior,
   reduced-motion support, and focused component/integration tests.
5. Completed browser QA, documentation, production build verification, and deployment.

## Key decisions

- React Query owns remote result state; Redux owns only persisted client state.
- Selection and iframe visibility are page-local because they are transient UI state.
- Cursor URLs remain opaque provider values.
- UI consumes provider-neutral `Sound` objects, keeping Mixcloud-specific mapping
  and embed URL construction inside the API layer.
- The player is lazy-mounted after artwork activation to avoid an unnecessary
  third-party iframe request.

## Validation

- `npm run lint`
- `npm test`
- `npm run build`
- Manual Chrome checks for live Mixcloud behavior, motion, keyboard flow,
  responsive layout, and autoplay fallback.
